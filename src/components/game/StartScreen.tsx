import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Play, ShoppingBag, Smartphone, LogOut, Cloud, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface Props {
  onPlay: () => void;
  tiltEnabled: boolean;
  onToggleTilt: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  isGuest: boolean;
  highScore: number;
}

export function StartScreen({ onPlay, tiltEnabled, onToggleTilt, onSignIn, onSignOut, isGuest, highScore }: Props) {
  const isMobile = typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 overflow-y-auto overscroll-contain bg-black/70 backdrop-blur-sm"
    >
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-8">
      <motion.h1
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="font-cinzel font-black text-6xl md:text-8xl text-primary text-glow-gold tracking-wider text-center"
      >
        <span className="block">Temple Dash</span>
        <span className="sr-only"> — Free 3D Endless Runner Game</span>
      </motion.h1>
      <p className="mt-3 text-muted-foreground text-center max-w-md text-base md:text-lg">
        The free 3D endless runner. Dodge traps, grab coins, unlock heroes — no download, plays instantly on mobile &amp; desktop.
      </p>
      {highScore > 0 && (
        <p className="mt-2 text-sm text-primary/80 font-cinzel">Best: {highScore.toLocaleString()}</p>
      )}


      <div className="mt-8 rounded-2xl bg-card/60 border border-border px-6 py-4 text-sm text-muted-foreground max-w-sm">
        {isMobile ? (
          <p>Swipe ⬅️ ➡️ to switch lanes • Swipe ⬆️ to jump • Swipe ⬇️ to slide</p>
        ) : (
          <p>← → arrows switch lanes • ↑ / Space to jump • ↓ to slide</p>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-full bg-card/60 border border-border px-4 py-2">
        <Smartphone className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="tilt-steering" className="text-sm text-foreground cursor-pointer">Tilt steering</label>
        <Switch id="tilt-steering" aria-label="Toggle tilt steering" checked={tiltEnabled} onCheckedChange={onToggleTilt} />
      </div>

      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        <Button size="lg" onClick={onPlay} className="font-cinzel text-lg h-14">
          <Play className="mr-2" /> Play
        </Button>
        <Button asChild variant="outline" size="lg" className="font-cinzel">
          <Link to="/shop"><ShoppingBag className="mr-2" /> Shop</Link>
        </Button>
        {isGuest ? (
          <Button onClick={onSignIn} variant="ghost" className="text-muted-foreground min-h-11">
            <Cloud className="mr-2 w-4 h-4" /> Back up progress to the cloud
          </Button>
        ) : (
          <>
            <Button asChild variant="ghost" className="text-muted-foreground min-h-11">
              <Link to="/settings"><Settings className="mr-2 w-4 h-4" /> Settings</Link>
            </Button>
            <Button onClick={onSignOut} variant="ghost" className="text-muted-foreground min-h-11">
              <LogOut className="mr-2 w-4 h-4" /> Sign out
            </Button>
          </>
        )}
      </div>

      {isGuest && (
        <p className="mt-3 text-xs text-muted-foreground text-center max-w-xs">
          Playing as guest — progress saves on this device.
        </p>
      )}

      <p className="mt-6 text-sm text-muted-foreground text-center flex items-center justify-center gap-4">
        <Link to="/privacy" className="hover:text-foreground inline-flex items-center min-h-11 px-3">Privacy</Link>
        <Link to="/terms" className="hover:text-foreground inline-flex items-center min-h-11 px-3">Terms</Link>
      </p>
      </div>
    </motion.div>
  );
}
