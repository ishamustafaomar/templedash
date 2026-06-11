import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ObstacleEntity } from "../engine/types";
import { LANE_X } from "../engine/constants";

interface Props { ob: ObstacleEntity; }

export function Obstacle({ ob }: Props) {
  const ref = useRef<THREE.Group>(null!);
  const x = LANE_X[ob.lane];

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: ob.kind === "saw" ? 0xc0c0c0 : 0x6a3a18,
    roughness: 0.6, metalness: ob.kind === "saw" ? 0.7 : 0.1,
  }), [ob.kind]);
  const trimMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xff6020, roughness: 0.5, emissive: 0xff2000, emissiveIntensity: 0.4 }), []);

  useFrame((_, dt) => {
    if (ob.kind === "saw" && ref.current) {
      ref.current.children[0].rotation.z += dt * 10;
    }
  });

  if (ob.kind === "lowbar") {
    return (
      <group ref={ref} position={[x, 0, ob.z]}>
        {/* horizontal bar at head height — must SLIDE under */}
        <mesh position={[0, 1.7, 0]} castShadow material={mat}>
          <boxGeometry args={[1.8, 0.25, 0.35]} />
        </mesh>
        <mesh position={[0, 1.7, 0]} material={trimMat}>
          <boxGeometry args={[1.85, 0.08, 0.4]} />
        </mesh>
        {/* support posts */}
        <mesh position={[-0.9, 1.0, 0]} material={mat}><boxGeometry args={[0.18, 1.95, 0.18]} /></mesh>
        <mesh position={[0.9, 1.0, 0]} material={mat}><boxGeometry args={[0.18, 1.95, 0.18]} /></mesh>
      </group>
    );
  }

  if (ob.kind === "hurdle") {
    return (
      <group ref={ref} position={[x, 0, ob.z]}>
        <mesh position={[0, 0.45, 0]} castShadow material={mat}>
          <boxGeometry args={[1.6, 0.9, 0.4]} />
        </mesh>
        <mesh position={[0, 0.88, 0]} material={trimMat}>
          <boxGeometry args={[1.65, 0.08, 0.42]} />
        </mesh>
      </group>
    );
  }

  if (ob.kind === "blocker") {
    return (
      <group ref={ref} position={[x, 0, ob.z]}>
        <mesh position={[0, 1.2, 0]} castShadow material={mat}>
          <boxGeometry args={[1.7, 2.4, 0.6]} />
        </mesh>
        <mesh position={[0, 2.4, 0]} material={trimMat}>
          <boxGeometry args={[1.75, 0.1, 0.62]} />
        </mesh>
      </group>
    );
  }

  // saw
  return (
    <group ref={ref} position={[x, 0, ob.z]}>
      <group position={[0, 1.0, 0]}>
        <mesh castShadow material={mat}>
          <cylinderGeometry args={[1.0, 1.0, 0.12, 16]} />
        </mesh>
        {/* teeth */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.05, 0, Math.sin(a) * 1.05]} rotation={[0, -a, 0]} material={trimMat}>
              <boxGeometry args={[0.25, 0.15, 0.15]} />
            </mesh>
          );
        })}
      </group>
      {/* base */}
      <mesh position={[0, 0.1, 0]} material={mat}>
        <boxGeometry args={[1.6, 0.2, 0.6]} />
      </mesh>
    </group>
  );
}

export const OBSTACLE_AABB: Record<ObstacleEntity["kind"], { yMin: number; yMax: number; xHalf: number; zHalf: number; }> = {
  lowbar:  { yMin: 1.45, yMax: 2.00, xHalf: 0.95, zHalf: 0.25 },
  hurdle:  { yMin: 0.00, yMax: 0.95, xHalf: 0.85, zHalf: 0.25 },
  blocker: { yMin: 0.00, yMax: 2.45, xHalf: 0.90, zHalf: 0.35 },
  saw:     { yMin: 0.10, yMax: 2.05, xHalf: 1.00, zHalf: 0.30 },
};
