import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../engine/store";
import { LANE_X, PLAYER_HEIGHT, PLAYER_SLIDE_HEIGHT, GRAVITY, LANE_CHANGE_DURATION } from "../engine/constants";
import type { Character } from "@/lib/characters";

interface Props { character: Character; }

export function Player({ character }: Props) {
  const group = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const scarf = useRef<THREE.Mesh>(null!);

  const bodyMat = useMemo(() => new THREE.MeshLambertMaterial({ color: character.bodyColor }), [character.bodyColor]);
  const gearMat = useMemo(() => new THREE.MeshLambertMaterial({ color: character.gearColor }), [character.gearColor]);
  const accentMat = useMemo(() => new THREE.MeshLambertMaterial({ color: character.accentColor, emissive: character.accentColor, emissiveIntensity: 0.15 }), [character.accentColor]);
  const skinMat = useMemo(() => new THREE.MeshLambertMaterial({ color: 0xe7b48a }), []);
  const bootMat = useMemo(() => new THREE.MeshLambertMaterial({ color: 0x2a1a10 }), []);
  const eyeMat = useMemo(() => new THREE.MeshLambertMaterial({ color: 0x0a0a0a }), []);

  useFrame((_, dt) => {
    const s = useGameStore.getState();

    if (s.isJumping) {
      const vy = s.vy - GRAVITY * dt;
      let y = s.y + vy * dt;
      if (y <= 0) {
        y = 0;
        useGameStore.setState({ y: 0, vy: 0, isJumping: false });
      } else {
        useGameStore.setState({ y, vy });
      }
    }
    if (s.isSliding) {
      const t = s.slideT - dt;
      if (t <= 0) useGameStore.setState({ isSliding: false, slideT: 0 });
      else useGameStore.setState({ slideT: t });
    }
    if (s.laneChangeT < 1) {
      const t = Math.min(1, s.laneChangeT + dt / LANE_CHANGE_DURATION);
      useGameStore.setState({ laneChangeT: t });
      if (t === 1) {
        useGameStore.setState({ lane: s.targetLane });
        // Drain a buffered swipe immediately so back-to-back inputs land.
        const q = useGameStore.getState().queuedMove;
        if (q === "left") useGameStore.getState().moveLeft();
        else if (q === "right") useGameStore.getState().moveRight();
      }
    }

    const live = useGameStore.getState();
    const fromX = LANE_X[live.lane];
    const toX = LANE_X[live.targetLane];
    const x = fromX + (toX - fromX) * live.laneChangeT;
    group.current.position.x = x;
    group.current.position.y = live.y;

    const slideScale = live.isSliding ? PLAYER_SLIDE_HEIGHT / PLAYER_HEIGHT : 1;
    bodyRef.current.scale.y = THREE.MathUtils.lerp(bodyRef.current.scale.y, slideScale, 0.3);
    bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, live.isSliding ? -0.4 : 0, 0.3);
    // Forward dive on slide (rotate around X). Body is yaw-flipped 180°, so positive X tilt dives forward into the run direction.
    const targetTilt = live.isSliding ? 0.9 : 0;
    bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, targetTilt, 0.25);

    const t = performance.now() * 0.014 * (live.isJumping || live.isSliding ? 0 : 1);
    const swing = Math.sin(t) * 0.85;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing * 0.9;
    if (armR.current) armR.current.rotation.x = swing * 0.9;
    // subtle torso bob
    bodyRef.current.position.y += Math.abs(Math.sin(t)) * 0.04 * (live.isSliding ? 0 : 1);
    // scarf flutter
    if (scarf.current) {
      scarf.current.rotation.x = 0.3 + Math.sin(performance.now() * 0.01) * 0.15;
    }

    const bank = (toX - fromX) * (1 - live.laneChangeT) * 0.07;
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -bank, 0.2);
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      <group ref={bodyRef} rotation={[0, Math.PI, 0]}>
        {/* Torso — tapered */}
        <mesh position={[0, 1.05, 0]} material={bodyMat}>
          <capsuleGeometry args={[0.36, 0.7, 6, 12]} />
        </mesh>
        {/* Chest strap */}
        <mesh position={[0, 1.15, 0.28]} material={accentMat}>
          <boxGeometry args={[0.7, 0.12, 0.08]} />
        </mesh>
        {/* Belt */}
        <mesh position={[0, 0.62, 0]} material={gearMat}>
          <cylinderGeometry args={[0.4, 0.4, 0.14, 16]} />
        </mesh>
        <mesh position={[0, 0.62, 0.36]} material={accentMat}>
          <boxGeometry args={[0.18, 0.18, 0.06]} />
        </mesh>

        {/* Scarf */}
        <mesh ref={scarf} position={[0, 1.45, -0.05]} material={accentMat}>
          <boxGeometry args={[0.55, 0.18, 0.18]} />
        </mesh>
        <mesh position={[0.1, 1.2, -0.18]} material={accentMat}>
          <boxGeometry args={[0.22, 0.55, 0.06]} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 1.55, 0]} material={skinMat}>
          <cylinderGeometry args={[0.13, 0.15, 0.18, 12]} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.85, 0]} material={skinMat}>
          <sphereGeometry args={[0.32, 18, 16]} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.11, 1.9, 0.27]} material={eyeMat}>
          <sphereGeometry args={[0.045, 10, 10]} />
        </mesh>
        <mesh position={[0.11, 1.9, 0.27]} material={eyeMat}>
          <sphereGeometry args={[0.045, 10, 10]} />
        </mesh>
        {/* Brow */}
        <mesh position={[0, 2.0, 0.27]} material={gearMat}>
          <boxGeometry args={[0.34, 0.04, 0.04]} />
        </mesh>

        {/* Explorer hat — brim + crown */}
        <mesh position={[0, 2.15, 0]} material={gearMat}>
          <cylinderGeometry args={[0.55, 0.55, 0.05, 20]} />
        </mesh>
        <mesh position={[0, 2.28, 0]} material={gearMat}>
          <cylinderGeometry args={[0.3, 0.34, 0.26, 20]} />
        </mesh>
        <mesh position={[0, 2.18, 0]} material={accentMat}>
          <torusGeometry args={[0.33, 0.035, 8, 26]} />
        </mesh>

        {/* Arms — shoulder group rotates */}
        <group ref={armL} position={[-0.42, 1.45, 0]}>
          <mesh position={[0, -0.4, 0]} material={bodyMat}>
            <capsuleGeometry args={[0.11, 0.55, 6, 10]} />
          </mesh>
          <mesh position={[0, -0.8, 0]} material={skinMat}>
            <sphereGeometry args={[0.13, 12, 12]} />
          </mesh>
        </group>
        <group ref={armR} position={[0.42, 1.45, 0]}>
          <mesh position={[0, -0.4, 0]} material={bodyMat}>
            <capsuleGeometry args={[0.11, 0.55, 6, 10]} />
          </mesh>
          <mesh position={[0, -0.8, 0]} material={skinMat}>
            <sphereGeometry args={[0.13, 12, 12]} />
          </mesh>
        </group>

        {/* Legs */}
        <group ref={legL} position={[-0.18, 0.55, 0]}>
          <mesh position={[0, -0.32, 0]} material={gearMat}>
            <capsuleGeometry args={[0.14, 0.55, 6, 10]} />
          </mesh>
          <mesh position={[0, -0.72, 0.06]} material={bootMat}>
            <boxGeometry args={[0.26, 0.16, 0.36]} />
          </mesh>
        </group>
        <group ref={legR} position={[0.18, 0.55, 0]}>
          <mesh position={[0, -0.32, 0]} material={gearMat}>
            <capsuleGeometry args={[0.14, 0.55, 6, 10]} />
          </mesh>
          <mesh position={[0, -0.72, 0.06]} material={bootMat}>
            <boxGeometry args={[0.26, 0.16, 0.36]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
