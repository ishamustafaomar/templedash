import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CoinEntity } from "../engine/types";
import { LANE_X } from "../engine/constants";

// Shared geometry + material across every coin — created once, GPU-friendly.
const DISC_GEO = new THREE.CylinderGeometry(0.34, 0.34, 0.07, 16);
DISC_GEO.rotateX(Math.PI / 2);
const COIN_MAT = new THREE.MeshLambertMaterial({
  color: 0xffd54a,
  emissive: 0xffa000,
  emissiveIntensity: 0.9,
});

interface Props { coin: CoinEntity; }

function CoinImpl({ coin }: Props) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.z += dt * 4.5;
    ref.current.position.z = coin.z;
    ref.current.position.y =
      coin.y + Math.sin(performance.now() * 0.004 + coin.z) * 0.08;
  });
  if (coin.collected) return null;
  return (
    <mesh
      ref={ref}
      position={[LANE_X[coin.lane], coin.y, coin.z]}
      geometry={DISC_GEO}
      material={COIN_MAT}
    />
  );
}

export const Coin = memo(CoinImpl, (a, b) => a.coin === b.coin);
