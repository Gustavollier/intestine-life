import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: name.trim(),
          phone_number: phone.trim() || null,
          birthdate: birthdate || null,
        },
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cadastro realizado!", description: "Verifique seu email para confirmar a conta." });
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardContent className="pt-8 pb-6 px-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3c-1.5 0-2.5 1-2.5 2.5v2c0 1-0.5 1.5-1.5 1.5-1 0-1.5 0.5-1.5 1.5v3c0 1.5 1 2.5 2.5 2.5h1c1 0 1.5 0.5 1.5 1.5v3c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5v-2c0-1 0.5-1.5 1.5-1.5h2c1 0 1.5-0.5 1.5-1.5v-2c0-1 0.5-1.5 1.5-1.5 1.5 0 2.5-1 2.5-2.5v-1c0-1.5-1-2.5-2.5-2.5-1 0-1.5-0.5-1.5-1.5v-1c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5v3c0 1-0.5 1.5-1.5 1.5H10c-1 0-1.5 0.5-1.5 1.5v1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Criar Conta</h1>
            <p className="text-muted-foreground text-sm mt-1">Preencha seus dados para se cadastrar</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nome *</label>
              <Input
                placeholder="Digite seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-muted/50"
                maxLength={70}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email *</label>
              <Input
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted/50"
                maxLength={255}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Telefone</label>
              <Input
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Data de nascimento</label>
              <Input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Senha *</label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted/50"
              />
            </div>
            <Button type="submit" className="w-full h-11 text-base font-semibold rounded-xl" disabled={loading}>
              {loading ? "Cadastrando..." : "Criar Conta"}
            </Button>
          </form>

          <p className="text-center mt-4">
            <button onClick={() => navigate("/")} className="text-primary text-sm font-medium hover:underline">
              Já tenho uma conta
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
