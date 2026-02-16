import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Difficulty, Note } from "@/types/note";
import { Clock, Plus, Minus, Save, Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import bristolType1 from "@/assets/bristol/type1.png";
import bristolType2 from "@/assets/bristol/type2.png";
import bristolType3 from "@/assets/bristol/type3.png";
import bristolType4 from "@/assets/bristol/type4.png";
import bristolType5 from "@/assets/bristol/type5.png";
import bristolType6 from "@/assets/bristol/type6.png";
import bristolType7 from "@/assets/bristol/type7.png";

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  note?: Note;
  onSave: (data: { difficulty: Difficulty; duration: number; text: string; time_of_day: string | null; bristol_scale: number | null }) => void;
}

const difficulties: Difficulty[] = ["Fácil", "Normal", "Difícil"];

const bristolImages: Record<number, string> = {
  1: bristolType1, 2: bristolType2, 3: bristolType3, 4: bristolType4,
  5: bristolType5, 6: bristolType6, 7: bristolType7,
};

export function NoteDialog({ open, onOpenChange, date, note, onSave }: NoteDialogProps) {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty>("Fácil");
  const [duration, setDuration] = useState(5);
  const [text, setText] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<string>(format(new Date(), "HH:mm"));
  const [bristolScale, setBristolScale] = useState<number | null>(null);

  useEffect(() => {
    if (note) {
      setDifficulty(note.difficulty);
      setDuration(note.duration);
      setText(note.text);
      setTimeOfDay(note.time_of_day || format(new Date(), "HH:mm"));
      setBristolScale(note.bristol_scale);
    } else {
      setDifficulty("Fácil");
      setDuration(5);
      setText("");
      setTimeOfDay(format(new Date(), "HH:mm"));
      setBristolScale(null);
    }
  }, [note, open]);

  const handleSave = () => {
    onSave({ difficulty, duration, text, time_of_day: timeOfDay || null, bristol_scale: bristolScale });
    onOpenChange(false);
  };

  const formattedDate = format(parseISO(date), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const isEditing = !!note;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Registro" : "Novo Registro de Evacuação"}</DialogTitle>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Time of day */}
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Horário
            </p>
            <Input
              type="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Difficulty */}
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

          {/* Bristol Scale */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Escala de Bristol (opcional)</p>
              <button
                type="button"
                onClick={() => { navigate("/bristol-scale", { state: { fromDialog: true, date } }); onOpenChange(false); }}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                <Info className="w-3 h-3" /> O que é?
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  onClick={() => setBristolScale(bristolScale === n ? null : n)}
                  className={`flex flex-col items-center py-2 rounded-xl text-xs font-medium transition-colors ${
                    bristolScale === n
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  <img src={bristolImages[n]} alt={`Tipo ${n}`} className="w-6 h-6 rounded object-cover" />
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
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

          {/* Observations */}
          <div>
            <p className="text-sm font-medium mb-2">Observações (opcional)</p>
            <Textarea
              placeholder="Adicione observações sobre consistência, alimentação, sintomas, etc..."
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
              <Plus className="w-4 h-4 mr-1" /> Salvar Registro
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
