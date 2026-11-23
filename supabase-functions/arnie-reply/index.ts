// =========================================
// JORDAN OLDTIMERS HOCKEY LEAGUE
// Arnie replies to a comment on the Rinkside Report
// =========================================
//
// Called by the database right after a player posts a comment under a
// recap (private.recap_comment_ask_arnie, supabase-migrations/
// 013_arnie_replies.sql), with { comment_id }. It:
//
//   1. writes Arnie Jordan's reply under that comment on recaps.html, and
//   2. emails the player who left the comment to say Arnie wrote back.
//
// Like send-recap-email, it is never called from the website: the
// database proves who it is with the shared secret in app_config
// (recap_email_secret), so "verify JWT" is OFF for this function.
//
// Arnie's words:
//   - If the Edge Function secret ANTHROPIC_API_KEY is set, Claude writes
//     a reply to what the player actually said, in Arnie's voice, with
//     that night's recap for context.
//   - Otherwise (or if that call fails) he picks a line from the bank
//     below, matched to what the comment's about where he can.
//
// Email uses the same Resend key and sender as the recap email, and
// skips anyone on recap_email_optouts.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = "https://jordanohl.ca";
const MODEL = "claude-haiku-5-5";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function sameText(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function resendKey() {
  const names = Object.keys(Deno.env.toObject()).filter((name) => /resend/i.test(name));
  const preferred = names.find((name) => name === "RESEND_API_KEY") || names[0];
  return preferred ? Deno.env.get(preferred) || "" : "";
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

// ---------- Arnie's line bank (used when there's no Claude key) ----------

const BANK: { match: RegExp; lines: string[] }[] = [
  {
    match: /\b(goalie|goaltender|save|saves|net|tender|shutout|robbed|stoned)\b/i,
    lines: [
      "{name}, I had my eyes on that crease all night. Well, one eye. The other one was on the hot dog. Goalies in this league make it look easy and the rest of us look like we're skating uphill.",
      "Goaltending talk, {name}? I tried it once in '87. Took a puck off the mask, woke up in the parking lot holding someone else's Timmies. Respect to anyone who stands in there.",
      "{name}, between you and me, I think that goalie's been taking naps between whistles and still stopping everything. Wish I could do my job half asleep. Wait.",
    ],
  },
  {
    match: /\b(ref|refs|referee|referees|whistle|call|calls|penalty|penalties|box|offside|shane|chip)\b/i,
    lines: [
      "{name}, I'm not saying the refs missed it, I'm saying the refs, the timekeeper and the speed of you fellas all got together and agreed not to see it. Teamwork.",
      "Penalty talk! {name}, I wrote it down in my notebook but then I spilled my coffee on that page, so as far as row three is concerned it never happened.",
      "{name}, the boys in stripes have a tough job. They have to keep up with you guys AND listen to me yell from row three. Cut 'em some slack. Not much. Some.",
    ],
  },
  {
    match: /\b(arnie|podcast|report|notebook|row three|row 3|hot ?dog|coffee|timmies)\b/i,
    lines: [
      "{name}, you've just doubled my fan base. Triple if you count my mother, and she says she doesn't listen.",
      "Thanks {name}! Tell your friends. Actually tell anyone. The guy who sleeps in the stands each week has started listening and I think it's helping him sleep.",
      "{name}, the notebook appreciates your support. Coffee stain on page four says hi.",
    ],
  },
  {
    match: /\b(wrong|actually|mistake|missed|forgot|didn'?t|wasn'?t|no it|incorrect|typo)\b/i,
    lines: [
      "{name}, I'll have you know I take my notes very seriously. Then I lose them under the bench. Blame the refs, the timekeeper and how fast you guys skate. I'll fix it next week. Probably.",
      "Fair point, {name}. In my defence, it all happens fast out there and my glasses were fogged up from the hot chocolate. Corrections department is me. I'm on it.",
    ],
  },
  {
    match: /./,
    lines: [
      "{name}, that's going in the notebook. Right under the hot dog stain. Great to hear from you, see you Sunday!",
      "Ha! {name}, I read that out loud in the stands and the Zamboni driver laughed. That's a big get for me.",
      "{name}, you chirp better than you backcheck, and I mean that as a compliment. Mostly.",
      "Appreciate that, {name}. Row three is always open. Bring a cushion, those benches don't forgive.",
      "{name}, I'm putting that on the podcast. Both listeners are gonna love it.",
      "Noted, {name}. And by noted I mean I wrote it on a napkin. Same thing in my world. See you at the rink!",
      "{name}, keep the comments coming. I've got a lot of time between goals and you guys make the time go faster. The skating doesn't, but the comments do.",
    ],
  },
];

function bankReply(comment: string, name: string) {
  const group = BANK.find((entry) => entry.match.test(comment))!;
  return pick(group.lines).replaceAll("{name}", name);
}

// ---------- Arnie via Claude ----------

async function claudeReply(comment: string, name: string, recap: { title?: string; text?: string } | null) {
  const key = Deno.env.get("ANTHROPIC_API_KEY") || "";
  if (!key) return "";

  const system = `You are Arnie Jordan, host of the "Rinkside Report", a tiny homemade podcast about the Jordan Oldtimers Hockey League (JOHL), a recreational oldtimers hockey league that plays Sunday nights at Jordan Arena in Ontario. Arnie is a local guy who watches every game from row three of the stands with a notebook, a Timmies coffee and a hot dog. His podcast has two or three loyal listeners.

A league player has just left a comment under your latest report. Write your reply to them.

Voice: warm, goofy, self-deprecating small-town hockey fan. Light, friendly ball-busting is welcome ("the goofier the better") but never mean, never about anyone's body, age in a nasty way, family, job, or anything off the ice. No swearing. If you get something wrong, you blame a mix of the refs, the timekeeper and how fast the guys skate - never the timekeeper alone. Call them "you guys", never "you people".
Rules: reply in 1 to 3 short sentences (under 60 words). Address the player by the name given. Plain text only: no hashtags, no emoji, no quotation marks around the reply, no sign-off. Don't invent specific stats, scores or names that aren't in the comment or the report. If the comment is rude, off-topic or inappropriate, give a short good-natured line steering it back to the hockey.`;

  const context = recap
    ? `Tonight's report was titled: ${recap.title || ""}\n\nWhat you said in it (for context):\n${String(recap.text || "").slice(0, 6000)}`
    : "";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        system,
        messages: [{
          role: "user",
          content: `${context}\n\nThe player's name: ${name}\nTheir comment:\n${comment}\n\nWrite Arnie's reply.`,
        }],
      }),
    });
    if (!response.ok) {
      console.error("Claude reply failed", response.status, await response.text());
      return "";
    }
    const data = await response.json();
    const text = (data.content || []).map((part: { text?: string }) => part.text || "").join("").trim();
    return text.replace(/^["“]|["”]$/g, "").slice(0, 600);
  } catch (error) {
    console.error("Claude reply error", error);
    return "";
  }
}

