import { Coins, Gem, Sparkles, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CoinPack = {
  priceId: string;
  title: string;
  coins: number;
  priceLabel: string;
  bonusLabel?: string;
  icon: LucideIcon;
  accent: string;
};

export const COIN_PACKS: CoinPack[] = [
  { priceId: "coins_small_price",  title: "Pouch of Coins", coins: 1000,  priceLabel: "$1.99",  icon: Coins,    accent: "#facc15" },
  { priceId: "coins_medium_price", title: "Sack of Coins",  coins: 5500,  priceLabel: "$4.99",  bonusLabel: "+10% bonus", icon: Gem,      accent: "#22d3ee" },
  { priceId: "coins_large_price",  title: "Chest of Coins", coins: 12000, priceLabel: "$9.99",  bonusLabel: "+20% bonus", icon: Sparkles, accent: "#a78bfa" },
  { priceId: "coins_huge_price",   title: "Vault of Coins", coins: 30000, priceLabel: "$19.99", bonusLabel: "Best value", icon: Trophy,   accent: "#f97316" },
];

export const COINS_BY_PRICE_ID: Record<string, number> = Object.fromEntries(
  COIN_PACKS.map((p) => [p.priceId, p.coins])
);
