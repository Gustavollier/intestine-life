import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Difficulty = "facil" | "normal" | "dificil";

export interface Annotation {
  id: string;
  user_id: string;
  difficulty: Difficulty;
  duration: number;
  observations: string | null;
  day: string;
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

export function useNotes() {
  const [notes, setNotes] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("annotations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar anotações", variant: "destructive" });
    } else {
      setNotes((data as Annotation[]) || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (note: { difficulty: string; duration: number; text: string; date: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const difficulty = difficultyMap[note.difficulty] || (note.difficulty as Difficulty);

    const { error } = await supabase.from("annotations").insert({
      user_id: user.id,
      difficulty,
      duration: note.duration,
      observations: note.text || null,
      day: note.date,
    });

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      await fetchNotes();
    }
  };

  const updateNote = async (id: string, data: { difficulty?: string; duration?: number; text?: string }) => {
    const updates: Record<string, unknown> = {};
    if (data.difficulty) updates.difficulty = difficultyMap[data.difficulty] || data.difficulty;
    if (data.duration !== undefined) updates.duration = data.duration;
    if (data.text !== undefined) updates.observations = data.text || null;

    const { error } = await supabase.from("annotations").update(updates).eq("id", id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      await fetchNotes();
    }
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from("annotations").delete().eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      await fetchNotes();
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
