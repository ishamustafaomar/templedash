import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { COINS_BY_PRICE_ID } from "@/lib/coinPacks";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

async function creditCoinsForSession(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId as string | undefined;
  const priceId = session.metadata?.priceId as string | undefined;
  const sessionId = session.id as string;

  if (!userId || !priceId) {
    console.warn("Missing userId/priceId in session metadata", sessionId);
    return;
  }
  if (session.payment_status !== "paid") {
    console.log("Session not paid; skipping", sessionId, session.payment_status);
    return;
  }
  const coins = COINS_BY_PRICE_ID[priceId];
  if (!coins) {
    console.warn("Unknown priceId, no coins to credit:", priceId);
    return;
  }

  const sb = getSupabase();

  // Idempotency: insert purchase record; if it conflicts, we've already credited.
  const { error: insertErr } = await sb.from("coin_purchases").insert({
    user_id: userId,
    stripe_session_id: sessionId,
    price_id: priceId,
    coins_granted: coins,
    amount_cents: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
    environment: env,
  });
  if (insertErr) {
    if ((insertErr as any).code === "23505") {
      console.log("Purchase already processed:", sessionId);
      return;
    }
    console.error("Failed to insert purchase row:", insertErr);
    throw insertErr;
  }

  const { data: profile, error: readErr } = await sb
    .from("profiles")
    .select("total_coins")
    .eq("id", userId)
    .maybeSingle();
  if (readErr) throw readErr;

  const current = (profile?.total_coins as number | undefined) ?? 0;
  const { error: updateErr } = await sb
    .from("profiles")
    .update({ total_coins: current + coins })
    .eq("id", userId);
  if (updateErr) throw updateErr;

  console.log(`Credited ${coins} coins to ${userId} for session ${sessionId}`);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await creditCoinsForSession(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
