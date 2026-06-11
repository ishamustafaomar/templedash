import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CoinEntity } from "../engine/types";
import { LANE_X } from "../engine/constants";

interface Props { coin: CoinEntity; }

export function Coin({ coin }: Props) {
  const ref = useRef<THREE.Mesh>(null!);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xffc940, emissive: 0xffaa00, emissiveIntensity: 0.6, roughness: 0.25, metalness: 0.85,
  }), []);

  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 4;
  });

  if (coin.collected) return null;
  return (
    <mesh ref={ref} position={[LANE_X[coin.lane], coin.y, coin.z]} material={mat} castShadow>
      <cylinderGeometry args={[0.32, 0.32, 0.08, 16]} />
    </mesh>
  );
}
