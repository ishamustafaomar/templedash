import { Coins, Footprints } from "lucide-react";
import { useGameStore } from "./engine/store";

export function GameHUD() {
  const score = useGameStore((s) => Math.floor(s.score));
  const coins = useGameStore((s) => s.coins);
  const distance = useGameStore((s) => Math.floor(s.distance));
  return (
    <>
      <div className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 z-20 text-center">
        <div className="font-cinzel font-black text-5xl md:text-6xl text-primary text-glow-gold tabular-nums">
          {score.toLocaleString()}
        </div>
        <div className="mt-1 flex items-center justify-center gap-1 text-xs md:text-sm text-muted-foreground">
          <Footprints className="w-3 h-3" />
          <span className="tabular-nums">{distance}m</span>
        </div>
      </div>
      <div className="pointer-events-none absolute top-6 right-6 z-20 flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md border border-primary/30 px-4 py-2">
        <Coins className="w-5 h-5 text-primary" />
        <span className="font-cinzel font-bold text-lg text-primary tabular-nums">{coins}</span>
      </div>
    </>
  );
}
