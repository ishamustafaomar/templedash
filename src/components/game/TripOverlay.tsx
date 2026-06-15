import { motion } from "framer-motion";

export function TripOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-none absolute inset-0 z-20"
    >
      {/* radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(120,10,10,0.6) 100%)",
        }}
      />
      {/* impact flash */}
      <motion.div
        className="absolute inset-0 bg-red-500/30"
        initial={{ opacity: 0.9 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      />
      {/* camera shake lines */}
      <motion.div
        className="absolute inset-0"
        animate={{ x: [0, -6, 5, -3, 0], y: [0, 3, -4, 2, 0] }}
        transition={{ duration: 0.4, repeat: 0 }}
        style={{
          boxShadow: "inset 0 0 120px 20px rgba(255,60,60,0.35)",
        }}
      />
    </motion.div>
  );
}
