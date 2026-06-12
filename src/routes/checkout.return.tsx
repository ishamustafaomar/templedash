import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/checkout/return")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Payment Complete — Temple Dash" },
      { name: "description", content: "Your Temple Dash coin purchase is complete — coins will appear in your balance within a few seconds." },
      { property: "og:title", content: "Payment Complete — Temple Dash" },
      { property: "og:description", content: "Your Temple Dash coin purchase is complete." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PaymentTestModeBanner />
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center rounded-2xl border border-border bg-card p-8 shadow-xl">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-cinzel font-bold text-2xl mb-2">Payment complete</h1>
          <p className="text-muted-foreground text-sm mb-1">
            Your coins will appear in your balance within a few seconds.
          </p>
          {session_id && (
            <p className="text-xs text-muted-foreground/70 mb-6 break-all">Ref: {session_id}</p>
          )}
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 font-cinzel font-bold hover:opacity-90 transition"
          >
            Back to Shop <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
