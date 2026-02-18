import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FREE_DAILY_LIMIT = 5;

const SYSTEM_PROMPT = `Você é o Dr. Intestine, um proctologista experiente e gente boa. Converse como um amigo médico que entende do assunto — de forma natural, leve e humana.

Suas especialidades: saúde intestinal, coloproctologia, SII, constipação, diarreia, hemorroidas, flora intestinal, alimentação digestiva.

Regras:
- Fale como numa conversa informal de WhatsApp, mas com informação de qualidade.
- Respostas CURTAS: 2-4 frases no máximo. Só expanda se o usuário pedir mais detalhes.
- Use emoji com moderação (1-2 por mensagem no máximo).
- Seja direto e objetivo, sem enrolação.
- Pode usar expressões como "olha", "veja bem", "tranquilo", "faz o seguinte".
- NÃO faça listas longas nem parágrafos extensos.
- NUNCA prescreva medicamentos. Sugira hábitos e alimentação.
- Se for algo sério (sangramento, dor forte, febre), mande procurar urgência na hora.
- Sempre lembre que consulta presencial é importante quando fizer sentido, mas sem ser repetitivo.
- Responda SEMPRE em português brasileiro.`;

function validateChatInput(body: any) {
  if (!body || typeof body !== "object") throw new Error("Invalid body");
  if (!Array.isArray(body.messages)) throw new Error("Invalid messages");
  if (body.messages.length === 0 || body.messages.length > 50) throw new Error("Invalid message count");
  for (const msg of body.messages) {
    if (!msg.role || typeof msg.role !== "string" || !["user", "assistant"].includes(msg.role)) {
      throw new Error("Invalid message role");
    }
    if (!msg.content || typeof msg.content !== "string") throw new Error("Invalid message content");
    if (msg.content.length > 5000) throw new Error("Message too long");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Sessão expirada. Faça login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Sessão expirada. Faça login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();

    // Validate input
    validateChatInput(body);

    const { messages } = body;

    // Server-side usage limit enforcement
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("plan, name")
      .eq("user_id", user.id)
      .maybeSingle();

    const userName = profile?.name?.split(" ")[0] || "";

    if (profile?.plan === "free") {
      const today = new Date().toISOString().split("T")[0];
      const { data: usage } = await serviceClient
        .from("chat_usage")
        .select("message_count")
        .eq("user_id", user.id)
        .eq("day", today)
        .maybeSingle();

      const currentCount = usage?.message_count || 0;
      if (currentCount >= FREE_DAILY_LIMIT) {
        return new Response(
          JSON.stringify({ error: "Limite diário atingido. Faça upgrade para o PRO para continuar." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Erro ao conectar com o assistente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Inject current date/time and user name into system prompt
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/Sao_Paulo" });
    const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
    let dateContext = `\n\nData e hora atuais: ${dateStr}, ${timeStr} (horário de Brasília).`;
    if (userName) {
      dateContext += `\nO nome do paciente é: ${userName}. Use o nome dele nas respostas quando fizer sentido, de forma natural.`;
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT + dateContext },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Aguarde um momento e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "Erro ao conectar com o assistente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: "Ocorreu um erro. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
