import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNotes, Evacuation } from "@/hooks/useNotes";
import { useFoodDiary } from "@/hooks/useFoodDiary";
import { NoteDialog } from "@/components/NoteDialog";
import { FoodDiaryDialog } from "@/components/FoodDiaryDialog";
import { Difficulty } from "@/types/note";
import { ChatWidget } from "@/components/ChatWidget";
import { ChevronLeft, ChevronRight, LogOut, Plus, Pencil, Trash2, Clock, X, UtensilsCrossed } from "lucide-react";
import { SwipeableCard } from "@/components/SwipeableCard";
import washHandsSvg from "@/assets/undraw-wash-hands.svg";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const difficultyColors: Record<string, string> = {
  "Fácil": "bg-primary/20 text-primary",
  "Normal": "bg-yellow-100 text-yellow-700",
  "Difícil": "bg-red-100 text-red-600",
};

type TabType = "evacuations" | "food";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("usuário");
  const { addNote, updateNote, deleteNote, getNotesForDate, getDatesWithNotes, difficultyDisplayMap, loading: notesLoading } = useNotes();
  const { addEntry, updateEntry, deleteEntry, getEntriesForDate, getDatesWithEntries, mealTypeLabels, loading: foodLoading } = useFoodDiary();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(format(new Date(), "yyyy-MM-dd"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [foodDialogOpen, setFoodDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Evacuation | undefined>();
  const [activeTab, setActiveTab] = useState<TabType>("evacuations");
  const [editingFoodEntry, setEditingFoodEntry] = useState<import("@/hooks/useFoodDiary").FoodEntry | undefined>();

  // Reopen NoteDialog when returning from Bristol Scale page
  useEffect(() => {
    if (location.state?.openNoteDialog && location.state?.date) {
      setSelectedDate(location.state.date);
      setDialogOpen(true);
      // Clear the state so it doesn't reopen on re-render
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }
      const { data } = await supabase.from("profiles").select("name").eq("user_id", user.id).maybeSingle();
      if (data?.name) setUsername(data.name.split(" ")[0]);
    };
    getProfile();
  }, [navigate]);

  const datesWithNotes = getDatesWithNotes();
  const datesWithFood = getDatesWithEntries();
  const selectedNotes = selectedDate ? getNotesForDate(selectedDate) : [];
  const selectedFoodEntries = selectedDate ? getEntriesForDate(selectedDate) : [];

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });
    const startPadding = getDay(start);
    return { allDays, startPadding };
  }, [currentMonth]);

  const today = format(new Date(), "yyyy-MM-dd");
  const isLoading = notesLoading || foodLoading;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleNewNote = () => {
    setEditingNote(undefined);
    setDialogOpen(true);
  };

  const handleEditNote = (note: Evacuation) => {
    setEditingNote(note);
    setDialogOpen(true);
  };

  const handleSaveNote = async (data: { difficulty: Difficulty; duration: number; text: string; time_of_day: string | null; bristol_scale: number | null }) => {
    if (editingNote) {
      await updateNote(editingNote.id, data);
    } else if (selectedDate) {
      await addNote({ ...data, date: selectedDate });
    }
  };

  const editingNoteForDialog = editingNote
    ? {
        id: editingNote.id,
        date: editingNote.day,
        difficulty: (difficultyDisplayMap[editingNote.difficulty] || "Fácil") as Difficulty,
        duration: editingNote.duration,
        text: editingNote.observations || "",
        time_of_day: editingNote.time_of_day || null,
        bristol_scale: editingNote.bristol_scale ?? null,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3c-1.5 0-2.5 1-2.5 2.5v2c0 1-0.5 1.5-1.5 1.5-1 0-1.5 0.5-1.5 1.5v3c0 1.5 1 2.5 2.5 2.5h1c1 0 1.5 0.5 1.5 1.5v3c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5v-2c0-1 0.5-1.5 1.5-1.5h2c1 0 1.5-0.5 1.5-1.5v-2c0-1 0.5-1.5 1.5-1.5 1.5 0 2.5-1 2.5-2.5v-1c0-1.5-1-2.5-2.5-2.5-1 0-1.5-0.5-1.5-1.5v-1c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5v3c0 1-0.5 1.5-1.5 1.5H10c-1 0-1.5 0.5-1.5 1.5v1" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-foreground leading-tight">Intestine Life</h1>
            <p className="text-xs text-muted-foreground">Olá, {username}!</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5">
          <LogOut className="w-4 h-4" /> Sair
        </Button>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Acompanhamento mensal de constipação</h2>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar column */}
          <div className="flex-1 flex flex-col gap-6">
            <Card className="p-6 border border-primary/20 rounded-3xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-muted rounded">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="font-semibold text-foreground capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </h3>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-muted rounded">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((d) => (
                  <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
                ))}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center animate-pulse"
                    style={{ animationDuration: "1.5s" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3c-1.5 0-2.5 1-2.5 2.5v2c0 1-0.5 1.5-1.5 1.5-1 0-1.5 0.5-1.5 1.5v3c0 1.5 1 2.5 2.5 2.5h1c1 0 1.5 0.5 1.5 1.5v3c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5v-2c0-1 0.5-1.5 1.5-1.5h2c1 0 1.5-0.5 1.5-1.5v-2c0-1 0.5-1.5 1.5-1.5 1.5 0 2.5-1 2.5-2.5v-1c0-1.5-1-2.5-2.5-2.5-1 0-1.5-0.5-1.5-1.5v-1c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5v3c0 1-0.5 1.5-1.5 1.5H10c-1 0-1.5 0.5-1.5 1.5v1" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: days.startPadding }).map((_, i) => (
                    <div key={`pad-${i}`} />
                  ))}
                  {days.allDays.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const hasNotes = datesWithNotes.includes(dateStr);
                    const hasFood = datesWithFood.includes(dateStr);
                    const isToday = dateStr === today;
                    const isSelected = dateStr === selectedDate;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                          isToday
                            ? "bg-primary text-primary-foreground font-bold"
                            : isSelected
                            ? "bg-primary/20 text-primary font-semibold"
                            : hasNotes || hasFood
                            ? "bg-primary/10 text-foreground"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        {format(day, "d")}
                        <div className="absolute bottom-0.5 flex gap-0.5">
                          {hasNotes && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                          {hasFood && <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground/50" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>

            <div className="flex gap-3">
              <Button onClick={handleNewNote} className="flex-1 h-12 rounded-xl text-base font-semibold gap-2">
                <Plus className="w-5 h-5" /> Evacuação
              </Button>
              <Button
                onClick={() => selectedDate && setFoodDialogOpen(true)}
                variant="outline"
                className="flex-1 h-12 rounded-xl text-base font-semibold gap-2 border-primary/30 text-primary hover:bg-primary/10"
                disabled={!selectedDate}
              >
                <UtensilsCrossed className="w-5 h-5" /> Refeição
              </Button>
            </div>
          </div>

          {/* Side panel */}
          <Card className="w-full lg:w-96 p-5 border border-primary/20 rounded-3xl shadow-lg">
            {selectedDate ? (
              <>
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(selectedDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <button onClick={() => setSelectedDate(null)} className="p-1 hover:bg-muted rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-muted rounded-xl p-1 mb-4">
                  <button
                    onClick={() => setActiveTab("evacuations")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "evacuations" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Evacuações ({selectedNotes.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("food")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "food" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Refeições ({selectedFoodEntries.length})
                  </button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center animate-pulse"
                      style={{ animationDuration: "1.5s" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3c-1.5 0-2.5 1-2.5 2.5v2c0 1-0.5 1.5-1.5 1.5-1 0-1.5 0.5-1.5 1.5v3c0 1.5 1 2.5 2.5 2.5h1c1 0 1.5 0.5 1.5 1.5v3c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5v-2c0-1 0.5-1.5 1.5-1.5h2c1 0 1.5-0.5 1.5-1.5v-2c0-1 0.5-1.5 1.5-1.5 1.5 0 2.5-1 2.5-2.5v-1c0-1.5-1-2.5-2.5-2.5-1 0-1.5-0.5-1.5-1.5v-1c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5v3c0 1-0.5 1.5-1.5 1.5H10c-1 0-1.5 0.5-1.5 1.5v1" />
                      </svg>
                    </div>
                  </div>
                ) : activeTab === "evacuations" ? (
                  <div className="space-y-3">
                    {selectedNotes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6">
                        <img src={washHandsSvg} alt="Ilustração de saúde" className="w-36 h-auto opacity-50 mb-3" />
                        <p className="text-sm text-muted-foreground text-center">
                          Nenhum registro de evacuação para este dia.
                        </p>
                      </div>
                    ) : (
                      selectedNotes.map((note, idx) => {
                        const displayDifficulty = difficultyDisplayMap[note.difficulty] || "Normal";
                        return (
                          <div key={note.id} className="border border-border rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                  #{idx + 1}
                                </span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColors[displayDifficulty] || ""}`}>
                                  {displayDifficulty}
                                </span>
                                {note.bristol_scale && (
                                  <span className="text-xs text-muted-foreground">
                                    Bristol: {note.bristol_scale}
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" /> {note.time_of_day ? note.time_of_day.slice(0, 5) : "--:--"} · {note.duration} min
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => handleEditNote(note)} className="p-1.5 hover:bg-muted rounded">
                                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                </button>
                                <button onClick={() => deleteNote(note.id)} className="p-1.5 hover:bg-destructive/10 rounded">
                                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                                </button>
                              </div>
                            </div>
                            {note.observations && <p className="text-sm text-foreground">{note.observations}</p>}
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedFoodEntries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6">
                        <UtensilsCrossed className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground text-center">
                          Nenhuma refeição registrada neste dia.
                        </p>
                      </div>
                    ) : (
                      selectedFoodEntries.map((entry) => (
                        <SwipeableCard
                          key={entry.id}
                          onEdit={() => { setEditingFoodEntry(entry); setFoodDialogOpen(true); }}
                          onDelete={() => deleteEntry(entry.id)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                              {mealTypeLabels[entry.meal_type]}
                            </span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{entry.description}</p>
                        </SwipeableCard>
                      ))
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
                <img src={washHandsSvg} alt="Ilustração de saúde" className="w-40 h-auto opacity-50 mb-4" />
                <p className="text-sm font-medium">Selecione um dia</p>
              </div>
            )}
          </Card>
        </div>
      </main>

      {selectedDate && (
        <>
          <NoteDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            date={selectedDate}
            note={editingNoteForDialog}
            onSave={handleSaveNote}
          />
          <FoodDiaryDialog
            open={foodDialogOpen}
            onOpenChange={(open) => { setFoodDialogOpen(open); if (!open) setEditingFoodEntry(undefined); }}
            date={selectedDate}
            entry={editingFoodEntry}
            onSave={addEntry}
            onUpdate={(id, data) => updateEntry(id, data)}
          />
        </>
      )}

      <ChatWidget />
    </div>
  );
}
