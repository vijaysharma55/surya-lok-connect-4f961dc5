import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Clock, CheckCircle2, XCircle, IdCard, DownloadCloud, Loader2, LogOut, Mail } from "lucide-react";
import { toast } from "sonner";
import { SunLogo } from "@/components/SunLogo";
import { IDCard as IDCardTemplate } from "@/components/IDCard";
import { generateIdCardPDF, generateIdCardPNG, safeFileName } from "@/lib/generatePDF";
import confetti from "canvas-confetti";
import { maskAadhaar } from "@/lib/mask";

type Application = {
  id: string;
  application_code: string;
  full_name: string;
  mobile: string;
  aadhaar: string;
  email: string | null;
  district: string;
  block: string;
  panchayat: string;
  post: string;
  status: "pending" | "approved" | "active" | "rejected" | string;
  photo_url: string | null;
  admin_notes: string | null;
  approved_at: string | null;
  created_at: string;
  id_card_downloaded_at?: string | null;
};

function fireConfetti() {
  const end = Date.now() + 800;
  const colors = ["#f59e0b", "#ef4444", "#16a34a", "#ffffff"];
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export default function MyProfile() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<Application | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("applications")
        .select(
          "id,application_code,full_name,mobile,aadhaar,email,district,block,panchayat,post,status,photo_url,admin_notes,approved_at,created_at,id_card_downloaded_at",
        )
        .eq("claimed_by", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancel) return;
      if (error) toast.error(error.message);
      setApp((data as Application) ?? null);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [user, authLoading]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth?redirect=/my-profile" replace />;

  return (
    <>
      <Seo
        title="My Profile — SLKF"
        description="Your SLKF volunteer profile, status, and ID card."
        path="/my-profile"
        noIndex
      />

      <section className="gradient-warm">
        <div className="container-tight py-10 sm:py-14">
          <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">My Profile</h1>
              <p className="mt-2 text-muted-foreground text-sm sm:text-base inline-flex items-center gap-2">
                <Mail className="h-4 w-4" /> {user.email}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => signOut()} className="gap-2">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </section>

      <section className="container-tight py-8 sm:py-12">
        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !app ? (
          <Card className="max-w-md mx-auto shadow-warm">
            <CardHeader><CardTitle>No application linked</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                We couldn't find an application tied to <span className="font-medium text-foreground">{user.email}</span>.
              </p>
              <p>
                If you applied with a different email, please use that email to sign in. Otherwise, submit a new application below.
              </p>
              <Button asChild className="w-full mt-2">
                <Link to="/apply">Apply now</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            <StatusCard status={app.status} notes={app.admin_notes} />
            {app.status === "approved" || app.status === "active" ? (
              <VolunteerCard app={app} />
            ) : (
              <Card>
                <CardContent className="p-6 text-sm space-y-2">
                  <div className="font-semibold">Application: {app.application_code}</div>
                  <div className="text-muted-foreground">{app.full_name} · {app.post}</div>
                  <div className="text-muted-foreground">{app.panchayat}, {app.block}, {app.district}</div>
                  <div className="text-xs text-muted-foreground">
                    Aadhaar: <span className="font-mono">{maskAadhaar(app.aadhaar)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Submitted {new Date(app.created_at).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </section>
    </>
  );
}

function StatusCard({ status, notes }: { status: string; notes: string | null }) {
  if (status === "approved" || status === "active") {
    return (
      <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
        <div>
          <div className="font-semibold text-green-800 dark:text-green-300">Approved — your Volunteer ID is active</div>
          <div className="text-xs text-muted-foreground">Welcome to the SLKF coordinator team.</div>
        </div>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex items-start gap-3">
        <XCircle className="h-5 w-5 text-destructive mt-0.5" />
        <div>
          <div className="font-semibold text-destructive">Application rejected</div>
          <div className="text-xs text-muted-foreground">{notes || "Please contact our team for details."}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 flex items-start gap-3">
      <Clock className="h-5 w-5 text-yellow-700 mt-0.5" />
      <div>
        <div className="font-semibold text-yellow-800 dark:text-yellow-300">Payment verification in progress</div>
        <div className="text-xs text-muted-foreground">Your profile will be active within 24 hours.</div>
      </div>
    </div>
  );
}

function VolunteerCard({ app }: { app: Application }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      await generateIdCardPDF(cardRef.current, safeFileName(app.full_name));
      toast.success("ID Card Downloaded Successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleDownload}
        disabled={downloading}
        aria-busy={downloading}
        aria-live="polite"
        className="w-full sm:w-auto gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        size="lg"
      >
        {downloading ? (
          <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /><span>Generating PDF…</span></>
        ) : (
          <><DownloadCloud className="h-4 w-4" aria-hidden /><span>Download Volunteer ID (PDF)</span></>
        )}
      </Button>

      <Card className="overflow-hidden border-2 border-primary/40 shadow-warm">
        <div className="bg-foreground text-background px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SunLogo size={22} />
            <span className="text-xs font-bold tracking-wider">SLKF · VOLUNTEER ID</span>
          </div>
          <Badge variant="outline" className="bg-green-500/15 text-green-300 border-green-400/40">Active</Badge>
        </div>
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="h-24 w-20 sm:h-28 sm:w-24 rounded-md border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
              {app.photo_url ? (
                <img src={app.photo_url} alt={app.full_name} className="h-full w-full object-cover" />
              ) : (
                <IdCard className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold text-foreground truncate">{app.full_name}</div>
              <div className="text-sm text-secondary font-semibold">{app.post}</div>
              <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                <div><span className="font-medium text-foreground">District:</span> {app.district}</div>
                <div><span className="font-medium text-foreground">Block:</span> {app.block}</div>
                <div><span className="font-medium text-foreground">Panchayat:</span> {app.panchayat}</div>
                <div><span className="font-medium text-foreground">Aadhaar:</span> <span className="font-mono">{maskAadhaar(app.aadhaar)}</span></div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
            <div className="font-mono font-semibold">{app.application_code}</div>
            <div className="text-muted-foreground">
              Approved {app.approved_at ? new Date(app.approved_at).toLocaleDateString() : "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      <div
        aria-hidden
        style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none", opacity: 0 }}
      >
        <IDCardTemplate ref={cardRef} data={app} />
      </div>
    </>
  );
}
