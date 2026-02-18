import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { DigestiveSection } from "@/components/DigestiveSection";
import intestineHero from "@/assets/intestine-hero.png";

interface Section {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  functions: string[];
  facts: string[];
}

const sections: Section[] = [
  {
    id: "mouth",
    title: "Boca e Esôfago",
    description: "Onde tudo começa — mastigação e transporte do alimento.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8 2 6 5 6 8c0 2 1 3 2 4l1 1v3h6v-3l1-1c1-1 2-2 2-4 0-3-2-6-6-6z" />
        <path d="M9 16v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-2" />
      </svg>
    ),
    functions: [
      "Mastigação mecânica dos alimentos",
      "Mistura com saliva para facilitar a deglutição",
      "Início da digestão de carboidratos pela enzima amilase",
      "Transporte do alimento via movimentos peristálticos",
    ],
    facts: [
      "Produzimos cerca de 1,5 litros de saliva por dia",
      "O esôfago tem cerca de 25cm de comprimento",
      "Leva apenas 6 a 8 segundos para o alimento chegar ao estômago",
    ],
  },
  {
    id: "stomach",
    title: "Estômago",
    description: "O centro de processamento ácido do corpo.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c-3 0-6 2-6 6 0 2 0 4 2 6s2 4 2 6h4c0-2 0-4 2-6s2-4 2-6c0-4-3-6-6-6z" />
        <path d="M9 21h6" />
      </svg>
    ),
    functions: [
      "Armazenamento temporário dos alimentos",
      "Produção de ácido clorídrico para matar bactérias",
      "Digestão de proteínas através da pepsina",
      "Mistura e transformação em quimo",
    ],
    facts: [
      "Pode expandir para armazenar até 4 litros de alimento",
      "O pH do estômago é extremamente ácido (1,5–3,5)",
      "O muco protege a parede estomacal do próprio ácido",
    ],
  },
  {
    id: "small-intestine",
    title: "Intestino Delgado",
    description: "Principal local de absorção de nutrientes.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8c0 0 2-2 4-2s4 2 4 2 2-2 4-2 4 2 4 2" />
        <path d="M4 12c0 0 2 2 4 2s4-2 4-2 2 2 4 2 4-2 4-2" />
        <path d="M4 16c0 0 2-2 4-2s4 2 4 2 2-2 4-2 4 2 4 2" />
      </svg>
    ),
    functions: [
      "Absorção de nutrientes (proteínas, carboidratos, lipídios)",
      "Absorção de vitaminas e minerais essenciais",
      "Digestão final com ajuda do pâncreas e fígado",
      "Movimentação do conteúdo através de peristaltismo",
    ],
    facts: [
      "Tem aproximadamente 6 metros de comprimento",
      "Possui vilosidades que aumentam a área de absorção",
      "90% da absorção de nutrientes ocorre aqui",
    ],
  },
  {
    id: "large-intestine",
    title: "Intestino Grosso (Cólon)",
    description: "Absorção de água e formação das fezes.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 5c0-1 1-2 2-2h2c1 0 2 1 2 2v4c0 1 1 2 2 2h2c1 0 2 1 2 2v4c0 1-1 2-2 2h-2c-1 0-2-1-2-2v-2c0-1-1-2-2-2H7c-1 0-2-1-2-2V5z" />
      </svg>
    ),
    functions: [
      "Absorção de água e eletrólitos",
      "Formação e armazenamento das fezes",
      "Fermentação de fibras por bactérias benéficas",
      "Síntese de algumas vitaminas (K e B12)",
    ],
    facts: [
      "Abriga trilhões de bactérias benéficas (microbiota)",
      "Tem cerca de 1,5 metros de comprimento",
      "Pode armazenar fezes por até 48 horas",
    ],
  },
  {
    id: "rectum",
    title: "Reto e Ânus",
    description: "A etapa final — eliminação controlada.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12" />
        <path d="M8 11l4 4 4-4" />
        <path d="M5 19h14" />
        <path d="M7 21h10" />
      </svg>
    ),
    functions: [
      "Armazenamento temporário das fezes",
      "Controle da evacuação pelos esfíncteres",
      "Sinalização ao cérebro sobre necessidade de evacuar",
    ],
    facts: [
      "O reto tem apenas 15cm de comprimento",
      "Os esfíncteres anais possuem controle voluntário e involuntário",
      "A posição de cócoras facilita a evacuação completa",
    ],
  },
  {
    id: "liver-pancreas",
    title: "Fígado e Pâncreas",
    description: "Órgãos auxiliares essenciais para a digestão.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M3 12h18" />
        <path d="M12 3v18" />
      </svg>
    ),
    functions: [
      "Fígado: produção de bile para digestão de gorduras",
      "Pâncreas: produção de enzimas digestivas",
      "Regulação do metabolismo de nutrientes",
      "Neutralização da acidez vinda do estômago",
    ],
    facts: [
      "O fígado é o maior órgão interno do corpo",
      "O pâncreas produz insulina para controlar o açúcar no sangue",
      "A bile é armazenada na vesícula biliar entre as refeições",
    ],
  },
];

