import { useRef, useState } from "react";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle2, XCircle, Search, IdCard, DownloadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SunLogo } from "@/components/SunLogo";
import { IDCard as IDCardTemplate } from "@/components/IDCard";
import { generateIdCardPDF, safeFileName } from "@/lib/generatePDF";

type Application = {
  id: string;
  application_code: string;
  full_name: string;
  mobile: string;
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
};

export default function MyProfile() {
  const [mobile, setMobile] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [app, setApp] = useState<Application | null>(null);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim() || aadhaar.length !== 12) {
      toast.error("Enter mobile and 12-digit Aadhaar");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("id,application_code,full_name,mobile,email,district,block,panchayat,post,status,photo_url,admin_notes,approved_at,created_at")
      .eq("mobile", mobile.trim())
      .eq("aadhaar", aadhaar.trim())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLoading(false);
    setSearched(true);
    if (error) { toast.error(error.message); return; }
    setApp((data as Application) ?? null);
  };

  return (
    <>
      <Seo
        title="My Volunteer Profile — SLKF"
        description="Check your SLKF volunteer application status and download your Volunteer ID card."
        path="/my-profile"
      />

      <section className="gradient-warm">
        <div className="container-tight py-10 sm:py-14 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">My Volunteer Profile</h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Enter the mobile number and Aadhaar you used in your application to view your status and ID card.
          </p>
        </div>
      </section>

      <section className="container-tight py-8 sm:py-12">
        <Card className="max-w-md mx-auto shadow-warm">
          <CardHeader><CardTitle>Lookup your application</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={lookup} className="space-y-3">
              <div>
                <Label htmlFor="m">Mobile</Label>
                <Input id="m" inputMode="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9XXXXXXXXX" />
              </div>
              <div>
                <Label htmlFor="a">Aadhaar (12 digits)</Label>
                <Input id="a" inputMode="numeric" value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="123412341234" />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                <Search className="h-4 w-4" /> {loading ? "Checking…" : "Check status"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {searched && !app && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            No application found with those details. Please check your mobile and Aadhaar, or{" "}
            <a href="/apply" className="underline text-primary">submit a new application</a>.
          </p>
        )}

        {app && (
          <div className="max-w-2xl mx-auto mt-8">
            <StatusCard status={app.status} notes={app.admin_notes} />
            {app.status === "approved" || app.status === "active" ? (
              <VolunteerCard app={app} />
            ) : (
              <Card className="mt-4">
                <CardContent className="p-6 text-sm space-y-2">
                  <div className="font-semibold">Application: {app.application_code}</div>
                  <div className="text-muted-foreground">{app.full_name} · {app.post}</div>
                  <div className="text-muted-foreground">{app.panchayat}, {app.block}, {app.district}</div>
                  <div className="text-xs text-muted-foreground">Submitted {new Date(app.created_at).toLocaleString()}</div>
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
        className="mt-4 w-full sm:w-auto"
        size="lg"
      >
        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
        {downloading ? "Generating PDF…" : "Download Volunteer ID (PDF)"}
      </Button>

      <Card className="mt-4 overflow-hidden border-2 border-primary/40 shadow-warm">
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
                <div><span className="font-medium text-foreground">Mobile:</span> {app.mobile}</div>
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

      {/* Hidden printable ID card — rendered off-screen for html2canvas */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          pointerEvents: "none",
          opacity: 0,
        }}
      >
        <IDCardTemplate ref={cardRef} data={app} />
      </div>
    </>
  );
}
