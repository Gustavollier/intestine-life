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
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendCode = async (e: React.FormEvent) => {
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
      toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada." });
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length < 6) {
      toast({ title: "Digite o código de 6 dígitos", variant: "destructive" });
      return;
    }

    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "recovery",
    });
    setVerifying(false);

    if (error) {
      toast({ title: "Código inválido", description: error.message, variant: "destructive" });
    } else {
      navigate("/reset-password");
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
                {sent ? "Digite o código enviado para seu email" : "Informe seu email para receber o código"}
              </p>
            </div>

            {!sent ? (
              <form onSubmit={handleSendCode} className="space-y-4">
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
                  {loading ? "Enviando..." : "Enviar código"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Código de verificação</label>
                  <Input
                    placeholder="Digite o código de 6 dígitos"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="bg-muted/50 text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-base font-semibold rounded-xl" disabled={verifying}>
                  {verifying ? "Verificando..." : "Verificar código"}
                </Button>
                <button
                  type="button"
                  onClick={() => { setSent(false); setCode(""); }}
                  className="w-full text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  Reenviar código
                </button>
              </form>
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
        <img
          src={intestineHero}
          alt="Intestine Life"
          className="w-[70%] max-w-lg object-contain drop-shadow-2xl"
        />
      </div>
    </div>
  );
};

export default ForgotPassword;
