import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Seo } from "@/components/Seo";
import { Loader2, Mail } from "lucide-react";

const schema = z.object({ email: z.string().trim().email("Enter a valid email").max(254) });

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Reset link sent. Check your inbox.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <Seo title="Forgot password | SLKF" description="Reset your SLKF account password." noIndex />
      <Card className="w-full max-w-md shadow-warm">
        <CardHeader className="text-center">
          <CardTitle>Forgot password?</CardTitle>
          <p className="text-sm text-muted-foreground">We'll email you a secure reset link.</p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-sm text-center space-y-3">
              <Mail className="h-8 w-8 text-primary mx-auto" />
              <p>If an account exists for <span className="font-medium">{email}</span>, a reset link is on its way.</p>
              <Button asChild variant="outline" className="w-full"><Link to="/auth">Back to sign in</Link></Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={busy} aria-busy={busy}>
                {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Send reset link"}
              </Button>
              <Link to="/auth" className="block text-center text-xs text-muted-foreground hover:underline">
                ← Back to sign in
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
