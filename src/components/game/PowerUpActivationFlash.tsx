import { AnimatePresence, motion } from "framer-motion";
import type { PowerupType } from "./GameEngine";

const COLORS: Record<PowerupType, string> = {
  shield: "#4488ff", magnet: "#ff44aa", speed: "#ffaa00", invincibility: "#aa44ff",
};

export function PowerUpActivationFlash({ flash }: { flash: PowerupType | null }) {
  return (
    <AnimatePresence>
      {flash && (
        <motion.div
          key={flash}
          initial={{ opacity: 0.7, scale: 0.6 }}
          animate={{ opacity: 0, scale: 2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="pointer-events-none absolute inset-0 z-20"
          style={{ background: `radial-gradient(circle at center, ${COLORS[flash]}aa, transparent 60%)` }}
        />
      )}
    </AnimatePresence>
  );
}
