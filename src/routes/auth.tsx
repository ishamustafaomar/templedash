import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  const submit = async (mode: "signin" | "signup") => {
    setLoading(true); setErr(null);
    try {
      const fn = mode === "signin" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
      const { error } = await fn.call(supabase.auth, {
        email,
        password,
        ...(mode === "signup" ? { options: { emailRedirectTo: window.location.origin } } : {}),
      } as any);
      if (error) throw error;
      router.invalidate();
      navigate({ to: "/", replace: true });
    } catch (e: any) {
      setErr(e.message || "Auth failed");
    } finally { setLoading(false); }
  };

  const apple = async () => {
    setLoading(true); setErr(null);
    const result = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
    if (result.error) { setErr((result.error as Error).message); setLoading(false); return; }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl bg-card border border-border p-8 shadow-2xl">
        <h1 className="font-cinzel font-black text-4xl text-center text-primary text-glow-gold">Temple Dash</h1>
        <p className="text-center text-muted-foreground text-sm mt-1">Sign in to save your progress</p>

        <Button onClick={apple} disabled={loading} variant="outline" className="w-full mt-6 font-cinzel gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M16.365 1.43c0 1.14-.43 2.23-1.21 3.03-.83.86-2.18 1.52-3.3 1.43-.14-1.12.4-2.28 1.18-3.08.83-.86 2.27-1.5 3.33-1.38zM20.5 17.07c-.55 1.27-.82 1.84-1.54 2.96-1 1.56-2.42 3.5-4.18 3.52-1.56.02-1.96-1.02-4.08-1.01-2.12.01-2.56 1.03-4.12 1.01-1.76-.02-3.1-1.77-4.1-3.33C0.7 17.05.42 12.15 2.46 9.5c1.45-1.88 3.74-2.98 5.9-2.98 2.2 0 3.58 1.2 5.4 1.2 1.76 0 2.83-1.2 5.37-1.2 1.92 0 3.95 1.04 5.4 2.84-4.74 2.6-3.97 9.37 .0 7.71z"/></svg>
          Continue with Apple
        </Button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="space-y-3 mt-4">
            <Field id="e1" label="Email" value={email} onChange={setEmail} type="email" />
            <Field id="p1" label="Password" value={password} onChange={setPassword} type="password" />
            <Button onClick={() => submit("signin")} disabled={loading} className="w-full font-cinzel">Sign In</Button>
          </TabsContent>
          <TabsContent value="signup" className="space-y-3 mt-4">
            <Field id="e2" label="Email" value={email} onChange={setEmail} type="email" />
            <Field id="p2" label="Password (min 6 chars)" value={password} onChange={setPassword} type="password" />
            <Button onClick={() => submit("signup")} disabled={loading} className="w-full font-cinzel">Create Account</Button>
          </TabsContent>
        </Tabs>

        {err && <p className="mt-4 text-sm text-destructive text-center">{err}</p>}
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