// ---------- the email to the player ----------

function longDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-CA", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

function emailHtml(name: string, comment: string, reply: string, date: string, link: string) {
  return `<!DOCTYPE html>
<html lang="en"><body style="margin:0;background:#f3f5f7;font-family:Arial,Helvetica,sans-serif;color:#17212b">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
  <div style="background:#071a2b;color:#fff;border-radius:8px 8px 0 0;padding:18px 22px;border-bottom:4px solid #c8102e">
    <div style="font-size:12px;letter-spacing:2px;font-weight:bold;color:#d7e2ea">ARNIE'S RINKSIDE REPORT</div>
    <div style="font-size:20px;font-weight:bold;margin-top:4px">Arnie wrote back</div>
  </div>
  <div style="background:#fff;border-radius:0 0 8px 8px;padding:22px">
    <p style="margin:0 0 14px">Hey ${esc(name)}, Arnie answered your comment on the ${esc(longDate(date))} report.</p>
    <div style="border-left:3px solid #ccd3d9;padding:4px 0 4px 12px;color:#5b6872;margin-bottom:14px">
      <div style="font-size:12px;font-weight:bold;margin-bottom:4px">You said</div>
      ${esc(comment)}
    </div>
    <div style="border-left:3px solid #c8102e;padding:4px 0 4px 12px;margin-bottom:20px">
      <div style="font-size:12px;font-weight:bold;color:#c8102e;margin-bottom:4px">Arnie Jordan</div>
      ${esc(reply)}
    </div>
    <a href="${esc(link)}" style="display:inline-block;background:#c8102e;color:#fff;text-decoration:none;font-weight:bold;padding:11px 18px;border-radius:4px">See the conversation</a>
  </div>
  <p style="font-size:12px;color:#7b8790;text-align:center;margin-top:16px">Jordan Oldtimers Hockey League · jordanohl.ca</p>
</div></body></html>`;
}

