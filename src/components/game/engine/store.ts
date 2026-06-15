import { create } from "zustand";
import type {
  CoinEntity, ObstacleEntity, PowerUpEntity, PowerupType, GameStatus, Lane, FinalStats,
} from "./types";
import { LANE_CHANGE_DURATION, SLIDE_DURATION, START_SPEED } from "./constants";

interface GameState {
  status: GameStatus;
  score: number;
  coins: number;
  distance: number;
  speed: number;

  // player
  lane: Lane;
  targetLane: Lane;
  laneChangeT: number; // 0..1
  y: number;
  vy: number;
  isJumping: boolean;
  isSliding: boolean;
  slideT: number;

  // world
  obstacles: ObstacleEntity[];
  coins3d: CoinEntity[];
  powerups3d: PowerUpEntity[];
  nextSpawnZ: number; // most negative z already spawned
  /** Bumped only when entity membership changes (add/remove), not on per-frame position updates.
   *  Components that render entity lists should subscribe to this instead of the arrays themselves. */
  entitiesVersion: number;

  // power-up state
  active: Record<PowerupType, boolean>;
  timers: Record<PowerupType, number>;
  shieldCount: number;


  // hud flash
  flashPowerup: PowerupType | null;
  tripping: boolean;

  // setters
  setStatus: (s: GameStatus) => void;
  reset: () => void;
  setLane: (l: Lane) => void;
  setTargetLane: (l: Lane) => void;
  jump: () => void;
  slide: () => void;
  moveLeft: () => void;
  moveRight: () => void;
}

const initialActive: Record<PowerupType, boolean> = {
  shield: false, magnet: false, speed: false, invincibility: false,
};
const initialTimers: Record<PowerupType, number> = {
  shield: 0, magnet: 0, speed: 0, invincibility: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  status: "idle",
  score: 0,
  coins: 0,
  distance: 0,
  speed: START_SPEED,

  lane: 1,
  targetLane: 1,
  laneChangeT: 1,
  y: 0,
  vy: 0,
  isJumping: false,
  isSliding: false,
  slideT: 0,

  obstacles: [],
  coins3d: [],
  powerups3d: [],
  nextSpawnZ: -40,
  entitiesVersion: 0,


  active: { ...initialActive },
  timers: { ...initialTimers },
  shieldCount: 0,

  flashPowerup: null,
  tripping: false,

  setStatus: (s) => set({ status: s }),

  reset: () => set({
    status: "running",
    score: 0, coins: 0, distance: 0, speed: START_SPEED,
    lane: 1, targetLane: 1, laneChangeT: 1,
    y: 0, vy: 0, isJumping: false, isSliding: false, slideT: 0,
    obstacles: [], coins3d: [], powerups3d: [],
    nextSpawnZ: -40,
    active: { ...initialActive }, timers: { ...initialTimers }, shieldCount: 0,
    flashPowerup: null, tripping: false,
  }),

  setLane: (l) => set({ lane: l }),
  setTargetLane: (l) => set({ targetLane: l }),

  jump: () => {
    const s = get();
    if (s.status !== "running") return;
    if (s.isJumping || s.isSliding) return;
    set({ isJumping: true, vy: 12 });
  },
  slide: () => {
    const s = get();
    if (s.status !== "running") return;
    if (s.isSliding) return;
    // cancel jump
    set({ isSliding: true, slideT: SLIDE_DURATION, isJumping: false, vy: 0, y: 0 });
  },
  moveLeft: () => {
    const s = get();
    if (s.status !== "running") return;
    if (s.laneChangeT < 1) return;
    if (s.targetLane === 0) return;
    set({ lane: s.targetLane, targetLane: (s.targetLane - 1) as Lane, laneChangeT: 0 });
    void LANE_CHANGE_DURATION;
  },
  moveRight: () => {
    const s = get();
    if (s.status !== "running") return;
    if (s.laneChangeT < 1) return;
    if (s.targetLane === 2) return;
    set({ lane: s.targetLane, targetLane: (s.targetLane + 1) as Lane, laneChangeT: 0 });
  },
}));
