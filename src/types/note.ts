export type Difficulty = "Fácil" | "Normal" | "Difícil";

export interface Note {
  id: string;
  date: string; // YYYY-MM-DD
  difficulty: Difficulty;
  duration: number; // minutes
  text: string;
  time_of_day: string | null; // HH:MM
}
