import { memo, useMemo, useRef } from "react";
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

const GEM_GEO = new THREE.IcosahedronGeometry(0.42, 0);
const MAT_CACHE = new Map<number, THREE.MeshLambertMaterial>();
function getMat(color: number) {
  let m = MAT_CACHE.get(color);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 1.4 });
    MAT_CACHE.set(color, m);
  }
  return m;
}

interface Props { pu: PowerUpEntity; }

function PowerUpImpl({ pu }: Props) {
  const ref = useRef<THREE.Mesh>(null!);
  const mat = useMemo(() => getMat(COLORS[pu.type]), [pu.type]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 2.2;
    ref.current.position.z = pu.z;
    ref.current.position.y = 1.4 + Math.sin(performance.now() * 0.004) * 0.18;
  });
  return (
    <mesh
      ref={ref}
      position={[LANE_X[pu.lane], 1.4, pu.z]}
      geometry={GEM_GEO}
      material={mat}
    />
  );
}

export const PowerUp = memo(PowerUpImpl, (a, b) => a.pu === b.pu);
