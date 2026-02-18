import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FREE_DAILY_LIMIT = 3;
const FREE_MONTHLY_LIMIT = 1;

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

function validateInput(body: any) {
  if (!body || typeof body !== "object") throw new Error("Invalid body");
  if (!body.date || typeof body.date !== "string" || body.date.length > 100) throw new Error("Invalid date");

  if (body.monthSummary !== undefined) {
    if (typeof body.monthSummary !== "string" || body.monthSummary.length > 10000) throw new Error("Invalid monthSummary");
    return;
  }

  if (body.evacuations !== undefined) {
    if (!Array.isArray(body.evacuations)) throw new Error("Invalid evacuations");
    if (body.evacuations.length > 50) throw new Error("Too many evacuations");
  }
  if (body.meals !== undefined) {
    if (!Array.isArray(body.meals)) throw new Error("Invalid meals");
    if (body.meals.length > 50) throw new Error("Too many meals");
  }
  if (body.hydration !== undefined && body.hydration !== null) {
    if (typeof body.hydration !== "object") throw new Error("Invalid hydration");
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
    validateInput(body);

    const { date, evacuations, meals, hydration, monthSummary } = body;

    // Server-side usage limit enforcement
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.plan === "free") {
      const analysisType = monthSummary ? "month" : "day";
      const { data: usageData } = await serviceClient
        .from("analysis_usage")
        .select("id")
        .eq("user_id", user.id)
        .eq("analysis_type", analysisType)
        .eq("reference_date", date);

      const usageCount = usageData?.length || 0;
      const limit = analysisType === "day" ? FREE_DAILY_LIMIT : FREE_MONTHLY_LIMIT;

      if (usageCount >= limit) {
        return new Response(
          JSON.stringify({ error: "Limite de análises atingido. Faça upgrade para o PRO para continuar." }),
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

    // Build context message from user data
    let userMessage = "";

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
          if (e.observations) userMessage += `, Obs: ${String(e.observations).slice(0, 500)}`;
          userMessage += `\n`;
        });
      } else {
        userMessage += `**Evacuações:** Nenhuma registrada.\n`;
      }

      if (meals && meals.length > 0) {
        userMessage += `\n**Refeições (${meals.length}):**\n`;
        meals.forEach((m: any) => {
          userMessage += `- ${m.meal_type}: ${String(m.description).slice(0, 500)}\n`;
        });
      } else {
        userMessage += `\n**Refeições:** Nenhuma registrada.\n`;
      }

      if (hydration) {
        userMessage += `\n**Hidratação:** ${hydration.totalMl}ml no dia (${hydration.bottles} garrafas, ${hydration.cups} copos).\n`;
      } else {
        userMessage += `\n**Hidratação:** Nenhum registro.\n`;
      }
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
      JSON.stringify({ error: "Ocorreu um erro. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
