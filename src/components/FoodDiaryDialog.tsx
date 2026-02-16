import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MealType, FoodEntry } from "@/hooks/useFoodDiary";
import { Plus, UtensilsCrossed, Save } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FoodDiaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  entry?: FoodEntry;
  onSave: (data: { day: string; meal_type: MealType; description: string }) => void;
  onUpdate?: (id: string, data: { meal_type: MealType; description: string }) => void;
}

const mealOptions: { value: MealType; label: string; emoji: string }[] = [
  { value: "breakfast", label: "Café da Manhã", emoji: "☕" },
  { value: "lunch", label: "Almoço", emoji: "🍽️" },
  { value: "snack", label: "Lanche", emoji: "🍎" },
  { value: "dinner", label: "Janta", emoji: "🌙" },
  { value: "other", label: "Outro", emoji: "🍴" },
];

export function FoodDiaryDialog({ open, onOpenChange, date, entry, onSave, onUpdate }: FoodDiaryDialogProps) {
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [description, setDescription] = useState("");

  const isEditing = !!entry;

  useEffect(() => {
    if (entry) {
      setMealType(entry.meal_type);
      setDescription(entry.description);
    } else {
      setMealType("lunch");
      setDescription("");
    }
  }, [entry, open]);

  const handleSave = () => {
    if (!description.trim()) return;
    if (isEditing && onUpdate) {
      onUpdate(entry.id, { meal_type: mealType, description: description.trim() });
    } else {
      onSave({ day: date, meal_type: mealType, description: description.trim() });
    }
    setDescription("");
    setMealType("lunch");
    onOpenChange(false);
  };

  const formattedDate = format(parseISO(date), "d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-primary" />
            {isEditing ? "Editar Refeição" : "Nova Refeição"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Meal type */}
          <div>
            <p className="text-sm font-medium mb-2">Tipo de refeição</p>
            <div className="grid grid-cols-3 gap-2">
              {mealOptions.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMealType(m.value)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-medium transition-colors text-center ${
                    mealType === m.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  <span className="text-base block mb-0.5">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-medium mb-2">O que você comeu?</p>
            <Textarea
              placeholder="Ex: Arroz, feijão, salada, frango grelhado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          {isEditing ? (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 rounded-xl"
                onClick={handleSave}
                disabled={!description.trim()}
              >
                <Save className="w-4 h-4 mr-1" /> Salvar
              </Button>
            </div>
          ) : (
            <Button
              className="w-full rounded-xl h-11"
              onClick={handleSave}
              disabled={!description.trim()}
            >
              <Plus className="w-4 h-4 mr-1" /> Salvar Refeição
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
