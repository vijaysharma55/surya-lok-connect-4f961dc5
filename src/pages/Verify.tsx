import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { SunLogo } from "@/components/SunLogo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Clock, ShieldCheck, IdCard, Loader2 } from "lucide-react";

type VerifyData = {
  application_code: string;
  full_name: string;
  post: string;
  district: string;
  status: string;
  photo_url: string | null;
  approved_at: string | null;
};

export default function Verify() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerifyData | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!id) { setLoading(false); return; }

      // Best-effort rate limit: 30 lookups / minute / id
      const { data: rl } = await supabase.rpc("rate_limit_hit", {
        p_key: `verify:${id}`,
        p_max: 30,
      });
      const allowed = Array.isArray(rl) ? rl[0]?.allowed !== false : true;
      if (!allowed) {
        if (!cancel) { setRateLimited(true); setLoading(false); }
        return;
      }

      const { data: rows } = await supabase.rpc("public_verify_id", { p_id: id });
      const row = Array.isArray(rows) && rows.length ? rows[0] : null;
      if (!cancel) {
        setData((row as VerifyData) ?? null);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [id]);

  const isActive = data && (data.status === "approved" || data.status === "active");
  const isRejected = data?.status === "rejected";

  return (
    <>
      <Seo
        title={data ? `Verify ${data.full_name} — SLKF` : "Verify Volunteer ID — SLKF"}
        description="Public verification of a Surya Lok Kalyan Foundation Volunteer ID."
        path={`/verify/${id ?? ""}`}
      />

      <section className="gradient-warm">
        <div className="container-tight py-10 sm:py-14 text-center">
          <div className="flex items-center justify-center gap-2">
            <SunLogo size={28} />
            <span className="text-xs font-bold tracking-widest uppercase text-secondary">
              SLKF · ID Verification
            </span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-foreground">
            Volunteer ID Verification
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            This page confirms whether the scanned Volunteer ID is genuine and currently active.
          </p>
        </div>
      </section>

      <section className="container-tight py-8 sm:py-12">
        <Card className="max-w-md mx-auto shadow-warm">
          <CardContent className="p-6">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Verifying ID…</span>
              </div>
            ) : rateLimited ? (
              <RateLimitedState />
            ) : !data ? (
              <NotFoundState code={id ?? ""} />
            ) : (
              <div className="space-y-5">
                <StatusBanner status={data.status} />

                <div className="flex items-start gap-4">
                  <div className="h-24 w-20 sm:h-28 sm:w-24 rounded-md border-2 border-secondary/40 bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                    {data.photo_url ? (
                      <img
                        src={data.photo_url}
                        alt={data.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <IdCard className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-bold text-foreground leading-tight">
                      {data.full_name}
                    </div>
                    <div className="text-sm font-semibold text-secondary mt-0.5">
                      {data.post}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      <span className="font-medium text-foreground">District:</span> {data.district}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/40 p-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground uppercase tracking-wide text-[10px]">
                      Application Code
                    </div>
                    <div className="font-mono font-semibold text-foreground mt-0.5 break-all">
                      {data.application_code}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground uppercase tracking-wide text-[10px]">
                      {isActive ? "Approved On" : "Status"}
                    </div>
                    <div className="font-semibold text-foreground mt-0.5">
                      {isActive
                        ? (data.approved_at
                            ? new Date(data.approved_at).toLocaleDateString("en-IN", {
                                day: "2-digit", month: "short", year: "numeric",
                              })
                            : "—")
                        : data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-border bg-background p-3 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <p>
                    Personal details such as mobile number and Aadhaar are never shown publicly.
                    {isActive
                      ? " This volunteer is officially recognised by SLKF."
                      : isRejected
                        ? " This Volunteer ID is not valid. Please report misuse to our office."
                        : " This Volunteer ID is awaiting verification by our office."}
                  </p>
                </div>

                <Button asChild variant="outline" className="w-full">
                  <Link to="/">Back to SLKF home</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function StatusBanner({ status }: { status: string }) {
  if (status === "approved" || status === "active") {
    return (
      <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-3 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <div className="flex-1">
          <div className="font-semibold text-green-800 dark:text-green-300 text-sm">
            Verified Active Volunteer
          </div>
          <div className="text-[11px] text-muted-foreground">
            This ID is genuine and currently active.
          </div>
        </div>
        <Badge className="bg-green-600 hover:bg-green-600 text-white">Active</Badge>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 flex items-center gap-3">
        <XCircle className="h-5 w-5 text-destructive" />
        <div className="flex-1">
          <div className="font-semibold text-destructive text-sm">ID Not Valid</div>
          <div className="text-[11px] text-muted-foreground">
            This application was rejected and the ID is not authorised.
          </div>
        </div>
        <Badge variant="destructive">Rejected</Badge>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3 flex items-center gap-3">
      <Clock className="h-5 w-5 text-yellow-700" />
      <div className="flex-1">
        <div className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">
          Verification In Progress
        </div>
        <div className="text-[11px] text-muted-foreground">
          This application is still under review.
        </div>
      </div>
      <Badge variant="secondary">Pending</Badge>
    </div>
  );
}

function NotFoundState({ code }: { code: string }) {
  return (
    <div className="text-center py-6 space-y-3">
      <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
        <XCircle className="h-6 w-6" />
      </div>
      <div className="font-semibold text-foreground">No matching ID found</div>
      <p className="text-xs text-muted-foreground">
        We couldn't find a volunteer with code <span className="font-mono">{code}</span>.
        Please re-scan the QR or contact our office.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  );
}
