import { useState, useEffect } from "react";
import { Droplets, UtensilsCrossed, Flame, TrendingUp, TrendingDown, Clock, CalendarDays, Lightbulb, Loader2, RefreshCw, Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Insight {
  icon: string;
  text: string;
}

const iconMap: Record<string, React.ReactNode> = {
  droplets: <Droplets className="w-4 h-4 shrink-0" />,
  utensils: <UtensilsCrossed className="w-4 h-4 shrink-0" />,
  flame: <Flame className="w-4 h-4 shrink-0" />,
  "trending-up": <TrendingUp className="w-4 h-4 shrink-0" />,
  "trending-down": <TrendingDown className="w-4 h-4 shrink-0" />,
  clock: <Clock className="w-4 h-4 shrink-0" />,
  calendar: <CalendarDays className="w-4 h-4 shrink-0" />,
};

type Period = "day" | "week" | "month";

const periodLabels: Record<Period, string> = {
  day: "Últimos 7 dias",
  week: "Última semana",
  month: "Último mês",
};

interface InsightsCardProps {
  onUpgrade?: () => void;
}

const FREE_DAILY_LIMIT = 2;

export function InsightsCard({ onUpgrade }: InsightsCardProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limited, setLimited] = useState(false);
  const [usedToday, setUsedToday] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period>("day");

  // Check usage on mount
  useEffect(() => {
    const checkUsage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("analysis_usage")
        .select("*", { count: "exact", head: true })
        .eq("analysis_type", "insights")
        .eq("reference_date", today);
      
      const used = count || 0;
      setUsedToday(used);
      if (used >= FREE_DAILY_LIMIT) {
        setLimited(true);
        setError(`Limite diário de insights atingido (${used}/${FREE_DAILY_LIMIT}). Assine o PRO para uso ilimitado.`);
        setLoaded(true);
      }
    };
    checkUsage();
  }, []);

  // Auto-fetch when not limited and not yet loaded
  useEffect(() => {
    if (!loaded && !loading && !limited && usedToday !== null) {
      fetchInsights();
    }
  }, [usedToday, limited]);

  const fetchInsights = async () => {
    if (limited) return;
    setLoading(true);
    setError(null);
    setLimited(false);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("get-insights", {
        body: { period },
      });
      if (fnError) {
        if (fnError.message?.includes("429") || fnError.message?.includes("Limite")) {
          setLimited(true);
          setUsedToday(FREE_DAILY_LIMIT);
          setError("Limite diário de insights atingido. Assine o PRO para uso ilimitado.");
        } else {
          throw fnError;
        }
        return;
      }
      if (data?.limited) {
        setLimited(true);
        setUsedToday(data.used || FREE_DAILY_LIMIT);
        setError(data.error || "Limite atingido.");
        return;
      }
      if (data?.insights) {
        setInsights(data.insights);
        // Increment local counter
        setUsedToday(prev => (prev !== null ? prev + 1 : 1));
      } else if (data?.message) {
        setError(data.message);
      }
    } catch (e: any) {
      console.error("Insights error:", e);
      try {
        const parsed = typeof e === 'string' ? JSON.parse(e) : e;
        if (parsed?.limited) {
          setLimited(true);
          setUsedToday(FREE_DAILY_LIMIT);
          setError(parsed.error || "Limite atingido.");
          return;
        }
      } catch {}
      setError("Não foi possível gerar insights.");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  const handleRefresh = () => {
    if (limited) {
      onUpgrade?.();
      return;
    }
    setLoaded(false);
    fetchInsights();
  };

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    if (!limited) {
      setLoaded(false);
      setInsights([]);
      // Will trigger fetch via the effect or manual
      setTimeout(() => fetchInsights(), 0);
    }
  };

  if (loading) {
    return (
      <div className="p-5">
        <div className="flex items-center justify-center py-8 gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analisando seus dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            {limited ? <Lock className="w-4 h-4 text-primary" /> : <Lightbulb className="w-4 h-4 text-primary" />}
          </div>
          <h3 className="font-semibold text-foreground text-sm">Insights</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">{error}</p>
        {limited && onUpgrade && (
          <Button onClick={onUpgrade} className="w-full gap-2 rounded-xl">
            <Crown className="w-4 h-4" />
            Seja Pro
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Insights Inteligentes</h3>
            <p className="text-xs text-muted-foreground">Baseados nos seus dados reais</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className={`p-1.5 rounded-lg mr-6 ${limited ? "opacity-50" : "hover:bg-muted"}`}
          title={limited ? "Limite atingido" : "Atualizar insights"}
        >
          {limited ? <Lock className="w-4 h-4 text-muted-foreground" /> : <RefreshCw className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-4">
        {(["day", "week", "month"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => handlePeriodChange(p)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Usage indicator for free users */}
      {usedToday !== null && (
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <div className="flex gap-0.5">
            {Array.from({ length: FREE_DAILY_LIMIT }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i < (usedToday || 0) ? "bg-primary" : "bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {Math.max(0, FREE_DAILY_LIMIT - (usedToday || 0))}/{FREE_DAILY_LIMIT} restantes hoje
          </span>
        </div>
      )}

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary mt-0.5">
              {iconMap[insight.icon] || <Lightbulb className="w-4 h-4 shrink-0" />}
            </div>
            <p className="text-sm text-foreground leading-relaxed flex-1">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
