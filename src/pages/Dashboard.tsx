import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useNotes, Evacuation } from "@/hooks/useNotes";
import { useFoodDiary } from "@/hooks/useFoodDiary";
import { useHydration } from "@/hooks/useHydration";
import { NoteDialog } from "@/components/NoteDialog";
import { FoodDiaryDialog } from "@/components/FoodDiaryDialog";
import { HydrationProgress } from "@/components/HydrationProgress";
import { WeeklyHydrationChart } from "@/components/WeeklyHydrationChart";
import { Difficulty } from "@/types/note";
import { ChatWidget } from "@/components/ChatWidget";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { GamificationCard } from "@/components/GamificationCard";
import { InsightsCard } from "@/components/InsightsCard";
import { ChevronLeft, ChevronRight, LogOut, Plus, Pencil, Trash2, Clock, X, UtensilsCrossed, Bot, Loader2, Droplets, GlassWater, CalendarDays, UserCircle, Lock, BookOpen, Crown, Lightbulb, Menu, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import washHandsSvg from "@/assets/undraw-wash-hands.svg";
import bristolType1 from "@/assets/bristol/type1.png";
import bristolType2 from "@/assets/bristol/type2.png";
import bristolType3 from "@/assets/bristol/type3.png";
import bristolType4 from "@/assets/bristol/type4.png";
import bristolType5 from "@/assets/bristol/type5.png";
import bristolType6 from "@/assets/bristol/type6.png";
import bristolType7 from "@/assets/bristol/type7.png";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import ReactMarkdown from "react-markdown";

// Preload Bristol scale images and wash-hands illustration
const bristolImages = [bristolType1, bristolType2, bristolType3, bristolType4, bristolType5, bristolType6, bristolType7];
[...bristolImages, washHandsSvg].forEach((src) => {
  const img = new Image();
  img.src = src;
});

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const difficultyColors: Record<string, string> = {
  "Fácil": "bg-primary/20 text-primary",
  "Normal": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Difícil": "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

type TabType = "evacuations" | "food" | "hydration";

export default function Dashboard() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profile: cachedProfile, loading: profileLoading, updateCachedPlan } = useProfile();
  const { addNote, updateNote, deleteNote, getNotesForDate, getDatesWithNotes, difficultyDisplayMap, loading: notesLoading } = useNotes();
  const { addEntry, updateEntry, deleteEntry, getEntriesForDate, getDatesWithEntries, mealTypeLabels, loading: foodLoading } = useFoodDiary();
  const { entries: allHydrationEntries, addEntry: addHydration, deleteEntry: deleteHydration, getEntriesForDate: getHydrationForDate, getDatesWithEntries: getDatesWithHydration, getTotalMlForDate, typeLabels: hydrationLabels, loading: hydrationLoading } = useHydration();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(format(new Date(), "yyyy-MM-dd"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [foodDialogOpen, setFoodDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Evacuation | undefined>();
  const [activeTab, setActiveTab] = useState<TabType>("food");
  const [editingFoodEntry, setEditingFoodEntry] = useState<import("@/hooks/useFoodDiary").FoodEntry | undefined>();
  // PRO upgrade modal
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [insightsModalOpen, setInsightsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // AI Analysis state
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisDate, setAnalysisDate] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<"day" | "month">("day");

  // Monthly analysis state
  const [monthlyAnalysisText, setMonthlyAnalysisText] = useState<string | null>(null);
  const [monthlyAnalysisLoading, setMonthlyAnalysisLoading] = useState(false);
  const [monthlyAnalysisMonth, setMonthlyAnalysisMonth] = useState<string | null>(null);

  // Plan derived from cached profile
  const userPlan = cachedProfile?.plan || "free";
  const username = cachedProfile?.name?.split(" ")[0] || "usuário";
  const profileLoaded = !profileLoading;

  // Analysis usage tracking for free users
  const [analysisUsedToday, setAnalysisUsedToday] = useState<number | null>(null);
  const [monthlyAnalysisUsed, setMonthlyAnalysisUsed] = useState<number | null>(null);
  const FREE_ANALYSIS_DAILY = 1;
  const FREE_ANALYSIS_MONTHLY = 1;

  const dailyLimitReached = userPlan === "free" && analysisUsedToday !== null && analysisUsedToday >= FREE_ANALYSIS_DAILY;
  const monthlyLimitReached = userPlan === "free" && monthlyAnalysisUsed !== null && monthlyAnalysisUsed >= FREE_ANALYSIS_MONTHLY;

  useEffect(() => {
    if (userPlan === "free" && profileLoaded) {
      const fetchAnalysisUsage = async () => {
        const today = new Date().toISOString().split("T")[0];
        const { count: dailyCount } = await supabase
          .from("analysis_usage")
          .select("*", { count: "exact", head: true })
          .eq("reference_date", today)
          .eq("analysis_type", "day");
        setAnalysisUsedToday(dailyCount || 0);

        const monthStart = new Date();
        monthStart.setDate(1);
        const monthKey = monthStart.toISOString().split("T")[0];
        const { count: monthlyCount } = await supabase
          .from("analysis_usage")
          .select("*", { count: "exact", head: true })
          .gte("reference_date", monthKey)
          .eq("analysis_type", "month");
        setMonthlyAnalysisUsed(monthlyCount || 0);
      };
      fetchAnalysisUsage();
    }
  }, [userPlan, profileLoaded]);

  const [hydrationGoal, setHydrationGoal] = useState(() => {
    const saved = localStorage.getItem("hydration_goal_ml");
    return saved ? parseInt(saved, 10) : 2000;
  });

  const handleGoalChange = (goal: number) => {
    setHydrationGoal(goal);
    localStorage.setItem("hydration_goal_ml", String(goal));
  };

  // Reopen NoteDialog when returning from Bristol Scale page
  useEffect(() => {
    if (location.state?.openNoteDialog && location.state?.date) {
      setSelectedDate(location.state.date);
      setDialogOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Redirect if not authenticated
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate("/");
    });
  }, [navigate]);

  const datesWithNotes = getDatesWithNotes();
  const datesWithFood = getDatesWithEntries();
  const datesWithHydration = getDatesWithHydration();
  const selectedNotes = selectedDate ? getNotesForDate(selectedDate) : [];
  const selectedFoodEntries = selectedDate ? getEntriesForDate(selectedDate) : [];
  const selectedHydrationEntries = selectedDate ? getHydrationForDate(selectedDate) : [];
  const selectedHydrationTotal = selectedDate ? getTotalMlForDate(selectedDate) : 0;

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });
    const startPadding = getDay(start);
    return { allDays, startPadding };
  }, [currentMonth]);

  const today = format(new Date(), "yyyy-MM-dd");
  const isLoading = notesLoading || foodLoading || hydrationLoading;
  const isFullLoading = isLoading || !profileLoaded;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleNewNote = () => {
    setEditingNote(undefined);
    setDialogOpen(true);
  };

  const handleEditNote = (note: Evacuation) => {
    setEditingNote(note);
    setDialogOpen(true);
  };

  const handleSaveNote = async (data: { difficulty: Difficulty; duration: number; text: string; time_of_day: string | null; bristol_scale: number | null }) => {
    if (editingNote) {
      await updateNote(editingNote.id, data);
    } else if (selectedDate) {
      await addNote({ ...data, date: selectedDate });
    }
  };

  const handleAnalyzeDay = async () => {
    if (!selectedDate) return;
    if (dailyLimitReached) {
      setUpgradeModalOpen(true);
      return;
    }
    setAnalysisLoading(true);
    setAnalysisText(null);
    setAnalysisDate(selectedDate);
    setAnalysisType("day");

    try {
      const evacuations = selectedNotes.map(n => ({
        difficulty: difficultyDisplayMap[n.difficulty] || n.difficulty,
        duration: n.duration,
        bristol_scale: n.bristol_scale,
        time_of_day: n.time_of_day,
        observations: n.observations,
      }));

      const meals = selectedFoodEntries.map(e => ({
        meal_type: mealTypeLabels[e.meal_type],
        description: e.description,
      }));

      const hydrationData = selectedHydrationEntries.length > 0 ? {
        totalMl: selectedHydrationTotal,
        bottles: selectedHydrationEntries.filter(e => e.type === "bottle").length,
        cups: selectedHydrationEntries.filter(e => e.type === "cup").length,
      } : null;

      const formattedDate = format(parseISO(selectedDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR });

      const { data, error } = await supabase.functions.invoke("analyze-day", {
        body: { date: formattedDate, evacuations, meals, hydration: hydrationData },
      });

      if (error) {
        // Check for 429 limit — immediately block button
        const errMsg = typeof error === "object" ? error?.message || "" : String(error);
        if (errMsg.includes("429") || errMsg.includes("Limite")) {
          setAnalysisUsedToday(FREE_ANALYSIS_DAILY);
          setUpgradeModalOpen(true);
          return;
        }
        throw error;
      }
      setAnalysisText(data.analysis || data.error || "Erro ao gerar análise.");
      // Immediately update usage counter for free users
      if (userPlan === "free") {
        setAnalysisUsedToday((prev) => (prev !== null ? prev + 1 : 1));
      }
    } catch (e: any) {
      console.error("Analysis error:", e);
      setAnalysisText("Não foi possível gerar a análise. Tente novamente.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleAnalyzeMonth = async () => {
    if (monthlyLimitReached) {
      setUpgradeModalOpen(true);
      return;
    }
    const monthKey = format(currentMonth, "yyyy-MM");
    setMonthlyAnalysisLoading(true);
    setMonthlyAnalysisText(null);
    setMonthlyAnalysisMonth(monthKey);

    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const allDaysInMonth = eachDayOfInterval({ start, end });

      let totalEvacuations = 0;
      let totalMeals = 0;
      let totalHydrationMl = 0;
      let daysWithData = 0;
      const difficultyCounts: Record<string, number> = {};
      const bristolCounts: Record<number, number> = {};

      for (const day of allDaysInMonth) {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayNotes = getNotesForDate(dateStr);
        const dayFood = getEntriesForDate(dateStr);
        const dayHydration = getTotalMlForDate(dateStr);

        if (dayNotes.length > 0 || dayFood.length > 0 || dayHydration > 0) {
          daysWithData++;
        }

        totalEvacuations += dayNotes.length;
        totalMeals += dayFood.length;
        totalHydrationMl += dayHydration;

        dayNotes.forEach(n => {
          const diff = difficultyDisplayMap[n.difficulty] || n.difficulty;
          difficultyCounts[diff] = (difficultyCounts[diff] || 0) + 1;
          if (n.bristol_scale) {
            bristolCounts[n.bristol_scale] = (bristolCounts[n.bristol_scale] || 0) + 1;
          }
        });
      }

      const formattedMonth = format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR });

      const monthSummary = `Resumo do mês de ${formattedMonth}:
- Dias com registros: ${daysWithData}/${allDaysInMonth.length}
- Total de evacuações: ${totalEvacuations}
- Dificuldade: ${Object.entries(difficultyCounts).map(([k, v]) => `${k}: ${v}`).join(", ") || "sem dados"}
- Bristol: ${Object.entries(bristolCounts).map(([k, v]) => `tipo ${k}: ${v}x`).join(", ") || "sem dados"}
- Total de refeições: ${totalMeals}
- Hidratação total: ${totalHydrationMl}ml (média: ${daysWithData > 0 ? Math.round(totalHydrationMl / daysWithData) : 0}ml/dia)`;

      const { data, error } = await supabase.functions.invoke("analyze-day", {
        body: {
          date: `mês de ${formattedMonth}`,
          evacuations: [],
          meals: [],
          hydration: daysWithData > 0 ? { totalMl: totalHydrationMl, bottles: 0, cups: 0 } : null,
          monthSummary,
        },
      });

      if (error) {
        const errMsg = typeof error === "object" ? error?.message || "" : String(error);
        if (errMsg.includes("429") || errMsg.includes("Limite")) {
          setMonthlyAnalysisUsed(FREE_ANALYSIS_MONTHLY);
          setUpgradeModalOpen(true);
          setMonthlyAnalysisLoading(false);
          return;
        }
        throw error;
      }
      setMonthlyAnalysisText(data.analysis || data.error || "Erro ao gerar análise.");
      if (userPlan === "free") {
        setMonthlyAnalysisUsed((prev) => (prev !== null ? prev + 1 : 1));
      }
    } catch (e: any) {
      console.error("Monthly analysis error:", e);
      setMonthlyAnalysisText("Não foi possível gerar a análise mensal. Tente novamente.");
    } finally {
      setMonthlyAnalysisLoading(false);
    }
  };

  const editingNoteForDialog = editingNote
    ? {
        id: editingNote.id,
        date: editingNote.day,
        difficulty: (difficultyDisplayMap[editingNote.difficulty] || "Fácil") as Difficulty,
        duration: editingNote.duration,
        text: editingNote.observations || "",
        time_of_day: editingNote.time_of_day || null,
        bristol_scale: editingNote.bristol_scale ?? null,
      }
    : undefined;

  const hasDayData = selectedDate && (selectedNotes.length > 0 || selectedFoodEntries.length > 0 || selectedHydrationEntries.length > 0);

  if (isFullLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center animate-pulse" style={{ animationDuration: "1.5s" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3c-1.5 0-2.5 1-2.5 2.5v2c0 1-0.5 1.5-1.5 1.5-1 0-1.5 0.5-1.5 1.5v3c0 1.5 1 2.5 2.5 2.5h1c1 0 1.5 0.5 1.5 1.5v3c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5v-2c0-1 0.5-1.5 1.5-1.5h2c1 0 1.5-0.5 1.5-1.5v-2c0-1 0.5-1.5 1.5-1.5 1.5 0 2.5-1 2.5-2.5v-1c0-1.5-1-2.5-2.5-2.5-1 0-1.5-0.5-1.5-1.5v-1c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5v3c0 1-0.5 1.5-1.5 1.5H10c-1 0-1.5 0.5-1.5 1.5v1" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Carregando seus dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Mobile: hamburger menu */}
        {isMobile ? (
          <>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="rounded-full">
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3c-1.5 0-2.5 1-2.5 2.5v2c0 1-0.5 1.5-1.5 1.5-1 0-1.5 0.5-1.5 1.5v3c0 1.5 1 2.5 2.5 2.5h1c1 0 1.5 0.5 1.5 1.5v3c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5v-2c0-1 0.5-1.5 1.5-1.5h2c1 0 1.5-0.5 1.5-1.5v-2c0-1 0.5-1.5 1.5-1.5 1.5 0 2.5-1 2.5-2.5v-1c0-1.5-1-2.5-2.5-2.5-1 0-1.5-0.5-1.5-1.5v-1c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5v3c0 1-0.5 1.5-1.5 1.5H10c-1 0-1.5 0.5-1.5 1.5v1" />
                </svg>
              </div>
              <h1 className="font-bold text-foreground text-sm leading-tight">Intestine Life</h1>
            </div>
            {/* Spacer to keep title centered */}
            <div className="w-10" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3c-1.5 0-2.5 1-2.5 2.5v2c0 1-0.5 1.5-1.5 1.5-1 0-1.5 0.5-1.5 1.5v3c0 1.5 1 2.5 2.5 2.5h1c1 0 1.5 0.5 1.5 1.5v3c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5v-2c0-1 0.5-1.5 1.5-1.5h2c1 0 1.5-0.5 1.5-1.5v-2c0-1 0.5-1.5 1.5-1.5 1.5 0 2.5-1 2.5-2.5v-1c0-1.5-1-2.5-2.5-2.5-1 0-1.5-0.5-1.5-1.5v-1c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5v3c0 1-0.5 1.5-1.5 1.5H10c-1 0-1.5 0.5-1.5 1.5v1" />
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-foreground leading-tight">Intestine Life</h1>
                <p className="text-xs text-muted-foreground">Olá, {username}!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/clinics")} className="rounded-full" title="Encontrar Consultórios">
                <MapPin className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/digestive-guide")} className="rounded-full" title="Guia Digestivo">
                <BookOpen className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setInsightsModalOpen(true)} className="rounded-full" title="Insights Inteligentes">
                <Lightbulb className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} className="rounded-full">
                <UserCircle className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5">
                <LogOut className="w-4 h-4" /> Sair
              </Button>
            </div>
          </>
        )}
      </header>

      {/* Mobile sidebar menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-left text-sm">Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col p-2 gap-1">
            <Button variant="ghost" className="justify-start gap-3 rounded-xl" onClick={() => { navigate("/clinics"); setMobileMenuOpen(false); }}>
              <MapPin className="w-5 h-5" />
              <span>Consultórios</span>
            </Button>
            <Button variant="ghost" className="justify-start gap-3 rounded-xl" onClick={() => { navigate("/digestive-guide"); setMobileMenuOpen(false); }}>
              <BookOpen className="w-5 h-5" />
              <span>Guia Digestivo</span>
            </Button>
            <Button variant="ghost" className="justify-start gap-3 rounded-xl" onClick={() => { setInsightsModalOpen(true); setMobileMenuOpen(false); }}>
              <Lightbulb className="w-5 h-5" />
              <span>Insights</span>
            </Button>
            <Button variant="ghost" className="justify-start gap-3 rounded-xl" onClick={() => { navigate("/profile"); setMobileMenuOpen(false); }}>
              <UserCircle className="w-5 h-5" />
              <span>Perfil</span>
            </Button>
          </nav>
          <div className="mt-auto border-t border-border p-2">
            <Button variant="ghost" className="justify-start gap-3 rounded-xl w-full text-destructive hover:text-destructive" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <GamificationCard />
        </div>

        {/* Insights Modal */}
        <Dialog open={insightsModalOpen} onOpenChange={setInsightsModalOpen}>
          <DialogContent className="sm:max-w-lg rounded-3xl border-primary/20 p-0 gap-0 overflow-hidden w-[calc(100%-2rem)] max-w-lg">
            <InsightsCard onUpgrade={() => { setInsightsModalOpen(false); setUpgradeModalOpen(true); }} />
          </DialogContent>
        </Dialog>

        <h2 className="text-xl font-bold text-foreground mb-4">Acompanhamento mensal</h2>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar column */}
          <div className="flex-1 flex flex-col gap-6">
            <Card className="p-6 border border-primary/20 rounded-3xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-muted rounded">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="font-semibold text-foreground capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </h3>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-muted rounded">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((d) => (
                  <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: days.startPadding }).map((_, i) => (
                    <div key={`pad-${i}`} />
                  ))}
                  {days.allDays.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const hasNotes = datesWithNotes.includes(dateStr);
                    const hasFood = datesWithFood.includes(dateStr);
                    const hasHydration = datesWithHydration.includes(dateStr);
                    const isToday = dateStr === today;
                    const isSelected = dateStr === selectedDate;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                          isToday
                            ? "bg-primary text-primary-foreground font-bold"
                            : isSelected
                            ? "bg-primary/20 text-primary font-semibold"
                            : hasNotes || hasFood || hasHydration
                            ? "bg-primary/10 text-foreground"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        {format(day, "d")}
                        <div className="absolute bottom-0.5 flex gap-0.5">
                          {hasNotes && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                          {hasFood && <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground/50" />}
                          {hasHydration && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
            </Card>


            {/* Monthly Analysis Button */}
            {(() => {
              if (!profileLoaded) return (
                <Button
                  disabled
                  variant="outline"
                  className="h-12 rounded-xl text-base font-semibold gap-2 border-primary/30 text-primary w-full"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Carregando...
                </Button>
              );
              return (
                  <Button
                    onClick={monthlyLimitReached ? () => setUpgradeModalOpen(true) : handleAnalyzeMonth}
                    disabled={monthlyAnalysisLoading}
                    variant="outline"
                    className={`h-12 rounded-xl text-base font-semibold gap-2 w-full ${monthlyLimitReached ? "border-muted text-muted-foreground" : "border-primary/30 text-primary hover:bg-primary/10"}`}
                  >
                    {monthlyAnalysisLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : monthlyLimitReached ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <CalendarDays className="w-5 h-5" />
                    )}
                    {monthlyAnalysisLoading
                      ? "Analisando mês..."
                      : monthlyLimitReached
                      ? "Limite mensal atingido"
                      : `Análise mensal — ${format(currentMonth, "MMMM", { locale: ptBR })}`}
                  </Button>
                );
            })()}

            {/* Monthly AI Analysis Card */}
            {monthlyAnalysisText && monthlyAnalysisMonth === format(currentMonth, "yyyy-MM") && (
              <Card className="p-5 border border-primary/20 rounded-3xl shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Dr. Intestine</h3>
                    <p className="text-xs text-muted-foreground">Análise mensal — {format(currentMonth, "MMMM yyyy", { locale: ptBR })}</p>
                  </div>
                  <button
                    onClick={() => { setMonthlyAnalysisText(null); setMonthlyAnalysisMonth(null); }}
                    className="ml-auto p-1 hover:bg-muted rounded"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none">
                  <ReactMarkdown>{monthlyAnalysisText}</ReactMarkdown>
                </div>
              </Card>
            )}
          </div>

          {/* Side panel - show before hydration chart on mobile */}
          <Card className="w-full lg:w-96 p-5 border border-primary/20 rounded-3xl shadow-lg order-first lg:order-none">
            {selectedDate ? (
              <>
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(selectedDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <button onClick={() => setSelectedDate(null)} className="p-1 hover:bg-muted rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Analyze day button inside card */}
                {hasDayData && (
                  <div className="mb-3">
                    <Button
                      onClick={dailyLimitReached ? () => setUpgradeModalOpen(true) : handleAnalyzeDay}
                      disabled={analysisLoading}
                      variant="outline"
                      size="sm"
                      className={`w-full rounded-xl gap-2 border-primary/30 ${dailyLimitReached ? "text-muted-foreground border-muted" : "text-primary hover:bg-primary/10"}`}
                    >
                      {analysisLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : dailyLimitReached ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                      {analysisLoading ? "Analisando..." : dailyLimitReached ? "Limite diário atingido" : "Analisar dia com Dr. Intestine"}
                    </Button>
                    {userPlan === "free" && analysisUsedToday !== null && (
                      <p className="text-[10px] text-muted-foreground text-center mt-1">
                        {Math.max(0, FREE_ANALYSIS_DAILY - analysisUsedToday)}/{FREE_ANALYSIS_DAILY} análise restante hoje
                      </p>
                    )}
                  </div>
                )}

                {/* Day AI Analysis Card (inline) */}
                {analysisText && analysisDate === selectedDate && (
                  <div className="mb-4 p-3 border border-primary/20 rounded-xl bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Bot className="w-3 h-3 text-primary-foreground" />
                      </div>
                      <span className="font-semibold text-foreground text-xs">Dr. Intestine</span>
                      <button
                        onClick={() => { setAnalysisText(null); setAnalysisDate(null); }}
                        className="ml-auto p-0.5 hover:bg-muted rounded"
                      >
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="text-xs text-foreground leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown>{analysisText}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Tabs - Order: Refeições, Água, Evacuações */}
                <div className="flex gap-1 bg-muted rounded-xl p-1 mb-4">
                  <button
                    onClick={() => setActiveTab("food")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "food" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Refeições ({selectedFoodEntries.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("hydration")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "hydration" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    <Droplets className="w-3 h-3 inline mr-1" />
                    Água
                  </button>
                  <button
                    onClick={() => setActiveTab("evacuations")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === "evacuations" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Evacuações ({selectedNotes.length})
                  </button>
                </div>

                {activeTab === "food" ? (
                  <div className="space-y-3">
                    <Button onClick={() => setFoodDialogOpen(true)} className="w-full h-10 rounded-xl text-sm font-semibold gap-2">
                      <Plus className="w-4 h-4" /> Nova Refeição
                    </Button>
                    {selectedFoodEntries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6">
                        <UtensilsCrossed className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground text-center">
                          Nenhuma refeição registrada neste dia.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[340px] overflow-y-auto styled-scroll">
                        <div className="space-y-3 pr-1">
                          {selectedFoodEntries.map((entry) => (
                            <div key={entry.id} className="border border-border rounded-xl p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                                  {mealTypeLabels[entry.meal_type]}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => { setEditingFoodEntry(entry); setFoodDialogOpen(true); }}
                                    className="p-1.5 hover:bg-muted rounded"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                  </button>
                                  <button
                                    onClick={() => deleteEntry(entry.id)}
                                    className="p-1.5 hover:bg-destructive/10 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-foreground whitespace-pre-wrap">{entry.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeTab === "hydration" ? (
                  /* Hydration Tab */
                  <div className="space-y-4">
                    {/* Circular progress */}
                    <HydrationProgress
                      currentMl={selectedHydrationTotal}
                      goalMl={hydrationGoal}
                      onGoalChange={handleGoalChange}
                    />

                    {/* Quick add buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => selectedDate && addHydration("bottle", selectedDate)}
                        className="flex flex-col items-center gap-2 p-4 border border-border rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      >
                        <GlassWater className="w-8 h-8 text-blue-500" />
                        <span className="text-xs font-medium text-foreground">Garrafa</span>
                        <span className="text-[10px] text-muted-foreground">~700ml</span>
                      </button>
                      <button
                        onClick={() => selectedDate && addHydration("cup", selectedDate)}
                        className="flex flex-col items-center gap-2 p-4 border border-border rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      >
                        <GlassWater className="w-6 h-6 text-blue-400" />
                        <span className="text-xs font-medium text-foreground">Copo</span>
                        <span className="text-[10px] text-muted-foreground">~350ml</span>
                      </button>
                    </div>

                    {/* Entries list */}
                    {selectedHydrationEntries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <Droplets className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground text-center">
                          Nenhum registro de hidratação neste dia.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[200px] overflow-y-auto styled-scroll">
                        <div className="space-y-2 pr-1">
                          {selectedHydrationEntries.map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between border border-border rounded-xl px-3 py-2">
                              <div className="flex items-center gap-2">
                                <GlassWater className={`${entry.type === "bottle" ? "w-5 h-5 text-blue-500" : "w-4 h-4 text-blue-400"}`} />
                                <span className="text-sm text-foreground">
                                  {entry.type === "bottle" ? "Garrafa" : "Copo"} — {entry.ml}ml
                                </span>
                              </div>
                              <button
                                onClick={() => deleteHydration(entry.id)}
                                className="p-1.5 hover:bg-destructive/10 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Evacuations Tab (last) */
                  <div className="space-y-3">
                    <Button onClick={handleNewNote} className="w-full h-10 rounded-xl text-sm font-semibold gap-2">
                      <Plus className="w-4 h-4" /> Nova Evacuação
                    </Button>
                    {selectedNotes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6">
                        <img src={washHandsSvg} alt="Ilustração de saúde" className="w-36 h-auto opacity-50 mb-3" />
                        <p className="text-sm text-muted-foreground text-center">
                          Nenhum registro de evacuação para este dia.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[340px] overflow-y-auto styled-scroll">
                        <div className="space-y-3 pr-1">
                          {selectedNotes.map((note, idx) => {
                            const displayDifficulty = difficultyDisplayMap[note.difficulty] || "Normal";
                            return (
                              <div key={note.id} className="border border-border rounded-xl p-3">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                    <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full shrink-0">
                                      #{idx + 1}
                                    </span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${difficultyColors[displayDifficulty] || ""}`}>
                                      {displayDifficulty}
                                    </span>
                                    {note.bristol_scale && (
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                        <img src={bristolImages[note.bristol_scale - 1]} alt={`Bristol ${note.bristol_scale}`} className="w-5 h-5 object-contain" loading="eager" />
                                        T{note.bristol_scale}
                                      </span>
                                    )}
                                    <span className="text-xs text-muted-foreground flex items-center gap-0.5 shrink-0">
                                      <Clock className="w-3 h-3" /> {note.time_of_day ? note.time_of_day.slice(0, 5) : "--:--"} · {note.duration}min
                                    </span>
                                  </div>
                                  <div className="flex gap-0.5 shrink-0">
                                    <button onClick={() => handleEditNote(note)} className="p-1 hover:bg-muted rounded">
                                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                    <button onClick={() => deleteNote(note.id)} className="p-1 hover:bg-destructive/10 rounded">
                                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                  </div>
                                </div>
                                {note.observations && <p className="text-sm text-foreground">{note.observations}</p>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
                <CalendarDays className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-sm font-medium">Selecione um dia</p>
              </div>
            )}
          </Card>

          {/* Weekly Hydration Chart - below side panel on mobile */}
          <Card className="p-5 border border-primary/20 rounded-3xl shadow-lg w-full lg:hidden">
            <WeeklyHydrationChart entries={allHydrationEntries} goalMl={hydrationGoal} />
          </Card>
        </div>

        {/* Weekly Hydration Chart - desktop only, below calendar */}
        <div className="hidden lg:block mt-6">
          <Card className="p-5 border border-primary/20 rounded-3xl shadow-lg">
            <WeeklyHydrationChart entries={allHydrationEntries} goalMl={hydrationGoal} />
          </Card>
        </div>

      </main>

      {selectedDate && (
        <>
          <NoteDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            date={selectedDate}
            note={editingNoteForDialog}
            onSave={handleSaveNote}
          />
          <FoodDiaryDialog
            open={foodDialogOpen}
            onOpenChange={(open) => { setFoodDialogOpen(open); if (!open) setEditingFoodEntry(undefined); }}
            date={selectedDate}
            entry={editingFoodEntry}
            onSave={addEntry}
            onUpdate={(id, data) => updateEntry(id, data)}
          />
        </>
      )}

      <ProUpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
      <ChatWidget />
    </div>
  );
}
