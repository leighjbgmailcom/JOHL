// =========================================
// JORDAN OLDTIMERS HOCKEY LEAGUE
// Invite somebody who isn't a player
// =========================================
//
// The Admin page invites players from the roster. This is for the people
// who need a login but aren't on a roster -- a timekeeper, say. It sends
// the same invitation email (set a password at accept-invite.html).
//
// Like send-recap-email, it is never called from the website: the
// database calls it (private.invite_staff, see
// supabase-migrations/006_invite_staff.sql) and proves who it is with the
// shared secret in the locked app_config table, which is why "verify
// JWT" is OFF for this function.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REDIRECT_TO = "https://jordanohl.ca/accept-invite.html";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sameText(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: secretRow } = await admin
    .from("app_config")
    .select("value")
    .eq("key", "recap_email_secret")
    .maybeSingle();

  const given = req.headers.get("x-recap-secret") || "";
  if (!secretRow?.value || !sameText(given, secretRow.value)) {
    return json({ error: "Not allowed" }, 401);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch (_) {
    return json({ error: "Bad request" }, 400);
  }

  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "That doesn't look like an email address" }, 400);

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: REDIRECT_TO });

  if (error) return json({ error: error.message }, 422);

  return json({ ok: true, user_id: data?.user?.id || null, invited_at: data?.user?.invited_at || null });
});
