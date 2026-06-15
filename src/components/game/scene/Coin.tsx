import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CoinEntity } from "../engine/types";
import { LANE_X } from "../engine/constants";

interface Props { coin: CoinEntity; }

export function Coin({ coin }: Props) {
  const group = useRef<THREE.Group>(null!);
  const coinMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xffd54a,
    emissive: 0xffa000,
    emissiveIntensity: 0.55,
    roughness: 0.18,
    metalness: 0.95,
  }), []);
  const rimMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xfff1a8,
    emissive: 0xffcc33,
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 1.0,
  }), []);

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * 4.5;
    group.current.position.y =
      coin.y + Math.sin(performance.now() * 0.004 + coin.z) * 0.08;
  });

  if (coin.collected) return null;
  return (
    <group ref={group} position={[LANE_X[coin.lane], coin.y, coin.z]}>
      {/* core disc */}
      <mesh material={coinMat} castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.07, 24]} />
      </mesh>
      {/* outer rim */}
      <mesh material={rimMat} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.04, 10, 28]} />
      </mesh>
      {/* embossed star */}
      <mesh position={[0, 0, 0.04]} material={rimMat}>
        <torusGeometry args={[0.13, 0.025, 6, 18]} />
      </mesh>
      <pointLight color={0xffc24a} intensity={0.6} distance={2.5} />
    </group>
  );
}
