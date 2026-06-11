import { motion } from "framer-motion";

export function TripOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="pointer-events-none absolute inset-0 z-20"
      style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(180,0,0,0.55) 100%)" }}
    >
      <motion.div
        animate={{ x: [-20, 0, -20] }} transition={{ repeat: Infinity, duration: 0.6 }}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-6xl"
      >🦍</motion.div>
      <motion.div
        animate={{ x: [20, 0, 20] }} transition={{ repeat: Infinity, duration: 0.6 }}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl"
      >🦍</motion.div>
    </motion.div>
  );
}
