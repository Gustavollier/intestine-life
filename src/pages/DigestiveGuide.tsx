import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { DigestiveSection } from "@/components/DigestiveSection";

const sections = [
  {
    title: "Boca e Esôfago",
    description: "Aqui começa a digestão! A mastigação quebra os alimentos e a saliva inicia a digestão química. O esôfago transporta o bolo alimentar até o estômago através de movimentos peristálticos.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8 2 6 5 6 8c0 2 1 3 2 4l1 1v3h6v-3l1-1c1-1 2-2 2-4 0-3-2-6-6-6z" />
        <path d="M9 16v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-2" />
      </svg>
    ),
    alerts: [
      "Dificuldade para engolir (disfagia)",
      "Azia ou queimação frequente",
      "Dor ao mastigar ou engolir",
      "Sensação de alimento preso na garganta",
    ],
    tips: [
      "Mastigue bem os alimentos (20-30x por porção)",
      "Coma devagar e em porções menores",
      "Evite deitar logo após comer",
      "Mantenha boa higiene bucal",
    ],
  },
  {
    title: "Estômago",
    description: "O estômago é como um liquidificador ácido! Ele mistura os alimentos com ácido clorídrico e enzimas (como a pepsina) para quebrar proteínas. O alimento vira uma pasta chamada quimo.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c-3 0-6 2-6 6 0 2 0 4 2 6s2 4 2 6h4c0-2 0-4 2-6s2-4 2-6c0-4-3-6-6-6z" />
        <path d="M9 21h6" />
      </svg>
    ),
    alerts: [
      "Queimação persistente (gastrite)",
      "Náuseas e vômitos frequentes",
      "Refluxo gastroesofágico",
      "Dor abdominal após refeições",
    ],
    tips: [
      "Evite comer deitado ou muito tarde",
      "Reduza alimentos muito ácidos ou picantes",
      "Não pule refeições",
      "Gerencie o estresse (ele afeta o estômago!)",
    ],
  },
  {
    title: "Intestino Delgado",
    description: "Com cerca de 6 metros, é onde a mágica da absorção acontece! Dividido em duodeno, jejuno e íleo, ele absorve nutrientes essenciais como vitaminas, minerais, carboidratos e gorduras.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8c0 0 2-2 4-2s4 2 4 2 2-2 4-2 4 2 4 2" />
        <path d="M4 12c0 0 2 2 4 2s4-2 4-2 2 2 4 2 4-2 4-2" />
        <path d="M4 16c0 0 2-2 4-2s4 2 4 2 2-2 4-2 4 2 4 2" />
      </svg>
    ),
    alerts: [
      "Inchaço e gases excessivos",
      "Diarreia crônica",
      "Perda de peso inexplicada",
      "Deficiência de vitaminas e minerais",
    ],
    tips: [
      "Mantenha dieta balanceada e variada",
      "Inclua probióticos (iogurte, kefir)",
      "Consuma prebióticos (alho, cebola, banana)",
      "Evite excesso de alimentos processados",
    ],
  },
  {
    title: "Intestino Grosso (Cólon)",
    description: "Responsável por absorver água e sais minerais, além de formar e armazenar as fezes. Aqui vivem bilhões de bactérias da microbiota intestinal, essenciais para sua saúde!",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 5c0-1 1-2 2-2h2c1 0 2 1 2 2v4c0 1 1 2 2 2h2c1 0 2 1 2 2v4c0 1-1 2-2 2h-2c-1 0-2-1-2-2v-2c0-1-1-2-2-2H7c-1 0-2-1-2-2V5z" />
      </svg>
    ),
    alerts: [
      "Constipação persistente",
      "Sangue nas fezes",
      "Alternância entre diarreia e constipação",
      "Dor abdominal crônica",
    ],
    tips: [
      "Consuma fibras diariamente (25-30g/dia)",
      "Beba bastante água (2L+ por dia)",
      "Pratique exercícios regularmente",
      "Não ignore a vontade de evacuar",
    ],
  },
  {
    title: "Reto e Ânus",
    description: "A etapa final! O reto armazena as fezes até o momento da evacuação. O ânus possui esfíncteres que controlam a eliminação. Uma evacuação saudável deve ser confortável e regular.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12" />
        <path d="M8 11l4 4 4-4" />
        <path d="M5 19h14" />
        <path d="M7 21h10" />
      </svg>
    ),
    alerts: [
      "Dor ao evacuar",
      "Hemorroidas frequentes",
      "Sangramento anal",
      "Sensação de evacuação incompleta",
    ],
    tips: [
      "Não segure as fezes — vá ao banheiro quando sentir vontade",
      "Use a postura correta (joelhos acima do quadril)",
      "Evite esforço excessivo",
      "Considere usar um banquinho de apoio para os pés",
    ],
  },
];

export default function DigestiveGuide() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-bold text-foreground leading-tight">Guia do Sistema Digestivo</h1>
          <p className="text-xs text-muted-foreground">Entenda como funciona seu intestino</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 mx-auto rounded-3xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3c-1.5 0-2.5 1-2.5 2.5v2c0 1-0.5 1.5-1.5 1.5-1 0-1.5 0.5-1.5 1.5v3c0 1.5 1 2.5 2.5 2.5h1c1 0 1.5 0.5 1.5 1.5v3c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5v-2c0-1 0.5-1.5 1.5-1.5h2c1 0 1.5-0.5 1.5-1.5v-2c0-1 0.5-1.5 1.5-1.5 1.5 0 2.5-1 2.5-2.5v-1c0-1.5-1-2.5-2.5-2.5-1 0-1.5-0.5-1.5-1.5v-1c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5v3c0 1-0.5 1.5-1.5 1.5H10c-1 0-1.5 0.5-1.5 1.5v1" />
            </svg>
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Seu Sistema Digestivo</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Descubra como cada parte do seu trato digestivo funciona, quais sinais merecem atenção e dicas práticas para manter tudo em equilíbrio.
          </p>
        </motion.div>

        {/* Sections */}
        {sections.map((section, index) => (
          <DigestiveSection
            key={section.title}
            title={section.title}
            description={section.description}
            icon={section.icon}
            alerts={section.alerts}
            tips={section.tips}
            index={index}
          />
        ))}

        {/* Final tips card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="p-6 border-primary/20 rounded-3xl bg-primary/5 dark:bg-primary/10">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Dicas Gerais de Saúde Intestinal</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Beba pelo menos 2 litros de água por dia",
                "Consuma fibras em todas as refeições",
                "Pratique atividade física regularmente",
                "Gerencie o estresse com meditação ou yoga",
                "Durma bem — o intestino também descansa",
                "Evite automedicação — consulte um médico",
              ].map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <span className="text-primary font-bold">✓</span>
                  {tip}
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Back button */}
        <div className="text-center pb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="gap-2 rounded-xl">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
