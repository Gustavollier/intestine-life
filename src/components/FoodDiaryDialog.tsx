import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MealType } from "@/hooks/useFoodDiary";
import { Plus, UtensilsCrossed } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FoodDiaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  onSave: (data: { day: string; meal_type: MealType; description: string }) => void;
}

const mealOptions: { value: MealType; label: string; emoji: string }[] = [
  { value: "breakfast", label: "Café da Manhã", emoji: "☕" },
  { value: "lunch", label: "Almoço", emoji: "🍽️" },
  { value: "snack", label: "Lanche", emoji: "🍎" },
  { value: "dinner", label: "Janta", emoji: "🌙" },
  { value: "other", label: "Outro", emoji: "🍴" },
];

export function FoodDiaryDialog({ open, onOpenChange, date, onSave }: FoodDiaryDialogProps) {
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [description, setDescription] = useState("");

  const handleSave = () => {
    if (!description.trim()) return;
    onSave({ day: date, meal_type: mealType, description: description.trim() });
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
            Nova Refeição
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

          <Button
            className="w-full rounded-xl h-11"
            onClick={handleSave}
            disabled={!description.trim()}
          >
            <Plus className="w-4 h-4 mr-1" /> Salvar Refeição
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
