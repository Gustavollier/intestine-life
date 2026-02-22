import { useState, useEffect, useRef } from "react";
import { Droplets, UtensilsCrossed, Flame, TrendingUp, TrendingDown, Clock, CalendarDays, Lightbulb, RefreshCw, Lock, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

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
  const { profile } = useProfile();
  const isPro = profile?.plan === "pro";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limited, setLimited] = useState(false);
  const [usedToday, setUsedToday] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period>("day");

  // Cache results per period
  const cacheRef = useRef<Record<Period, Insight[] | null>>({
    day: null,
    week: null,
    month: null,
  });

  const currentInsights = cacheRef.current[period];

  // Check usage on mount (only for free users)
  useEffect(() => {
    if (isPro) return;
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
      }
    };
    checkUsage();
  }, [isPro]);

  const fetchInsights = async () => {
    if (limited) {
      onUpgrade?.();
      return;
    }
    setLoading(true);
    setError(null);
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
        cacheRef.current[period] = data.insights;
        if (!isPro) {
          const newUsed = (usedToday !== null ? usedToday + 1 : 1);
          setUsedToday(newUsed);
          if (newUsed >= FREE_DAILY_LIMIT) {
            setLimited(true);
          }
        }
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
    }
  };

  // Loading skeleton with animated lightbulb
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <div className="w-4 h-4 rounded bg-primary/20 animate-pulse" />
          </div>
          <div className="flex-1 space-y-2 py-0.5">
            <div className="h-3 bg-primary/10 rounded-full w-full animate-pulse" />
            <div className="h-3 bg-primary/10 rounded-full w-3/4 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ${loading ? "animate-pulse" : ""}`}>
            <Lightbulb className={`w-4 h-4 text-primary ${loading ? "animate-[scale-in_0.6s_ease-in-out_infinite_alternate]" : ""}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Insights Inteligentes</h3>
            <p className="text-xs text-muted-foreground">
              {loading ? "Gerando insights..." : "Baseados nos seus dados reais"}
            </p>
          </div>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-4">
        {(["day", "week", "month"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => !loading && setPeriod(p)}
            disabled={loading}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Usage indicator — only for free users */}
      {!isPro && usedToday !== null && (
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

      {/* Loading skeleton */}
      {loading && <LoadingSkeleton />}

      {/* Error (limit reached globally) */}
      {!loading && error && limited && (
        <>
          <p className="text-sm text-muted-foreground text-center py-4">{error}</p>
          {onUpgrade && (
            <Button onClick={onUpgrade} className="w-full gap-2 rounded-xl">
              <Crown className="w-4 h-4" />
              Seja Pro
            </Button>
          )}
        </>
      )}

      {/* Error (non-limit) */}
      {!loading && error && !limited && (
        <p className="text-sm text-muted-foreground text-center py-4">{error}</p>
      )}

      {/* Show cached results if available */}
      {!loading && !error && currentInsights && currentInsights.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          {currentInsights.map((insight, i) => (
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
          {/* Reload button */}
          {!limited && (
            <Button
              onClick={fetchInsights}
              variant="outline"
              size="sm"
              className="w-full rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/10"
            >
              <RefreshCw className="w-4 h-4" />
              Gerar novamente
            </Button>
          )}
        </div>
      )}

      {/* No cached results — show generate button */}
      {!loading && !error && (!currentInsights || currentInsights.length === 0) && (
        <div className="flex flex-col items-center py-6 gap-3">
          <p className="text-sm text-muted-foreground text-center">
            Selecione o período e gere seus insights
          </p>
          <Button
            onClick={fetchInsights}
            disabled={limited}
            className="gap-2 rounded-xl"
          >
            {limited ? <Lock className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {limited ? "Limite atingido" : "Gerar insights"}
          </Button>
        </div>
      )}
    </div>
  );
}
