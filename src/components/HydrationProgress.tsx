import { useState, useEffect, useRef, useCallback } from "react";
import { Droplets, Settings2 } from "lucide-react";

interface HydrationProgressProps {
  currentMl: number;
  goalMl: number;
  onGoalChange: (goal: number) => void;
}

const CONFETTI_COLORS = ["#00c950", "#34d399", "#60a5fa", "#818cf8", "#f472b6", "#fbbf24", "#fb923c"];

function createConfettiPiece() {
  return {
    id: Math.random(),
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1.5,
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 4 + Math.random() * 6,
    type: Math.random() > 0.5 ? "circle" : "rect" as "circle" | "rect",
  };
}

export function HydrationProgress({ currentMl, goalMl, onGoalChange }: HydrationProgressProps) {
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [tempGoal, setTempGoal] = useState(String(goalMl / 1000));
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ReturnType<typeof createConfettiPiece>[]>([]);
  const prevReachedRef = useRef(false);

  const progress = Math.min((currentMl / goalMl) * 100, 100);
  const reached = currentMl >= goalMl;

  // Trigger confetti only on transition to goal reached
  useEffect(() => {
    if (reached && !prevReachedRef.current && currentMl > 0) {
      setConfettiPieces(Array.from({ length: 40 }, createConfettiPiece));
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
    prevReachedRef.current = reached;
  }, [reached, currentMl]);

  const handleGoalSave = useCallback(() => {
    const parsed = parseFloat(tempGoal);
    if (!isNaN(parsed) && parsed > 0) {
      onGoalChange(Math.round(parsed * 1000));
    }
    setShowGoalEdit(false);
  }, [tempGoal, onGoalChange]);

  // SVG circle props
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center py-3">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              className="absolute animate-confetti-fall"
              style={{
                left: `${piece.x}%`,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
              }}
            >
              {piece.type === "circle" ? (
                <div
                  className="rounded-full"
                  style={{
                    width: piece.size,
                    height: piece.size,
                    backgroundColor: piece.color,
                    transform: `rotate(${piece.rotation}deg)`,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: piece.size,
                    height: piece.size * 0.6,
                    backgroundColor: piece.color,
                    transform: `rotate(${piece.rotation}deg)`,
                    borderRadius: 1,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Circular progress */}
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={reached ? "hsl(142, 76%, 36%)" : "hsl(217, 91%, 60%)"}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Droplets className={`w-4 h-4 mb-0.5 ${reached ? "text-primary" : "text-blue-500"}`} />
          <span className={`text-lg font-bold ${reached ? "text-primary" : "text-foreground"}`}>
            {currentMl >= 1000 ? `${(currentMl / 1000).toFixed(1)}L` : `${currentMl}ml`}
          </span>
          <span className="text-[10px] text-muted-foreground">
            de {goalMl >= 1000 ? `${(goalMl / 1000).toFixed(1)}L` : `${goalMl}ml`}
          </span>
        </div>
      </div>

      {/* Goal edit */}
      <div className="mt-2 flex items-center gap-1">
        {showGoalEdit ? (
          <div className="flex items-center gap-1.5 animate-fade-in">
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="10"
              value={tempGoal}
              onChange={(e) => setTempGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGoalSave()}
              className="w-16 h-7 text-center text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <span className="text-xs text-muted-foreground">litros</span>
            <button onClick={handleGoalSave} className="text-xs text-primary font-medium hover:underline">
              OK
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setTempGoal(String(goalMl / 1000)); setShowGoalEdit(true); }}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings2 className="w-3 h-3" />
            Meta: {goalMl >= 1000 ? `${(goalMl / 1000).toFixed(1)}L` : `${goalMl}ml`}
          </button>
        )}
      </div>

      {/* Goal reached message */}
      {reached && currentMl > 0 && (
        <p className="text-xs text-primary font-medium mt-1 animate-fade-in">
          Meta alcançada! Parabéns!
        </p>
      )}
    </div>
  );
}
