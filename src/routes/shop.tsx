import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Coins, ShoppingBag, X, Lock } from "lucide-react";
import { useProfile } from "@/lib/useProfile";
import { ShopItemCard, SHOP_ITEMS, levelCost, type ShopItem } from "@/components/shop/ShopItemCard";
import { CoinPackCard } from "@/components/shop/CoinPackCard";
import { COIN_PACKS, type CoinPack } from "@/lib/coinPacks";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const Route = createFileRoute("/shop")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Temple Shop — Upgrades & Coin Packs" },
      { name: "description", content: "Buy coin packs or spend coins on permanent power-up upgrades." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { profile, ready, save } = useProfile();
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkoutPack, setCheckoutPack] = useState<CoinPack | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  const onBuyPack = (pack: CoinPack) => {
    if (!signedIn) {
      setToast({ kind: "err", msg: "Sign in to purchase coins." });
      setTimeout(() => setToast(null), 2800);
      return;
    }
    setCheckoutPack(pack);
  };

  const purchase = async (item: ShopItem) => {
    if (!profile) return;
    let cost: number | null;
    const updates: Record<string, number | boolean> = {};
    if (item.type === "level") {
      const lvl = (profile as any)[item.field] as number;
      cost = levelCost(lvl);
      if (cost == null) return;
      updates[item.field] = lvl + 1;
    } else {
      if ((profile as any)[item.field]) return;
      cost = item.cost ?? 0;
      updates[item.field] = true;
    }
    if (profile.total_coins < cost) {
      setToast({ kind: "err", msg: "Not enough coins!" });
      setTimeout(() => setToast(null), 2800);
      return;
    }
    updates.total_coins = profile.total_coins - cost;
    setBusy(true);
    try {
      await save(updates as any);
      setToast({ kind: "ok", msg: `${item.title} unlocked!` });
    } catch {
      setToast({ kind: "err", msg: "Purchase failed." });
    } finally { setBusy(false); }
    setTimeout(() => setToast(null), 2800);
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <PaymentTestModeBanner />
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-4 h-4" /> Back to Game
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5">
            <Coins className="w-4 h-4 text-primary" />
            <span className="font-cinzel font-bold text-primary tabular-nums">
              {!ready ? "—" : profile?.total_coins ?? 0}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-primary font-semibold uppercase tracking-widest text-xs mb-3">
            <ShoppingBag className="w-4 h-4" /> Temple Shop
          </div>
          <h1 className="font-cinzel font-bold text-4xl md:text-5xl mb-2">Upgrades</h1>
          <p className="text-muted-foreground">Spend your coins to unlock permanent upgrades across every run.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!ready
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-card animate-pulse" />)
            : SHOP_ITEMS.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <ShopItemCard item={item} profile={profile!} onBuy={purchase} busy={busy} />
              </motion.div>
            ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Coins are earned during runs. Upgrades persist across all sessions.
        </p>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full px-5 py-3 font-cinzel font-bold shadow-2xl ${
              toast.kind === "ok"
                ? "bg-primary text-primary-foreground"
                : "bg-destructive text-destructive-foreground"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
