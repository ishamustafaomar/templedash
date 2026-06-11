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

  const google = async () => {
    setLoading(true); setErr(null);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { setErr((result.error as Error).message); setLoading(false); return; }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl bg-card border border-border p-8 shadow-2xl">
        <h1 className="font-cinzel font-black text-4xl text-center text-primary text-glow-gold">Temple Dash</h1>
        <p className="text-center text-muted-foreground text-sm mt-1">Sign in to save your progress</p>

        <Button onClick={google} disabled={loading} variant="outline" className="w-full mt-6 font-cinzel">
          Continue with Google
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
