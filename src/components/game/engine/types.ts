export type PowerupType = "shield" | "magnet" | "speed" | "invincibility";

export type ObstacleKind = "lowbar" | "hurdle" | "blocker" | "saw";

export type Lane = 0 | 1 | 2;

export interface ObstacleEntity {
  id: number;
  kind: ObstacleKind;
  lane: Lane;
  z: number; // negative = ahead; grows toward 0 as it approaches player
}

export interface CoinEntity {
  id: number;
  lane: Lane;
  y: number;
  z: number;
  collected: boolean;
}

export interface PowerUpEntity {
  id: number;
  type: PowerupType;
  lane: Lane;
  z: number;
}

export type GameStatus = "idle" | "running" | "over";

export interface FinalStats {
  score: number;
  coins: number;
  distance: number;
}
