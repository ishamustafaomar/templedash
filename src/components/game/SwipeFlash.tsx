import { AnimatePresence, motion } from "framer-motion";

interface Props { action: "up" | "down" | "left" | "right" | null; }

export function SwipeFlash({ action }: Props) {
  return (
    <AnimatePresence>
      {action === "up" && (
        <motion.div key="u"
          initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
          className="pointer-events-none absolute top-0 left-0 right-0 h-32 z-20"
          style={{ background: "linear-gradient(180deg, rgba(250,204,21,0.75), transparent)" }}
        />
      )}
      {action === "down" && (
        <motion.div key="d"
          initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.35 }}
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 z-20"
          style={{ background: "linear-gradient(0deg, rgba(96,165,250,0.75), transparent)" }}
        />
      )}
      {action === "left" && (
        <motion.div key="l"
          initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.35 }}
          className="pointer-events-none absolute top-0 bottom-0 left-0 w-14 z-20"
          style={{ background: "linear-gradient(90deg, rgba(34,197,94,0.75), transparent)" }}
        />
      )}
      {action === "right" && (
        <motion.div key="r"
          initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.35 }}
          className="pointer-events-none absolute top-0 bottom-0 right-0 w-14 z-20"
          style={{ background: "linear-gradient(270deg, rgba(34,197,94,0.75), transparent)" }}
        />
      )}
    </AnimatePresence>
  );
}
