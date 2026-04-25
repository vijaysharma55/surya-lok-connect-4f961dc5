import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const FROM = "SLKF <onboarding@resend.dev>";
const APP_URL = "https://surya-lok-connect.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const applicationId = String(body.applicationId ?? "").trim();
    if (!applicationId) {
      return new Response(JSON.stringify({ error: "applicationId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin check
    const userId = claims.claims.sub;
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select("id, application_code, full_name, email, status")
      .eq("id", applicationId)
      .maybeSingle();

    if (appErr || !app) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!app.email) {
      return new Response(JSON.stringify({ ok: true, skipped: "no email" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verifyUrl = `${APP_URL}/verify/${app.application_code}`;
    const profileUrl = `${APP_URL}/my-profile`;

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
        <div style="text-align:center;padding:18px 0;background:linear-gradient(90deg,#f59e0b,#ef4444);border-radius:12px;color:#fff">
          <div style="font-weight:800;letter-spacing:1px;font-size:18px">SURYA LOK KALYAN FOUNDATION</div>
          <div style="font-size:12px;opacity:.9;margin-top:4px">Volunteer ID Approved</div>
        </div>
        <h2 style="margin-top:24px">Congratulations, ${escapeHtml(app.full_name)} 🎉</h2>
        <p>Your application has been <b style="color:#15803d">approved</b>. Your Volunteer ID is now active.</p>
        <p><b>Member ID:</b> <span style="font-family:monospace">${escapeHtml(app.application_code)}</span></p>
        <p style="margin:24px 0">
          <a href="${profileUrl}" style="background:#f59e0b;color:#fff;padding:12px 18px;text-decoration:none;border-radius:8px;font-weight:700">Download your ID Card</a>
        </p>
        <p style="font-size:13px;color:#475569">Anyone can verify your ID at:<br/>
          <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <p style="font-size:12px;color:#64748b">If you didn't expect this email, you can safely ignore it.</p>
      </div>
    `;

    const r = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: FROM,
        to: [app.email],
        subject: `🎉 Your SLKF Volunteer ID ${app.application_code} is approved`,
        html,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      throw new Error(`Resend ${r.status}: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ ok: true, id: data.id ?? null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-approval-email error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
