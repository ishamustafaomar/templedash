import { useRef } from "react";

interface Props {
  onSwipe: (dir: "up" | "down" | "left" | "right") => void;
  enabled: boolean;
}

export function MobileControls({ onSwipe, enabled }: Props) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);

  if (!enabled) return null;

  const onStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onEnd = (e: React.TouchEvent) => {
    if (!start.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.current.x;
    const dy = t.clientY - start.current.y;
    const dt = Date.now() - start.current.t;
    start.current = null;
    if (dt > 500) return;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    const min = 30;
    if (ax < min && ay < min) return;
    if (ax > ay) onSwipe(dx > 0 ? "right" : "left");
    else onSwipe(dy > 0 ? "down" : "up");
  };
  return (
    <div
      className="absolute inset-0 z-10 touch-none"
      onTouchStart={onStart}
      onTouchEnd={onEnd}
    />
  );
}
