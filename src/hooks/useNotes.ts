import { useState, useEffect } from "react";
import { Note } from "@/types/note";

const STORAGE_KEY = "intestine_notes";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const addNote = (note: Omit<Note, "id">) => {
    setNotes((prev) => [...prev, { ...note, id: crypto.randomUUID() }]);
  };

  const updateNote = (id: string, data: Partial<Omit<Note, "id">>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...data } : n)));
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const getNotesForDate = (date: string) => notes.filter((n) => n.date === date);

  const getDatesWithNotes = () => [...new Set(notes.map((n) => n.date))];

  return { notes, addNote, updateNote, deleteNote, getNotesForDate, getDatesWithNotes };
}
