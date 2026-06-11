import { Shield, Magnet, Zap, Sparkles, Coins as CoinIcon, Star, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ShopItemType = "level" | "oneshot";

export interface ShopItem {
  id: string;
  field: "shield_level" | "magnet_level" | "speed_level" | "invincibility_level" | "coin_multiplier" | "head_start";
  title: string;
  description: string;
  type: ShopItemType;
  cost?: number;
  icon: React.ReactNode;
  color: string;
}

const LEVEL_COSTS = [0, 150, 300, 500, 800];

export const SHOP_ITEMS: ShopItem[] = [
  { id: "shield_level", field: "shield_level", title: "Shield Duration", description: "Base 4s + 2s per level", type: "level", icon: <Shield />, color: "#4488ff" },
  { id: "magnet_level", field: "magnet_level", title: "Magnet Duration", description: "Base 6s + 2s per level", type: "level", icon: <Magnet />, color: "#ff44aa" },
  { id: "speed_level", field: "speed_level", title: "Speed Boost", description: "Base 3s + 2s per level", type: "level", icon: <Zap />, color: "#ffaa00" },
  { id: "invincibility_level", field: "invincibility_level", title: "Invincibility", description: "Base 4s + 2s per level", type: "level", icon: <Sparkles />, color: "#aa44ff" },
  { id: "coin_multiplier", field: "coin_multiplier", title: "2× Coin Multiplier", description: "Double coins on every run, forever.", type: "oneshot", cost: 500, icon: <Star />, color: "#ffcc00" },
  { id: "head_start", field: "head_start", title: "Head Start", description: "Begin every run with 4s of invincibility.", type: "oneshot", cost: 350, icon: <Rocket />, color: "#00ff88" },
];

export function levelCost(level: number): number | null {
  if (level >= 5) return null;
  return LEVEL_COSTS[level];
}

interface ProfileFields {
  total_coins: number;
  shield_level: number; magnet_level: number; speed_level: number; invincibility_level: number;
  coin_multiplier: boolean; head_start: boolean;
}

interface Props {
  item: ShopItem;
  profile: ProfileFields;
  onBuy: (item: ShopItem) => void;
  busy?: boolean;
}

export function ShopItemCard({ item, profile, onBuy, busy }: Props) {
  const maxLevel = 5;
  let cost: number | null = item.cost ?? null;
  let owned = false;
  let level = 1;

  if (item.type === "level") {
    level = profile[item.field as "shield_level"] as number;
    cost = levelCost(level);
  } else {
    owned = profile[item.field as "coin_multiplier"] as boolean;
  }

  const canAfford = cost != null && profile.total_coins >= cost;
  const disabled = busy || (item.type === "level" && cost == null) || (item.type === "oneshot" && owned) || !canAfford;

  const label = (() => {
    if (item.type === "level" && cost == null) return "Max Level";
    if (item.type === "oneshot" && owned) return "Owned";
    if (!canAfford) return "Not enough coins";
    return `Upgrade (${cost} 🪙)`;
  })();

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 transition-all hover:border-primary/50">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}22`, color: item.color }}>
            {item.icon}
          </div>
          <div>
            <div className="font-cinzel font-bold">{item.title}</div>
            <div className="text-xs text-muted-foreground">{item.description}</div>
          </div>
        </div>
        {item.type === "oneshot" && owned && (
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-500/20 text-green-400">OWNED</span>
        )}
        {item.type === "level" && (
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/20 text-primary">Lv {level}/{maxLevel}</span>
        )}
      </div>

      {item.type === "level" && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${(level/maxLevel)*100}%`, backgroundColor: item.color }} />
        </div>
      )}

      <Button onClick={() => onBuy(item)} disabled={disabled} className="font-cinzel">
        <CoinIcon className="w-4 h-4 mr-2" /> {label}
      </Button>
    </div>
  );
}
