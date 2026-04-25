import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Seo } from "@/components/Seo";
import { Loader2, LogIn, UserPlus } from "lucide-react";

const credSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(254),
  password: z.string().min(8, "Min 8 characters").max(72),
});

export default function Auth() {
  const { user, loading, isStaff } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "";
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (loading) return null;
  if (user) {
    const target = redirect || (isStaff ? "/admin" : "/my-profile");
    return <Navigate to={target} replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate(redirect || "/my-profile");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: { emailRedirectTo: `${window.location.origin}/my-profile` },
    });
    setBusy(false);
    if (error) return toast.error(error.message);

    // Bootstrap: very first signup attempts admin; RLS will block unless table is empty.
    if (data.user) {
      await supabase.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
    }
    toast.success("Account created. Please check your email to verify.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <Seo title="Sign in | SLKF" description="Sign in to your SLKF account." noIndex />
      <Card className="w-full max-w-md shadow-warm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to SLKF</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in with your email to access your profile.</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" type="email" autoComplete="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="si-pass">Password</Label>
                  <Input id="si-pass" type="password" autoComplete="current-password" value={password}
                    onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={busy} aria-busy={busy}>
                  {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
                        : <><LogIn className="h-4 w-4" /> Sign in</>}
                </Button>
                <div className="text-center">
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" autoComplete="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-pass">Password (min 8)</Label>
                  <Input id="su-pass" type="password" autoComplete="new-password" minLength={8} value={password}
                    onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={busy} aria-busy={busy}>
                  {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                        : <><UserPlus className="h-4 w-4" /> Create account</>}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Use the same email you used in your application to auto-link your profile.
                </p>
              </form>
            </TabsContent>
          </Tabs>
          <Link to="/" className="block text-center text-xs text-muted-foreground mt-4 hover:underline">
            ← Back to website
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
