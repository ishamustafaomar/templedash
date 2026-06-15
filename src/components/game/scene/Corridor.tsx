import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../engine/store";

const TILE_LENGTH = 24;
const TILE_COUNT = 7; // was 12 — far plane is fogged so we don't need more
const CORRIDOR_WIDTH = 8.5;
const WALL_HEIGHT = 5.5;

// Shared materials + geometries (one allocation, every tile re-uses).
const FLOOR_MAT = new THREE.MeshLambertMaterial({ color: 0x6b4a2e });
const STRIPE_MAT = new THREE.MeshLambertMaterial({ color: 0xd4a437, emissive: 0x553200, emissiveIntensity: 0.4 });
const WALL_MAT = new THREE.MeshLambertMaterial({ color: 0x3a2818 });
const TORCH_MAT = new THREE.MeshBasicMaterial({ color: 0xff8030 });

const FLOOR_GEO = new THREE.BoxGeometry(CORRIDOR_WIDTH, 0.2, TILE_LENGTH);
const STRIPE_GEO = new THREE.BoxGeometry(0.08, 0.02, TILE_LENGTH * 0.92);
const WALL_GEO = new THREE.BoxGeometry(0.4, WALL_HEIGHT, TILE_LENGTH);
const TORCH_GEO = new THREE.SphereGeometry(0.18, 8, 6);

export function Corridor() {
  const offset = useRef(0);
  const floorGroup = useRef<THREE.Group>(null!);

  useFrame((_, dt) => {
    const s = useGameStore.getState();
    if (s.status !== "running") return;
    const speed = s.speed * (s.active.speed ? 1.5 : 1);
    offset.current += speed * dt;
    const total = TILE_LENGTH * TILE_COUNT;
    if (offset.current > TILE_LENGTH) offset.current -= TILE_LENGTH;

    const children = floorGroup.current.children;
    for (let i = 0; i < children.length; i++) {
      const baseZ = -((TILE_COUNT - 1) * TILE_LENGTH) + i * TILE_LENGTH;
      let z = baseZ + offset.current;
      while (z > TILE_LENGTH) z -= total;
      children[i].position.z = z;
    }

    // Scalar updates inline (cheap; HUD subscribers handle these)
    useGameStore.setState({
      distance: s.distance + speed * dt,
      score: s.score + speed * dt * 1.5 * (s.active.speed ? 2 : 1),
      speed: Math.min(38, s.speed + 0.25 * dt),
    });
  });

  return (
    <group ref={floorGroup}>
      {Array.from({ length: TILE_COUNT }, (_, i) => (
        <group key={i}>
          <mesh position={[0, 0, 0]} geometry={FLOOR_GEO} material={FLOOR_MAT} />
          <mesh position={[-2.2, 0.11, 0]} geometry={STRIPE_GEO} material={STRIPE_MAT} />
          <mesh position={[2.2, 0.11, 0]} geometry={STRIPE_GEO} material={STRIPE_MAT} />
          <mesh position={[-CORRIDOR_WIDTH / 2 - 0.2, WALL_HEIGHT / 2, 0]} geometry={WALL_GEO} material={WALL_MAT} />
          <mesh position={[CORRIDOR_WIDTH / 2 + 0.2, WALL_HEIGHT / 2, 0]} geometry={WALL_GEO} material={WALL_MAT} />
          <mesh position={[-CORRIDOR_WIDTH / 2 - 0.3, 3.4, 0]} geometry={TORCH_GEO} material={TORCH_MAT} />
          <mesh position={[CORRIDOR_WIDTH / 2 + 0.3, 3.4, 0]} geometry={TORCH_GEO} material={TORCH_MAT} />
        </group>
      ))}
    </group>
  );
}
