import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Game } from "@/components/game/Game";
import { GameHUD } from "@/components/game/GameHUD";
import { StartScreen } from "@/components/game/StartScreen";
import { CharacterSelect } from "@/components/game/CharacterSelect";
import { GameOver } from "@/components/game/GameOver";
import { SwipeFlash } from "@/components/game/SwipeFlash";
import { PowerUpHUD } from "@/components/game/PowerUpHUD";
import { PowerUpActivationFlash } from "@/components/game/PowerUpActivationFlash";
import { TripOverlay } from "@/components/game/TripOverlay";
import { ControlsLegend } from "@/components/game/ControlsLegend";
import { getCharacter } from "@/lib/characters";
import { useSoundManager } from "@/lib/useSoundManager";
import { useProfile } from "@/lib/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useGameStore } from "@/components/game/engine/store";
import { useGameInput } from "@/components/game/engine/input";
import { useTiltInput, requestTiltPermission } from "@/components/game/engine/tilt";

import type { PowerupType, FinalStats } from "@/components/game/engine/types";

type GameState = "start" | "charselect" | "playing" | "over";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Temple Dash — Endless Runner" },
      { name: "description", content: "Run, dodge and collect coins through an ancient temple in this 3D endless runner." },
      { property: "og:url", content: "https://templedash.fun/" },
    ],
    links: [{ rel: "canonical", href: "https://templedash.fun/" }],
  }),
  component: GamePage,
});

function powerupDur(level: number, base: number) { return base + (level - 1) * 2; }

function GamePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { profile, isGuest, save } = useProfile();
  const sound = useSoundManager();

  const [gameState, setGameState] = useState<GameState>("start");
  const [selectedCharId, setSelectedCharId] = useState("explorer");
  const [finalStats, setFinalStats] = useState<FinalStats>({ score: 0, coins: 0, distance: 0 });
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [flashPowerup, setFlashPowerup] = useState<PowerupType | null>(null);
  const [isTripping, setIsTripping] = useState(false);
  const [tiltEnabled, setTiltEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("td:tilt") === "1";
  });

  // NOTE: deliberately do NOT subscribe to per-frame store values (score, coins, distance,
  // active, timers) here — each subscription would re-render this whole page every frame.
  // HUD components subscribe internally with selectors / shallow eq.

  useGameInput(gameState === "playing");
  useTiltInput(gameState === "playing" && tiltEnabled);


  const handleToggleTilt = useCallback(async () => {
    if (!tiltEnabled) {
      const ok = await requestTiltPermission();
      if (!ok) return;
      setTiltEnabled(true);
      window.localStorage.setItem("td:tilt", "1");
    } else {
      setTiltEnabled(false);
      window.localStorage.setItem("td:tilt", "0");
    }
  }, [tiltEnabled]);


  const startGame = useCallback((charId: string) => {
    if (!profile) return;
    useGameStore.getState().reset();
    setGameState("playing");
  }, [profile]);

  const handleGameOver = useCallback(async (final: FinalStats) => {
    if (!profile) return;
    const flooredScore = Math.floor(final.score);
    setFinalStats({ ...final, score: flooredScore });
    const prevHigh = profile.high_score;
    const newHigh = flooredScore > prevHigh;
    setIsNewHighScore(newHigh);
    const updates: Record<string, number | boolean> = {
      total_coins: profile.total_coins + final.coins,
    };
    if (newHigh) updates.high_score = flooredScore;
    try { await save(updates as Partial<typeof profile>); } catch (e) { console.error(e); }
    setGameState("over");
  }, [profile, save]);

  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
  };

  const char = getCharacter(selectedCharId);

  return (
    <div className="fixed inset-0 bg-background overflow-hidden touch-none select-none">
      {(gameState === "playing" || gameState === "over") && profile && (
        <Game
          character={char}
          coinMultiplier={profile.coin_multiplier}
          powerupDurations={{
            magnet: powerupDur(profile.magnet_level, 6),
            speed: powerupDur(profile.speed_level, 3),
            invincibility: powerupDur(profile.invincibility_level, 4),
          }}
          onCoin={() => {}}
          onPowerup={(t) => { setFlashPowerup(t); setTimeout(() => setFlashPowerup(null), 600); }}
          onCrash={() => { setIsTripping(true); setTimeout(() => setIsTripping(false), 600); }}
          onGameOver={handleGameOver}
          onSound={(n) => sound.play(n as Parameters<typeof sound.play>[0])}
        />
      )}

      {gameState === "playing" && (
        <>
          <GameHUD score={Math.floor(hudScore)} coins={hudCoins} distance={hudDist} />
          <PowerUpHUD active={active} timers={timers} />
          <PowerUpActivationFlash flash={flashPowerup} />
          <SwipeFlash action={null} />
          {isTripping && <TripOverlay />}
          <ControlsLegend />
        </>
      )}

      <AnimatePresence>
        {gameState === "start" && (
          <StartScreen
            key="start"
            highScore={profile?.high_score ?? 0}
            tiltEnabled={tiltEnabled}
            onToggleTilt={handleToggleTilt}

            isGuest={isGuest}
            onSignIn={() => navigate({ to: "/auth" })}
            onSignOut={handleSignOut}
            onPlay={() => setGameState("charselect")}
          />
        )}
        {gameState === "charselect" && (
          <CharacterSelect
            key="cs"
            onBack={() => setGameState("start")}
            onConfirm={(id) => { setSelectedCharId(id); startGame(id); }}
          />
        )}
        {gameState === "over" && (
          <GameOver
            key="over"
            score={finalStats.score} coins={finalStats.coins} distance={finalStats.distance}
            highScore={profile?.high_score ?? 0}
            isNewHighScore={isNewHighScore}
            onRestart={() => startGame(selectedCharId)}
            onMenu={() => setGameState("start")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// reference to suppress unused on hud subscribers
void useEffect;
