import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Temple Dash" },
      { name: "description", content: "The rules for using Temple Dash and purchasing in-game items." },
      { property: "og:title", content: "Terms of Service — Temple Dash" },
      { property: "og:description", content: "The rules for using Temple Dash and purchasing in-game items." },
      { property: "og:url", content: "https://templedash.fun/terms" },
    ],
    links: [{ rel: "canonical", href: "https://templedash.fun/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  const updated = "June 11, 2026";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to game
        </Link>
        <h1 className="font-cinzel font-bold text-4xl mt-4">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mt-1">Last updated: {updated}</p>

        <div className="prose prose-invert mt-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold">Acceptance</h2>
            <p>By playing Temple Dash or creating an account, you agree to these Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Your account</h2>
            <p>
              You are responsible for keeping your sign-in credentials secure. You may delete your
              account at any time from Settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Virtual currency and purchases</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Coins are a virtual currency with no real-world value and cannot be redeemed for cash.</li>
              <li>Purchased coins are credited to your account once payment is confirmed.</li>
              <li>Coins are non-transferable between accounts.</li>
              <li>
                Purchases are final. If coins are not delivered due to a technical error, contact
                support and we will credit the missing balance or refund the charge.
              </li>
              <li>
                If your account is deleted, any unspent coins are forfeited.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Acceptable use</h2>
            <p>
              Don't cheat, exploit bugs to mint coins, reverse engineer the game, or attempt to
              disrupt our services. We may suspend accounts that do.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Disclaimer</h2>
            <p>
              The game is provided "as is" without warranties. To the extent permitted by law, we
              are not liable for indirect or consequential damages.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Changes</h2>
            <p>
              We may update these Terms. Material changes will be announced in-app. Continued use
              after changes means you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Contact</h2>
            <p>Email <a href="mailto:support@example.com" className="text-primary underline">support@example.com</a>.</p>
          </section>

          <p className="text-xs text-muted-foreground pt-6 border-t border-border">
            See also our <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
