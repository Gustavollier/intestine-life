import { useState, useEffect } from "react";
import { Droplets, UtensilsCrossed, Flame, TrendingUp, TrendingDown, Clock, CalendarDays, Lightbulb, Loader2, RefreshCw, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
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

export function InsightsCard() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limited, setLimited] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    setLimited(false);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("get-insights");
      if (fnError) {
        // Check if it's a 429 limit error
        if (fnError.message?.includes("429") || fnError.message?.includes("Limite")) {
          setLimited(true);
          setError("Você já usou seu insight gratuito de hoje. Assine o PRO para uso ilimitado.");
        } else {
          throw fnError;
        }
        return;
      }
      if (data?.limited) {
        setLimited(true);
        setError(data.error || "Limite atingido.");
        return;
      }
      if (data?.insights) {
        setInsights(data.insights);
      } else if (data?.message) {
        setError(data.message);
      }
    } catch (e: any) {
      console.error("Insights error:", e);
      // Check if the error response contains limited flag
      try {
        const parsed = typeof e === 'string' ? JSON.parse(e) : e;
        if (parsed?.limited) {
          setLimited(true);
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

  if (!loaded && !loading) {
    return (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Insights Inteligentes</h3>
            <p className="text-xs text-muted-foreground">Correlações entre seus dados</p>
          </div>
        </div>
        <Button
          onClick={fetchInsights}
          variant="outline"
          className="w-full rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/10"
        >
          <Lightbulb className="w-4 h-4" />
          Gerar insights dos meus dados
        </Button>
      </div>
    );
  }

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
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
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
          onClick={fetchInsights}
          className="p-1.5 hover:bg-muted rounded-lg"
          title="Atualizar insights"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

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
