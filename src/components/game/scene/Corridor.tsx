import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../engine/store";

const TILE_LENGTH = 20;
const TILE_COUNT = 12;
const CORRIDOR_WIDTH = 8.5;
const WALL_HEIGHT = 5.5;

export function Corridor() {
  const offset = useRef(0);
  const floorGroup = useRef<THREE.Group>(null!);
  const pillarsGroup = useRef<THREE.Group>(null!);

  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x6b4a2e, roughness: 0.95, metalness: 0.02,
  }), []);
  const tileMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x8a6238, roughness: 0.9,
  }), []);
  const stripeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xd4a437, roughness: 0.4, metalness: 0.6, emissive: 0x553200, emissiveIntensity: 0.25,
  }), []);
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x3a2818, roughness: 0.95,
  }), []);
  const wallBrickMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x5a3a22, roughness: 0.9,
  }), []);
  const pillarMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x4a3220, roughness: 0.85,
  }), []);
  const pillarCapMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xb88840, roughness: 0.5, metalness: 0.4,
  }), []);
  const torchMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xff8030, emissive: 0xff6010, emissiveIntensity: 1.8, roughness: 0.6,
  }), []);

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
      while (z > TILE_LENGTH) z -= total;
      tile.position.z = z;
    });
    pillarsGroup.current.children.forEach((p, i) => {
      const baseZ = -((TILE_COUNT - 1) * TILE_LENGTH) + i * TILE_LENGTH;
      let z = baseZ + offset.current;
      while (z > TILE_LENGTH) z -= total;
      p.position.z = z;
    });

    const newDist = s.distance + speed * dt;
    const newScore = s.score + speed * dt * 1.5 * (s.active.speed ? 2 : 1);
    const newSpeed = Math.min(38, s.speed + 0.25 * dt);
    useGameStore.setState({ distance: newDist, score: newScore, speed: newSpeed });
  });

  return (
    <>
      {/* atmospheric fog */}
      <fog attach="fog" args={["#1a0f08", 18, 70]} />

      <group ref={floorGroup}>
        {Array.from({ length: TILE_COUNT }, (_, i) => (
          <group key={i}>
            {/* base floor */}
            <mesh position={[0, 0, 0]} receiveShadow material={floorMat}>
              <boxGeometry args={[CORRIDOR_WIDTH, 0.2, TILE_LENGTH]} />
            </mesh>
            {/* lane stripe inlays — gold */}
            <mesh position={[-2.2, 0.11, 0]} material={stripeMat}>
              <boxGeometry args={[0.08, 0.02, TILE_LENGTH * 0.92]} />
            </mesh>
            <mesh position={[2.2, 0.11, 0]} material={stripeMat}>
              <boxGeometry args={[0.08, 0.02, TILE_LENGTH * 0.92]} />
            </mesh>
            {/* stone tile cracks (lighter accent every few feet) */}
            {Array.from({ length: 5 }, (_, j) => (
              <mesh
                key={j}
                position={[0, 0.105, -TILE_LENGTH / 2 + (j + 0.5) * (TILE_LENGTH / 5)]}
                material={tileMat}
              >
                <boxGeometry args={[CORRIDOR_WIDTH - 0.2, 0.01, 0.08]} />
              </mesh>
            ))}
            {/* walls — base */}
            <mesh position={[-CORRIDOR_WIDTH / 2 - 0.2, WALL_HEIGHT / 2, 0]} receiveShadow material={wallMat}>
              <boxGeometry args={[0.4, WALL_HEIGHT, TILE_LENGTH]} />
            </mesh>
            <mesh position={[CORRIDOR_WIDTH / 2 + 0.2, WALL_HEIGHT / 2, 0]} receiveShadow material={wallMat}>
              <boxGeometry args={[0.4, WALL_HEIGHT, TILE_LENGTH]} />
            </mesh>
            {/* brick band along walls */}
            <mesh position={[-CORRIDOR_WIDTH / 2 - 0.05, 1.2, 0]} material={wallBrickMat}>
              <boxGeometry args={[0.15, 0.5, TILE_LENGTH]} />
            </mesh>
            <mesh position={[CORRIDOR_WIDTH / 2 + 0.05, 1.2, 0]} material={wallBrickMat}>
              <boxGeometry args={[0.15, 0.5, TILE_LENGTH]} />
            </mesh>
            <mesh position={[-CORRIDOR_WIDTH / 2 - 0.05, 3.6, 0]} material={wallBrickMat}>
              <boxGeometry args={[0.15, 0.5, TILE_LENGTH]} />
            </mesh>
            <mesh position={[CORRIDOR_WIDTH / 2 + 0.05, 3.6, 0]} material={wallBrickMat}>
              <boxGeometry args={[0.15, 0.5, TILE_LENGTH]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Pillars + torches every TILE_LENGTH */}
      <group ref={pillarsGroup}>
        {Array.from({ length: TILE_COUNT }, (_, i) => (
          <group key={i}>
            {/* left pillar */}
            <mesh position={[-CORRIDOR_WIDTH / 2 - 0.6, WALL_HEIGHT / 2, 0]} castShadow material={pillarMat}>
              <boxGeometry args={[0.7, WALL_HEIGHT, 0.7]} />
            </mesh>
            <mesh position={[-CORRIDOR_WIDTH / 2 - 0.6, WALL_HEIGHT - 0.1, 0]} material={pillarCapMat}>
              <boxGeometry args={[0.85, 0.2, 0.85]} />
            </mesh>
            <mesh position={[-CORRIDOR_WIDTH / 2 - 0.6, 0.15, 0]} material={pillarCapMat}>
              <boxGeometry args={[0.85, 0.3, 0.85]} />
            </mesh>
            {/* right pillar */}
            <mesh position={[CORRIDOR_WIDTH / 2 + 0.6, WALL_HEIGHT / 2, 0]} castShadow material={pillarMat}>
              <boxGeometry args={[0.7, WALL_HEIGHT, 0.7]} />
            </mesh>
            <mesh position={[CORRIDOR_WIDTH / 2 + 0.6, WALL_HEIGHT - 0.1, 0]} material={pillarCapMat}>
              <boxGeometry args={[0.85, 0.2, 0.85]} />
            </mesh>
            <mesh position={[CORRIDOR_WIDTH / 2 + 0.6, 0.15, 0]} material={pillarCapMat}>
              <boxGeometry args={[0.85, 0.3, 0.85]} />
            </mesh>
            {/* torches */}
            <mesh position={[-CORRIDOR_WIDTH / 2 - 0.3, 3.4, 0]} material={torchMat}>
              <sphereGeometry args={[0.18, 10, 10]} />
            </mesh>
            <mesh position={[CORRIDOR_WIDTH / 2 + 0.3, 3.4, 0]} material={torchMat}>
              <sphereGeometry args={[0.18, 10, 10]} />
            </mesh>
            <pointLight position={[-CORRIDOR_WIDTH / 2 - 0.3, 3.4, 0]} color="#ff8830" intensity={1.4} distance={11} />
            <pointLight position={[CORRIDOR_WIDTH / 2 + 0.3, 3.4, 0]} color="#ff8830" intensity={1.4} distance={11} />
          </group>
        ))}
      </group>

      {/* ambient warmth */}
      <ambientLight intensity={0.18} color="#ffb070" />
    </>
  );
}
