import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../engine/store";

const TILE_LENGTH = 20;
const TILE_COUNT = 12;
const CORRIDOR_WIDTH = 8.5;
const WALL_HEIGHT = 5;

export function Corridor() {
  const offset = useRef(0);
  const floorGroup = useRef<THREE.Group>(null!);
  const pillarsGroup = useRef<THREE.Group>(null!);

  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x5a3820, roughness: 0.9 }), []);
  const stripeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.9 }), []);
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.95 }), []);
  const pillarMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.85 }), []);

  useFrame((_, dt) => {
    const s = useGameStore.getState();
    if (s.status !== "running") return;
    const speed = s.speed * (s.active.speed ? 1.5 : 1);
    offset.current += speed * dt;
    const total = TILE_LENGTH * TILE_COUNT;
    if (offset.current > TILE_LENGTH) offset.current -= TILE_LENGTH;

    floorGroup.current.children.forEach((tile, i) => {
      const baseZ = -((TILE_COUNT - 1) * TILE_LENGTH) + i * TILE_LENGTH;
      let z = baseZ + offset.current;
      // wrap
      while (z > TILE_LENGTH) z -= total;
      tile.position.z = z;
    });
    pillarsGroup.current.children.forEach((p, i) => {
      const baseZ = -((TILE_COUNT - 1) * TILE_LENGTH) + i * TILE_LENGTH;
      let z = baseZ + offset.current;
      while (z > TILE_LENGTH) z -= total;
      p.position.z = z;
    });

    // distance + score + ramp
    const newDist = s.distance + speed * dt;
    const newScore = s.score + speed * dt * 1.5 * (s.active.speed ? 2 : 1);
    const newSpeed = Math.min(38, s.speed + 0.25 * dt);
    useGameStore.setState({ distance: newDist, score: newScore, speed: newSpeed });
  });

  return (
    <>
      <group ref={floorGroup}>
        {Array.from({ length: TILE_COUNT }, (_, i) => (
          <group key={i}>
            {/* floor */}
            <mesh position={[0, 0, 0]} receiveShadow material={floorMat}>
              <boxGeometry args={[CORRIDOR_WIDTH, 0.2, TILE_LENGTH]} />
            </mesh>
            {/* center strip */}
            <mesh position={[0, 0.11, 0]} material={stripeMat}>
              <boxGeometry args={[0.4, 0.02, TILE_LENGTH * 0.9]} />
            </mesh>
            {/* walls */}
            <mesh position={[-CORRIDOR_WIDTH / 2 - 0.2, WALL_HEIGHT / 2, 0]} material={wallMat}>
              <boxGeometry args={[0.4, WALL_HEIGHT, TILE_LENGTH]} />
            </mesh>
            <mesh position={[CORRIDOR_WIDTH / 2 + 0.2, WALL_HEIGHT / 2, 0]} material={wallMat}>
              <boxGeometry args={[0.4, WALL_HEIGHT, TILE_LENGTH]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Pillars along walls — spaced every TILE_LENGTH */}
      <group ref={pillarsGroup}>
        {Array.from({ length: TILE_COUNT }, (_, i) => (
          <group key={i}>
            <mesh position={[-CORRIDOR_WIDTH / 2 - 0.5, WALL_HEIGHT / 2, 0]} material={pillarMat} castShadow>
              <boxGeometry args={[0.6, WALL_HEIGHT, 0.6]} />
            </mesh>
            <mesh position={[CORRIDOR_WIDTH / 2 + 0.5, WALL_HEIGHT / 2, 0]} material={pillarMat} castShadow>
              <boxGeometry args={[0.6, WALL_HEIGHT, 0.6]} />
            </mesh>
            {/* torch glow */}
            <pointLight position={[-CORRIDOR_WIDTH / 2 - 0.5, 3.5, 0]} color="#ff8830" intensity={0.8} distance={10} />
            <pointLight position={[CORRIDOR_WIDTH / 2 + 0.5, 3.5, 0]} color="#ff8830" intensity={0.8} distance={10} />
          </group>
        ))}
      </group>
    </>
  );
}
