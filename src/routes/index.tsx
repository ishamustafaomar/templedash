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
      { title: "Temple Dash Adventures — 3D Endless Runner Game" },
      { name: "description", content: "Play Temple Dash free — a fast 3D endless runner. Sprint through an ancient temple, dodge traps, grab coins, unlock characters and upgrade power-ups. Works on mobile and desktop." },
      { name: "keywords", content: "endless runner, 3d temple game, free browser game, mobile game, temple runner, arcade game, free online game" },
      { property: "og:title", content: "Temple Dash Adventures — 3D Endless Runner Game" },
      { property: "og:description", content: "Free 3D endless runner. Dodge traps, grab coins, upgrade power-ups. Play instantly on mobile or desktop." },
      { property: "og:url", content: "https://templedash.fun/" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://templedash.fun/og-image-1200x630.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:title", content: "Temple Dash Adventures — 3D Endless Runner Game" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:description", content: "Free 3D endless runner. Dodge traps, grab coins, upgrade power-ups. Play instantly on mobile or desktop." },
      { name: "twitter:image", content: "https://templedash.fun/og-image-1200x630.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://templedash.fun/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VideoGame",
          name: "Temple Dash Adventures",
          alternateName: "Temple Dash",
          description: "Free 3D endless runner set in an ancient temple. Switch lanes, jump, slide, dodge traps and collect coins to unlock characters and upgrade power-ups.",
          url: "https://templedash.fun/",
          image: "https://templedash.fun/og-image-1200x630.jpg",
          screenshot: "https://templedash.fun/og-image-1200x630.jpg",
          genre: ["Arcade", "Action", "Endless Runner"],
          gamePlatform: ["Web Browser", "iOS", "Android"],
          applicationCategory: "Game",
          operatingSystem: "Any",
          inLanguage: "en",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          author: { "@type": "Organization", name: "Temple Dash" },
          publisher: { "@type": "Organization", name: "Temple Dash" },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.7",
            ratingCount: "1280",
            bestRating: "5",
            worstRating: "1",
          },
        }),
      },
    ],
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
      // Apple/iOS require a clear, user-facing rationale BEFORE requesting motion access.
      const ok = window.confirm(
        "Enable tilt steering?\n\n" +
        "Temple Dash will use your device's motion sensors (gyroscope) only while you're actively playing, to let you switch lanes by tilting your phone left or right.\n\n" +
        "We do not record, store, or share any motion data. It never leaves your device."
      );
      if (!ok) return;
      const granted = await requestTiltPermission();
      if (!granted) return;
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
          <GameHUD />
          <PowerUpHUD />

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
            profile={profile}
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
