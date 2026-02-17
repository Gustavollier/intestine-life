import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, User, Lock, Moon, Sun } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }
      setEmail(user.email || "");
      const { data } = await supabase.from("profiles").select("name").eq("user_id", user.id).maybeSingle();
      if (data?.name) setName(data.name);
    };
    loadProfile();
  }, [navigate]);

  const handleSaveName = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ name }).eq("user_id", user.id);
    if (error) {
      toast({ title: "Erro ao salvar nome", variant: "destructive" });
    } else {
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
      setCurrentPassword("");
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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-foreground">Perfil</h1>
      </header>

      <main className="max-w-lg mx-auto p-6 flex flex-col gap-6">
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
    </div>
  );
}
