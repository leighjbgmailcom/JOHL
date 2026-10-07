// =========================================
// JORDAN OLDTIMERS HOCKEY LEAGUE
// Rinkside Report email
// =========================================
//
// Emails the link to a weekly recap (recaps.html?date=...) through
// Resend. It is never called from the website: the database calls it
// (private.send_recap_email, see supabase-migrations/005_recap_email.sql)
// and proves who it is with a shared secret kept in the locked
// app_config table. That is why "verify JWT" is OFF for this function --
// the secret check below is the lock on the door instead.
//
// What it will do, by "mode":
//
//   info  - sends nothing. Says whether the Resend key is there and which
//           sending domains Resend has verified.
//   test  - sends the recap email to ONE address, and only if that address
//           belongs to a league admin's login.
//   all   - sends it to every player on the active season with an email
//           on file. It has to say who in the league approved it
//           (approved_by), the recap has to be published (not a draft),
//           and app_config.recap_email_all_enabled has to be 'true'.
//           Everyone it reaches is written down, so running it again for
//           the same recap only sends to whoever was missed (say, because
//           the day's email allowance ran out) -- nobody gets it twice
//           unless force is set.
//
// A recap marked "draft": true in recaps.json isn't on the public Recaps
// page yet. A test email for a draft links to its preview
// (recaps.html?date=...&preview).
//
// Needs the Edge Function secret RESEND_API_KEY.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SITE = "https://jordanohl.ca";
const RESEND = "https://api.resend.com";

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

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// The Resend key, under whichever name it was saved.
function resendKey() {
  const names = Object.keys(Deno.env.toObject()).filter((name) => /resend/i.test(name));
  const preferred = names.find((name) => name === "RESEND_API_KEY") || names[0];
  return { names, key: preferred ? Deno.env.get(preferred) || "" : "" };
}

function longDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

async function loadRecap(date: string) {
  const response = await fetch(`${SITE}/recaps/recaps.json?t=${Date.now()}`);
  if (!response.ok) throw new Error(`Couldn't read recaps.json from the site (${response.status})`);
  const data = await response.json();
  const recap = (data.recaps || []).find((entry: any) => entry.date === date);
  if (!recap) throw new Error(`There is no recap for ${date} on the site yet`);
  return { show: data.show || "Rinkside Report", host: data.host || "Arnie Jordan", recap };
}

async function loadScores(admin: any, date: string) {
  const { data: games } = await admin
    .from("games")
    .select("game_time, away_score, home_score, went_ot, status, no_games, away:away_team_id(name), home:home_team_id(name)")
    .eq("game_date", date)
    .eq("status", "final")
    .order("game_time");

  return (games || [])
    .filter((game: any) => !game.no_games && game.away && game.home)
    .map((game: any) => ({
      away: game.away.name,
      home: game.home.name,
      awayScore: game.away_score,
      homeScore: game.home_score,
      ot: !!game.went_ot,
    }));
}

