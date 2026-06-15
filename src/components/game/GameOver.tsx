import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Trophy, Footprints, Coins, Star, RotateCcw, Home, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  score: number; distance: number; coins: number;
  highScore: number; isNewHighScore: boolean;
  onRestart: () => void; onMenu: () => void;
}

export function GameOver({ score, distance, coins, highScore, isNewHighScore, onRestart, onMenu }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 overflow-y-auto overscroll-contain bg-black/75 backdrop-blur-md"
    >
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-8">
      <h2 className="font-cinzel font-black text-4xl md:text-6xl text-destructive text-glow-red">Game Over</h2>

      {isNewHighScore && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary text-primary font-cinzel font-bold"
        >
          <Star className="w-5 h-5" /> New High Score! <Star className="w-5 h-5" />
        </motion.div>
      )}

      <div className="mt-6 w-full max-w-sm rounded-2xl bg-card border border-border p-6 space-y-4">
        <Row icon={<Trophy className="text-primary" />} label="Score" value={score.toLocaleString()} />
        <Row icon={<Footprints />} label="Distance" value={`${Math.floor(distance)}m`} />
        <Row icon={<Coins className="text-primary" />} label="Coins this run" value={`+${coins}`} />
        <Row icon={<Star />} label="Best Score" value={Math.max(score, highScore).toLocaleString()} />
      </div>

      <div className="mt-6 flex flex-col gap-2 w-full max-w-sm">
        <Button size="lg" onClick={onRestart} className="font-cinzel"><RotateCcw className="mr-2" /> Play Again</Button>
        <Button variant="outline" onClick={onMenu} className="font-cinzel"><Home className="mr-2" /> Main Menu</Button>
        <Button asChild variant="ghost"><Link to="/shop"><ShoppingBag className="mr-2 w-4 h-4" />Visit Shop</Link></Button>
      </div>
      </div>
    </motion.div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string; }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-sm">{label}</span></div>
      <div className="font-cinzel font-bold text-lg tabular-nums">{value}</div>
    </div>
  );
}
