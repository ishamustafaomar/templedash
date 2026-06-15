import { memo, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ObstacleEntity } from "../engine/types";
import { LANE_X } from "../engine/constants";

interface Props { ob: ObstacleEntity; }

function ObstacleImpl({ ob }: Props) {

  const ref = useRef<THREE.Group>(null!);
  const sawBlade = useRef<THREE.Group>(null!);
  const x = LANE_X[ob.lane];

  const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x7a6a55, roughness: 0.95, metalness: 0.05,
  }), []);
  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x6b3a18, roughness: 0.85, metalness: 0.05,
  }), []);
  const metalMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xb8bcc0, roughness: 0.35, metalness: 0.9,
  }), []);
  const dangerMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xff5020, roughness: 0.5, emissive: 0xff3000, emissiveIntensity: 0.7,
  }), []);
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xd4a437, roughness: 0.4, metalness: 0.85, emissive: 0x553200, emissiveIntensity: 0.3,
  }), []);

  useFrame((_, dt) => {
    if (ref.current) ref.current.position.z = ob.z;
    if (ob.kind === "saw" && sawBlade.current) {
      sawBlade.current.rotation.z += dt * 12;
    }
  });


  if (ob.kind === "lowbar") {
    // Carved stone arch with glowing runes — slide under
    return (
      <group ref={ref} position={[x, 0, ob.z]}>
        {/* posts */}
        <mesh position={[-0.95, 1.0, 0]} castShadow material={stoneMat}>
          <boxGeometry args={[0.3, 2.0, 0.4]} />
        </mesh>
        <mesh position={[0.95, 1.0, 0]} castShadow material={stoneMat}>
          <boxGeometry args={[0.3, 2.0, 0.4]} />
        </mesh>
        {/* crossbar (the head-height bar) */}
        <mesh position={[0, 1.78, 0]} castShadow material={stoneMat}>
          <boxGeometry args={[2.1, 0.32, 0.4]} />
        </mesh>
        {/* gold rune trim */}
        <mesh position={[0, 1.78, 0.21]} material={goldMat}>
          <boxGeometry args={[2.0, 0.12, 0.04]} />
        </mesh>
        <mesh position={[0, 1.78, 0.23]} material={dangerMat}>
          <boxGeometry args={[0.18, 0.18, 0.02]} />
        </mesh>
        <pointLight position={[0, 1.78, 0.5]} color="#ff8030" intensity={0.6} distance={3} />
      </group>
    );
  }

  if (ob.kind === "hurdle") {
    // Stacked stone block with banded gold trim — jump over
    return (
      <group ref={ref} position={[x, 0, ob.z]}>
        <mesh position={[0, 0.35, 0]} castShadow material={stoneMat}>
          <boxGeometry args={[1.7, 0.7, 0.55]} />
        </mesh>
        <mesh position={[0, 0.72, 0]} castShadow material={woodMat}>
          <boxGeometry args={[1.75, 0.18, 0.58]} />
        </mesh>
        <mesh position={[0, 0.82, 0]} material={goldMat}>
          <boxGeometry args={[1.78, 0.05, 0.6]} />
        </mesh>
        {/* corner accents */}
        <mesh position={[-0.82, 0.72, 0]} material={goldMat}>
          <boxGeometry args={[0.12, 0.22, 0.62]} />
        </mesh>
        <mesh position={[0.82, 0.72, 0]} material={goldMat}>
          <boxGeometry args={[0.12, 0.22, 0.62]} />
        </mesh>
      </group>
    );
  }

  if (ob.kind === "blocker") {
    // Tall idol totem — change lanes
    return (
      <group ref={ref} position={[x, 0, ob.z]}>
        {/* base */}
        <mesh position={[0, 0.2, 0]} castShadow material={stoneMat}>
          <boxGeometry args={[1.7, 0.4, 0.7]} />
        </mesh>
        {/* body */}
        <mesh position={[0, 1.1, 0]} castShadow material={stoneMat}>
          <boxGeometry args={[1.5, 1.6, 0.55]} />
        </mesh>
        {/* head */}
        <mesh position={[0, 2.15, 0]} castShadow material={stoneMat}>
          <boxGeometry args={[1.3, 0.5, 0.55]} />
        </mesh>
        {/* eyes */}
        <mesh position={[-0.32, 2.15, 0.29]} material={dangerMat}>
          <boxGeometry args={[0.2, 0.18, 0.04]} />
        </mesh>
        <mesh position={[0.32, 2.15, 0.29]} material={dangerMat}>
          <boxGeometry args={[0.2, 0.18, 0.04]} />
        </mesh>
        {/* mouth */}
        <mesh position={[0, 1.95, 0.29]} material={dangerMat}>
          <boxGeometry args={[0.55, 0.08, 0.04]} />
        </mesh>
        {/* gold collar */}
        <mesh position={[0, 1.85, 0]} material={goldMat}>
          <boxGeometry args={[1.55, 0.1, 0.58]} />
        </mesh>
        <pointLight position={[0, 2.15, 0.6]} color="#ff4020" intensity={0.5} distance={2.5} />
      </group>
    );
  }

  // saw — buzzsaw on wooden mount
  return (
    <group ref={ref} position={[x, 0, ob.z]}>
      {/* base */}
      <mesh position={[0, 0.12, 0]} castShadow material={woodMat}>
        <boxGeometry args={[1.6, 0.24, 0.6]} />
      </mesh>
      {/* mast */}
      <mesh position={[0, 0.55, 0]} material={woodMat}>
        <boxGeometry args={[0.16, 0.9, 0.16]} />
      </mesh>
      {/* spinning blade */}
      <group ref={sawBlade} position={[0, 1.05, 0]}>
        <mesh castShadow material={metalMat} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.95, 0.95, 0.08, 24]} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0]}
              rotation={[0, 0, a + Math.PI / 2]}
              material={metalMat}
              castShadow
            >
              <coneGeometry args={[0.1, 0.22, 4]} />
            </mesh>
          );
        })}
        <mesh material={dangerMat} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.1, 16]} />
        </mesh>
      </group>
      <pointLight position={[0, 1.05, 0.5]} color="#ff5020" intensity={0.6} distance={3} />
    </group>
  );
}

export const OBSTACLE_AABB: Record<ObstacleEntity["kind"], { yMin: number; yMax: number; xHalf: number; zHalf: number; }> = {
  lowbar:  { yMin: 1.45, yMax: 2.00, xHalf: 1.05, zHalf: 0.25 },
  hurdle:  { yMin: 0.00, yMax: 0.95, xHalf: 0.85, zHalf: 0.30 },
  blocker: { yMin: 0.00, yMax: 2.45, xHalf: 0.85, zHalf: 0.35 },
  saw:     { yMin: 0.10, yMax: 2.05, xHalf: 1.00, zHalf: 0.30 },
};
