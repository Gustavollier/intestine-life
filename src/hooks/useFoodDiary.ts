import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { registerCacheClearer } from "@/lib/cacheRegistry";

export type MealType = "breakfast" | "lunch" | "snack" | "dinner" | "other";

export interface FoodEntry {
  id: string;
  user_id: string;
  day: string;
  meal_type: MealType;
  description: string;
  created_at: string;
}

const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Café da Manhã",
  lunch: "Almoço",
  snack: "Lanche",
  dinner: "Janta",
  other: "Outro",
};

// Module-level cache
let cachedEntries: FoodEntry[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;
registerCacheClearer(() => { cachedEntries = null; cacheTimestamp = 0; });

export function useFoodDiary() {
  const [entries, setEntries] = useState<FoodEntry[]>(cachedEntries || []);
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

    const { data, error } = await supabase
      .from("food_diary")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Erro ao carregar diário alimentar", variant: "destructive" });
    } else {
      const result = (data as FoodEntry[]) || [];
      cachedEntries = result;
      cacheTimestamp = Date.now();
      setEntries(result);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = async (entry: { day: string; meal_type: MealType; description: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const tempId = crypto.randomUUID();
    const optimistic: FoodEntry = {
      id: tempId,
      user_id: user.id,
      day: entry.day,
      meal_type: entry.meal_type,
      description: entry.description,
      created_at: new Date().toISOString(),
    };

    setEntries((prev) => { const next = [...prev, optimistic]; cachedEntries = next; return next; });

    const { error } = await supabase.from("food_diary").insert({
      user_id: user.id,
      day: entry.day,
      meal_type: entry.meal_type,
      description: entry.description,
    });

    if (error) {
      setEntries((prev) => prev.filter((e) => e.id !== tempId));
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      fetchEntries(true);
    }
  };

  const updateEntry = async (id: string, data: { meal_type?: MealType; description?: string }) => {
    const previous = entries;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, ...(data.meal_type && { meal_type: data.meal_type }), ...(data.description !== undefined && { description: data.description }) }
          : e
      )
    );

    const { error } = await supabase.from("food_diary").update(data).eq("id", id);
    if (error) {
      setEntries(previous);
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    }
  };

  const deleteEntry = async (id: string) => {
    const previous = entries;
    setEntries((prev) => prev.filter((e) => e.id !== id));

    const { error } = await supabase.from("food_diary").delete().eq("id", id);
    if (error) {
      setEntries(previous);
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  const getEntriesForDate = (date: string) => entries.filter((e) => e.day === date);
  const getDatesWithEntries = () => [...new Set(entries.map((e) => e.day))];

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesForDate,
    getDatesWithEntries,
    mealTypeLabels,
  };
}
