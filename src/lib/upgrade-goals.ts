export interface UpgradeProfile {
  total_coins: number;
  shield_level: number;
  magnet_level: number;
  speed_level: number;
  invincibility_level: number;
  coin_multiplier: boolean;
  head_start: boolean;
}

export type UpgradeField = Exclude<keyof UpgradeProfile, "total_coins">;

const LEVEL_COSTS = [0, 150, 300, 500, 800];
const UPGRADES = [
  { field: "shield_level", title: "Shield Duration", base: 4 },
  { field: "magnet_level", title: "Magnet Duration", base: 6 },
  { field: "speed_level", title: "Speed Boost", base: 3 },
  { field: "invincibility_level", title: "Invincibility", base: 4 },
  { field: "coin_multiplier", title: "2× Coin Multiplier", cost: 500 },
  { field: "head_start", title: "Head Start", cost: 350 },
] as const;

export function levelCost(level: number): number | null {
  if (!Number.isInteger(level) || level < 0 || level >= 5) return null;
  return LEVEL_COSTS[level] ?? null;
}

export function upgradeDetails(field: UpgradeField, profile: UpgradeProfile) {
  const item = UPGRADES.find((candidate) => candidate.field === field);
  if (!item) return null;
  const value = profile[field];
  const level = typeof value === "number" ? value : null;
  const cost = "base" in item
    ? (level === null ? null : levelCost(level))
    : (value ? null : item.cost);
  if (cost === null) return null;
  return {
    field, title: item.title, cost,
    remaining: Math.max(0, cost - profile.total_coins),
    nextLevel: level === null ? null : level + 1,
    nextDuration: "base" in item && level !== null ? item.base + level * 2 : null,
  };
}

export function nearestUpgrade(profile: UpgradeProfile) {
  const available = UPGRADES.flatMap((item) => {
    const details = upgradeDetails(item.field, profile);
    return details ? [details] : [];
  });
  available.sort((a, b) => a.remaining - b.remaining || a.cost - b.cost);
  return available[0] ?? null;
}