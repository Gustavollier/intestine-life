import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Bot, TrendingUp, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProUpgradeModal({ open, onOpenChange }: ProUpgradeModalProps) {
  const navigate = useNavigate();

  const features = [
    { icon: Bot, label: "Análises diárias ilimitadas com Dr. Intestine" },
    { icon: TrendingUp, label: "Análises mensais de tendências de saúde" },
    { icon: MessageCircle, label: "Chat ilimitado com o Dr. Intestine" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl border-primary/20">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/20 mb-4">
            <Crown className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-primary-foreground mb-1">
            Desbloqueie o Plano PRO
          </h2>
          <p className="text-sm text-primary-foreground/80">
            Você atingiu o limite do plano gratuito
          </p>
        </div>

        {/* Features */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Com o PRO, você terá acesso completo a:
          </p>

          <div className="space-y-3">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-foreground">{feature.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate("/profile");
              }}
              className="w-full h-12 rounded-xl text-base font-semibold gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Assinar o PRO
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full text-sm text-muted-foreground"
            >
              Continuar no plano gratuito
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
