import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const INSIGHTS_PROMPT = `Você é o Dr. Intestine, um proctologista experiente. Analise os dados estatísticos de saúde intestinal do paciente e gere insights práticos baseados em correlações reais encontradas nos dados.

Instruções:
- Gere de 3 a 5 insights curtos e práticos baseados nos dados.
- Cada insight deve ser UMA frase objetiva que revela uma correlação ou padrão.
- Use dados concretos (porcentagens, médias, comparações).
- Relacione alimentação, hidratação e evacuações quando possível.
- Se não houver dados suficientes para um insight, não invente.
- NAO use emojis.
- Responda SEMPRE em português brasileiro.
- NAO prescreva medicamentos.

Formato de resposta (JSON array):
[
  { "icon": "droplets", "text": "Nos dias com mais de 2L de água, suas evacuações foram 40% mais fáceis." },
  { "icon": "utensils", "text": "Você registra mais evacuações difíceis em dias sem café da manhã." }
]

Ícones disponíveis: "droplets" (hidratação), "utensils" (alimentação), "flame" (evacuação/padrão), "trending-up" (melhora), "trending-down" (piora), "clock" (horário/frequência), "calendar" (regularidade).

Responda APENAS com o JSON array, sem markdown, sem explicação.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, serviceKey);
    const userId = user.id;

    // Fetch all data in parallel
    const [evacRes, foodRes, hydrationRes] = await Promise.all([
      serviceClient.from("evacuations").select("*").eq("user_id", userId).order("day"),
      serviceClient.from("food_diary").select("*").eq("user_id", userId).order("day"),
      serviceClient.from("hydration").select("*").eq("user_id", userId).order("day"),
    ]);

    const evacuations = evacRes.data || [];
    const meals = foodRes.data || [];
    const hydrations = hydrationRes.data || [];

    if (evacuations.length === 0 && meals.length === 0 && hydrations.length === 0) {
      return new Response(
        JSON.stringify({ insights: [], message: "Registre mais dados para gerar insights." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build statistics summary for AI
    const allDays = new Set<string>();
    evacuations.forEach((e: any) => allDays.add(e.day));
    meals.forEach((m: any) => allDays.add(m.day));
    hydrations.forEach((h: any) => allDays.add(h.day));

    // Hydration per day
    const hydrationByDay: Record<string, number> = {};
    hydrations.forEach((h: any) => {
      hydrationByDay[h.day] = (hydrationByDay[h.day] || 0) + h.ml;
    });

    // Evacuations per day with details
    const evacByDay: Record<string, any[]> = {};
    evacuations.forEach((e: any) => {
      if (!evacByDay[e.day]) evacByDay[e.day] = [];
      evacByDay[e.day].push(e);
    });

    // Meals per day
    const mealsByDay: Record<string, any[]> = {};
    meals.forEach((m: any) => {
      if (!mealsByDay[m.day]) mealsByDay[m.day] = [];
      mealsByDay[m.day].push(m);
    });

    // Compute correlations
    const daysWithEvac = Object.keys(evacByDay);
    const totalEvacDays = daysWithEvac.length;

    // Difficulty distribution
    const diffCounts: Record<string, number> = {};
    evacuations.forEach((e: any) => {
      diffCounts[e.difficulty] = (diffCounts[e.difficulty] || 0) + 1;
    });

    // Bristol distribution
    const bristolCounts: Record<number, number> = {};
    evacuations.forEach((e: any) => {
      if (e.bristol_scale) bristolCounts[e.bristol_scale] = (bristolCounts[e.bristol_scale] || 0) + 1;
    });

    // Hydration vs difficulty correlation
    let highHydrationEasyCount = 0;
    let highHydrationTotal = 0;
    let lowHydrationDifficultCount = 0;
    let lowHydrationTotal = 0;
    const avgHydration = Object.values(hydrationByDay).length > 0
      ? Object.values(hydrationByDay).reduce((a, b) => a + b, 0) / Object.values(hydrationByDay).length
      : 0;

    daysWithEvac.forEach((day) => {
      const dayHydration = hydrationByDay[day] || 0;
      const dayEvacs = evacByDay[day];
      if (dayHydration > avgHydration) {
        highHydrationTotal++;
        if (dayEvacs.some((e: any) => e.difficulty === "facil")) highHydrationEasyCount++;
      } else if (dayHydration < avgHydration && dayHydration > 0) {
        lowHydrationTotal++;
        if (dayEvacs.some((e: any) => e.difficulty === "dificil")) lowHydrationDifficultCount++;
      }
    });

    // Meal types vs evacuation
    const mealTypeCounts: Record<string, number> = {};
    meals.forEach((m: any) => {
      mealTypeCounts[m.meal_type] = (mealTypeCounts[m.meal_type] || 0) + 1;
    });

    // Days with breakfast vs without
    const daysWithBreakfast = new Set(
      meals.filter((m: any) => m.meal_type === "breakfast").map((m: any) => m.day)
    );

    // Average duration
    const avgDuration = evacuations.length > 0
      ? Math.round(evacuations.reduce((a: number, e: any) => a + e.duration, 0) / evacuations.length)
      : 0;

    // Most common time of day
    const timeSlots: Record<string, number> = {};
    evacuations.forEach((e: any) => {
      if (e.time_of_day) {
        const hour = parseInt(e.time_of_day.split(":")[0]);
        const slot = hour < 6 ? "madrugada" : hour < 12 ? "manhã" : hour < 18 ? "tarde" : "noite";
        timeSlots[slot] = (timeSlots[slot] || 0) + 1;
      }
    });

    const summary = `Dados do paciente (últimos ${allDays.size} dias com registros):

EVACUAÇÕES (${evacuations.length} registros em ${totalEvacDays} dias):
- Dificuldade: Fácil: ${diffCounts["facil"] || 0}, Normal: ${diffCounts["normal"] || 0}, Difícil: ${diffCounts["dificil"] || 0}
- Bristol: ${Object.entries(bristolCounts).map(([k, v]) => `tipo ${k}: ${v}x`).join(", ") || "sem dados"}
- Duração média: ${avgDuration} minutos
- Horários mais comuns: ${Object.entries(timeSlots).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}x`).join(", ") || "sem dados"}

HIDRATAÇÃO:
- Média diária: ${Math.round(avgHydration)}ml (${Object.keys(hydrationByDay).length} dias registrados)
- Dias com hidratação acima da média e evacuação fácil: ${highHydrationEasyCount}/${highHydrationTotal || 1}
- Dias com hidratação abaixo da média e evacuação difícil: ${lowHydrationDifficultCount}/${lowHydrationTotal || 1}

REFEIÇÕES (${meals.length} registros):
- Tipos: ${Object.entries(mealTypeCounts).map(([k, v]) => `${k}: ${v}`).join(", ")}
- Dias com café da manhã: ${daysWithBreakfast.size}
- Dias com evacuação que tinham café da manhã: ${daysWithEvac.filter(d => daysWithBreakfast.has(d)).length}/${totalEvacDays}

Gere insights baseados nestes dados reais.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Erro de configuração." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: INSIGHTS_PROMPT },
          { role: "user", content: summary },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI error:", aiResponse.status);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar insights." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    let rawContent = aiData.choices?.[0]?.message?.content || "[]";

    // Strip markdown code fences if present
    rawContent = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let insights;
    try {
      insights = JSON.parse(rawContent);
    } catch {
      console.error("Failed to parse insights:", rawContent);
      insights = [];
    }

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Insights error:", err);
    return new Response(
      JSON.stringify({ error: "Erro ao gerar insights." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
