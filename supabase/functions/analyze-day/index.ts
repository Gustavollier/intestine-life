import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Dr. Intestine, um proctologista experiente e carismático. Você está analisando os dados de saúde intestinal e alimentação de um paciente para um dia específico.

Sua tarefa:
- Analise os dados de evacuações (quantidade, dificuldade, duração, escala de Bristol, horários), refeições e hidratação do dia.
- Dê um parecer geral sobre como está o funcionamento intestinal naquele dia.
- Relacione a alimentação e hidratação com o resultado intestinal quando possível.
- Dê 1-2 dicas práticas e personalizadas baseadas nos dados.
- Baseie suas orientações em conhecimento médico e nutricional atualizado e consolidado.
- Se não houver dados suficientes, incentive o paciente a registrar mais.

Formato:
- Use um tom amigável e profissional.
- Resposta com NO MÁXIMO 4-5 frases.
- NAO use emojis em hipótese alguma.
- Responda SEMPRE em português brasileiro.
- NAO prescreva medicamentos.
- Seja direto e objetivo.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date, evacuations, meals, hydration, monthSummary } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context message from user data
    let userMessage = "";

    // If monthSummary is provided, use it for monthly analysis
    if (monthSummary) {
      userMessage = `Analise meus dados do ${date}:\n\n${monthSummary}\n\nDê um parecer geral sobre o mês e tendências observadas.`;
    } else {
      userMessage = `Analise meus dados do dia ${date}:\n\n`;

    if (evacuations && evacuations.length > 0) {
      userMessage += `**Evacuações (${evacuations.length}):**\n`;
      evacuations.forEach((e: any, i: number) => {
        userMessage += `- #${i + 1}: Dificuldade: ${e.difficulty}, Duração: ${e.duration} min`;
        if (e.bristol_scale) userMessage += `, Bristol: tipo ${e.bristol_scale}`;
        if (e.time_of_day) userMessage += `, Horário: ${e.time_of_day}`;
        if (e.observations) userMessage += `, Obs: ${e.observations}`;
        userMessage += `\n`;
      });
    } else {
      userMessage += `**Evacuações:** Nenhuma registrada.\n`;
    }

    if (meals && meals.length > 0) {
      userMessage += `\n**Refeições (${meals.length}):**\n`;
      meals.forEach((m: any) => {
        userMessage += `- ${m.meal_type}: ${m.description}\n`;
      });
    } else {
      userMessage += `\n**Refeições:** Nenhuma registrada.\n`;
    }

    if (hydration) {
      userMessage += `\n**Hidratação:** ${hydration.totalMl}ml no dia (${hydration.bottles} garrafas, ${hydration.cups} copos).\n`;
    } else {
      userMessage += `\n**Hidratação:** Nenhum registro.\n`;
    }
    } // close else block

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
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
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

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Não foi possível gerar a análise.";

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-day error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
