import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, User, Lock, Moon, Sun, Crown, Loader2, CreditCard } from "lucide-react";
import StripeCheckout from "@/components/StripeCheckout";

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { profile: cachedProfile, loading: profileCacheLoading, updateCachedName, updateCachedPlan, fetchProfile } = useProfile();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  // Subscription state - start with cached plan so text shows instantly
  const [plan, setPlan] = useState(cachedProfile?.plan || "free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [checkingPlan, setCheckingPlan] = useState(!cachedProfile);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Sync from cached profile
  useEffect(() => {
    if (cachedProfile) {
      setName(cachedProfile.name);
      setPlan(cachedProfile.plan);
    }
  }, [cachedProfile]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate("/"); return; }
      setEmail(user.email || "");
    });
  }, [navigate]);

  // Check subscription status on mount and after checkout
  useEffect(() => {
    const checkSubscription = async () => {
      setCheckingPlan(true);
      try {
        const { data, error } = await supabase.functions.invoke("check-subscription");
        if (!error && data) {
          setPlan(data.plan || "free");
          updateCachedPlan(data.plan || "free");
          setSubscriptionEnd(data.subscription_end || null);
        }
      } catch (e) {
        console.error("Error checking subscription:", e);
      } finally {
        setCheckingPlan(false);
      }
    };
    checkSubscription();

    // Show toast if coming back from checkout
    const subParam = searchParams.get("subscription");
    if (subParam === "success") {
      toast({ title: "Assinatura ativada com sucesso! 🎉" });
      // Re-check after a moment for Stripe to process
      setTimeout(checkSubscription, 2000);
    } else if (subParam === "canceled") {
      toast({ title: "Checkout cancelado", variant: "destructive" });
    }
  }, [searchParams, toast]);

  const handleSaveName = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ name }).eq("user_id", user.id);
    if (error) {
      toast({ title: "Erro ao salvar nome", variant: "destructive" });
    } else {
      updateCachedName(name);
      toast({ title: "Nome atualizado com sucesso!" });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "A nova senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha alterada com sucesso!" });
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleUpgrade = () => {
    setCheckoutOpen(true);
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (e) {
      toast({ title: "Erro ao abrir portal", variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-foreground">Perfil</h1>
      </header>

      <main className="max-w-lg mx-auto p-6 flex flex-col gap-6">
        {/* Plan */}
        <Card className={`p-6 rounded-3xl shadow-lg border-2 ${plan === "pro" ? "border-yellow-500/50 bg-yellow-500/5" : "border-primary/20"}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className={`w-5 h-5 ${plan === "pro" ? "text-yellow-500" : "text-muted-foreground"}`} />
              <h2 className="font-semibold text-foreground">Seu plano</h2>
            </div>
            {plan === "pro" && (
              <span className="text-xs font-bold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2.5 py-1 rounded-full">
                PRO
              </span>
            )}
          </div>

          {checkingPlan ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando plano...
            </div>
          ) : plan === "pro" ? (
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                Você tem acesso a <strong>todas as funcionalidades</strong>, incluindo chat ilimitado e análises avançadas.
              </p>
              {subscriptionEnd && (
                <p className="text-xs text-muted-foreground">
                  Próxima renovação: {new Date(subscriptionEnd).toLocaleDateString("pt-BR")}
                </p>
              )}
              <Button variant="outline" onClick={handleManageSubscription} disabled={portalLoading} className="w-full rounded-xl">
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Gerenciar assinatura
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Plano gratuito — 5 mensagens/dia no chat e análise diária básica.
              </p>
              <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-semibold text-foreground">Desbloqueie com o Pro:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ Chat ilimitado com Dr. Intestine</li>
                  <li>✓ Análise mensal com tendências</li>
                  <li>✓ Relatórios detalhados</li>
                </ul>
              </div>
              <Button onClick={handleUpgrade} className="w-full rounded-xl">
                <Crown className="w-4 h-4 mr-2" />
                Assinar Pro — R$2,00/mês
              </Button>
            </div>
          )}
        </Card>

        {/* Name */}
        <Card className="p-6 border border-primary/20 rounded-3xl shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Informações pessoais</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={email} disabled className="opacity-60" />
            </div>
            <Button onClick={handleSaveName} disabled={saving} className="w-full rounded-xl">
              {saving ? "Salvando..." : "Salvar nome"}
            </Button>
          </div>
        </Card>

        {/* Password */}
        <Card className="p-6 border border-primary/20 rounded-3xl shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Alterar senha</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">Nova senha</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPassword} className="w-full rounded-xl">
              {changingPassword ? "Alterando..." : "Alterar senha"}
            </Button>
          </div>
        </Card>

        {/* Dark mode */}
        <Card className="p-6 border border-primary/20 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
              <h2 className="font-semibold text-foreground">Modo escuro</h2>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </Card>
      </main>

      <StripeCheckout open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}
