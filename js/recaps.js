/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   RINKSIDE REPORT (recaps.html) — the weekly game-night recap

   Each recap is an entry in recaps/recaps.json: the game date, a title,
   the audio file, and the words as paragraphs. This page lists them
   newest first: the player at the top, then that night's final scores
   (from the schedule) with every goal underneath. Adding a week is adding an entry and an MP3 -- see
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

            <audio class="recap-audio" controls preload="${isFeatured ? "metadata" : "none"}" src="${recapEsc(recap.audio)}">
                Your browser can't play this here. <a href="${recapEsc(recap.audio)}">Download the recap</a>.
            </audio>

            ${recapScoresHtml(recap.date)}

            <details class="recap-words">
                <summary>Read the recap</summary>
                ${(recap.text || []).map(paragraph => `<p>${recapEsc(paragraph)}</p>`).join("")}
                <p class="recap-signoff">— ${recapEsc(host)}, ${recapEsc(show)}</p>
            </details>
        </article>
    `;
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

    if (wanted && featured.date === wanted && featured !== recaps[0]) {
        document.getElementById(`recap-${featured.date}`).scrollIntoView({ block: "start" });
    }
}

document.addEventListener("DOMContentLoaded", renderRecaps);
