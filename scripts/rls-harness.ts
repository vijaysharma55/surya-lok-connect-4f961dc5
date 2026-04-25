/**
 * RLS Test Harness — exercises key flows as anon / authenticated user / admin
 * and reports which policy (if any) blocked each step.
 *
 * Run:  bun scripts/rls-harness.ts
 *
 * Requires env: SUPABASE_URL, VITE_SUPABASE_ANON_KEY (or SUPABASE_PUBLISHABLE_KEY),
 *               SUPABASE_SERVICE_ROLE_KEY.
 *
 * SAFE: every row inserted is tagged and cleaned up at the end via service role.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const ANON =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!URL || !ANON || !SERVICE) {
  console.error("Missing env vars (SUPABASE_URL / ANON / SERVICE_ROLE).");
  process.exit(1);
}

const TAG = `rls-harness-${Date.now()}`;
const RUN_ID = Math.random().toString(36).slice(2, 8);

type Result = {
  flow: string;
  actor: "anon" | "user" | "admin";
  expected: "allow" | "deny";
  actual: "allow" | "deny";
  pass: boolean;
  policy: string;
  error?: string;
};
const results: Result[] = [];

function record(r: Result) {
  results.push(r);
  const icon = r.pass ? "✅" : "❌";
  console.log(
    `${icon} [${r.actor.padEnd(5)}] ${r.flow.padEnd(38)} expected=${r.expected} actual=${r.actual}  ${r.policy}${r.error ? `\n     → ${r.error}` : ""}`,
  );
}

const isRlsError = (e: any) =>
  !!e &&
  (e.code === "42501" ||
    /row-level security|violates row-level security/i.test(e.message ?? ""));

// ---------- Setup helpers ----------
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

async function makeUser(label: string) {
  const email = `${label}+${RUN_ID}@harness.test`;
  const password = `Pw_${RUN_ID}_${label}!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
  if (signInErr) throw signInErr;
  return { client, userId: data.user!.id, email };
}

async function grantAdmin(userId: string) {
  const { error } = await admin
    .from("user_roles")
    .insert({ user_id: userId, role: "admin" });
  if (error) throw error;
}

const baseAppRow = (overrides: Record<string, any> = {}) => ({
  full_name: `Harness ${RUN_ID}`,
  mobile: "9999999999",
  aadhaar: "111122223333",
  district: "TestDistrict",
  block: "TestBlock",
  panchayat: "TestPanchayat",
  post: "Panchayat Coordinator",
  transaction_id: `TXN-${RUN_ID}`,
  payment_screenshot_url: `https://example.com/${TAG}.png`,
  status: "pending",
  admin_notes: TAG, // marker for cleanup
  ...overrides,
});

// ---------- Test runners ----------
async function testInsert(
  client: SupabaseClient,
  actor: Result["actor"],
  expected: Result["expected"],
  policy: string,
  overrides: Record<string, any> = {},
) {
  const flow = `INSERT applications`;
  const { data, error } = await client
    .from("applications")
    .insert(baseAppRow(overrides))
    .select("id")
    .maybeSingle();
  const actual: Result["actual"] = error ? "deny" : "allow";
  record({
    flow,
    actor,
    expected,
    actual,
    pass: actual === expected,
    policy,
    error: error?.message,
  });
  return data?.id as string | undefined;
}

async function testApproval(
  client: SupabaseClient,
  actor: Result["actor"],
  expected: Result["expected"],
  policy: string,
  appId: string,
) {
  const flow = `UPDATE applications status→approved`;
  const { error, data } = await client
    .from("applications")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", appId)
    .select("id");
  const denied = !!error || !data || data.length === 0;
  const actual: Result["actual"] = denied ? "deny" : "allow";
  record({
    flow,
    actor,
    expected,
    actual,
    pass: actual === expected,
    policy,
    error: error?.message ?? (denied ? "no rows updated (silent RLS filter)" : undefined),
  });
}

async function testIdDownload(
  client: SupabaseClient,
  actor: Result["actor"],
  expected: Result["expected"],
  policy: string,
  appId: string,
) {
  const flow = `UPDATE applications id_card_downloaded_at`;
  const { error, data } = await client
    .from("applications")
    .update({ id_card_downloaded_at: new Date().toISOString() })
    .eq("id", appId)
    .select("id");
  const denied = !!error || !data || data.length === 0;
  const actual: Result["actual"] = denied ? "deny" : "allow";
  record({
    flow,
    actor,
    expected,
    actual,
    pass: actual === expected,
    policy,
    error: error?.message ?? (denied ? "no rows updated (silent RLS filter)" : undefined),
  });
}

// ---------- Main ----------
async function main() {
  console.log(`\n— RLS Harness run ${RUN_ID} —\n`);

  // Actors
  const anon = createClient(URL, ANON, { auth: { persistSession: false } });
  const owner = await makeUser("owner");
  const stranger = await makeUser("stranger");
  const adminUser = await makeUser("admin");
  await grantAdmin(adminUser.userId);
  // Refresh session so JWT picks up the new role (has_role queries DB anyway, but be safe)
  await adminUser.client.auth.refreshSession();

  console.log("Actors ready: anon, owner, stranger, admin\n");

  // 1. INSERT — anon allowed (Public submits bounded application)
  const anonAppId = await testInsert(
    anon,
    "anon",
    "allow",
    "Public submits bounded application",
    { email: owner.email },
  );

  // 1b. INSERT with bad bounds — should DENY
  await testInsert(
    anon,
    "anon",
    "deny",
    "Public submits bounded application (length check)",
    { email: owner.email, full_name: "x" }, // fails 2..120 bound
  );

  // 1c. INSERT trying to self-approve — should DENY (status must be 'pending')
  await testInsert(
    anon,
    "anon",
    "deny",
    "Public submits bounded application (status=pending)",
    { email: owner.email, status: "approved" },
  );

  if (!anonAppId) {
    console.log("\n⚠️  Could not create base application; aborting remaining tests.");
    return finish();
  }

  // The trigger claim_application_on_insert should set claimed_by = owner.userId
  // because we passed owner.email. Verify:
  const { data: claimedRow } = await admin
    .from("applications")
    .select("claimed_by")
    .eq("id", anonAppId)
    .single();
  console.log(
    `\nℹ️  application.claimed_by = ${claimedRow?.claimed_by ?? "NULL"} (owner=${owner.userId})\n`,
  );

  // 2. ID download update — owner ALLOW, stranger DENY, anon DENY
  await testIdDownload(owner.client, "user", "allow", "Owners mark id_card_downloaded", anonAppId);
  await testIdDownload(stranger.client, "user", "deny", "Owners mark id_card_downloaded", anonAppId);
  await testIdDownload(anon, "anon", "deny", "Owners mark id_card_downloaded (anon blocked)", anonAppId);

  // 3. Approval update — admin ALLOW, stranger DENY, anon DENY
  await testApproval(adminUser.client, "admin", "allow", "Admins update applications", anonAppId);
  await testApproval(stranger.client, "user", "deny", "Admins/Coordinators update applications", anonAppId);
  await testApproval(anon, "anon", "deny", "Admins update applications (anon blocked)", anonAppId);

  await finish();
}

function toCsv(rows: Result[]) {
  const header = ["flow", "actor", "expected", "actual", "pass", "policy", "error"];
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    header.join(","),
    ...rows.map((r) => header.map((h) => esc((r as any)[h])).join(",")),
  ].join("\n");
}

async function uploadReport(report: any, csv: string) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const base = `rls-reports/${ts}`;
  const json = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const csvBlob = new Blob([csv], { type: "text/csv" });
  const a = await admin.storage.from("documents").upload(`${base}/report.json`, json, {
    contentType: "application/json",
    upsert: true,
  });
  const b = await admin.storage.from("documents").upload(`${base}/report.csv`, csvBlob, {
    contentType: "text/csv",
    upsert: true,
  });
  // Latest pointer
  const c = await admin.storage.from("documents").upload(`rls-reports/latest.json`, json, {
    contentType: "application/json",
    upsert: true,
  });
  if (a.error || b.error || c.error) {
    console.log("upload errors:", a.error?.message, b.error?.message, c.error?.message);
  } else {
    console.log(`📤 Uploaded report to documents/${base}/`);
  }
}

async function finish() {
  // Cleanup: delete tagged rows + harness users
  console.log("\n— Cleanup —");
  const { error: delErr } = await admin.from("applications").delete().eq("admin_notes", TAG);
  if (delErr) console.log("cleanup applications:", delErr.message);

  const { data: users } = await admin.auth.admin.listUsers();
  for (const u of users?.users ?? []) {
    if (u.email?.includes(`+${RUN_ID}@harness.test`)) {
      await admin.from("user_roles").delete().eq("user_id", u.id);
      await admin.auth.admin.deleteUser(u.id);
    }
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  const report = {
    run_id: RUN_ID,
    generated_at: new Date().toISOString(),
    total: results.length,
    passed,
    failed,
    results,
  };
  const csv = toCsv(results);
  await uploadReport(report, csv);

  console.log(`\n— Summary — ${passed} passed, ${failed} failed (of ${results.length})`);
  if (failed > 0) {
    console.log("\nFailures:");
    for (const r of results.filter((x) => !x.pass)) {
      console.log(`  • [${r.actor}] ${r.flow}  expected=${r.expected} got=${r.actual}  → ${r.policy}`);
      if (r.error) console.log(`      ${r.error}`);
    }
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  finish();
});