const tips = [
  { icon: "💧", tip: "Beba bastante água ao longo do dia" },
  { icon: "🥗", tip: "Consuma fibras em todas as refeições" },
  { icon: "🚶", tip: "Pratique exercícios regularmente" },
  { icon: "😴", tip: "Durma bem — o intestino também descansa" },
  { icon: "🍽️", tip: "Mastigue bem os alimentos (20-30x)" },
  { icon: "⏰", tip: "Mantenha horários regulares para refeições" },
];

export default function DigestiveGuide() {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3c-1.5 0-2.5 1-2.5 2.5v2c0 1-.5 1.5-1.5 1.5-1 0-1.5.5-1.5 1.5v3c0 1.5 1 2.5 2.5 2.5h1c1 0 1.5.5 1.5 1.5v3c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5v-2c0-1 .5-1.5 1.5-1.5h2c1 0 1.5-.5 1.5-1.5v-2c0-1 .5-1.5 1.5-1.5 1.5 0 2.5-1 2.5-2.5v-1c0-1.5-1-2.5-2.5-2.5-1 0-1.5-.5-1.5-1.5v-1c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5v3c0 1-.5 1.5-1.5 1.5H10c-1 0-1.5.5-1.5 1.5v1" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-foreground leading-tight">Guia Digestivo</h1>
            <p className="text-xs text-muted-foreground">Aprenda sobre cada parte do seu corpo</p>
          </div>
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-primary rounded-3xl p-8 text-primary-foreground text-center shadow-lg"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3, type: "spring" }}
            className="inline-block bg-primary-foreground/20 p-4 rounded-full mb-4"
          >
            <img src={intestineHero} alt="Sistema Digestivo" className="w-14 h-14 object-contain" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Conheça seu Sistema Digestivo</h2>
          <p className="text-primary-foreground/80 text-sm max-w-md mx-auto">
            Uma jornada fascinante através do seu corpo, desde a primeira mordida até a absorção completa dos nutrientes.
          </p>
        </motion.div>

        {/* Journey label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h3 className="text-lg font-bold text-foreground">A Jornada dos Alimentos</h3>
          <p className="text-sm text-muted-foreground">Toque em cada seção para aprender mais</p>
        </motion.div>

        {/* Accordion Sections */}
        <div className="space-y-3">
          {sections.map((section, index) => (
            <DigestiveSection
              key={section.id}
              title={section.title}
              description={section.description}
              icon={section.icon}
              functions={section.functions}
              facts={section.facts}
              isExpanded={expandedSection === section.id}
              onToggle={() => toggleSection(section.id)}
              index={index}
            />
          ))}
        </div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-card rounded-3xl p-6 border border-border shadow-sm"
        >
          <h3 className="text-lg font-bold text-foreground mb-4 text-center">
            Dicas para uma Digestão Saudável
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tips.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 bg-secondary/50 dark:bg-secondary/30 rounded-xl p-3"
              >
                <span className="text-xl">{item.icon}</span>
                <p className="text-sm text-foreground">{item.tip}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Back */}
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
