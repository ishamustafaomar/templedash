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
  const legL = useRef<THREE.Mesh>(null!);
  const legR = useRef<THREE.Mesh>(null!);
  const armL = useRef<THREE.Mesh>(null!);
  const armR = useRef<THREE.Mesh>(null!);

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: character.bodyColor, roughness: 0.7 }), [character.bodyColor]);
  const gearMat = useMemo(() => new THREE.MeshStandardMaterial({ color: character.gearColor, roughness: 0.6 }), [character.gearColor]);
  const accentMat = useMemo(() => new THREE.MeshStandardMaterial({ color: character.accentColor, roughness: 0.5 }), [character.accentColor]);
  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xf2c7a0, roughness: 0.8 }), []);

  useFrame((_, dt) => {
    const s = useGameStore.getState();

    // physics — vertical
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
    // slide timer
    if (s.isSliding) {
      const t = s.slideT - dt;
      if (t <= 0) useGameStore.setState({ isSliding: false, slideT: 0 });
      else useGameStore.setState({ slideT: t });
    }
    // lane change interpolation
    if (s.laneChangeT < 1) {
      const t = Math.min(1, s.laneChangeT + dt / LANE_CHANGE_DURATION);
      useGameStore.setState({ laneChangeT: t });
      if (t === 1) useGameStore.setState({ lane: s.targetLane });
    }

    const live = useGameStore.getState();
    const fromX = LANE_X[live.lane];
    const toX = LANE_X[live.targetLane];
    const x = fromX + (toX - fromX) * live.laneChangeT;
    group.current.position.x = x;
    group.current.position.y = live.y;

    // squash when sliding
    const slideScale = live.isSliding ? PLAYER_SLIDE_HEIGHT / PLAYER_HEIGHT : 1;
    bodyRef.current.scale.y = THREE.MathUtils.lerp(bodyRef.current.scale.y, slideScale, 0.3);
    bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, live.isSliding ? -0.4 : 0, 0.3);

    // run cycle
    const t = performance.now() * 0.012 * (live.isJumping || live.isSliding ? 0 : 1);
    const swing = Math.sin(t) * 0.7;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing * 0.8;
    if (armR.current) armR.current.rotation.x = swing * 0.8;

    // banking on lane change
    const bank = (toX - fromX) * (1 - live.laneChangeT) * 0.06;
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -bank, 0.2);
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      <group ref={bodyRef}>
        {/* Torso */}
        <mesh position={[0, 1.0, 0]} castShadow material={bodyMat}>
          <boxGeometry args={[0.9, 1.1, 0.55]} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.85, 0]} castShadow material={skinMat}>
          <boxGeometry args={[0.55, 0.55, 0.55]} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.13, 1.88, 0.28]}><boxGeometry args={[0.08, 0.08, 0.02]} /><meshStandardMaterial color="#101010" /></mesh>
        <mesh position={[0.13, 1.88, 0.28]}><boxGeometry args={[0.08, 0.08, 0.02]} /><meshStandardMaterial color="#101010" /></mesh>
        {/* Hat */}
        <mesh position={[0, 2.22, 0]} castShadow material={gearMat}>
          <cylinderGeometry args={[0.55, 0.55, 0.05, 16]} />
        </mesh>
        <mesh position={[0, 2.32, 0]} castShadow material={gearMat}>
          <cylinderGeometry args={[0.32, 0.32, 0.22, 16]} />
        </mesh>
        <mesh position={[0, 2.32, 0]} material={accentMat}>
          <torusGeometry args={[0.33, 0.04, 8, 24]} />
        </mesh>
        {/* Arms */}
        <mesh ref={armL} position={[-0.55, 1.35, 0]} castShadow material={bodyMat}>
          <boxGeometry args={[0.22, 0.9, 0.22]} />
        </mesh>
        <mesh ref={armR} position={[0.55, 1.35, 0]} castShadow material={bodyMat}>
          <boxGeometry args={[0.22, 0.9, 0.22]} />
        </mesh>
        {/* Legs */}
        <mesh ref={legL} position={[-0.22, 0.45, 0]} castShadow material={gearMat}>
          <boxGeometry args={[0.28, 0.9, 0.28]} />
        </mesh>
        <mesh ref={legR} position={[0.22, 0.45, 0]} castShadow material={gearMat}>
          <boxGeometry args={[0.28, 0.9, 0.28]} />
        </mesh>
      </group>
    </group>
  );
}
