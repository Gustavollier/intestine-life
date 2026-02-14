import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Difficulty, Note } from "@/types/note";
import { Clock, Plus, Minus, Save } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  note?: Note;
  onSave: (data: { difficulty: Difficulty; duration: number; text: string }) => void;
}

const difficulties: Difficulty[] = ["Fácil", "Normal", "Difícil"];

export function NoteDialog({ open, onOpenChange, date, note, onSave }: NoteDialogProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>("Fácil");
  const [duration, setDuration] = useState(5);
  const [text, setText] = useState("");

  useEffect(() => {
    if (note) {
      setDifficulty(note.difficulty);
      setDuration(note.duration);
      setText(note.text);
    } else {
      setDifficulty("Fácil");
      setDuration(5);
      setText("");
    }
  }, [note, open]);

  const handleSave = () => {
    onSave({ difficulty, duration, text });
    onOpenChange(false);
  };

  const formattedDate = format(parseISO(date), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const isEditing = !!note;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Anotação" : "Nova Anotação"}</DialogTitle>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div>
            <p className="text-sm font-medium mb-2">Como foi?</p>
            <div className="flex gap-2">
              {difficulties.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
                    difficulty === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Quanto tempo demorou? (minutos)
            </p>
            <div className="flex items-center justify-center gap-6">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10"
                onClick={() => setDuration(Math.max(1, duration - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-2xl font-bold min-w-[60px] text-center">
                {duration} <span className="text-sm font-normal text-muted-foreground">min</span>
              </span>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 border-primary text-primary"
                onClick={() => setDuration(duration + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Anotações (opcional)</p>
            <Textarea
              placeholder="Adicione observações sobre alimentação, sintomas, etc..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          {isEditing ? (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 rounded-xl" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" /> Salvar
              </Button>
            </div>
          ) : (
            <Button className="w-full rounded-xl h-11" onClick={handleSave}>
              <Plus className="w-4 h-4 mr-1" /> Salvar Anotação
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
