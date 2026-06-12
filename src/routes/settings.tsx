import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — Temple Dash" },
      { name: "description", content: "Manage your Temple Dash account, sign out, or permanently delete your cloud-save data." },
      { property: "og:title", content: "Settings — Temple Dash" },
      { property: "og:description", content: "Manage your Temple Dash account or delete your cloud-save data." },
      { property: "og:url", content: "https://templedash.fun/settings" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const deleteAccount = useServerFn(deleteMyAccount);
  const [email, setEmail] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate({ to: "/auth", search: { redirect: "/settings" }, replace: true });
        return;
      }
      setEmail(data.user.email ?? null);
    });
  }, [navigate]);

  const onDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
      await supabase.auth.signOut();
      navigate({ to: "/", replace: true });
    } catch (e: any) {
      setError(e?.message || "Failed to delete account.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to game
        </Link>
        <h1 className="font-cinzel font-bold text-3xl mt-4">Settings</h1>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-cinzel font-bold text-lg">Account</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Signed in as <span className="text-foreground">{email ?? "…"}</span>
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/", replace: true });
            }}
          >
            Sign out
          </Button>
        </section>

        <section className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h2 className="font-cinzel font-bold text-lg text-destructive">Delete account</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete your account, cloud progress, upgrades, and purchase history.
                This action cannot be undone. Any unspent coins will be forfeited.
              </p>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="mt-4">Delete my account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will erase your profile, high score, coins, upgrades, and purchase
                      history from our servers. You will be signed out immediately. This cannot
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-2">
                    <Label htmlFor="confirm">Type <span className="font-mono font-bold">DELETE</span> to confirm</Label>
                    <Input
                      id="confirm"
                      autoComplete="off"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE"
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={busy} onClick={() => setConfirmText("")}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      disabled={busy || confirmText !== "DELETE"}
                      onClick={(e) => { e.preventDefault(); onDelete(); }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {busy ? "Deleting…" : "Delete forever"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <p className="text-xs text-muted-foreground mt-3">
                Prefer to do this from a browser? You can also request deletion at{" "}
                <Link to="/privacy" className="text-primary underline">our privacy page</Link>.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          {" · "}
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
        </p>
      </div>
    </div>
  );
}
