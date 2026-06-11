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
      gl={{ antialias: true }}
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

  useFrame((_, dt) => {
    const s = useGameStore.getState();
    if (s.status !== "running") return;

    const speed = s.speed * (s.active.speed ? 1.5 : 1);
    const dz = speed * dt;

    // Move all entities toward +z (camera)
    const obstacles = s.obstacles.map((o) => ({ ...o, z: o.z + dz })).filter((o) => o.z < DESPAWN_BEHIND);
    const coins3d = s.coins3d.map((c) => ({ ...c, z: c.z + dz })).filter((c) => c.z < DESPAWN_BEHIND && !c.collected);
    const powerups3d = s.powerups3d.map((p) => ({ ...p, z: p.z + dz })).filter((p) => p.z < DESPAWN_BEHIND);

    // Spawn chunks ahead
    let nextSpawnZ = s.nextSpawnZ;
    let chunkIdx = 0;
    while (nextSpawnZ > -SPAWN_AHEAD) {
      const addPU = Math.random() < 0.25;
      const chunk = spawnChunk(nextSpawnZ, addPU);
      obstacles.push(...chunk.obstacles);
      coins3d.push(...chunk.coins);
      powerups3d.push(...chunk.powerups);
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
    for (const o of obstacles) {
      const ox = LANE_X[o.lane];
      const box = OBSTACLE_AABB[o.kind];
      // z overlap: obstacle's z range vs player slice (z in [-0.4, 0.4])
      if (o.z + box.zHalf < -0.5 || o.z - box.zHalf > 0.5) continue;
      // x overlap
      if (Math.abs(playerLaneX - ox) > box.xHalf + PLAYER_HALF_WIDTH) continue;
      // y overlap
      if (playerYMax < box.yMin || playerYMin > box.yMax) continue;
      crashed = true;
      break;
    }

    // Collect coins (with magnet pull)
    let coinsCollected = 0;
    const magnet = s.active.magnet;
    for (const c of coins3d) {
      if (c.collected) continue;
      const cx = LANE_X[c.lane];
      const dx = Math.abs(playerLaneX - cx);
      const dyAbs = Math.abs(playerYMax * 0.5 - c.y);
      const inSlice = c.z > -0.6 && c.z < 0.6;
      if (magnet && Math.abs(c.z) < 6) {
        // pull toward player
        c.y += (1.0 - c.y) * 0.15;
        // we keep lane visually, but treat as collected if near
        if (Math.abs(c.z) < 3 && dx < 2.5) { c.collected = true; coinsCollected++; }
      } else if (inSlice && dx < 0.9 && dyAbs < 1.0) {
        c.collected = true;
        coinsCollected++;
      }
    }

    // Collect power-ups
    let pickedPU: PowerupType | null = null;
    const newPU = [];
    for (const p of powerups3d) {
      const px = LANE_X[p.lane];
      const dx = Math.abs(playerLaneX - px);
      if (p.z > -0.7 && p.z < 0.7 && dx < 1.0) {
        pickedPU = p.type;
      } else {
        newPU.push(p);
      }
    }

    // Apply power-up timers
    const active = { ...s.active };
    const timers = { ...s.timers };
    (Object.keys(timers) as PowerupType[]).forEach((k) => {
      if (k === "shield") return;
      if (timers[k] > 0) {
        timers[k] = Math.max(0, timers[k] - dt);
        if (timers[k] === 0) active[k] = false;
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
      onPowerup(pickedPU);
      onSound?.(pickedPU);
    }

    // Handle crash with shield/invincibility
    if (crashed && !crashedRef.current) {
      if (active.invincibility) {
        crashed = false;
      } else if (shieldCount > 0) {
        shieldCount -= 1;
        if (shieldCount === 0) active.shield = false;
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

    useGameStore.setState({
      obstacles,
      coins3d,
      powerups3d: newPU,
      nextSpawnZ,
      coins: s.coins + coinAdd,
      score: s.score + scoreAdd,
      active, timers, shieldCount,
    });

    if (crashed && !crashedRef.current) {
      crashedRef.current = true;
      onSound?.("crash");
      onCrash();
      const final = { score: Math.floor(s.score + scoreAdd), coins: s.coins + coinAdd, distance: s.distance };
      // briefly delay so the crash registers
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

  const { obstacles, coins3d, powerups3d } = useGameStore();
  return (
    <>
      {obstacles.map((o) => <Obstacle key={o.id} ob={o} />)}
      {coins3d.map((c) => <Coin key={c.id} coin={c} />)}
      {powerups3d.map((p) => <PowerUp key={p.id} pu={p} />)}
    </>
  );
}

// suppress unused warnings for things referenced only via constants
void POWERUP_BASE_DUR; void THREE;
