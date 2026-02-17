import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const FREE_DAILY_LIMIT = 5;

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [userPlan, setUserPlan] = useState("free");
  const [dailyCount, setDailyCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Load user profile and daily usage
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile name and plan
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, plan")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.name) setUserName(profile.name);
      if (profile?.plan) setUserPlan(profile.plan);

      // Fetch today's chat usage
      const today = new Date().toISOString().split("T")[0];
      const { data: usage } = await supabase
        .from("chat_usage")
        .select("message_count")
        .eq("user_id", user.id)
        .eq("day", today)
        .maybeSingle();
      if (usage) setDailyCount(usage.message_count);
    };
    load();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const isLimitReached = userPlan === "free" && dailyCount >= FREE_DAILY_LIMIT;

  const incrementUsage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const newCount = dailyCount + 1;

    await supabase.from("chat_usage").upsert(
      { user_id: user.id, day: today, message_count: newCount },
      { onConflict: "user_id,day" }
    );
    setDailyCount(newCount);
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading || isLimitReached) return;

    const userMsg: Msg = { role: "user", content: text };
    setInput("");
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Track usage
    await incrementUsage();

    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const allMessages = [...messages, userMsg];
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, userName }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            /* ignore */
          }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      toast({
        title: "Erro no chat",
        description: e instanceof Error ? e.message : "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
      // Remove optimistic user message if no assistant reply came
      if (!assistantSoFar) {
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isLimitReached, messages, toast, userName, dailyCount]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
          aria-label="Abrir chat de saúde"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-4rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Dr. Intestine</p>
                <p className="text-xs text-muted-foreground">Assistente de saúde intestinal</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-muted rounded-lg">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-8 h-8 text-primary opacity-60" />
                <p className="text-sm text-muted-foreground font-medium">
                  Olá! Sou o Dr. Intestine 👋
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pergunte sobre saúde intestinal, alimentação, sintomas ou hábitos saudáveis.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border px-3 py-2.5">
            {isLimitReached ? (
              <div className="text-center py-3">
                <Lock className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-sm font-medium text-foreground">Limite diário atingido</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Você usou {FREE_DAILY_LIMIT}/{FREE_DAILY_LIMIT} mensagens gratuitas hoje.
                </p>
                <Button
                  size="sm"
                  className="mt-2 rounded-xl text-xs"
                  onClick={() => window.location.href = "/profile"}
                >
                  Fazer upgrade para Pro
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua dúvida..."
                    rows={1}
                    className="flex-1 resize-none bg-muted/50 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary max-h-20"
                  />
                  <Button
                    size="icon"
                    onClick={send}
                    disabled={!input.trim() || isLoading}
                    className="rounded-xl h-9 w-9 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[10px] text-muted-foreground">
                    Não substitui consulta médica presencial
                  </p>
                  {userPlan === "free" && (
                    <p className="text-[10px] text-muted-foreground">
                      {FREE_DAILY_LIMIT - dailyCount} msgs restantes
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
