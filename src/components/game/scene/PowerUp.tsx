import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PowerUpEntity } from "../engine/types";
import { LANE_X } from "../engine/constants";

const COLORS = {
  shield: 0x4488ff,
  magnet: 0xff44aa,
  speed: 0xffaa00,
  invincibility: 0xaa44ff,
} as const;

interface Props { pu: PowerUpEntity; }

export function PowerUp({ pu }: Props) {
  const ref = useRef<THREE.Group>(null!);
  const color = COLORS[pu.type];
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.4,
  }), [color]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 2;
    ref.current.position.y = 1.4 + Math.sin(performance.now() * 0.004) * 0.15;
  });

  return (
    <group ref={ref} position={[LANE_X[pu.lane], 1.4, pu.z]}>
      <mesh material={mat} castShadow>
        <octahedronGeometry args={[0.45, 0]} />
      </mesh>
      <pointLight color={color} intensity={1.2} distance={4} />
    </group>
  );
}
