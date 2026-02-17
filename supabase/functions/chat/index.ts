import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Inject current date/time into system prompt so the AI always knows "today"
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/Sao_Paulo" });
    const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
    const dateContext = `\n\nData e hora atuais: ${dateStr}, ${timeStr} (horário de Brasília).`;

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
