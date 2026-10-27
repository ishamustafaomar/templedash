import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — Temple Dash" },
      { name: "description", content: "Set a new password for your Temple Dash account." },
      { property: "og:title", content: "Reset password — Temple Dash" },
      { property: "og:description", content: "Set a new password for your Temple Dash account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY after the recovery link sets the session
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also check current session in case event already fired
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    setErr(null); setInfo(null);
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setErr("Passwords don't match."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setInfo("Password updated. Redirecting...");
    setTimeout(() => navigate({ to: "/", replace: true }), 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl bg-card border border-border p-8 shadow-2xl">
        <Link to="/auth" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3 h-3" /> Back to sign in
        </Link>
        <h1 className="font-cinzel font-black text-3xl text-center text-primary text-glow-gold mt-2">Reset password</h1>

        {!ready ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Open this page from the password reset email link to continue.
          </p>
        ) : (
          <div className="space-y-3 mt-6">
            <div>
              <Label htmlFor="np">New password</Label>
              <Input id="np" type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="cp">Confirm password</Label>
              <Input id="cp" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-1" />
            </div>
            <Button onClick={submit} disabled={loading} className="w-full font-cinzel">
              {loading ? "Updating..." : "Update password"}
            </Button>
          </div>
        )}

        {err && <p className="mt-4 text-sm text-destructive text-center">{err}</p>}
        {info && <p className="mt-4 text-sm text-primary text-center">{info}</p>}
      </div>
    </div>
  );
}
