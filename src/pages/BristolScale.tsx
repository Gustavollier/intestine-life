import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const bristolTypes = [
  {
    type: 1,
    emoji: "🫘",
    title: "Tipo 1 — Caroços duros separados",
    description: "Fezes em formato de pequenas bolinhas duras, semelhantes a nozes. Difíceis de evacuar. Indicam constipação severa — as fezes ficaram muito tempo no intestino.",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  {
    type: 2,
    emoji: "🌰",
    title: "Tipo 2 — Forma de salsicha com caroços",
    description: "Formato alongado, mas com superfície irregular e grumosa. Também indica constipação, porém menos severa que o tipo 1.",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    type: 3,
    emoji: "🥜",
    title: "Tipo 3 — Salsicha com rachaduras",
    description: "Formato de salsicha com rachaduras na superfície. Considerado normal, mas pode indicar leve desidratação.",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  {
    type: 4,
    emoji: "🍌",
    title: "Tipo 4 — Salsicha lisa e macia",
    description: "Formato de salsicha ou cobra, lisa e macia. Este é o tipo ideal! Indica boa hidratação e trânsito intestinal saudável.",
    color: "bg-primary/10 text-primary border-primary/20",
  },
  {
    type: 5,
    emoji: "🫛",
    title: "Tipo 5 — Pedaços macios com bordas definidas",
    description: "Pedaços macios e separados, com bordas bem definidas. Fáceis de evacuar. Pode indicar falta de fibras na dieta.",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  {
    type: 6,
    emoji: "☁️",
    title: "Tipo 6 — Pedaços fofos e pastosos",
    description: "Fezes pastosas, sem forma definida, com bordas irregulares. Pode indicar diarreia leve ou trânsito intestinal acelerado.",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    type: 7,
    emoji: "💧",
    title: "Tipo 7 — Totalmente líquido",
    description: "Completamente líquido, sem pedaços sólidos. Indica diarreia. Pode ser causado por infecção, intolerância alimentar ou outros fatores.",
    color: "bg-red-100 text-red-700 border-red-200",
  },
];

export default function BristolScale() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-bold text-foreground leading-tight">Escala de Bristol</h1>
          <p className="text-xs text-muted-foreground">Classificação das fezes</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-4">
        <Card className="p-5 border-primary/20 rounded-3xl">
          <h2 className="font-semibold text-foreground mb-2">O que é a Escala de Bristol?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A Escala de Bristol é uma ferramenta médica criada na Universidade de Bristol em 1997 para classificar a forma das fezes humanas em 7 categorias. Ela ajuda pacientes e profissionais de saúde a avaliar o funcionamento do trânsito intestinal de forma simples e padronizada.
          </p>
        </Card>

        <div className="space-y-3">
          {bristolTypes.map((item) => (
            <Card key={item.type} className={`p-4 rounded-2xl border ${item.color}`}>
              <div className="flex items-start gap-3">
                <span className="text-3xl">{item.emoji}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs leading-relaxed opacity-80">{item.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-5 border-primary/20 rounded-3xl">
          <h2 className="font-semibold text-foreground mb-2">💡 Dica</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Os tipos <strong>3 e 4</strong> são considerados ideais. Se suas fezes estão frequentemente nos tipos 1-2 (constipação) ou 6-7 (diarreia), considere consultar um profissional de saúde e revisar sua dieta e hidratação.
          </p>
        </Card>
      </main>
    </div>
  );
}
