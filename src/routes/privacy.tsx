import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Temple Dash" },
      { name: "description", content: "How Temple Dash collects, uses, and protects your data." },
      { property: "og:title", content: "Privacy Policy — Temple Dash" },
      { property: "og:description", content: "How Temple Dash collects, uses, and protects your data." },
      { property: "og:url", content: "https://templedash.fun/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://templedash.fun/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const updated = "June 11, 2026";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to game
        </Link>
        <h1 className="font-cinzel font-bold text-4xl mt-4">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mt-1">Last updated: {updated}</p>

        <div className="prose prose-invert mt-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold">Summary</h2>
            <p>
              Temple Dash is a single-player game. We collect the minimum data needed to save your
              progress to the cloud. We don't sell your data and we don't
              run third-party advertising or behavioral tracking.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">What we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account:</strong> email address and a unique user ID when you sign up.</li>
              <li><strong>Game progress:</strong> high score, total coins, upgrade levels, and unlocked perks.</li>
              <li>
                <strong>Crash diagnostics:</strong> if the app errors, we log the error message and
                stack trace to fix the bug. No personal content is included.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">How we use it</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sync your progress across devices when you sign in.</li>
              <li>Diagnose and fix crashes.</li>
              <li>Comply with tax, accounting, and fraud-prevention requirements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Third-party processors</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase</strong> — authentication and database hosting.</li>
              <li><strong>Stripe</strong> — payment processing for coin purchases.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Your rights</h2>
            <p>
              You can delete your account at any time from{" "}
              <Link to="/settings" className="text-primary underline">Settings</Link>. Deletion removes
              your profile, progress, and purchase history from our systems.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Children</h2>
            <p>Temple Dash is not directed at children under 13 and we do not knowingly collect their data.</p>
          </section>


          <p className="text-xs text-muted-foreground pt-6 border-t border-border">
            See also our <Link to="/terms" className="text-primary underline">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
