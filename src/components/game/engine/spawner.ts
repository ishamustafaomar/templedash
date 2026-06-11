import type { Lane, ObstacleEntity, CoinEntity, PowerUpEntity, ObstacleKind, PowerupType } from "./types";
import { CHUNK_LENGTH } from "./constants";

let nextId = 1;
const id = () => nextId++;

type Pattern = (chunkZ: number) => { obstacles: ObstacleEntity[]; coins: CoinEntity[]; powerups: PowerUpEntity[]; };

const lanes: Lane[] = [0, 1, 2];

function coinLine(lane: Lane, startZ: number, count: number, gap = 2, y = 1.2): CoinEntity[] {
  return Array.from({ length: count }, (_, i) => ({
    id: id(), lane, y, z: startZ - i * gap, collected: false,
  }));
}

function coinArc(lane: Lane, centerZ: number): CoinEntity[] {
  // jump arc: 5 coins peaking at y=2.6
  return Array.from({ length: 5 }, (_, i) => {
    const t = (i - 2) / 2; // -1..1
    const y = 2.6 - t * t * 1.4;
    return { id: id(), lane, y, z: centerZ - i * 1.4 + 2.8, collected: false };
  });
}

function ob(kind: ObstacleKind, lane: Lane, z: number): ObstacleEntity {
  return { id: id(), kind, lane, z };
}

const PATTERNS: Pattern[] = [
  // Empty with a coin line
  (z) => ({ obstacles: [], coins: coinLine(1, z - 2, 6), powerups: [] }),
  // Hurdle in random lane + coin arc over it
  (z) => {
    const l = lanes[Math.floor(Math.random() * 3)];
    return { obstacles: [ob("hurdle", l, z - 8)], coins: coinArc(l, z - 8), powerups: [] };
  },
  // Low bar across all 3 lanes — must slide
  (z) => ({
    obstacles: lanes.map((l) => ob("lowbar", l, z - 8)),
    coins: coinLine(1, z - 12, 4),
    powerups: [],
  }),
  // Two blockers leaving one lane open
  (z) => {
    const open = lanes[Math.floor(Math.random() * 3)];
    return {
      obstacles: lanes.filter((l) => l !== open).map((l) => ob("blocker", l, z - 8)),
      coins: coinLine(open, z - 6, 5),
      powerups: [],
    };
  },
  // Saw in one lane
  (z) => {
    const l = lanes[Math.floor(Math.random() * 3)];
    const other = lanes.filter((x) => x !== l)[Math.floor(Math.random() * 2)] as Lane;
    return { obstacles: [ob("saw", l, z - 8)], coins: coinLine(other, z - 4, 5), powerups: [] };
  },
  // Hurdle + low bar combo (jump then slide)
  (z) => {
    const l = lanes[Math.floor(Math.random() * 3)];
    return {
      obstacles: [ob("hurdle", l, z - 5), ob("lowbar", l, z - 14)],
      coins: [...coinArc(l, z - 5), ...coinLine(l, z - 18, 3)],
      powerups: [],
    };
  },
  // Two side blockers with hurdle in center
  (z) => ({
    obstacles: [ob("blocker", 0, z - 8), ob("hurdle", 1, z - 8), ob("blocker", 2, z - 8)],
    coins: coinArc(1, z - 8),
    powerups: [],
  }),
];

const POWERUP_TYPES: PowerupType[] = ["magnet", "shield", "speed", "invincibility"];

export function spawnChunk(chunkStartZ: number, addPowerup: boolean) {
  const pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
  const result = pattern(chunkStartZ);
  if (addPowerup) {
    const l = lanes[Math.floor(Math.random() * 3)] as Lane;
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    result.powerups.push({ id: id(), type, lane: l, z: chunkStartZ - CHUNK_LENGTH / 2 });
  }
  return result;
}
