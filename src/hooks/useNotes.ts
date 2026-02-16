import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Difficulty = "facil" | "normal" | "dificil";

export interface Evacuation {
  id: string;
  user_id: string;
  difficulty: Difficulty;
  duration: number;
  observations: string | null;
  day: string;
  time_of_day: string | null;
  bristol_scale: number | null;
  created_at: string;
}

const difficultyMap: Record<string, Difficulty> = {
  "Fácil": "facil",
  "Normal": "normal",
  "Difícil": "dificil",
};

const difficultyDisplayMap: Record<Difficulty, string> = {
  facil: "Fácil",
  normal: "Normal",
  dificil: "Difícil",
};

// Module-level cache to avoid re-fetching on every navigation
let cachedNotes: Evacuation[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useNotes() {
  const [notes, setNotes] = useState<Evacuation[]>(cachedNotes || []);
  const [loading, setLoading] = useState(!cachedNotes);
  const { toast } = useToast();

  const fetchNotes = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedNotes && (now - cacheTimestamp) < CACHE_TTL) {
      setNotes(cachedNotes);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("evacuations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar registros", variant: "destructive" });
    } else {
      const result = (data as Evacuation[]) || [];
      cachedNotes = result;
      cacheTimestamp = Date.now();
      setNotes(result);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (note: { difficulty: string; duration: number; text: string; date: string; time_of_day: string | null; bristol_scale: number | null }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const difficulty = difficultyMap[note.difficulty] || (note.difficulty as Difficulty);
    const tempId = crypto.randomUUID();
    const optimisticNote: Evacuation = {
      id: tempId,
      user_id: user.id,
      difficulty,
      duration: note.duration,
      observations: note.text || null,
      day: note.date,
      time_of_day: note.time_of_day,
      bristol_scale: note.bristol_scale,
      created_at: new Date().toISOString(),
    };

    setNotes((prev) => { const next = [optimisticNote, ...prev]; cachedNotes = next; return next; });

    const { error } = await supabase.from("evacuations").insert({
      user_id: user.id,
      difficulty,
      duration: note.duration,
      observations: note.text || null,
      day: note.date,
      time_of_day: note.time_of_day,
      bristol_scale: note.bristol_scale,
    });

    if (error) {
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      fetchNotes(true);
    }
  };

  const updateNote = async (id: string, data: { difficulty?: string; duration?: number; text?: string; time_of_day?: string | null; bristol_scale?: number | null }) => {
    const updates: Record<string, unknown> = {};
    if (data.difficulty) updates.difficulty = difficultyMap[data.difficulty] || data.difficulty;
    if (data.duration !== undefined) updates.duration = data.duration;
    if (data.text !== undefined) updates.observations = data.text || null;
    if (data.time_of_day !== undefined) updates.time_of_day = data.time_of_day;
    if (data.bristol_scale !== undefined) updates.bristol_scale = data.bristol_scale;

    const previousNotes = notes;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              ...(updates.difficulty && { difficulty: updates.difficulty as Difficulty }),
              ...(updates.duration !== undefined && { duration: updates.duration as number }),
              ...(updates.observations !== undefined && { observations: updates.observations as string | null }),
              ...(updates.time_of_day !== undefined && { time_of_day: updates.time_of_day as string | null }),
            }
          : n
      )
    );

    const { error } = await supabase.from("evacuations").update(updates).eq("id", id);

    if (error) {
      setNotes(previousNotes);
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    }
  };

  const deleteNote = async (id: string) => {
    const previousNotes = notes;
    setNotes((prev) => { const next = prev.filter((n) => n.id !== id); cachedNotes = next; return next; });

    const { error } = await supabase.from("evacuations").delete().eq("id", id);

    if (error) {
      setNotes(previousNotes);
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  const getNotesForDate = (date: string) => notes.filter((n) => n.day === date);

  const getDatesWithNotes = () => [...new Set(notes.map((n) => n.day))];

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    getNotesForDate,
    getDatesWithNotes,
    difficultyDisplayMap,
  };
}
