import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import intestineHero from "@/assets/intestine-hero.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Digite seu email", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background px-6">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="pt-8 pb-6 px-8">
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3c-1.5 0-2.5 1-2.5 2.5v2c0 1-0.5 1.5-1.5 1.5-1 0-1.5 0.5-1.5 1.5v3c0 1.5 1 2.5 2.5 2.5h1c1 0 1.5 0.5 1.5 1.5v3c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5v-2c0-1 0.5-1.5 1.5-1.5h2c1 0 1.5-0.5 1.5-1.5v-2c0-1 0.5-1.5 1.5-1.5 1.5 0 2.5-1 2.5-2.5v-1c0-1.5-1-2.5-2.5-2.5-1 0-1.5-0.5-1.5-1.5v-1c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5v3c0 1-0.5 1.5-1.5 1.5H10c-1 0-1.5 0.5-1.5 1.5v1" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Recuperar Senha</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {sent ? "Verifique sua caixa de entrada" : "Informe seu email para receber o link"}
              </p>
            </div>

            {!sent ? (
              <form onSubmit={handleSendLink} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    placeholder="Digite seu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-muted/50"
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-base font-semibold rounded-xl" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    <path d="m16 19 2 2 4-4" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enviamos um link de recuperação para <strong className="text-foreground">{email}</strong>. Clique no link do email para redefinir sua senha.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="text-sm text-primary hover:underline"
                >
                  Reenviar email
                </button>
              </div>
            )}

            <p className="text-center mt-4">
              <button onClick={() => navigate("/")} className="text-primary text-sm font-medium hover:underline">
                Voltar para login
              </button>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:flex w-1/2 bg-primary items-center justify-center relative overflow-hidden">
        <img src={intestineHero} alt="Intestine Life" className="w-[70%] max-w-lg object-contain drop-shadow-2xl" loading="eager" fetchPriority="high" decoding="async" />
      </div>
    </div>
  );
};

export default ForgotPassword;
