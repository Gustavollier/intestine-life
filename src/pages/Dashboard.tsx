import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNotes } from "@/hooks/useNotes";
import { NoteDialog } from "@/components/NoteDialog";
import { Note, Difficulty } from "@/types/note";
import { ChevronLeft, ChevronRight, LogOut, Plus, Pencil, Trash2, Clock, X } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const difficultyColors: Record<Difficulty, string> = {
  "Fácil": "bg-primary/20 text-primary",
  "Normal": "bg-yellow-100 text-yellow-700",
  "Difícil": "bg-red-100 text-red-600",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem("intestine_user") || "usuário";
  const { addNote, updateNote, deleteNote, getNotesForDate, getDatesWithNotes } = useNotes();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>();

  const datesWithNotes = getDatesWithNotes();
  const selectedNotes = selectedDate ? getNotesForDate(selectedDate) : [];

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });
    const startPadding = getDay(start);
    return { allDays, startPadding };
  }, [currentMonth]);

  const today = format(new Date(), "yyyy-MM-dd");

  const handleLogout = () => {
    localStorage.removeItem("intestine_user");
    navigate("/");
  };

  const handleNewNote = () => {
    setEditingNote(undefined);
    setDialogOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setDialogOpen(true);
  };

  const handleSaveNote = (data: { difficulty: Difficulty; duration: number; text: string }) => {
    if (editingNote) {
      updateNote(editingNote.id, data);
    } else if (selectedDate) {
      addNote({ ...data, date: selectedDate });
    }
  };

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
        <h2 className="text-xl font-bold text-foreground mb-4">Acompanhamento mensal</h2>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar */}
          <Card className="flex-1 p-6 border border-primary/20 rounded-3xl shadow-lg">
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

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: days.startPadding }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {days.allDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const hasNotes = datesWithNotes.includes(dateStr);
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
                        : hasNotes
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                    {hasNotes && !isToday && (
                      <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Notes panel - always visible */}
          <Card className="w-full lg:w-96 p-5 border border-primary/20 rounded-3xl shadow-lg">
            {selectedDate ? (
              <>
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="font-bold text-foreground">Anotações do Dia</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(selectedDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-primary font-medium mt-0.5">
                      Total de vezes: {selectedNotes.length}
                    </p>
                  </div>
                  <button onClick={() => setSelectedDate(null)} className="p-1 hover:bg-muted rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 mt-4">
                  {selectedNotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma anotação para este dia.
                    </p>
                  ) : (
                    selectedNotes.map((note, idx) => (
                      <div key={note.id} className="border border-border rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              #{idx + 1}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColors[note.difficulty]}`}>
                              {note.difficulty}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> {note.duration} min
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
                        {note.text && <p className="text-sm text-foreground">{note.text}</p>}
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-40">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <p className="text-sm font-medium">Selecione um dia</p>
              </div>
            )}
          </Card>
        </div>

        {/* New note button */}
        <Button onClick={handleNewNote} className="w-full max-w-3xl mt-6 h-12 rounded-xl text-base font-semibold gap-2">
          <Plus className="w-5 h-5" /> Nova Anotação
        </Button>
      </main>

      {selectedDate && (
        <NoteDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          date={selectedDate}
          note={editingNote}
          onSave={handleSaveNote}
        />
      )}
    </div>
  );
}
