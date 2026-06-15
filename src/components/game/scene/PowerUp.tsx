import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PowerUpEntity } from "../engine/types";
import { LANE_X } from "../engine/constants";

const COLORS = {
  shield: 0x4aa8ff,
  magnet: 0xff4aa0,
  speed: 0xffb020,
  invincibility: 0xb060ff,
} as const;

interface Props { pu: PowerUpEntity; }

export function PowerUp({ pu }: Props) {
  const ref = useRef<THREE.Group>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const color = COLORS[pu.type];
  const coreMat = useMemo(() => new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.1,
    roughness: 0.2,
    metalness: 0.5,
  }), [color]);
  const haloMat = useMemo(() => new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.55,
  }), [color]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 2.2;
    ref.current.position.y = 1.4 + Math.sin(performance.now() * 0.004) * 0.18;
    if (ring.current) ring.current.rotation.z += dt * 1.5;
  });

  return (
    <group ref={ref} position={[LANE_X[pu.lane], 1.4, pu.z]}>
      {/* gem core */}
      <mesh material={coreMat} castShadow>
        <icosahedronGeometry args={[0.42, 0]} />
      </mesh>
      {/* halo ring */}
      <mesh ref={ring} material={haloMat} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.65, 0.04, 8, 32]} />
      </mesh>
      <pointLight color={color} intensity={1.8} distance={5} />
    </group>
  );
}
