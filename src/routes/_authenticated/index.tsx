import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence } from "framer-motion";
import { Crosshair } from "lucide-react";
import { GameEngine, type PowerupType } from "@/components/game/GameEngine";
import { GameHUD } from "@/components/game/GameHUD";
import { StartScreen } from "@/components/game/StartScreen";
import { CharacterSelect } from "@/components/game/CharacterSelect";
import { GameOver } from "@/components/game/GameOver";
import { MobileControls } from "@/components/game/MobileControls";
import { SwipeFlash } from "@/components/game/SwipeFlash";
import { TiltIndicator } from "@/components/game/TiltIndicator";
import { PowerUpHUD } from "@/components/game/PowerUpHUD";
import { PowerUpActivationFlash } from "@/components/game/PowerUpActivationFlash";
import { TripOverlay } from "@/components/game/TripOverlay";
import { getCharacter } from "@/lib/characters";
import { useSoundManager } from "@/lib/useSoundManager";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";

type GameState = "start" | "charselect" | "playing" | "over";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Temple Dash — Endless Runner" },
      { name: "description", content: "Run, dodge and collect coins through an ancient temple in this 3D endless runner." },
    ],
  }),
  component: GamePage,
});

function powerupDur(level: number, base: number) { return base + (level - 1) * 2; }

function GamePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(updateMyProfile);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const saveMut = useMutation({
    mutationFn: (data: Parameters<typeof saveProfile>[0]["data"]) => saveProfile({ data }),
    onSuccess: (data) => qc.setQueryData(["profile"], data),
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const sound = useSoundManager();

  const [gameState, setGameState] = useState<GameState>("start");
  const [selectedCharId, setSelectedCharId] = useState("explorer");
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);
  const [finalStats, setFinalStats] = useState({ score: 0, coins: 0, distance: 0 });
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  const [swipeAction, setSwipeAction] = useState<"up" | "down" | "left" | "right" | null>(null);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [tiltLane, setTiltLane] = useState(1);
  const [tiltAngle, setTiltAngle] = useState(0);
  const [isTripping, setIsTripping] = useState(false);
  const [activePowerups, setActivePowerups] = useState<Record<PowerupType, boolean>>({
    shield: false, magnet: false, speed: false, invincibility: false,
  });
  const [powerupTimers, setPowerupTimers] = useState<Record<PowerupType, number>>({
    shield: 0, magnet: 0, speed: 0, invincibility: 0,
  });
  const [flashPowerup, setFlashPowerup] = useState<PowerupType | null>(null);

  const launchGame = useCallback((charId: string) => {
    if (!canvasRef.current || !profile) return;
    engineRef.current?.dispose();
    const char = getCharacter(charId);
    const engine = new GameEngine(canvasRef.current, {
      onScore: (s) => { setScore(s.score); setCoins(s.coins); setDistance(s.distance); },
      onCoin: () => {},
      onPowerup: (t) => { setFlashPowerup(t); setTimeout(() => setFlashPowerup(null), 600); },
      onPowerupState: (a, t) => { setActivePowerups(a); setPowerupTimers(t); },
      onTrip: () => setIsTripping(true),
      onStumbleEnd: () => setIsTripping(false),
      onTilt: (l, a) => { setTiltLane(l); setTiltAngle(a); },
      onSound: (n) => sound.play(n as any),
      onGameOver: async (final) => {
        setFinalStats(final);
        const earnedCoins = final.coins;
        const prevHigh = profile.high_score;
        const newHigh = final.score > prevHigh;
        setIsNewHighScore(newHigh);
        const updates: Record<string, number | boolean> = {
          total_coins: profile.total_coins + earnedCoins,
        };
        if (newHigh) updates.high_score = final.score;
        try { await saveMut.mutateAsync(updates as any); } catch (e) { console.error(e); }
        setGameState("over");
      },
    }, char);
    engine.setCoinMultiplier(profile.coin_multiplier);
    engine.setHeadStart(profile.head_start);
    engine.setPowerupDurations({
      shield: powerupDur(profile.shield_level, 4),
      magnet: powerupDur(profile.magnet_level, 6),
      speed: powerupDur(profile.speed_level, 3),
      invincibility: powerupDur(profile.invincibility_level, 4),
    });
    engine.setTiltEnabled(tiltEnabled);
    engineRef.current = engine;
    engine.start();
    setGameState("playing");
    setScore(0); setCoins(0); setDistance(0);
  }, [profile, sound, tiltEnabled, saveMut]);

  useEffect(() => () => { engineRef.current?.dispose(); }, []);

  // Tilt setup
  useEffect(() => {
    if (!tiltEnabled) return;
    const handler = (e: DeviceOrientationEvent) => {
      if (e.gamma != null) engineRef.current?.feedTilt(e.gamma);
    };
    window.addEventListener("deviceorientation", handler);
    engineRef.current?.setTiltEnabled(true);
    return () => {
      window.removeEventListener("deviceorientation", handler);
      engineRef.current?.setTiltEnabled(false);
    };
  }, [tiltEnabled]);

  const handleToggleTilt = async () => {
    if (!tiltEnabled) {
      const DOE = (DeviceOrientationEvent as any);
      if (typeof DOE?.requestPermission === "function") {
        try {
          const res = await DOE.requestPermission();
          if (res !== "granted") return;
        } catch { return; }
      }
    }
    setTiltEnabled(v => !v);
  };

  const handleSwipe = (dir: "up" | "down" | "left" | "right") => {
    setSwipeAction(dir);
    setTimeout(() => setSwipeAction(null), 350);
    const e = engineRef.current;
    if (!e) return;
    if (dir === "up") e.jump();
    else if (dir === "down") e.slide();
    else if (dir === "left") e.moveLeft();
    else if (dir === "right") e.moveRight();
  };

  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {gameState === "playing" && (
        <>
          <GameHUD score={score} coins={coins} distance={distance} />
          <PowerUpHUD active={activePowerups} timers={powerupTimers} />
          <PowerUpActivationFlash flash={flashPowerup} />
          <SwipeFlash action={swipeAction} />
          {tiltEnabled && (
            <>
              <TiltIndicator lane={tiltLane} angle={tiltAngle} />
              <button
                onClick={() => engineRef.current?.recalibrateBaseline()}
                className="absolute top-6 left-6 z-30 flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md border border-border px-3 py-2 text-xs text-foreground"
              >
                <Crosshair className="w-3 h-3" /> Recal
              </button>
            </>
          )}
          {isTripping && <TripOverlay />}
          <MobileControls onSwipe={handleSwipe} enabled={true} />
        </>
      )}

      <AnimatePresence>
        {gameState === "start" && (
          <StartScreen
            key="start"
            highScore={profile?.high_score ?? 0}
            tiltEnabled={tiltEnabled}
            onToggleTilt={handleToggleTilt}
            onSignOut={handleSignOut}
            onPlay={() => setGameState("charselect")}
          />
        )}
        {gameState === "charselect" && (
          <CharacterSelect
            key="cs"
            onBack={() => setGameState("start")}
            onConfirm={(id) => { setSelectedCharId(id); launchGame(id); }}
          />
        )}
        {gameState === "over" && (
          <GameOver
            key="over"
            score={finalStats.score} coins={finalStats.coins} distance={finalStats.distance}
            highScore={profile?.high_score ?? 0}
            isNewHighScore={isNewHighScore}
            onRestart={() => launchGame(selectedCharId)}
            onMenu={() => setGameState("start")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
