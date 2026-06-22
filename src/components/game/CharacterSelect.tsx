import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHARACTERS } from "@/lib/characters";

interface Props { onConfirm: (id: string) => void; onBack: () => void; }

export function CharacterSelect({ onConfirm, onBack }: Props) {
  const [idx, setIdx] = useState(0);
  const char = CHARACTERS[idx];
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 touch-auto overflow-y-auto overscroll-contain bg-black/75 backdrop-blur-md"
    >
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-8">
      <h2 className="font-cinzel font-bold text-2xl md:text-4xl text-foreground mb-6">Choose Your Runner</h2>

      <div className="relative flex items-center gap-6">
        <Button variant="ghost" size="icon" aria-label="Previous character" onClick={() => setIdx((idx - 1 + CHARACTERS.length) % CHARACTERS.length)}>
          <ChevronLeft className="w-8 h-8" aria-hidden="true" />
        </Button>

        <AnimatePresence mode="wait">
          <motion.div
            key={char.id}
            initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-72 rounded-3xl p-6 border-2 text-center"
            style={{ borderColor: char.themeColor, background: `linear-gradient(180deg, ${char.themeColor}22, transparent)` }}
          >
            <div className="text-7xl mb-3">{char.emoji}</div>
            <div className="font-cinzel font-bold text-2xl">{char.name}</div>
            <div className="text-sm text-muted-foreground font-cinzel italic">{char.title}</div>
            <p className="mt-4 text-sm text-foreground/80">{char.description}</p>
            <div className="mt-4 inline-block px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: `${char.themeColor}33`, color: char.themeColor }}>
              {char.ability}
            </div>
          </motion.div>
        </AnimatePresence>

        <Button variant="ghost" size="icon" aria-label="Next character" onClick={() => setIdx((idx + 1) % CHARACTERS.length)}>
          <ChevronRight className="w-8 h-8" aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-8 flex gap-3">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button size="lg" onClick={() => onConfirm(char.id)} className="font-cinzel">
          <Check className="mr-2" /> Select {char.name}
        </Button>
      </div>
      </div>
    </motion.div>
  );
}
