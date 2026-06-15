import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "./engine/store";
import { Corridor } from "./scene/Corridor";
import { Player } from "./scene/Player";
import { Obstacle, OBSTACLE_AABB } from "./scene/Obstacle";
import { Coin } from "./scene/Coin";
import { PowerUp } from "./scene/PowerUp";
import { spawnChunk } from "./engine/spawner";
import {
  CAMERA_POS, CAMERA_LOOK, CHUNK_LENGTH, DESPAWN_BEHIND, LANE_X,
  PLAYER_HALF_WIDTH, PLAYER_HEIGHT, PLAYER_SLIDE_HEIGHT, POWERUP_BASE_DUR, SPAWN_AHEAD,
} from "./engine/constants";
import type { Character } from "@/lib/characters";
import type { PowerupType, FinalStats } from "./engine/types";

interface Props {
  character: Character;
  coinMultiplier: boolean;
  powerupDurations: { magnet: number; speed: number; invincibility: number; };
  onCoin: () => void;
  onPowerup: (t: PowerupType) => void;
  onCrash: () => void;
  onGameOver: (s: FinalStats) => void;
  onSound?: (n: string) => void;
}

export function Game(props: Props) {
  return (
    <Canvas
      shadows
      camera={{ position: CAMERA_POS, fov: 60, near: 0.1, far: 200 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
      style={{ position: "absolute", inset: 0 }}
    >
      <CameraRig />
      <Lighting />
      <fog attach="fog" args={["#1a0e08", 20, 95]} />
      <color attach="background" args={["#0a0604"]} />
      <Corridor />
      <Player character={props.character} />
      <World {...props} />
    </Canvas>
  );
}

function CameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...CAMERA_POS);
    camera.lookAt(...CAMERA_LOOK);
  }, [camera]);
  useFrame(() => {
    const s = useGameStore.getState();
    const targetX = LANE_X[s.lane] + (LANE_X[s.targetLane] - LANE_X[s.lane]) * s.laneChangeT;
    camera.position.x += (targetX * 0.3 - camera.position.x) * 0.08;
    camera.lookAt(targetX * 0.5, CAMERA_LOOK[1], CAMERA_LOOK[2]);
  });
  return null;
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.25} color="#ffa060" />
      <directionalLight
        position={[3, 12, 5]}
        intensity={0.6}
        color="#ffcc88"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 3, 4]} color="#ffaa55" intensity={0.7} distance={12} />
    </>
  );
}

