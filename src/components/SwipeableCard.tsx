import { useRef, useState, type ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface SwipeableCardProps {
  children: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SwipeableCard({ children, onEdit, onDelete }: SwipeableCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiped, setSwiped] = useState(false);

  const THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentX.current = e.touches[0].clientX;
    const diff = startX.current - currentX.current;
    if (diff > 0) {
      setOffset(Math.min(diff, THRESHOLD + 20));
    } else if (swiped) {
      setOffset(Math.max(THRESHOLD + diff, 0));
    }
  };

  const handleTouchEnd = () => {
    const diff = startX.current - currentX.current;
    if (!swiped && diff > THRESHOLD / 2) {
      setOffset(THRESHOLD);
      setSwiped(true);
    } else if (swiped && diff < -(THRESHOLD / 2)) {
      setOffset(0);
      setSwiped(false);
    } else {
      setOffset(swiped ? THRESHOLD : 0);
    }
  };

  const handleClose = () => {
    setOffset(0);
    setSwiped(false);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Action buttons behind */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
        {onEdit && (
          <button
            onClick={() => { handleClose(); onEdit(); }}
            className="w-10 flex items-center justify-center bg-primary text-primary-foreground"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => { handleClose(); onDelete(); }}
            className="w-10 flex items-center justify-center bg-destructive text-destructive-foreground"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Foreground content */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => swiped && handleClose()}
        className="relative bg-card border border-border rounded-xl p-3 transition-transform duration-200 ease-out"
        style={{ transform: `translateX(-${offset}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
