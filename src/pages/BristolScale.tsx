import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import bristolType1 from "@/assets/bristol/type1.png";
import bristolType2 from "@/assets/bristol/type2.png";
import bristolType3 from "@/assets/bristol/type3.png";
import bristolType4 from "@/assets/bristol/type4.png";
import bristolType5 from "@/assets/bristol/type5.png";
import bristolType6 from "@/assets/bristol/type6.png";
import bristolType7 from "@/assets/bristol/type7.png";

const bristolImages: Record<number, string> = {
  1: bristolType1, 2: bristolType2, 3: bristolType3, 4: bristolType4,
  5: bristolType5, 6: bristolType6, 7: bristolType7,
};

const bristolTypes = [
  {
    type: 1,
    title: "Tipo 1 — Caroços duros separados",
    description: "Fezes em formato de pequenas bolinhas duras, semelhantes a nozes. Difíceis de evacuar. Indicam constipação severa — as fezes ficaram muito tempo no intestino.",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  {
    type: 2,
    title: "Tipo 2 — Forma de salsicha com caroços",
    description: "Formato alongado, mas com superfície irregular e grumosa. Também indica constipação, porém menos severa que o tipo 1.",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    type: 3,
    title: "Tipo 3 — Salsicha com rachaduras",
    description: "Formato de salsicha com rachaduras na superfície. Considerado normal, mas pode indicar leve desidratação.",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  {
    type: 4,
    title: "Tipo 4 — Salsicha lisa e macia",
    description: "Formato de salsicha ou cobra, lisa e macia. Este é o tipo ideal! Indica boa hidratação e trânsito intestinal saudável.",
    color: "bg-primary/10 text-primary border-primary/20",
  },
  {
    type: 5,
    title: "Tipo 5 — Pedaços macios com bordas definidas",
    description: "Pedaços macios e separados, com bordas bem definidas. Fáceis de evacuar. Pode indicar falta de fibras na dieta.",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  {
    type: 6,
    title: "Tipo 6 — Pedaços fofos e pastosos",
    description: "Fezes pastosas, sem forma definida, com bordas irregulares. Pode indicar diarreia leve ou trânsito intestinal acelerado.",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    type: 7,
    title: "Tipo 7 — Totalmente líquido",
    description: "Completamente líquido, sem pedaços sólidos. Indica diarreia. Pode ser causado por infecção, intolerância alimentar ou outros fatores.",
    color: "bg-red-100 text-red-700 border-red-200",
  },
];

export default function BristolScale() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromDialog = location.state?.fromDialog;
  const dialogDate = location.state?.date;

  const handleBack = () => {
    if (fromDialog && dialogDate) {
      navigate("/dashboard", { state: { openNoteDialog: true, date: dialogDate } });
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-xl">
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
                <img src={bristolImages[item.type]} alt={`Tipo ${item.type}`} className="w-14 h-14 rounded-xl object-contain bg-white p-1 shadow-sm" />
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
