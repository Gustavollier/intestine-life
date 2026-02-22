import { useState, useEffect } from "react";
import { Flame, Trophy, Star, Droplets, UtensilsCrossed, ClipboardList, CheckCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface GamificationData {
  streak: number;
  bestStreak: number;
  totalDaysWithData: number;
  weeklyProgress: { days: number; statuses: boolean[] };
  badges: Badge[];
}

const weekLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const iconMap: Record<string, React.ReactNode> = {
  flame: <Flame className="w-4 h-4" />,
  trophy: <Trophy className="w-4 h-4" />,
  star: <Star className="w-4 h-4" />,
  droplets: <Droplets className="w-4 h-4" />,
  utensils: <UtensilsCrossed className="w-4 h-4" />,
  clipboard: <ClipboardList className="w-4 h-4" />,
  "check-circle": <CheckCircle className="w-4 h-4" />,
};

// Module-level cache
let cachedGamification: GamificationData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function GamificationCard() {
  const [data, setData] = useState<GamificationData | null>(cachedGamification);
  const [loading, setLoading] = useState(!cachedGamification);

  useEffect(() => {
    const fetchData = async () => {
      const now = Date.now();
      if (cachedGamification && (now - cacheTimestamp) < CACHE_TTL) {
        setData(cachedGamification);
        setLoading(false);
        return;
      }

      try {
        const { data: result, error } = await supabase.functions.invoke("get-gamification");
        if (error) throw error;
        cachedGamification = result;
        cacheTimestamp = Date.now();
        setData(result);
      } catch (e) {
        console.error("Gamification fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="p-5 border border-primary/20 rounded-3xl shadow-lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const unlockedBadges = data.badges.filter((b) => b.unlocked);
  const lockedBadges = data.badges.filter((b) => !b.unlocked);

  return (
    <Card className="p-5 border border-primary/20 rounded-3xl shadow-lg space-y-5">
      {/* Streak + Stats Row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-foreground leading-none">{data.streak}</p>
            <p className="text-xs text-muted-foreground">
              {data.streak === 1 ? "dia seguido" : "dias seguidos"}
            </p>
          </div>
        </div>
        <div className="text-center px-3">
          <p className="text-lg font-bold text-foreground leading-none">{data.bestStreak}</p>
          <p className="text-[10px] text-muted-foreground">recorde</p>
        </div>
        <div className="text-center px-3">
          <p className="text-lg font-bold text-foreground leading-none">{data.totalDaysWithData}</p>
          <p className="text-[10px] text-muted-foreground">dias ativos</p>
        </div>
      </div>

      {/* Weekly Progress */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Progresso semanal — {data.weeklyProgress.days}/7 dias
        </p>
        <div className="flex gap-1.5">
          {data.weeklyProgress.statuses.map((active, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-2 rounded-full transition-colors ${
                  active ? "bg-primary" : "bg-muted"
                }`}
              />
              <span className="text-[10px] text-muted-foreground">{weekLabels[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Conquistas — {unlockedBadges.length}/{data.badges.length}
        </p>
        <div className="flex flex-wrap gap-2">
          {unlockedBadges.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1.5 rounded-xl text-xs font-medium"
              title={badge.description}
            >
              {iconMap[badge.icon] || <Star className="w-4 h-4" />}
              {badge.name}
            </div>
          ))}
          {lockedBadges.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-1.5 bg-muted text-muted-foreground px-2.5 py-1.5 rounded-xl text-xs font-medium opacity-50"
              title={badge.description}
            >
              {iconMap[badge.icon] || <Star className="w-4 h-4" />}
              {badge.name}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
