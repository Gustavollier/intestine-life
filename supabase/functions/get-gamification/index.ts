import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

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

    // Validate user
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, serviceKey);
    const userId = user.id;

    // Fetch all days with data from all 3 tables in parallel
    const [evacRes, foodRes, hydrationRes] = await Promise.all([
      serviceClient
        .from("evacuations")
        .select("day")
        .eq("user_id", userId),
      serviceClient
        .from("food_diary")
        .select("day")
        .eq("user_id", userId),
      serviceClient
        .from("hydration")
        .select("day")
        .eq("user_id", userId),
    ]);

    // Collect unique days with any data
    const daysSet = new Set<string>();
    (evacRes.data || []).forEach((r: any) => daysSet.add(r.day));
    (foodRes.data || []).forEach((r: any) => daysSet.add(r.day));
    (hydrationRes.data || []).forEach((r: any) => daysSet.add(r.day));

    const allDays = Array.from(daysSet).sort();
    const totalDaysWithData = allDays.length;

    // Calculate streak (consecutive days ending today or yesterday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Also accept yesterday as streak continuation
    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    
    let streak = 0;
    const checkDate = new Date(today);
    
    // If today has no data, start checking from yesterday
    if (!daysSet.has(formatDate(checkDate))) {
      checkDate.setDate(checkDate.getDate() - 1);
      // If yesterday also has no data, streak is 0
      if (!daysSet.has(formatDate(checkDate))) {
        streak = 0;
      } else {
        streak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
        while (daysSet.has(formatDate(checkDate))) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }
    } else {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
      while (daysSet.has(formatDate(checkDate))) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Calculate best streak ever
    let bestStreak = 0;
    let currentRun = 0;
    for (let i = 0; i < allDays.length; i++) {
      if (i === 0) {
        currentRun = 1;
      } else {
        const prev = new Date(allDays[i - 1]);
        const curr = new Date(allDays[i]);
        const diffMs = curr.getTime() - prev.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          currentRun++;
        } else {
          currentRun = 1;
        }
      }
      if (currentRun > bestStreak) bestStreak = currentRun;
    }

    // Weekly progress (current week Mon-Sun)
    const dayOfWeek = today.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);
    
    let weeklyDays = 0;
    const weekDayStatuses: boolean[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const hasData = daysSet.has(formatDate(d));
      weekDayStatuses.push(hasData);
      if (hasData) weeklyDays++;
    }

    // Count totals for badges
    const totalEvacuations = (evacRes.data || []).length;
    const totalMeals = (foodRes.data || []).length;
    const totalHydrations = (hydrationRes.data || []).length;

    // Badges
    const badges: Badge[] = [
      {
        id: "first_record",
        name: "Primeiro Registro",
        description: "Fez seu primeiro registro no app",
        icon: "star",
        unlocked: totalDaysWithData >= 1,
      },
      {
        id: "streak_3",
        name: "3 Dias Seguidos",
        description: "Manteve registros por 3 dias consecutivos",
        icon: "flame",
        unlocked: bestStreak >= 3,
      },
      {
        id: "streak_7",
        name: "Semana Perfeita",
        description: "7 dias consecutivos registrando dados",
        icon: "flame",
        unlocked: bestStreak >= 7,
      },
      {
        id: "streak_30",
        name: "Mês de Ouro",
        description: "30 dias consecutivos registrando dados",
        icon: "trophy",
        unlocked: bestStreak >= 30,
      },
      {
        id: "meals_10",
        name: "Chef Intestinal",
        description: "Registrou 10 refeições",
        icon: "utensils",
        unlocked: totalMeals >= 10,
      },
      {
        id: "meals_50",
        name: "Diário Alimentar",
        description: "Registrou 50 refeições",
        icon: "utensils",
        unlocked: totalMeals >= 50,
      },
      {
        id: "evacuations_10",
        name: "Autoconhecimento",
        description: "Registrou 10 evacuações",
        icon: "clipboard",
        unlocked: totalEvacuations >= 10,
      },
      {
        id: "hydration_hero",
        name: "Herói da Hidratação",
        description: "Registrou hidratação em 7 dias diferentes",
        icon: "droplets",
        unlocked: new Set((hydrationRes.data || []).map((r: any) => r.day)).size >= 7,
      },
      {
        id: "complete_day",
        name: "Dia Completo",
        description: "Registrou evacuação, refeição e hidratação no mesmo dia",
        icon: "check-circle",
        unlocked: (() => {
          const evacDays = new Set((evacRes.data || []).map((r: any) => r.day));
          const foodDays = new Set((foodRes.data || []).map((r: any) => r.day));
          const hydrDays = new Set((hydrationRes.data || []).map((r: any) => r.day));
          return Array.from(evacDays).some(d => foodDays.has(d) && hydrDays.has(d));
        })(),
      },
    ];

    return new Response(
      JSON.stringify({
        streak,
        bestStreak,
        totalDaysWithData,
        weeklyProgress: { days: weeklyDays, statuses: weekDayStatuses },
        badges,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Gamification error:", err);
    return new Response(
      JSON.stringify({ error: "Erro ao calcular gamificação." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