function buildEmail(show: string, host: string, recap: any, scores: any[]) {
  const link = `${SITE}/recaps.html?date=${recap.date}${recap.draft ? "&preview" : ""}`;
  const dateText = longDate(recap.date);
  const teaser = Array.isArray(recap.text) && recap.text.length ? String(recap.text[0]) : "";

  const scoreRows = scores
    .map(
      (s) => `
        <tr>
          <td style="padding:6px 0;font-size:15px;color:#0b2239;">${esc(s.away)}</td>
          <td style="padding:6px 12px;font-size:16px;font-weight:700;color:#0b2239;white-space:nowrap;text-align:center;">${esc(s.awayScore)} &ndash; ${esc(s.homeScore)}${s.ot ? " <span style=\"font-size:11px;font-weight:600;color:#c8102e;\">OT</span>" : ""}</td>
          <td style="padding:6px 0;font-size:15px;color:#0b2239;text-align:right;">${esc(s.home)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#eef2f6;">
  <div style="display:none;max-height:0;overflow:hidden;">${esc(recap.title)} &mdash; press play and hear ${esc(host)}'s notes from the stands.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:10px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td style="background:#071a2b;padding:18px 24px;color:#ffffff;">
              <div style="font-size:12px;letter-spacing:2px;color:#9fb6cc;">JORDAN OLDTIMERS HOCKEY LEAGUE</div>
              <div style="font-size:22px;font-weight:700;margin-top:4px;">${esc(show)}</div>
            </td>
          </tr>
          <tr>
            <td style="border-top:4px solid #c8102e;padding:24px;">
              <div style="font-size:12px;letter-spacing:1.5px;font-weight:700;color:#c8102e;text-transform:uppercase;">${esc(dateText)}</div>
              <h1 style="margin:8px 0 16px;font-size:22px;line-height:1.3;color:#0b2239;">${esc(recap.title)}</h1>
              ${scoreRows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e3e9ef;border-bottom:1px solid #e3e9ef;margin-bottom:18px;">${scoreRows}</table>` : ""}
              <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#2b3b4d;">${esc(teaser)}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="background:#c8102e;border-radius:6px;">
                    <a href="${link}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">&#9654;&nbsp; Hear the full recap</a>
                  </td>
                </tr>
              </table>
              <p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#6b7a8a;text-align:center;">A few minutes of your week. Press play, or read along on the page.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f6f8fa;padding:16px 24px;font-size:12px;line-height:1.5;color:#6b7a8a;">
              You're getting this because you're on a JOHL roster this season. ${esc(host)} is a made-up character &mdash; the goals and scores are real, straight from the league's score sheets, and the rest of his notes are written and voiced by computer for a laugh. Don't want these? Reply to this email and we'll take you off the list.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const scoreText = scores.map((s) => `  ${s.away} ${s.awayScore} - ${s.homeScore} ${s.home}${s.ot ? " (OT)" : ""}`).join("\n");

  const text = [
    `${show} - ${dateText}`,
    "",
    recap.title,
    "",
    scoreText,
    scoreText ? "" : null,
    teaser,
    "",
    `Hear the full recap: ${link}`,
    "",
    `You're getting this because you're on a JOHL roster this season. ${host} is a made-up character - the goals and scores are real, straight from the league's score sheets, and the rest of his notes are written and voiced by computer for a laugh. Don't want these? Reply to this email and we'll take you off the list.`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  // The sender's name already says whose report it is, so the subject is
  // just the night's headline.
  return { subject: recap.title, html, text };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // --- Who's calling? ---
  const { data: configRows, error: configError } = await admin.from("app_config").select("key, value");
  if (configError) return json({ error: "Couldn't read the settings" }, 500);

  const config: Record<string, string> = {};
  for (const row of configRows || []) config[row.key] = row.value;

  const given = req.headers.get("x-recap-secret") || "";
  if (!config.recap_email_secret || !sameText(given, config.recap_email_secret)) {
    return json({ error: "Not allowed" }, 401);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch (_) {
    return json({ error: "Bad request" }, 400);
  }

  const mode = String(body.mode || "");
  const { names, key } = resendKey();

  try {
    // --- info: look, don't send ---
    if (mode === "info") {
      let domains: unknown = null;
      if (key) {
        const response = await fetch(`${RESEND}/domains`, { headers: { Authorization: `Bearer ${key}` } });
        const payload = await response.json().catch(() => ({}));
        domains = response.ok
          ? (payload.data || []).map((d: any) => ({ name: d.name, status: d.status }))
          : { status: response.status, message: payload.message || payload.name || "couldn't list domains" };
      }
      return json({
        ok: true,
        resendSecretNames: names,
        hasKey: !!key,
        domains,
        from: config.recap_email_from || null,
        replyTo: config.recap_email_reply_to || null,
        allEnabled: config.recap_email_all_enabled === "true",
      });
    }

    if (mode !== "test" && mode !== "all") return json({ error: "mode must be info, test or all" }, 400);

    const date = String(body.date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "date must look like 2026-10-04" }, 400);

    if (!key) return json({ error: "The RESEND_API_KEY secret isn't set for this function" }, 500);
    if (!config.recap_email_from) return json({ error: "app_config.recap_email_from isn't set" }, 500);

    // --- Who gets it? ---
    let recipients: string[] = [];
    let approvedBy = "";
    const alreadySent = new Set<string>();

    if (mode === "test") {
      const to = String(body.to || "").trim().toLowerCase();
      if (!to) return json({ error: "test mode needs a 'to' address" }, 400);

      const { data: admins } = await admin.from("profiles").select("id").eq("is_admin", true);
      const adminEmails: string[] = [];
      for (const profile of admins || []) {
        const { data } = await admin.auth.admin.getUserById(profile.id);
        if (data?.user?.email) adminEmails.push(data.user.email.toLowerCase());
      }
      if (!adminEmails.includes(to)) return json({ error: "Test emails only go to a league admin's own address" }, 403);
      recipients = [to];
    } else {
      if (config.recap_email_all_enabled !== "true") {
        return json({ error: "Sending to the whole league is switched off (app_config.recap_email_all_enabled)" }, 403);
      }

      approvedBy = String(body.approved_by || "").trim();
      if (!approvedBy) {
        return json({ error: "A whole-league send has to say who in the league approved it (approved_by)" }, 403);
      }

      // Everybody an earlier run for this recap already reached.
      if (body.force !== true) {
        const { data: earlier, error: earlierError } = await admin
          .from("recap_email_sends")
          .select("detail")
          .eq("recap_date", date)
          .eq("mode", "all");
        if (earlierError) throw earlierError;
        for (const row of earlier || []) {
          for (const email of row.detail?.sent_to || []) alreadySent.add(String(email).toLowerCase());
        }
      }

      const { data: optOuts } = await admin.from("recap_email_optouts").select("email");
      const skip = new Set((optOuts || []).map((row: any) => String(row.email).trim().toLowerCase()));

      const { data: players, error: playersError } = await admin
        .from("players")
        .select("email, seasons!inner(active)")
        .eq("seasons.active", true)
        .not("email", "is", null);
      if (playersError) throw playersError;

      const seen = new Set<string>();
      for (const player of players || []) {
        const email = String(player.email || "").trim().toLowerCase();
        if (!email || !email.includes("@") || seen.has(email) || skip.has(email)) continue;
        seen.add(email);
        if (!alreadySent.has(email)) recipients.push(email);
      }
      if (!seen.size) return json({ error: "No player emails to send to" }, 500);
      if (!recipients.length) {
        return json({ error: `The ${date} recap has already been emailed to the league (${alreadySent.size} players)` }, 409);
      }
    }

    // --- What do they get? ---
    const { show, host, recap } = await loadRecap(date);
    if (mode === "all" && recap.draft) {
      return json({ error: `The ${date} recap is still a draft. Publish it (take "draft" off it in recaps.json) before emailing the league` }, 409);
    }
    const scores = await loadScores(admin, date);
    const email = buildEmail(show, host, recap, scores);
    const subject = mode === "test" ? `[TEST] ${email.subject}` : email.subject;

    const message = (to: string) => ({
      from: config.recap_email_from,
      to: [to],
      ...(config.recap_email_reply_to
        ? {
          reply_to: config.recap_email_reply_to,
          // Lets a mail app show its own "unsubscribe" button, which writes to the league.
          headers: { "List-Unsubscribe": `<mailto:${config.recap_email_reply_to}?subject=Unsubscribe%20from%20the%20Rinkside%20Report>` },
        }
        : {}),
      subject,
      html: email.html,
      text: email.text,
    });

    // One email per person (nobody sees anybody else's address), sent in
    // batches of 50. It stops at the first batch that's turned down, so
    // what's left can be picked up by running it again.
    const sentTo: string[] = [];
    const errors: unknown[] = [];

    for (let start = 0; start < recipients.length; start += 50) {
      if (start > 0) await new Promise((resolve) => setTimeout(resolve, 700));

      const chunk = recipients.slice(start, start + 50);
      const response = await fetch(`${RESEND}/emails/batch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(chunk.map(message)),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        errors.push({ status: response.status, message: payload.message || payload.name || "send failed", recipients: chunk.length });
        break;
      }
      sentTo.push(...chunk);
    }

    const ok = errors.length === 0;
    const sent = sentTo.length;
    const remaining = recipients.length - sent;

    const { error: logError } = await admin.from("recap_email_sends").insert({
      recap_date: date,
      mode,
      recipient_count: sent,
      ok,
      detail: {
        subject,
        intended: recipients.length,
        errors,
        ...(mode === "all" ? { approved_by: approvedBy, sent_to: sentTo } : {}),
      },
    });
    if (logError) console.error("Couldn't write the send log:", logError.message);

    return json({
      ok,
      mode,
      date,
      subject,
      from: config.recap_email_from,
      sent,
      remaining,
      already_sent_before: alreadySent.size,
      log_saved: !logError,
      errors,
    }, ok ? 200 : 502);
  } catch (err) {
    return json({ error: String((err as any)?.message || err) }, 500);
  }
});
