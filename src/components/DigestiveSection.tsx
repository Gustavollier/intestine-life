import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface DigestiveSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  functions: string[];
  facts: string[];
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

export function DigestiveSection({
  title,
  description,
  icon,
  functions,
  facts,
  isExpanded,
  onToggle,
  index,
}: DigestiveSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <motion.div
        className={`bg-card rounded-3xl shadow-md border border-border overflow-hidden cursor-pointer transition-shadow ${
          isExpanded ? "ring-2 ring-primary shadow-lg" : ""
        }`}
        whileHover={{ scale: 1.01, y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={onToggle}
      >
        {/* Section Header */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ scale: isExpanded ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
              className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary shrink-0"
            >
              {icon}
            </motion.div>
            <div>
              <h4 className="text-lg font-bold text-foreground">{title}</h4>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="shrink-0 text-muted-foreground"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </div>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-5 pb-5 space-y-5">
                {/* Functions */}
                <div>
                  <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                    Funções Principais
                  </h5>
                  <ul className="space-y-2">
                    {functions.map((func, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="flex items-start gap-3 bg-secondary/50 dark:bg-secondary/30 rounded-xl p-3"
                      >
                        <span className="text-primary mt-0.5 font-bold text-xs">✓</span>
                        <span className="text-sm text-foreground">{func}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Facts */}
                <div>
                  <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                      </svg>
                    </span>
                    Curiosidades
                  </h5>
                  <div className="space-y-2">
                    {facts.map((fact, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 + idx * 0.08 }}
                        className="bg-secondary/50 dark:bg-secondary/30 rounded-xl p-3"
                      >
                        <p className="text-sm text-foreground">{fact}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
