import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Heart } from "lucide-react";

interface DigestiveSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  alerts: string[];
  tips: string[];
  index: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: "easeOut" as const },
  }),
};

export function DigestiveSection({ title, description, icon, alerts, tips, index }: DigestiveSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary shrink-0"
        >
          {icon}
        </motion.div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sinais de Alerta */}
        <motion.div
          custom={0}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="p-4 border-destructive/20 bg-destructive/5 dark:bg-destructive/10 rounded-2xl h-full">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="font-semibold text-destructive text-sm">Sinais de Alerta</h3>
            </div>
            <ul className="space-y-2">
              {alerts.map((alert, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  {alert}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* Dicas de Saúde */}
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="p-4 border-primary/20 bg-primary/5 dark:bg-primary/10 rounded-2xl h-full">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-primary text-sm">Dicas de Saúde</h3>
            </div>
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </div>
    </motion.section>
  );
}