function World({ coinMultiplier, powerupDurations, onCoin, onPowerup, onCrash, onGameOver, onSound }: Omit<Props, "character">) {
  const crashedRef = useRef(false);

  // Subscribe ONLY to membership changes so React doesn't reconcile every frame.
  const version = useGameStore((s) => s.entitiesVersion);
  // Read live array references at render time (mutated in place by the game loop).
  const { obstacles: obstaclesNow, coins3d: coinsNow, powerups3d: powerupsNow } = useGameStore.getState();

  useFrame((_, dt) => {
    const s = useGameStore.getState();
    if (s.status !== "running") return;

    const speed = s.speed * (s.active.speed ? 1.5 : 1);
    const dz = speed * dt;

    const obstacles = s.obstacles;
    const coins3d = s.coins3d;
    const powerups3d = s.powerups3d;
    let membershipChanged = false;

    // Move + despawn (in place, no allocations)
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].z += dz;
      if (obstacles[i].z >= DESPAWN_BEHIND) { obstacles.splice(i, 1); membershipChanged = true; }
    }
    for (let i = coins3d.length - 1; i >= 0; i--) {
      const c = coins3d[i];
      c.z += dz;
      if (c.collected || c.z >= DESPAWN_BEHIND) { coins3d.splice(i, 1); membershipChanged = true; }
    }
    for (let i = powerups3d.length - 1; i >= 0; i--) {
      powerups3d[i].z += dz;
      if (powerups3d[i].z >= DESPAWN_BEHIND) { powerups3d.splice(i, 1); membershipChanged = true; }
    }

    // Spawn chunks ahead
    let nextSpawnZ = s.nextSpawnZ + dz;
    let chunkIdx = 0;
    while (nextSpawnZ > -SPAWN_AHEAD) {
      const addPU = Math.random() < 0.25;
      const chunk = spawnChunk(nextSpawnZ, addPU);
      for (let i = 0; i < chunk.obstacles.length; i++) obstacles.push(chunk.obstacles[i]);
      for (let i = 0; i < chunk.coins.length; i++) coins3d.push(chunk.coins[i]);
      for (let i = 0; i < chunk.powerups.length; i++) powerups3d.push(chunk.powerups[i]);
      if (chunk.obstacles.length || chunk.coins.length || chunk.powerups.length) membershipChanged = true;
      nextSpawnZ -= CHUNK_LENGTH;
      chunkIdx++;
      if (chunkIdx > 10) break;
    }

    // Player state for collision
    const playerLaneX = LANE_X[s.lane] + (LANE_X[s.targetLane] - LANE_X[s.lane]) * s.laneChangeT;
    const playerYMin = s.y;
    const playerYMax = s.y + (s.isSliding ? PLAYER_SLIDE_HEIGHT : PLAYER_HEIGHT);

    // Collisions: obstacles
    let crashed = false;
    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      const ox = LANE_X[o.lane];
      const box = OBSTACLE_AABB[o.kind];
      if (o.z + box.zHalf < -0.5 || o.z - box.zHalf > 0.5) continue;
      if (Math.abs(playerLaneX - ox) > box.xHalf + PLAYER_HALF_WIDTH) continue;
      if (playerYMax < box.yMin || playerYMin > box.yMax) continue;
      crashed = true;
      break;
    }

    // Collect coins (with magnet pull)
    let coinsCollected = 0;
    const magnet = s.active.magnet;
    for (let i = 0; i < coins3d.length; i++) {
      const c = coins3d[i];
      if (c.collected) continue;
      const cx = LANE_X[c.lane];
      const dx = Math.abs(playerLaneX - cx);
      const dyAbs = Math.abs(playerYMax * 0.5 - c.y);
      const inSlice = c.z > -0.6 && c.z < 0.6;
      if (magnet && Math.abs(c.z) < 6) {
        c.y += (1.0 - c.y) * 0.15;
        if (Math.abs(c.z) < 3 && dx < 2.5) { c.collected = true; coinsCollected++; }
      } else if (inSlice && dx < 0.9 && dyAbs < 1.0) {
        c.collected = true;
        coinsCollected++;
      }
    }

    // Collect power-ups (splice out picked one)
    let pickedPU: PowerupType | null = null;
    for (let i = powerups3d.length - 1; i >= 0; i--) {
      const p = powerups3d[i];
      const px = LANE_X[p.lane];
      const dx = Math.abs(playerLaneX - px);
      if (p.z > -0.7 && p.z < 0.7 && dx < 1.0) {
        pickedPU = p.type;
        powerups3d.splice(i, 1);
        membershipChanged = true;
        break;
      }
    }

    // Apply power-up timers (in-place mutation of active/timers objects is fine; we only
    // setState with new references when a value actually changed below).
    const active = { ...s.active };
    const timers = { ...s.timers };
    let activeChanged = false;
    (Object.keys(timers) as PowerupType[]).forEach((k) => {
      if (k === "shield") return;
      if (timers[k] > 0) {
        timers[k] = Math.max(0, timers[k] - dt);
        if (timers[k] === 0) { active[k] = false; activeChanged = true; }
      }
    });
    let shieldCount = s.shieldCount;
    if (pickedPU) {
      if (pickedPU === "shield") {
        shieldCount = Math.max(shieldCount, 1);
        active.shield = true;
      } else {
        const dur = pickedPU === "magnet" ? powerupDurations.magnet
          : pickedPU === "speed" ? powerupDurations.speed
          : powerupDurations.invincibility;
        timers[pickedPU] = dur;
        active[pickedPU] = true;
      }
      activeChanged = true;
      onPowerup(pickedPU);
      onSound?.(pickedPU);
    }

    // Handle crash with shield/invincibility
    if (crashed && !crashedRef.current) {
      if (active.invincibility) {
        crashed = false;
      } else if (shieldCount > 0) {
        shieldCount -= 1;
        if (shieldCount === 0) { active.shield = false; activeChanged = true; }
        crashed = false;
        onSound?.("shieldBreak");
      }
    }

    if (coinsCollected > 0) {
      onCoin();
      onSound?.("coin");
    }

    const coinAdd = coinsCollected * (coinMultiplier ? 2 : 1) * (s.active.speed ? 2 : 1);
    const scoreAdd = coinsCollected * 25;

    const patch: Partial<ReturnType<typeof useGameStore.getState>> = {
      nextSpawnZ,
      coins: s.coins + coinAdd,
      score: s.score + scoreAdd,
      shieldCount,
    };
    if (activeChanged) { patch.active = active; patch.timers = timers; }
    else if (s.timers.magnet !== timers.magnet || s.timers.speed !== timers.speed || s.timers.invincibility !== timers.invincibility) {
      patch.timers = timers;
    }
    if (membershipChanged) patch.entitiesVersion = s.entitiesVersion + 1;
    useGameStore.setState(patch);

    if (crashed && !crashedRef.current) {
      crashedRef.current = true;
      onSound?.("collision");
      onCrash();
      const final = { score: Math.floor(s.score + scoreAdd), coins: s.coins + coinAdd, distance: s.distance };
      setTimeout(() => {
        useGameStore.setState({ status: "over" });
        onGameOver(final);
      }, 500);
    }
  });

  // reset crash flag when status leaves "over"
  useEffect(() => {
    const unsub = useGameStore.subscribe((s) => {
      if (s.status !== "over") crashedRef.current = false;
    });
    return unsub;
  }, []);

  // `version` is included as a render dependency so React reconciles only on add/remove.
  void version;
  return (
    <>
      {obstaclesNow.map((o) => <Obstacle key={o.id} ob={o} />)}
      {coinsNow.map((c) => <Coin key={c.id} coin={c} />)}
      {powerupsNow.map((p) => <PowerUp key={p.id} pu={p} />)}
    </>
  );
}

// suppress unused warnings for things referenced only via constants
void POWERUP_BASE_DUR; void THREE;
