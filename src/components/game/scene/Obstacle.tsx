import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ObstacleEntity } from "../engine/types";
import { LANE_X } from "../engine/constants";

// Shared materials — created once, reused for every obstacle instance.
const STONE = new THREE.MeshLambertMaterial({ color: 0x7a6a55 });
const WOOD = new THREE.MeshLambertMaterial({ color: 0x6b3a18 });
const METAL = new THREE.MeshLambertMaterial({ color: 0xb8bcc0 });
const DANGER = new THREE.MeshLambertMaterial({ color: 0xff5020, emissive: 0xff3000, emissiveIntensity: 0.9 });
const GOLD = new THREE.MeshLambertMaterial({ color: 0xd4a437, emissive: 0x553200, emissiveIntensity: 0.4 });

// Shared geometries (cylinders/boxes are cheap but allocating one per obstacle adds up).
const LOWBAR_POST = new THREE.BoxGeometry(0.3, 2.0, 0.4);
const LOWBAR_CROSS = new THREE.BoxGeometry(2.1, 0.32, 0.4);
const LOWBAR_TRIM = new THREE.BoxGeometry(2.0, 0.12, 0.04);
const HURDLE_BASE = new THREE.BoxGeometry(1.7, 0.7, 0.55);
const HURDLE_TOP = new THREE.BoxGeometry(1.75, 0.18, 0.58);
const HURDLE_TRIM = new THREE.BoxGeometry(1.78, 0.05, 0.6);
const BLOCKER_BASE = new THREE.BoxGeometry(1.7, 0.4, 0.7);
const BLOCKER_BODY = new THREE.BoxGeometry(1.5, 1.6, 0.55);
const BLOCKER_HEAD = new THREE.BoxGeometry(1.3, 0.5, 0.55);
const BLOCKER_EYE = new THREE.BoxGeometry(0.2, 0.18, 0.04);
const BLOCKER_MOUTH = new THREE.BoxGeometry(0.55, 0.08, 0.04);
const SAW_BASE = new THREE.BoxGeometry(1.6, 0.24, 0.6);
const SAW_MAST = new THREE.BoxGeometry(0.16, 0.9, 0.16);
const SAW_BLADE = new THREE.CylinderGeometry(0.95, 0.95, 0.08, 16);
SAW_BLADE.rotateX(Math.PI / 2);
const SAW_HUB = new THREE.CylinderGeometry(0.22, 0.22, 0.1, 12);
SAW_HUB.rotateX(Math.PI / 2);

interface Props { ob: ObstacleEntity; }

function ObstacleImpl({ ob }: Props) {
  const ref = useRef<THREE.Group>(null!);
  const sawBlade = useRef<THREE.Mesh>(null!);
  const x = LANE_X[ob.lane];

  useFrame((_, dt) => {
    if (ref.current) ref.current.position.z = ob.z;
    if (ob.kind === "saw" && sawBlade.current) {
      sawBlade.current.rotation.z += dt * 12;
    }
  });

  if (ob.kind === "lowbar") {
    return (
      <group ref={ref} position={[x, 0, ob.z]}>
        <mesh position={[-0.95, 1.0, 0]} geometry={LOWBAR_POST} material={STONE} />
        <mesh position={[0.95, 1.0, 0]} geometry={LOWBAR_POST} material={STONE} />
        <mesh position={[0, 1.78, 0]} geometry={LOWBAR_CROSS} material={STONE} />
        <mesh position={[0, 1.78, 0.21]} geometry={LOWBAR_TRIM} material={GOLD} />
      </group>
    );
  }

  if (ob.kind === "hurdle") {
    return (
      <group ref={ref} position={[x, 0, ob.z]}>
        <mesh position={[0, 0.35, 0]} geometry={HURDLE_BASE} material={STONE} />
        <mesh position={[0, 0.72, 0]} geometry={HURDLE_TOP} material={WOOD} />
        <mesh position={[0, 0.82, 0]} geometry={HURDLE_TRIM} material={GOLD} />
      </group>
    );
  }

  if (ob.kind === "blocker") {
    return (
      <group ref={ref} position={[x, 0, ob.z]}>
        <mesh position={[0, 0.2, 0]} geometry={BLOCKER_BASE} material={STONE} />
        <mesh position={[0, 1.1, 0]} geometry={BLOCKER_BODY} material={STONE} />
        <mesh position={[0, 2.15, 0]} geometry={BLOCKER_HEAD} material={STONE} />
        <mesh position={[-0.32, 2.15, 0.29]} geometry={BLOCKER_EYE} material={DANGER} />
        <mesh position={[0.32, 2.15, 0.29]} geometry={BLOCKER_EYE} material={DANGER} />
        <mesh position={[0, 1.95, 0.29]} geometry={BLOCKER_MOUTH} material={DANGER} />
      </group>
    );
  }

  // saw
  return (
    <group ref={ref} position={[x, 0, ob.z]}>
      <mesh position={[0, 0.12, 0]} geometry={SAW_BASE} material={WOOD} />
      <mesh position={[0, 0.55, 0]} geometry={SAW_MAST} material={WOOD} />
      <mesh ref={sawBlade} position={[0, 1.05, 0]} geometry={SAW_BLADE} material={METAL} />
      <mesh position={[0, 1.05, 0.06]} geometry={SAW_HUB} material={DANGER} />
    </group>
  );
}

export const Obstacle = memo(ObstacleImpl, (a, b) => a.ob === b.ob);

export const OBSTACLE_AABB: Record<ObstacleEntity["kind"], { yMin: number; yMax: number; xHalf: number; zHalf: number; }> = {
  lowbar:  { yMin: 1.45, yMax: 2.00, xHalf: 1.05, zHalf: 0.25 },
  hurdle:  { yMin: 0.00, yMax: 0.95, xHalf: 0.85, zHalf: 0.30 },
  blocker: { yMin: 0.00, yMax: 2.45, xHalf: 0.85, zHalf: 0.35 },
  saw:     { yMin: 0.10, yMax: 2.05, xHalf: 1.00, zHalf: 0.30 },
};
