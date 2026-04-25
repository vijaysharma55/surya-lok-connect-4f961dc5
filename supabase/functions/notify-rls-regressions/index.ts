import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type DiffRow = {
  status:
    | "regression"
    | "fixed"
    | "still-failing"
    | "added"
    | "removed"
    | "unchanged";
  flow: string;
  actor: string;
  expected: string;
  base?: { actual: string; pass: boolean; policy?: string; error?: string };
  head?: { actual: string; pass: boolean; policy?: string; error?: string };
};

type Payload = {
  base_run_id: string;
  head_run_id: string;
  base_generated_at?: string;
  head_generated_at?: string;
  diff: DiffRow[];
  triggered_by?: "auto" | "manual";
  triggered_by_email?: string;
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmail(p: Payload, regressions: DiffRow[], stillFailing: DiffRow[]) {
  const rows = regressions
    .map(
      (r) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;font-family:monospace">${escapeHtml(r.actor)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(r.flow)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">expected <b>${escapeHtml(r.expected)}</b>, got <b>${escapeHtml(r.head?.actual ?? "?")}</b></td>
        <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(r.head?.policy ?? "—")}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#b91c1c;font-size:12px">${escapeHtml(r.head?.error ?? "")}</td>
      </tr>`,
    )
    .join("");

  const subject = `🚨 RLS regressions: ${regressions.length} flow${regressions.length === 1 ? "" : "s"} now failing (${p.head_run_id})`;
  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:720px;margin:0 auto;color:#0f172a">
      <h2 style="color:#b91c1c;margin:0 0 8px">🚨 RLS regressions detected</h2>
      <p style="margin:0 0 16px;color:#475569">
        Compared <code>${escapeHtml(p.base_run_id)}</code> → <code>${escapeHtml(p.head_run_id)}</code>
        ${p.triggered_by === "manual" && p.triggered_by_email ? `· triggered by ${escapeHtml(p.triggered_by_email)}` : "· auto-triggered after harness run"}
      </p>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-bottom:16px">
        <strong>${regressions.length}</strong> regression${regressions.length === 1 ? "" : "s"} (PASS → FAIL)
        · <strong>${stillFailing.length}</strong> still failing
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f8fafc;text-align:left">
            <th style="padding:8px;border-bottom:2px solid #e2e8f0">Actor</th>
            <th style="padding:8px;border-bottom:2px solid #e2e8f0">Flow</th>
            <th style="padding:8px;border-bottom:2px solid #e2e8f0">Outcome</th>
            <th style="padding:8px;border-bottom:2px solid #e2e8f0">Likely policy</th>
            <th style="padding:8px;border-bottom:2px solid #e2e8f0">Error</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <p style="margin-top:24px;font-size:12px;color:#64748b">
        Open the <strong>Admin → RLS Reports</strong> page to view the full diff.
      </p>
    </div>`;
  const text =
    `RLS regressions detected\n` +
    `Base: ${p.base_run_id}\nHead: ${p.head_run_id}\n` +
    `${regressions.length} regression(s), ${stillFailing.length} still failing.\n\n` +
    regressions
      .map(
        (r) =>
          `- [${r.actor}] ${r.flow} — expected ${r.expected}, got ${r.head?.actual} (policy: ${r.head?.policy ?? "—"})`,
      )
      .join("\n");
  return { subject, html, text };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!LOVABLE_API_KEY || !RESEND_API_KEY)
    return json({ error: "Email connector not configured" }, 500);
  if (!SUPABASE_URL || !SERVICE_ROLE)
    return json({ error: "Supabase env missing" }, 500);

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body || !Array.isArray(body.diff) || !body.head_run_id || !body.base_run_id) {
    return json({ error: "Missing base_run_id, head_run_id, or diff[]" }, 400);
  }

  const regressions = body.diff.filter((d) => d.status === "regression");
  const stillFailing = body.diff.filter((d) => d.status === "still-failing");

  if (regressions.length === 0) {
    return json({ ok: true, sent: 0, message: "No regressions; no email sent." });
  }

  // Look up admin emails via service role
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: roleRows, error: rolesErr } = await sb
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  if (rolesErr) return json({ error: `roles query failed: ${rolesErr.message}` }, 500);
  const userIds = (roleRows ?? []).map((r: any) => r.user_id);
  if (userIds.length === 0) return json({ ok: true, sent: 0, message: "No admins to notify" });

  const { data: profiles, error: profErr } = await sb
    .from("profiles")
    .select("id,email")
    .in("id", userIds);
  if (profErr) return json({ error: `profiles query failed: ${profErr.message}` }, 500);
  const recipients = Array.from(
    new Set(
      (profiles ?? [])
        .map((p: any) => (p.email ?? "").trim().toLowerCase())
        .filter((e: string) => e && /.+@.+\..+/.test(e)),
    ),
  );
  if (recipients.length === 0) return json({ ok: true, sent: 0, message: "No admin emails on file" });

  const { subject, html, text } = buildEmail(body, regressions, stillFailing);

  const resp = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "SLKF RLS Monitor <onboarding@resend.dev>",
      to: recipients,
      subject,
      html,
      text,
    }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("Resend error", resp.status, data);
    return json({ error: `Resend ${resp.status}`, details: data }, 502);
  }

  return json({
    ok: true,
    sent: recipients.length,
    recipients,
    regressions: regressions.length,
    still_failing: stillFailing.length,
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
