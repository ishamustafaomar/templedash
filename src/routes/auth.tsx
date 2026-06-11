import { createFileRoute, useNavigate, useRouter, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — Temple Dash" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  const submit = async (mode: "signin" | "signup") => {
    setLoading(true); setErr(null); setInfo(null);
    try {
      if (!email || !password) throw new Error("Enter your email and password.");
      if (mode === "signup" && password.length < 6) throw new Error("Password must be at least 6 characters.");
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo("Account created. Check your email to confirm, then sign in.");
          setLoading(false);
          return;
        }
      }
      router.invalidate();
      navigate({ to: "/", replace: true });
    } catch (e: any) {
      setErr(e?.message || "Auth failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl bg-card border border-border p-8 shadow-2xl">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3 h-3" /> Back to game
        </Link>
        <h1 className="font-cinzel font-black text-4xl text-center text-primary text-glow-gold mt-2">Temple Dash</h1>
        <p className="text-center text-muted-foreground text-sm mt-1">
          Sign in to back up your progress to the cloud
        </p>

        <Tabs defaultValue="signin" className="mt-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="space-y-3 mt-4">
            <Field id="e1" label="Email" value={email} onChange={setEmail} type="email" />
            <Field id="p1" label="Password" value={password} onChange={setPassword} type="password" />
            <Button onClick={() => submit("signin")} disabled={loading} className="w-full font-cinzel">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </TabsContent>
          <TabsContent value="signup" className="space-y-3 mt-4">
            <Field id="e2" label="Email" value={email} onChange={setEmail} type="email" />
            <Field id="p2" label="Password (min 6 chars)" value={password} onChange={setPassword} type="password" />
            <Button onClick={() => submit("signup")} disabled={loading} className="w-full font-cinzel">
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </TabsContent>
        </Tabs>

        {err && <p className="mt-4 text-sm text-destructive text-center">{err}</p>}
        {info && <p className="mt-4 text-sm text-primary text-center">{info}</p>}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Don't want an account?{" "}
          <Link to="/" className="text-primary hover:underline">Play as guest</Link>
          {" "}— your progress saves on this device.
        </p>
      </div>
    </div>
  );
}

function Field({ id, label, value, onChange, type }: { id: string; label: string; value: string; onChange: (v: string) => void; type: string; }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} className="mt-1" />
    </div>
  );
}