// ---------- main ----------

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const { data: configRows } = await admin.from("app_config").select("key, value");
  const config: Record<string, string> = Object.fromEntries((configRows || []).map((row) => [row.key, row.value]));

  const given = req.headers.get("x-recap-secret") || "";
  if (!config.recap_email_secret || !sameText(given, config.recap_email_secret)) {
    return json({ error: "Not allowed" }, 401);
  }

  let body: { comment_id?: number; skip_email?: boolean };
  try { body = await req.json(); } catch { return json({ error: "Bad body" }, 400); }
  const commentId = Number(body.comment_id);
  if (!commentId) return json({ error: "comment_id is required" }, 400);

  const { data: comment, error: commentError } = await admin
    .from("recap_comments")
    .select("id, recap_date, author_id, author_name, body, is_arnie")
    .eq("id", commentId)
    .maybeSingle();
  if (commentError || !comment) return json({ error: "No such comment" }, 404);
  if (comment.is_arnie) return json({ skipped: "That one's Arnie's own" });

  const { data: already } = await admin.from("recap_comments").select("id").eq("reply_to", commentId).eq("is_arnie", true).limit(1);
  if (already && already.length) return json({ skipped: "Arnie already answered it" });

  // First name or nickname, the way Arnie would say it.
  const name = (comment.author_name || "pal").split(" ")[0] === "League" ? "pal" : String(comment.author_name).split(" ")[0];

  let recap: { title?: string; text?: string } | null = null;
  try {
    const response = await fetch(`${SITE}/recaps/recaps.json?t=${Date.now()}`);
    const data = await response.json();
    recap = (data.recaps || []).find((entry: { date: string }) => entry.date === comment.recap_date) || null;
  } catch (error) {
    console.error("Could not read recaps.json", error);
  }

  const fromClaude = await claudeReply(comment.body, name, recap);
  const reply = fromClaude || bankReply(comment.body, name);

  const { data: saved, error: saveError } = await admin
    .from("recap_comments")
    .insert({ recap_date: comment.recap_date, body: reply, is_arnie: true, reply_to: comment.id, author_name: "Arnie Jordan" })
    .select("id")
    .single();
  if (saveError) {
    console.error("Could not save Arnie's reply", saveError);
    return json({ error: "Could not save the reply" }, 500);
  }

  // ---- tell the player ----
  let emailed = false, emailNote = "";
  const key = resendKey();
  if (body.skip_email) {
    emailNote = "skip_email set";
  } else if (!key || !config.recap_email_from) {
    emailNote = "Resend key or sender missing";
  } else if (!comment.author_id) {
    emailNote = "comment has no author";
  } else {
    const { data: userData } = await admin.auth.admin.getUserById(comment.author_id);
    const to = userData?.user?.email || "";
    const { data: optOut } = to
      ? await admin.from("recap_email_optouts").select("email").ilike("email", to).maybeSingle()
      : { data: null };
    if (!to) emailNote = "no email on the login";
    else if (optOut) emailNote = "opted out";
    else {
      const link = `${SITE}/recaps.html?date=${comment.recap_date}#comment-${comment.id}`;
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: config.recap_email_from,
          to: [to],
          ...(config.recap_email_reply_to ? { reply_to: config.recap_email_reply_to } : {}),
          subject: "Arnie wrote back to your comment",
          html: emailHtml(name, comment.body, reply, comment.recap_date, link),
          text: `Hey ${name}, Arnie answered your comment on the Rinkside Report.\n\nYou said: ${comment.body}\n\nArnie Jordan: ${reply}\n\nSee the conversation: ${link}`,
        }),
      });
      emailed = response.ok;
      if (!response.ok) emailNote = `Resend ${response.status}: ${await response.text()}`;
    }
  }

  return json({ ok: true, reply_id: saved.id, source: fromClaude ? "claude" : "bank", emailed, emailNote });
});
