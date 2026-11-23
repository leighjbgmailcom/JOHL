/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   RINKSIDE REPORT (recaps.html) — the weekly game-night recap

   Each recap is an entry in recaps/recaps.json: the game date, a title,
   the audio file, and the words as paragraphs. This page lists them
   newest first: Arnie on camera at the top (js/arnie-player.js), the words just under it, then
   that night's final scores (from the schedule) with every goal. Adding a week is adding an entry and an MP3 -- see
   tools/recap/README.md.

   recaps.html?date=2026-10-04 opens straight to that night's recap,
   which is what the email to the players links to.

   A recap marked "draft": true is waiting for the league's OK. It stays
   off this page (and the home page) for everyone except whoever opens
   the preview link, recaps.html?date=...&preview.
   ========================================= */

function recapEsc(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// That night's goals, read once for every recap on the page and kept
// here by game id.
let RECAP_GOALS = {};

async function loadRecapGoals(dates) {
    const ids = SCHEDULE
        .filter(game => dates.includes(game.date) && !game.noGames && game.status === "final")
        .map(game => game.id);
    if (!ids.length) return;

    const { data, error } = await supabaseClient
        .from("game_goals")
        .select("id, game_id, team_id, period, game_time, scorer_id, assist1_id, assist2_id")
        .in("game_id", ids);

    if (error) {
        console.error("Could not load the goals for the recaps:", error);
        return;
    }

    RECAP_GOALS = {};
    (data || []).forEach(goal => {
        const key = String(goal.game_id);
        (RECAP_GOALS[key] = RECAP_GOALS[key] || []).push(goal);
    });
}

// "#11 KP" -- the player's number, then his nickname, or his last name
// if he doesn't have one (the same names Arnie uses).
function recapPlayerTag(playerId) {
    if (playerId == null) return "";
    const player = PLAYERS.find(p => String(p.id) === String(playerId));
    if (!player) return "";
    const name = player.nickname || player.last;
    return player.number != null ? `#${player.number} ${name}` : name;
}

function recapOrdinal(n) {
    const tens = n % 100;
    if (tens >= 11 && tens <= 13) return `${n}th`;
    return n + ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th");
}

// One game's goals in the order they went in, numbered per team (each
// team's 1st goal, 2nd goal, ...),
// with who scored and who assisted. The game clock counts down, so a
// higher time in the same period came first. A shootout winner is shown
// after the list, since it isn't counted as a goal in the game.
function recapGoalsHtml(game) {
    const goals = RECAP_GOALS[String(game.id)] || [];
    if (!goals.length) return "";

    const awayTeam = getTeam(game.away);
    const teamCode = teamId => (awayTeam && String(teamId) === String(awayTeam.id)) ? game.away : game.home;
    const periodLabel = { "1": "1st", "2": "2nd", "3": "3rd", "OT": "OT" };

    const order = goal => {
        const periodIndex = GOALIE_STATS_PERIOD_ORDER.indexOf(String(goal.period));
        const seconds = parseClockToSeconds(goal.game_time);
        return [periodIndex === -1 ? GOALIE_STATS_PERIOD_ORDER.length : periodIndex, seconds == null ? Infinity : -seconds, goal.id];
    };
    const sorted = [...goals].sort((a, b) => {
        const ka = order(a), kb = order(b);
        return (ka[0] - kb[0]) || (ka[1] - kb[1]) || (ka[2] - kb[2]);
    });

    const inGame = sorted.filter(goal => String(goal.period) !== "SO");
    const shootout = sorted.filter(goal => String(goal.period) === "SO");

    // Numbered per team: each team's first goal is its "1st goal".
    const goalCounts = {};
    const rows = inGame.map(goal => {
        const code = teamCode(goal.team_id);
        goalCounts[code] = (goalCounts[code] || 0) + 1;
        const assists = [goal.assist1_id, goal.assist2_id].map(recapPlayerTag).filter(Boolean);
        const time = normalizeClockText(goal.game_time);
        const when = [periodLabel[goal.period] || goal.period, time].filter(Boolean).join(" ");
        return `
            <li class="recap-goal">
                <span class="recap-goal-team">${teamBadge(code)}</span>
                <span class="recap-goal-main">
                    <span class="recap-goal-by"><strong>${recapOrdinal(goalCounts[code])} goal</strong> by ${recapEsc(recapPlayerTag(goal.scorer_id) || "?")}</span>
                    <span class="recap-goal-assist">${assists.length ? `Assist: ${recapEsc(assists.join(", "))}` : "Unassisted"}</span>
                </span>
                <span class="recap-goal-time">${recapEsc(when)}</span>
            </li>
        `;
    }).join("");

    const shootoutRows = shootout.map(goal => `
        <li class="recap-goal is-shootout">
            <span class="recap-goal-team">${teamBadge(teamCode(goal.team_id))}</span>
            <span class="recap-goal-main">
                <span class="recap-goal-by"><strong>Shootout winner</strong> by ${recapEsc(recapPlayerTag(goal.scorer_id) || "?")}</span>
            </span>
            <span class="recap-goal-time">SO</span>
        </li>
    `).join("");

    return `<ol class="recap-goals">${rows}${shootoutRows}</ol>`;
}

// That night's finished games, in the order they were played, each with
// its goals listed underneath.
function recapScoresHtml(date) {
    const games = SCHEDULE
        .filter(game => game.date === date && !game.noGames && game.status === "final")
        .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

    if (!games.length) return "";

    return `
        <div class="recap-scores">
            ${games.map(game => `
                <div class="recap-game">
                    <div class="recap-score">
                        <span class="recap-score-team">${teamBadge(game.away)}<span>${recapEsc(teamName(game.away))}</span></span>
                        <span class="recap-score-line">${game.awayScore ?? 0} – ${game.homeScore ?? 0}</span>
                        <span class="recap-score-team is-home"><span>${recapEsc(teamName(game.home))}</span>${teamBadge(game.home)}</span>
                    </div>
                    ${recapGoalsHtml(game)}
                </div>
            `).join("")}
        </div>
    `;
}

function recapHtml(recap, show, host, isFeatured) {
    return `
        <article class="recap ${isFeatured ? "is-featured" : ""} ${recap.draft ? "is-draft" : ""}" id="recap-${recapEsc(recap.date)}">
            ${recap.draft ? `<p class="recap-draft-note"><strong>Draft</strong> Only people with this preview link can see it. It isn't on the Recaps page or in anyone's inbox yet.</p>` : ""}
            <p class="eyebrow">${recapEsc(formatDateISO(recap.date))}</p>
            <h3>${recapEsc(recap.title)}</h3>

            <div class="recap-player" data-date="${recapEsc(recap.date)}"></div>
            ${recap.draft ? "" : recapShareHtml(recap)}

            <details class="recap-words">
                <summary>Read the recap</summary>
                ${(recap.text || []).map(paragraph => `<p>${recapEsc(paragraph)}</p>`).join("")}
                <p class="recap-signoff">— ${recapEsc(host)}, ${recapEsc(show)}</p>
            </details>

            ${recap.draft ? "" : `<section class="recap-comments" data-date="${recapEsc(recap.date)}">
                <h4>Dressing room chatter</h4>
                <ol class="recap-comment-list"><li class="recap-comment-empty">Loading…</li></ol>
                <div class="recap-comment-form"></div>
            </section>`}

            ${recapScoresHtml(recap.date)}


        </article>
    `;
}

/* -----------------------------------------
   SHARING: one Share button. On a phone it opens the phone's own share
   sheet (texts, WhatsApp, Facebook, email...); where there isn't one
   (most computers) it copies the link instead.
   ----------------------------------------- */

function recapShareUrl(recap) {
    return `https://jordanohl.ca/recaps.html?date=${encodeURIComponent(recap.date)}`;
}

function recapShareHtml(recap) {
    const url = recapShareUrl(recap);
    const text = `Arnie Jordan's Rinkside Report: ${recap.title}`;
    return `
        <div class="recap-share" data-url="${recapEsc(url)}" data-text="${recapEsc(text)}">
            <button type="button" class="recap-share-btn">Share</button>
        </div>
    `;
}

function setupRecapShare(bar) {
    const url = bar.dataset.url, text = bar.dataset.text;
    const button = bar.querySelector(".recap-share-btn");
    button.addEventListener("click", async () => {
        if (navigator.share) {
            navigator.share({ title: "Rinkside Report", text, url }).catch(() => {});
            return;
        }
        try {
            await navigator.clipboard.writeText(url);
            button.textContent = "Link copied!";
        } catch (error) {
            window.prompt("Copy this link:", url);
        }
        setTimeout(() => { button.textContent = "Share"; }, 2000);
    });
}


/* -----------------------------------------
   COMMENTS: anyone can read them; players signed in to the site can
   post (their name is filled in by the database from the roster) and
   delete their own. Admins can delete any. Table: recap_comments
   (supabase-migrations/011_recap_comments.sql).
   ----------------------------------------- */

let RECAP_ME = null;   // { id, isAdmin } once we know who's signed in

function recapWhen(iso) {
    const then = new Date(iso), mins = Math.round((Date.now() - then) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
    return then.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

// Web links in Arnie's own comments (only the site can post as him)
// become clickable. Players' comments stay plain text.
function recapLinkify(escaped) {
    return escaped.replace(/https:\/\/[^\s<]+[^\s<.,!?)]/g, url =>
        `<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
}

function recapCommentHtml(comment) {
    const mine = RECAP_ME && (RECAP_ME.isAdmin || (!comment.is_arnie && comment.author_id === RECAP_ME.id));
    return `
        <li class="recap-comment ${comment.is_arnie ? "is-arnie" : ""}" id="comment-${comment.id}" data-id="${comment.id}">
            <div class="recap-comment-head">
                <strong>${recapEsc(comment.author_name)}</strong>
                ${comment.is_arnie ? `<span class="recap-arnie-badge">Host</span>` : ""}
                <span>${recapEsc(recapWhen(comment.created_at))}</span>
                ${mine ? `<button type="button" class="recap-comment-delete">Delete</button>` : ""}
            </div>
            <p>${comment.is_arnie ? recapLinkify(recapEsc(comment.body)) : recapEsc(comment.body)}</p>
        </li>
    `;
}

// Each player's comment, with Arnie's reply tucked in right under it.
function recapThreadHtml(comments) {
    const replies = {};
    comments.filter(c => c.reply_to).forEach(c => { (replies[c.reply_to] = replies[c.reply_to] || []).push(c); });
    return comments
        .filter(c => !c.reply_to)
        .map(c => recapCommentHtml(c) + (replies[c.id] || []).map(recapCommentHtml).join(""))
        .join("");
}

const RECAP_COMMENT_COLUMNS = "id, recap_date, author_id, author_name, body, created_at, reply_to, is_arnie";

// Arnie reads the comments twice a day (a scheduled task, lunch and
// supper time) and answers each one; the player gets an email when he does.
function arnieWillAnswer(list, comment) {
    const note = document.createElement("li");
    note.className = "recap-comment is-arnie is-typing";
    note.innerHTML = `<div class="recap-comment-head"><strong>Arnie Jordan</strong></div><p>Arnie reads the comments at lunch and suppertime. You'll get an email when he writes back.</p>`;
    const mineEl = list.querySelector(`[data-id="${comment.id}"]`);
    if (mineEl) mineEl.after(note); else list.appendChild(note);
}

async function loadRecapComments(root) {
    const sections = [...root.querySelectorAll(".recap-comments")];
    if (!sections.length) return;

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            RECAP_ME = { id: session.user.id, isAdmin: false };
            const { data: profile } = await supabaseClient.from("profiles").select("is_admin").eq("id", session.user.id).maybeSingle();
            RECAP_ME.isAdmin = !!(profile && profile.is_admin);
        }
    } catch (error) {
        console.error("Could not check who is signed in:", error);
    }

    const { data, error } = await supabaseClient
        .from("recap_comments")
        .select(RECAP_COMMENT_COLUMNS)
        .in("recap_date", sections.map(section => section.dataset.date))
        .order("created_at", { ascending: true });

    sections.forEach(section => {
        const list = section.querySelector(".recap-comment-list");
        const mine = (data || []).filter(comment => comment.recap_date === section.dataset.date);
        list.innerHTML = error
            ? `<li class="recap-comment-empty">Comments couldn't be loaded right now.</li>`
            : (mine.length ? recapThreadHtml(mine) : `<li class="recap-comment-empty">No comments yet. Get the chirps going.</li>`);
        setupRecapCommentForm(section);
    });

    // Arrived from the "Arnie wrote back" email: go to that conversation.
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({ block: "center" });
}

function setupRecapCommentForm(section) {
    const holder = section.querySelector(".recap-comment-form");
    const list = section.querySelector(".recap-comment-list");

    if (!RECAP_ME) {
        holder.innerHTML = `<p class="recap-comment-signin"><a href="index.html?login=1&redirect=recaps.html">Sign in</a> to leave a comment.</p>`;
    } else {
        holder.innerHTML = `
            <form>
                <textarea maxlength="600" rows="2" placeholder="Chirp away (keep it about the hockey)…" required></textarea>
                <button type="submit">Post</button>
            </form>
        `;
        const form = holder.querySelector("form");
        const box = form.querySelector("textarea");
        const button = form.querySelector("button");
        form.addEventListener("submit", async event => {
            event.preventDefault();
            const body = box.value.trim();
            if (!body) return;
            button.disabled = true;
            const { data, error } = await supabaseClient
                .from("recap_comments")
                .insert({ recap_date: section.dataset.date, body })
                .select(RECAP_COMMENT_COLUMNS)
                .single();
            button.disabled = false;
            if (error) {
                console.error("Could not post the comment:", error);
                alert("That comment didn't go through. Try again in a minute.");
                return;
            }
            const empty = list.querySelector(".recap-comment-empty");
            if (empty) empty.remove();
            list.insertAdjacentHTML("beforeend", recapCommentHtml(data));
            box.value = "";
            arnieWillAnswer(list, data);
        });
    }

    list.addEventListener("click", async event => {
        const button = event.target.closest(".recap-comment-delete");
        if (!button) return;
        const item = button.closest(".recap-comment");
        if (!confirm("Delete this comment?")) return;
        const { error } = await supabaseClient.from("recap_comments").delete().eq("id", item.dataset.id);
        if (error) { alert("Couldn't delete it right now."); return; }
        // Arnie's reply goes with it.
        list.querySelectorAll(".recap-comment.is-arnie").forEach(reply => {
            if (reply.previousElementSibling === item) reply.remove();
        });
        item.remove();
    });
}

async function renderRecaps() {
    const element = document.getElementById("recap-list");
    if (!element) return;

    let data;
    try {
        // The file changes every week, so it's never read from the browser's cache.
        const response = await fetch("recaps/recaps.json", { cache: "no-store" });
        if (!response.ok) throw new Error("HTTP " + response.status);
        data = await response.json();
    } catch (error) {
        console.error("Could not load the recaps:", error);
        element.innerHTML = `<p class="recap-empty">The recaps couldn't be loaded right now. Try again in a minute.</p>`;
        return;
    }

    // Scores come from the schedule; the recaps still show without them.
    await loadLeagueData();

    const params = new URLSearchParams(window.location.search);
    const showDrafts = params.has("preview");

    const recaps = (data.recaps || [])
        .filter(recap => showDrafts || !recap.draft)
        .sort((a, b) => b.date.localeCompare(a.date));

    // Every goal behind those nights' scores, for the goal-by-goal lists.
    await loadRecapGoals(recaps.map(recap => recap.date));

    if (!recaps.length) {
        element.innerHTML = `<p class="recap-empty">No recaps yet. The first one lands the day after the next game night.</p>`;
        return;
    }

    // The one asked for in the link, or else the latest, is the one up top
    // and ready to play.
    const wanted = params.get("date");
    const featured = recaps.find(recap => recap.date === wanted) || recaps[0];

    element.innerHTML = recaps
        .map(recap => recapHtml(recap, data.show, data.host, recap === featured))
        .join("");

    // Share buttons and comments under each recap.
    element.querySelectorAll(".recap-share").forEach(setupRecapShare);
    loadRecapComments(element);

    // Arnie on camera in place of the plain audio player (js/arnie-player.js).
    element.querySelectorAll(".recap-player").forEach(slot => {
        const recap = recaps.find(entry => entry.date === slot.dataset.date);
        if (typeof mountArniePlayer === "function") mountArniePlayer(slot, recap);
        else slot.innerHTML = `<audio class="recap-audio" controls preload="none" src="${recapEsc(recap.audio)}"></audio>`;
    });

    if (wanted && featured.date === wanted && featured !== recaps[0]) {
        document.getElementById(`recap-${featured.date}`).scrollIntoView({ block: "start" });
    }
}

document.addEventListener("DOMContentLoaded", renderRecaps);
