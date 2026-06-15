import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { registerCacheClearer } from "@/lib/cacheRegistry";

export type HydrationType = "bottle" | "cup";

export interface HydrationEntry {
  id: string;
  user_id: string;
  day: string;
  type: HydrationType;
  ml: number;
  created_at: string;
}

const typeLabels: Record<HydrationType, string> = {
  bottle: "Garrafa (700ml)",
  cup: "Copo (350ml)",
};

const typeMl: Record<HydrationType, number> = {
  bottle: 700,
  cup: 350,
};

let cachedEntries: HydrationEntry[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

export function useHydration() {
  const [entries, setEntries] = useState<HydrationEntry[]>(cachedEntries || []);
  const [loading, setLoading] = useState(!cachedEntries);
  const { toast } = useToast();

  const fetchEntries = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedEntries && (now - cacheTimestamp) < CACHE_TTL) {
      setEntries(cachedEntries);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await (supabase
      .from("hydration" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }) as any);

    if (error) {
      toast({ title: "Erro ao carregar hidratação", variant: "destructive" });
    } else {
      const result = (data as HydrationEntry[]) || [];
      cachedEntries = result;
      cacheTimestamp = Date.now();
      setEntries(result);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = async (type: HydrationType, day: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ml = typeMl[type];
    const tempId = crypto.randomUUID();
    const optimistic: HydrationEntry = {
      id: tempId,
      user_id: user.id,
      day,
      type,
      ml,
      created_at: new Date().toISOString(),
    };

    setEntries((prev) => { const next = [...prev, optimistic]; cachedEntries = next; return next; });

    const { error } = await (supabase.from("hydration" as any).insert({
      user_id: user.id,
      day,
      type,
      ml,
    } as any) as any);

    if (error) {
      setEntries((prev) => prev.filter((e) => e.id !== tempId));
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      fetchEntries(true);
    }
  };

  const deleteEntry = async (id: string) => {
    const previous = entries;
    setEntries((prev) => { const next = prev.filter((e) => e.id !== id); cachedEntries = next; return next; });

    const { error } = await (supabase.from("hydration" as any).delete().eq("id", id) as any);
    if (error) {
      setEntries(previous);
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  const getEntriesForDate = (date: string) => entries.filter((e) => e.day === date);
  const getDatesWithEntries = () => [...new Set(entries.map((e) => e.day))];

  const getTotalMlForDate = (date: string) => {
    return getEntriesForDate(date).reduce((sum, e) => sum + e.ml, 0);
  };

  return {
    entries,
    loading,
    addEntry,
    deleteEntry,
    getEntriesForDate,
    getDatesWithEntries,
    getTotalMlForDate,
    typeLabels,
    typeMl,
  };
}
