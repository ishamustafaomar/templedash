import { motion } from "framer-motion";
import type { CoinPack } from "@/lib/coinPacks";

export function CoinPackCard({
  pack,
  onBuy,
  disabled,
}: {
  pack: CoinPack;
  onBuy: (pack: CoinPack) => void;
  disabled?: boolean;
}) {
  const Icon = pack.icon;
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled}
      onClick={() => onBuy(pack)}
      className="text-left rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 hover:border-primary/60 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${pack.accent}22`, color: pack.accent }}
        >
          <Icon className="w-5 h-5" />
        </div>
        {pack.bonusLabel && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${pack.accent}22`, color: pack.accent }}
          >
            {pack.bonusLabel}
          </span>
        )}
      </div>
      <div>
        <h3 className="font-cinzel font-bold text-lg">{pack.title}</h3>
        <p className="text-2xl font-bold tabular-nums" style={{ color: pack.accent }}>
          {pack.coins.toLocaleString()} <span className="text-sm text-muted-foreground font-normal">coins</span>
        </p>
      </div>
      <div className="mt-auto flex items-center justify-between">
        <span className="text-sm text-muted-foreground">One-time</span>
        <span className="font-cinzel font-bold text-foreground">{pack.priceLabel}</span>
      </div>
    </motion.button>
  );
}
