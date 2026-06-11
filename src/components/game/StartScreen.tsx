import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Play, ShoppingBag, Smartphone, LogOut, Cloud } from "lucide-react";
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
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm px-6"
    >
      <motion.h1
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="font-cinzel font-black text-6xl md:text-8xl text-primary text-glow-gold tracking-wider"
      >
        Temple Dash
      </motion.h1>
      <p className="mt-3 text-muted-foreground text-center max-w-md">
        Ancient corridors. Endless danger. How far can you run?
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
        <Smartphone className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-foreground">Tilt steering</span>
        <Switch checked={tiltEnabled} onCheckedChange={onToggleTilt} />
      </div>

      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        <Button size="lg" onClick={onPlay} className="font-cinzel text-lg h-14">
          <Play className="mr-2" /> Play
        </Button>
        <Button asChild variant="outline" size="lg" className="font-cinzel">
          <Link to="/shop"><ShoppingBag className="mr-2" /> Shop</Link>
        </Button>
        {isGuest ? (
          <Button onClick={onSignIn} variant="ghost" size="sm" className="text-muted-foreground">
            <Cloud className="mr-2 w-4 h-4" /> Back up progress to the cloud
          </Button>
        ) : (
          <Button onClick={onSignOut} variant="ghost" size="sm" className="text-muted-foreground">
            <LogOut className="mr-2 w-4 h-4" /> Sign out
          </Button>
        )}
      </div>

      {isGuest && (
        <p className="mt-3 text-xs text-muted-foreground/70 text-center max-w-xs">
          Playing as guest — progress saves on this device.
        </p>
      )}
    </motion.div>
  );
}
