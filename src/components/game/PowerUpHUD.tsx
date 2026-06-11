import { Shield, Magnet, Zap, Sparkles } from "lucide-react";
import type { PowerupType } from "./GameEngine";

const ICONS: Record<PowerupType, React.ReactNode> = {
  shield: <Shield className="w-4 h-4" />,
  magnet: <Magnet className="w-4 h-4" />,
  speed: <Zap className="w-4 h-4" />,
  invincibility: <Sparkles className="w-4 h-4" />,
};
const COLORS: Record<PowerupType, string> = {
  shield: "#4488ff", magnet: "#ff44aa", speed: "#ffaa00", invincibility: "#aa44ff",
};
const DUR: Record<PowerupType, number> = { shield: 99, magnet: 6, speed: 3, invincibility: 4 };

interface Props {
  active: Record<PowerupType, boolean>;
  timers: Record<PowerupType, number>;
}

export function PowerUpHUD({ active, timers }: Props) {
  const list = (Object.keys(active) as PowerupType[]).filter(k => active[k]);
  if (!list.length) return null;
  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
      {list.map(type => {
        const color = COLORS[type];
        const max = DUR[type];
        const pct = type === "shield" ? 100 : Math.max(0, Math.min(100, (timers[type] / max) * 100));
        return (
          <div key={type} className="rounded-xl border px-3 py-2 bg-black/50 backdrop-blur-md"
            style={{ borderColor: color, boxShadow: `0 0 20px ${color}55` }}>
            <div className="flex items-center gap-2" style={{ color }}>
              {ICONS[type]}
              <span className="text-xs font-cinzel uppercase">{type}</span>
            </div>
            <div className="mt-1 h-1 w-16 rounded-full bg-muted overflow-hidden">
              <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
