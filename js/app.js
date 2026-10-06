/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   Rendering logic — reads from js/data.js
   (TEAMS, PLAYERS, SCHEDULE)
   ========================================= */


/* =========================================
   HELPERS
   ========================================= */

function getTeam(code) {
    return TEAMS.find(team => team.code === code);
}

// Position is stored as free text ("Goalie" / "Skater" from the admin
// player-edit dropdown, though some older records used the single letter
// "G"). Every goalie check in the site should go through this helper so
// they all agree, no matter which of those a given record has.
function isGoaliePosition(position) {
    if (!position) return false;
    const p = String(position).trim().toLowerCase();
    return p === "goalie" || p === "g";
}

// Parses a game-clock reading into total seconds. Returns null for
// anything blank or unreadable. Used to figure out which goalie was in
// net for a given goal (see GOALIE STATS below).
//
// Deliberately forgiving about how the time was typed, because a phone's
// number pad has no colon key: "9:48", "9.48", "9,48", "9 48", "948" and
// ":36" are all read as a clock time. A bare one- or two-digit number
// ("36") is NOT, since it could mean either 0:36 or 36:00.
function parseClockToSeconds(value) {
    if (value == null) return null;
    const text = String(value).trim();
    if (!text) return null;

    let match = text.match(/^(\d{0,2})\s*[:.,; ]\s*([0-5]\d)$/);
    if (!match) match = text.match(/^(\d{1,2})([0-5]\d)$/);
    if (!match) return null;

    return parseInt(match[1] || "0", 10) * 60 + parseInt(match[2], 10);
}

// Tidies a typed clock time into the standard "M:SS" form for saving
// ("1647" / "16,47" -> "16:47"). Blank comes back as null; anything that
// can't be read as a time is handed back as typed, so nothing is lost.
function normalizeClockText(value) {
    if (value == null) return null;
    const text = String(value).trim();
    if (!text) return null;
    const seconds = parseClockToSeconds(text);
    return seconds == null ? text : formatSecondsAsClock(seconds);
}

// Formats a duration in seconds (e.g. a goalie's ice time in a game) as
// "M:SS" for display.
function formatSecondsAsClock(totalSeconds) {
    const secs = Math.round(totalSeconds || 0);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}


/* =========================================
   PENALTY INFRACTION TYPES
   Shared standard infraction list for the penalty-entry dropdowns in
   Admin's Enter Game Results and the Live Game screen, so every game
   sheet records infractions consistently for tracking/reporting instead
   of free-typed text that varies game to game. The stored value in
   game_penalties.infraction is always the full name (e.g. "Tripping"),
   never the short code, so existing records and reports keep reading
   normally; "Other" falls back to a free-text field for anything not on
   the list.
   ========================================= */

const INFRACTION_TYPES = [
    { code: "RO", name: "Roughing" },
    { code: "TR", name: "Tripping" },
    { code: "SL", name: "Slashing" },
    { code: "HKG/HO", name: "Hooking / Holding" },
    { code: "INT", name: "Interference" },
    { code: "HS/HISTK", name: "High-Sticking" },
    { code: "CC/CROSS", name: "Cross-Checking" },
    { code: "BDG/BOARD", name: "Boarding" },
    { code: "CHG", name: "Charging" },
    { code: "ELB", name: "Elbowing" },
    { code: "FI/FGT", name: "Fighting" },
    { code: "DG/DELAY", name: "Delay of Game" },
    { code: "KNE", name: "Kneeing" },
    { code: "BM", name: "Bench Minor (e.g., Too Many Men)" },
    { code: "CFB", name: "Checking from Behind" },
    { code: "HC", name: "Head Contact" },
    { code: "USC/ABS", name: "Unsportsmanlike Conduct / Abuse of Officials" },
    { code: "BUTT", name: "Butt-Ending" },
    { code: "SP", name: "Spearing" }
];

function isKnownInfraction(name) {
    if (!name) return false;
    return INFRACTION_TYPES.some(t => t.name === name);
}

// Builds the <option> list for an infraction <select>, with an "Other"
// entry at the end for anything not on the standard list. selectedValue
// pre-selects a matching option, or "__other__" if it's a non-empty value
// that isn't one of the standard names (e.g. an older free-typed record).
function infractionOptionsHtml(selectedValue) {
    const known = isKnownInfraction(selectedValue);
    const options = [`<option value="">—</option>`]
        .concat(INFRACTION_TYPES.map(t =>
            `<option value="${t.name}" ${selectedValue === t.name ? "selected" : ""}>${t.code} — ${t.name}</option>`
        ))
        .concat([`<option value="__other__" ${selectedValue && !known ? "selected" : ""}>Other…</option>`]);
    return options.join("");
}

function teamName(code) {
    if (code === "TBD") return "TBD";
    const team = getTeam(code);
    return team ? team.name : code;
}

function teamBadge(code) {
    if (code === "TBD") {
        return `<div class="team-badge" style="background:#97a3ac;">TBD</div>`;
    }
    const team = getTeam(code);
    if (!team) return "";

    // Try the team logo image first; if it fails to load (missing file,
    // wrong path, etc.) fall back to the colored initials circle so the
    // page never shows a broken image icon.
    const fallback = `this.outerHTML = '<div class=&quot;team-badge ${team.class}&quot;>${team.code}</div>';`;

    return `
        <div class="team-badge-logo">
            <img
                src="${team.logo}"
                alt="${team.name} logo"
                onerror="${fallback}"
            >
        </div>
    `;
}

// Today's date as YYYY-MM-DD in local time (matches SCHEDULE date format)
function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

// "18:30" (24-hour) -> "6:30 PM". Returns "" for empty/missing input.
function formatTime12h(time) {
    if (!time) return "";
    const [hStr, mStr] = time.split(":");
    let hours = parseInt(hStr, 10);
    const minutes = mStr || "00";
    const suffix = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes} ${suffix}`;
}

function formatDateISO(iso) {
    // iso = "YYYY-MM-DD" -> parse as local date, not UTC
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-CA", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

// Group flat SCHEDULE array into ordered list of { date, entries: [...] }
function groupScheduleByDate(entries) {
    const order = [];
    const map = new Map();

    entries.forEach(entry => {
        if (!map.has(entry.date)) {
            map.set(entry.date, []);
            order.push(entry.date);
        }
        map.get(entry.date).push(entry);
    });

    return order.map(date => ({ date, entries: map.get(date) }));
}


/* =========================================
   HOME PAGE — NEXT GAME DAY
   ========================================= */

function getNextGameDay() {
    const today = todayISO();

    const upcomingDates = SCHEDULE
        .filter(entry => !entry.noGames && entry.date >= today)
        .map(entry => entry.date);

    if (upcomingDates.length === 0) {
        return null;
    }

    const nextDate = upcomingDates.sort()[0];

    return SCHEDULE.filter(
        entry => !entry.noGames && entry.date === nextDate
    );
}

function renderNextGame() {
    const element = document.getElementById("next-game");
    if (!element) return;

    const games = getNextGameDay();

    if (!games || games.length === 0) {
        element.innerHTML = `
            <div class="info-banner">
                <strong>That's a wrap.</strong>
                No more games left on the 2026-27 schedule.
                Check the <a href="schedule.html">full schedule</a> for final results.
            </div>
        `;
        return;
    }

    const gameDate = formatDateISO(games[0].date);

    element.innerHTML = `
        <div class="next-game-day">

            <div class="next-game-date">
                <h3>${gameDate}</h3>
            </div>

            <div class="homepage-games">
                ${games.map(game => {
                    const isLive = game.status === "live";
                    const isFinal = game.status === "final";
                    const hasScore = isLive || isFinal;
                    const isOpen = hasScore && GAME_DETAIL_OPEN.home.has(String(game.id));

                    return `
                    <div class="homepage-game ${isLive ? "is-live" : ""} ${isOpen ? "is-open" : ""}">
                        <div class="homepage-game-time">
                            ${isLive ? `<span class="live-badge">Live</span>` : formatTime12h(game.time)}
                            ${hasScore ? `
                                <button type="button" class="homepage-detail-link" id="home-detail-link-${game.id}"
                                    aria-expanded="${isOpen ? "true" : "false"}" aria-controls="home-detail-${game.id}"
                                    onclick="toggleHomeGameDetail(${game.id})">${homeDetailLinkLabel(game, isOpen)}</button>
                            ` : ""}
                        </div>

                        <a class="homepage-team" href="teams.html?team=${game.away}" title="View ${teamName(game.away)}">
                            ${teamBadge(game.away)}
                            <span>${teamName(game.away)}</span>
                            ${hasScore ? `<span class="homepage-score">${game.awayScore ?? 0}</span>` : ""}
                        </a>

                        <div class="homepage-vs ${isFinal ? "is-final" : ""}">${isFinal ? "Final" : "vs."}</div>

                        <a class="homepage-team" href="teams.html?team=${game.home}" title="View ${teamName(game.home)}">
                            ${teamBadge(game.home)}
                            <span>${teamName(game.home)}</span>
                            ${hasScore ? `<span class="homepage-score">${game.homeScore ?? 0}</span>` : ""}
                        </a>
                    </div>
                    ${hasScore ? `<div class="homepage-game-detail" id="home-detail-${game.id}" ${isOpen ? "" : "hidden"}>${isOpen ? gameDetailCachedHtml(game.id) : ""}</div>` : ""}
                `;
                }).join("")}
            </div>

        </div>
    `;

    // The box is redrawn every time a score changes, so anything that
    // was open is brought up to date rather than closed.
    refreshOpenGameDetails("home");
}


/* =========================================
   GAME DETAIL PANELS — WATCH LIVE / RECAP (home page and Schedule)

   A game that's under way or finished can be opened up to show what
   happened in it: who's in net, who scored, who took a penalty.
     - Home page: the "Watch live" / "Recap" link beside a game's time
       in the Next Game Day box.
     - Schedule: tapping a live or finished game.
   Both draw the same thing (renderScheduleGameDetail) and share the code
   below; only where the panel sits on the page differs.

   A live game's panel keeps itself current: it's re-read whenever the
   page redraws (every goal changes the game's score, which redraws it)
   and every GAME_DETAIL_POLL_MS besides, which is what picks up
   penalties and goalie changes. A finished game is read once and kept.
   ========================================= */

const GAME_DETAIL_OPEN = { home: new Set(), schedule: new Set() }; // ids of the games whose panel is open
const GAME_DETAIL_HTML = {};   // game id -> { html, status }: the last drawn panel
const GAME_DETAIL_POLL_MS = 15000;
let gameDetailTimer = null;

function gameDetailCachedHtml(gameId) {
    const cached = GAME_DETAIL_HTML[gameId];
    return cached ? cached.html : "";
}

// Does this game's panel need reading (again)? Always for a live game;
// for a finished one only if it hasn't been read since it went final.
function gameDetailIsStale(game) {
    const cached = GAME_DETAIL_HTML[game.id];
    return !cached || cached.status !== game.status || game.status === "live";
}

function homeDetailLinkLabel(game, isOpen) {
    if (isOpen) return "Hide ▴";
    return game.status === "live" ? "Watch live ▾" : "Recap ▾";
}

function scheduleDetailHintLabel(game, isOpen) {
    if (isOpen) return "Hide ▴";
    return game.status === "live" ? "Tap to watch live ▾" : "Tap for game details ▾";
}

// Opens or closes a panel where it sits on its page.
function setGameDetailOpen(where, game, open) {
    if (where === "home") {
        const panel = document.getElementById(`home-detail-${game.id}`);
        const link = document.getElementById(`home-detail-link-${game.id}`);
        if (panel) panel.hidden = !open;
        if (link) {
            link.textContent = homeDetailLinkLabel(game, open);
            link.setAttribute("aria-expanded", open ? "true" : "false");
        }
        return;
    }

    const wrapper = document.getElementById(`schedule-wrapper-${game.id}`);
    if (!wrapper) return;
    wrapper.classList.toggle("open", open);
    const hint = wrapper.querySelector(".schedule-expand-chevron");
    if (hint) hint.textContent = scheduleDetailHintLabel(game, open);
}

function toggleGameDetail(where, gameId) {
    const key = String(gameId);
    const game = SCHEDULE.find(g => String(g.id) === key);
    const panel = document.getElementById(`${where}-detail-${gameId}`);
    if (!game || !panel) return;

    const open = !GAME_DETAIL_OPEN[where].has(key);
    if (open) GAME_DETAIL_OPEN[where].add(key);
    else GAME_DETAIL_OPEN[where].delete(key);

    setGameDetailOpen(where, game, open);

    if (open) {
        panel.innerHTML = gameDetailCachedHtml(gameId) || `<p class="schedule-detail-loading">Loading game details…</p>`;
        if (gameDetailIsStale(game)) loadGameDetail(gameId);
    }

    updateGameDetailPolling();
}

function toggleHomeGameDetail(gameId) {
    toggleGameDetail("home", gameId);
}

function toggleScheduleGameDetail(gameId) {
    toggleGameDetail("schedule", gameId);
}

// The open panel(s) for a game on whichever page this is.
function openGameDetailPanels(gameId) {
    return Object.keys(GAME_DETAIL_OPEN)
        .filter(where => GAME_DETAIL_OPEN[where].has(String(gameId)))
        .map(where => document.getElementById(`${where}-detail-${gameId}`))
        .filter(Boolean);
}

// Reads one game's goals, goalies and penalties and (re)draws its panel.
async function loadGameDetail(gameId) {
    const key = String(gameId);
    const game = SCHEDULE.find(g => String(g.id) === key);
    if (!game) return;

    const [{ data: goals, error: goalsError }, { data: periods, error: periodsError }, { data: penalties, error: penaltiesError }] = await Promise.all([
        supabaseClient.from("game_goals").select("*").eq("game_id", gameId),
        supabaseClient.from("game_goalie_periods").select("*").eq("game_id", gameId),
        supabaseClient.from("game_penalties").select("*").eq("game_id", gameId)
    ]);

    if (goalsError || periodsError || penaltiesError) {
        console.error("Error loading game detail:", goalsError || periodsError || penaltiesError);
        // Keep whatever's showing; only say so if there's nothing yet.
        if (!GAME_DETAIL_HTML[gameId]) {
            openGameDetailPanels(gameId).forEach(panel => {
                panel.innerHTML = `<p class="schedule-detail-empty">Couldn't load game details right now.</p>`;
            });
        }
        return;
    }

    // The game as it is now -- it may have gone final while this loaded.
    const current = SCHEDULE.find(g => String(g.id) === key) || game;
    const html = renderScheduleGameDetail(current, goals || [], periods || [], penalties || [], { live: current.status === "live" });

    GAME_DETAIL_HTML[gameId] = { html, status: current.status };
    openGameDetailPanels(gameId).forEach(panel => {
        if (panel.innerHTML !== html) panel.innerHTML = html;
    });
}

// After a page redraws: forget panels for games no longer on it and
// re-read the open ones that need it.
function refreshOpenGameDetails(where) {
    GAME_DETAIL_OPEN[where].forEach(key => {
        const game = SCHEDULE.find(g => String(g.id) === key);
        if (!game || !document.getElementById(`${where}-detail-${key}`)) {
            GAME_DETAIL_OPEN[where].delete(key);
        } else if (gameDetailIsStale(game)) {
            loadGameDetail(key);
        }
    });
    updateGameDetailPolling();
}

// Runs the timer only while a live game's panel is open.
function updateGameDetailPolling() {
    const liveOpen = () => [...GAME_DETAIL_OPEN.home, ...GAME_DETAIL_OPEN.schedule].filter(key => {
        const game = SCHEDULE.find(g => String(g.id) === key);
        return game && game.status === "live";
    });

    const watching = liveOpen().length > 0;

    if (watching && !gameDetailTimer) {
        gameDetailTimer = setInterval(() => {
            if (document.hidden) return;
            [...new Set(liveOpen())].forEach(loadGameDetail);
        }, GAME_DETAIL_POLL_MS);
    } else if (!watching && gameDetailTimer) {
        clearInterval(gameDetailTimer);
        gameDetailTimer = null;
    }
}


/* =========================================
   TEAMS PAGE (teams.html) -- an accordion per team: record up top,
   click to expand the full roster (with stats) and the team's sponsor
   blurb. Supports ?team=CODE (from the homepage's "Up Next" box) to
   land pre-expanded and scrolled to that team.
   ========================================= */

function skaterStatsForPlayer(stats, playerId) {
    const s = stats && stats[playerId];
    if (!s) return { gp: 0, goals: 0, assists: 0, points: 0 };
    return { gp: s.games.size, goals: s.goals, assists: s.assists, points: s.goals + s.assists };
}

function goalieStatsForPlayer(stats, playerId) {
    const s = stats && stats[playerId];
    if (!s) return { gp: 0, periodsPlayed: 0, minutesPlayed: 0, ga: 0, gaa: 0 };
    return {
        gp: s.games.size,
        periodsPlayed: s.periodsPlayed.size,
        minutesPlayed: s.secondsPlayed / 60,
        ga: s.ga,
        gaa: computeGaa(s.gaTimed, s.secondsPlayed)
    };
}

function rosterRowHtml(player, cells) {
    return `
        <tr class="clickable-row" onclick="window.location.href='players.html?player=${player.id}'">
            <td>${player.number != null ? "#" + player.number : "—"}</td>
            <td><strong>${player.last}, ${player.first}</strong></td>
            ${cells}
        </tr>
    `;
}

async function renderTeamsPage() {
    const container = document.getElementById("teams-accordion");
    if (!container) return;

    const [skaterStats, goalieStats] = await Promise.all([
        computeSkaterStats(),
        computeGoalieStats()
    ]);

    const standingsByCode = {};
    computeStandings().forEach(s => { standingsByCode[s.code] = s; });

    container.innerHTML = TEAMS.map(team => {
        const record = standingsByCode[team.code];
        const recordLabel = record && record.gp > 0
            ? `${record.w}-${record.l}-${record.otl}${record.t ? "-" + record.t : ""} &nbsp;·&nbsp; <strong>${record.pts} PTS</strong>`
            : "No games played yet";

        const roster = PLAYERS.filter(p => p.team === team.code);
        const skaters = roster
            .filter(p => !isGoaliePosition(p.position))
            .map(p => ({ player: p, stats: skaterStatsForPlayer(skaterStats, p.id) }))
            .sort((a, b) => {
                if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                if (a.player.number != null && b.player.number != null) return a.player.number - b.player.number;
                return a.player.last.localeCompare(b.player.last);
            });
        const goalies = roster
            .filter(p => isGoaliePosition(p.position))
            .map(p => ({ player: p, stats: goalieStatsForPlayer(goalieStats, p.id) }))
            .sort((a, b) => a.player.last.localeCompare(b.player.last));

        const sponsors = SPONSORS.filter(s => s.team === team.code);

        return `
            <div class="team-accordion-item" data-team="${team.code}">
                <button type="button" class="team-accordion-header">
                    <div class="team-accordion-info">
                        ${teamBadge(team.code)}
                        <div>
                            <h3>${team.name}</h3>
                            <p class="team-accordion-record">${recordLabel}</p>
                        </div>
                    </div>
                    <span class="team-accordion-chevron">▾</span>
                </button>

                <div class="team-accordion-body">

                    <h4>Skaters</h4>
                    ${skaters.length ? `
                        <div class="table-wrapper">
                            <table class="standings-table roster-mini-table">
                                <thead>
                                    <tr><th>#</th><th>Player</th><th>GP</th><th>G</th><th>A</th><th>PTS</th></tr>
                                </thead>
                                <tbody>
                                    ${skaters.map(row => rosterRowHtml(row.player, `
                                        <td>${row.stats.gp}</td>
                                        <td>${row.stats.goals}</td>
                                        <td>${row.stats.assists}</td>
                                        <td><strong>${row.stats.points}</strong></td>
                                    `)).join("")}
                                </tbody>
                            </table>
                        </div>
                    ` : `<p class="roster-empty">No skaters on this roster yet.</p>`}

                    ${goalies.length ? `
                        <h4>Goalies</h4>
                        <div class="table-wrapper">
                            <table class="standings-table roster-mini-table">
                                <thead>
                                    <tr><th>#</th><th>Player</th><th>GP</th><th>GA</th><th>GAA</th></tr>
                                </thead>
                                <tbody>
                                    ${goalies.map(row => rosterRowHtml(row.player, `
                                        <td>${row.stats.gp}</td>
                                        <td>${row.stats.ga}</td>
                                        <td><strong>${row.stats.gaa.toFixed(2)}</strong></td>
                                    `)).join("")}
                                </tbody>
                            </table>
                        </div>
                    ` : ""}

                    ${sponsors.length ? `
                        <div class="team-accordion-sponsors">
                            <p class="team-accordion-sponsors-label">Proud sponsor${sponsors.length > 1 ? "s" : ""}</p>
                            ${sponsors.map(sponsor => `
                                <div class="sponsor-blurb-mini">
                                    ${sponsor.url
                                        ? `<a href="${sponsor.url}" target="_blank" rel="noopener"><strong>${sponsor.name}</strong></a>`
                                        : `<strong>${sponsor.name}</strong>`}
                                    ${sponsor.blurb ? `<p>${sponsor.blurb}</p>` : ""}
                                </div>
                            `).join("")}
                        </div>
                    ` : ""}

                </div>
            </div>
        `;
    }).join("");

    setupTeamsAccordion();
}

function setupTeamsAccordion() {
    document.querySelectorAll(".team-accordion-header").forEach(header => {
        header.addEventListener("click", () => {
            header.closest(".team-accordion-item").classList.toggle("open");
        });
    });

    const focusTeam = new URLSearchParams(window.location.search).get("team");
    if (!focusTeam) return;

    const item = document.querySelector(`.team-accordion-item[data-team="${focusTeam}"]`);
    if (!item) return;

    item.classList.add("open");
    item.scrollIntoView({ behavior: "smooth", block: "start" });
}


/* =========================================
   SCHEDULE (schedule.html)
   ========================================= */

// Whether the "Results" section (games already played, folded away on a
// game day) is open. Kept here so it stays as it was left when a score
// changes and the page redraws.
let scheduleResultsOpen = false;

function scheduleGameHtml(game) {
    const isTbd = game.home === "TBD" || game.away === "TBD";
    const isLive = game.status === "live";
    const isFinal = game.status === "final";
    const hasDetail = isLive || isFinal;
    const isOpen = hasDetail && GAME_DETAIL_OPEN.schedule.has(String(game.id));

    let scoreHtml;
    if (isTbd) {
        scoreHtml = "TBD";
    } else if (isLive) {
        scoreHtml = `<span class="live-badge">Live</span><div>${game.awayScore ?? 0} – ${game.homeScore ?? 0}</div>`;
    } else if (isFinal) {
        scoreHtml = `<div class="schedule-score-final">${game.awayScore ?? 0} – ${game.homeScore ?? 0}</div><div class="schedule-final-tag">Final${game.wentOT ? " (OT)" : ""}</div>`;
    } else {
        scoreHtml = "GAME " + game.gameNo;
    }

    return `
        <div class="schedule-game-wrapper ${isOpen ? "open" : ""}" id="schedule-wrapper-${game.id}">
            <div class="schedule-game ${isTbd ? "is-tbd" : ""} ${isLive ? "is-live" : ""} ${hasDetail ? "is-clickable" : ""}"
                ${hasDetail ? `onclick="toggleScheduleGameDetail(${game.id})"` : ""}>

                <div class="schedule-time">
                    ${formatTime12h(game.time)}
                </div>

                <div>
                    <div class="schedule-matchup">
                        <div class="schedule-team">
                            ${teamBadge(game.away)}
                            <span>${teamName(game.away)}</span>
                        </div>
                        <span class="at-symbol">vs.</span>
                        <div class="schedule-team">
                            ${teamBadge(game.home)}
                            <span>${teamName(game.home)}</span>
                        </div>
                        ${game.note ? `<span class="note-tag">${game.note}</span>` : ""}
                    </div>
                    ${game.location && game.location !== "Jordan Arena" ? `<div class="schedule-location">${game.location}</div>` : ""}
                    ${hasDetail ? `<div class="schedule-expand-chevron ${isLive ? "is-live" : ""}">${scheduleDetailHintLabel(game, isOpen)}</div>` : ""}
                </div>

                <div class="schedule-score">
                    ${scoreHtml}
                </div>

            </div>
            ${hasDetail ? `<div class="schedule-game-detail" id="schedule-detail-${game.id}">${isOpen ? gameDetailCachedHtml(game.id) : ""}</div>` : ""}
        </div>
    `;
}

function scheduleDayHtml(group) {
    const dateLabel = formatDateISO(group.date);
    const byeEntry = group.entries.find(e => e.noGames);

    if (byeEntry) {
        return `
            <div class="schedule-day">
                <div class="schedule-date">${dateLabel}</div>
                <div class="schedule-bye">No games — ${byeEntry.note}</div>
            </div>
        `;
    }

    return `
        <div class="schedule-day">
            <div class="schedule-date">${dateLabel}</div>
            ${group.entries.map(scheduleGameHtml).join("")}
        </div>
    `;
}

function renderSchedule(filter = "ALL") {
    const element = document.getElementById("schedule-list");
    if (!element) return;

    let entries = SCHEDULE;

    if (filter !== "ALL") {
        entries = entries.filter(entry =>
            entry.noGames ||
            entry.home === filter ||
            entry.away === filter
        );
    }

    const groups = groupScheduleByDate(entries);

    if (groups.length === 0) {
        element.innerHTML = `<p>No games scheduled.</p>`;
        return;
    }

    // On a game day, the days already played are folded away under
    // "Results" so tonight's games are at the top of the page. Any other
    // day the whole season is listed as usual.
    const today = todayISO();
    const isGameDay = SCHEDULE.some(entry => !entry.noGames && entry.date === today);
    const played = isGameDay ? groups.filter(group => group.date < today) : [];
    const rest = isGameDay ? groups.filter(group => group.date >= today) : groups;
    const playedGames = played.reduce((count, group) => count + group.entries.filter(e => !e.noGames).length, 0);

    const resultsHtml = played.length ? `
        <div class="schedule-results ${scheduleResultsOpen ? "open" : ""}" id="schedule-results">
            <button type="button" class="schedule-results-toggle" id="schedule-results-toggle"
                aria-expanded="${scheduleResultsOpen ? "true" : "false"}" aria-controls="schedule-results-body"
                onclick="toggleScheduleResults()">
                <span class="schedule-results-title">Results</span>
                <span class="schedule-results-count">${playedGames} game${playedGames === 1 ? "" : "s"} already played</span>
                <span class="schedule-results-chevron">${scheduleResultsOpen ? "Hide ▴" : "Show ▾"}</span>
            </button>
            <div class="schedule-results-body" id="schedule-results-body">
                ${played.map(scheduleDayHtml).join("")}
            </div>
        </div>
    ` : "";

    element.innerHTML = resultsHtml + rest.map(scheduleDayHtml).join("");

    // The page is redrawn every time a score changes, so any game that
    // was open is brought up to date rather than closed.
    refreshOpenGameDetails("schedule");
}

function toggleScheduleResults() {
    scheduleResultsOpen = !scheduleResultsOpen;

    const section = document.getElementById("schedule-results");
    const toggle = document.getElementById("schedule-results-toggle");
    if (!section || !toggle) return;

    section.classList.toggle("open", scheduleResultsOpen);
    toggle.setAttribute("aria-expanded", scheduleResultsOpen ? "true" : "false");
    toggle.querySelector(".schedule-results-chevron").textContent = scheduleResultsOpen ? "Hide ▴" : "Show ▾";
}

// "#<number> First Last" tag for an event row.
function scheduleEventPlayerTag(playerId) {
    if (playerId == null) return "";
    const player = PLAYERS.find(p => String(p.id) === String(playerId));
    if (!player) return "";
    const name = `${player.first} ${player.last}`;
    return player.number != null ? `#${player.number} ${name}` : name;
}

// Builds the game detail markup: a "Starting Goalies" section up front
// (the first goalie each team listed), followed by the chronological feed
// of goals, penalties and goalie changes. A goalie change is shown at the
// time the previous goalie came out, which is how the score sheet (and
// game_goalie_periods.time_out) records it. Each row shows the team's
// logo, the event type, and the player(s) involved by full name -- this
// is the public schedule view, so it stays lighter on detail than Admin's
// full Enter Game Results screen.
function renderScheduleGameDetail(game, goals, periods, penalties, options = {}) {
    const awayTeam = getTeam(game.away);
    const homeTeam = getTeam(game.home);
    const awayTeamId = awayTeam ? awayTeam.id : null;

    function sideCodeForTeamId(teamId) {
        return String(teamId) === String(awayTeamId) ? game.away : game.home;
    }

    function periodTimeLabel(period, time) {
        return `P${period}${time ? ` ${time}` : ""}`;
    }

    // Sort key: period order first, then descending clock time within the
    // period (the game clock counts down, so a higher reading happened
    // earlier) -- entries with no recorded time sort as "top of period".
    // The third value breaks ties: a goal scored at the exact moment a
    // goalie came out is listed before the change, since it was scored on
    // the goalie coming out.
    function sortKey(period, time, order = 0) {
        const periodIndex = GOALIE_STATS_PERIOD_ORDER.indexOf(period);
        const seconds = parseClockToSeconds(time);
        return [periodIndex === -1 ? GOALIE_STATS_PERIOD_ORDER.length : periodIndex, seconds == null ? Infinity : -seconds, order];
    }

    // Each team's goalies in the order they played: the first one started
    // the game, and every one after came in when the one before came out.
    const otSeconds = overtimeLengthSeconds(goals, periods);
    const startingGoalieEntries = [];
    const inNetEntries = [];
    const goalieChangeEntries = [];

    [...new Set(periods.map(gp => String(gp.team_id)))]
        .sort((a, b) => (a === String(awayTeamId) ? 0 : 1) - (b === String(awayTeamId) ? 0 : 1))
        .forEach(teamId => {
            const teamRows = periods
                .filter(gp => String(gp.team_id) === teamId)
                .sort((a, b) => a.id - b.id);

            buildGoalieTimeline(teamRows, otSeconds).forEach((stint, i, timeline) => {
                // Whoever's last in the order is the one in net now.
                if (i === timeline.length - 1) inNetEntries.push({ teamId, goalieId: stint.goalieId });

                if (i === 0) {
                    startingGoalieEntries.push({ teamId, goalieId: stint.goalieId });
                    return;
                }
                const cameOut = timeline[i - 1];
                goalieChangeEntries.push({
                    teamId,
                    goalieId: stint.goalieId,
                    outGoalieId: cameOut.goalieId,
                    period: cameOut.row.period,
                    time: normalizeClockText(cameOut.row.time_out)
                });
            });
        });

    const startingGoaliesHtml = startingGoalieEntries
        .map(entry => `
            <div class="schedule-event-row is-starting-goalie">
                <span class="schedule-event-team">${teamBadge(sideCodeForTeamId(entry.teamId))}</span>
                <span class="schedule-event-main">
                    <span class="schedule-event-label">Starting Goalie</span>
                    <span class="schedule-event-detail">${scheduleEventPlayerTag(entry.goalieId)}</span>
                </span>
                <span class="schedule-event-time">P1</span>
            </div>
        `).join("");

    const events = [];

    goals.forEach(goal => {
        const scorerTag = scheduleEventPlayerTag(goal.scorer_id);
        const assistTags = [goal.assist1_id, goal.assist2_id]
            .map(scheduleEventPlayerTag)
            .filter(Boolean);

        events.push({
            teamCode: sideCodeForTeamId(goal.team_id),
            label: "Goal",
            detail: scorerTag,
            subDetail: assistTags.length ? `assist: ${assistTags.join(", ")}` : "",
            cssClass: "is-goal",
            timeLabel: periodTimeLabel(goal.period, normalizeClockText(goal.game_time)),
            key: sortKey(goal.period, goal.game_time)
        });
    });

    penalties.forEach(penalty => {
        events.push({
            teamCode: sideCodeForTeamId(penalty.team_id),
            label: penalty.minutes ? `Penalty (${penalty.minutes} min)` : "Penalty",
            detail: scheduleEventPlayerTag(penalty.player_id),
            subDetail: penalty.infraction || "",
            cssClass: "is-penalty",
            timeLabel: periodTimeLabel(penalty.period, normalizeClockText(penalty.game_time)),
            key: sortKey(penalty.period, penalty.game_time)
        });
    });

    // Goalie changes -- the starting goalies are already shown up top, so
    // they don't also appear in this timeline.
    goalieChangeEntries.forEach(change => {
        const outTag = scheduleEventPlayerTag(change.outGoalieId);
        const hasTime = GOALIE_CLOCK_PERIODS.includes(change.period);
        events.push({
            teamCode: sideCodeForTeamId(change.teamId),
            label: "Goalie Change",
            detail: scheduleEventPlayerTag(change.goalieId),
            subDetail: outTag ? `in for ${outTag}` : "",
            cssClass: "is-goalie-shift",
            timeLabel: hasTime ? periodTimeLabel(change.period, change.time) : "",
            key: sortKey(change.period, change.time, 1)
        });
    });

    events.sort((a, b) => {
        if (a.key[0] !== b.key[0]) return a.key[0] - b.key[0];
        if (a.key[1] !== b.key[1]) return a.key[1] - b.key[1];
        return a.key[2] - b.key[2];
    });

    const eventRowHtml = event => `
        <div class="schedule-event-row ${event.cssClass}">
            <span class="schedule-event-team">${teamBadge(event.teamCode)}</span>
            <span class="schedule-event-main">
                <span class="schedule-event-label">${event.label}</span>
                ${event.detail ? `<span class="schedule-event-detail">${event.detail}</span>` : ""}
                ${event.subDetail ? `<span class="schedule-event-subdetail">(${event.subDetail})</span>` : ""}
            </span>
            <span class="schedule-event-time">${event.timeLabel}</span>
        </div>
    `;

    const eventsHtml = events.map(eventRowHtml).join("");

    // A game that's still on (the home page's "Watch live"): who's in
    // net right now, then everything that's happened with the latest first.
    if (options.live) {
        const inNetHtml = inNetEntries.map(entry => `
            <div class="schedule-event-row is-starting-goalie">
                <span class="schedule-event-team">${teamBadge(sideCodeForTeamId(entry.teamId))}</span>
                <span class="schedule-event-main">
                    <span class="schedule-event-label">In Net</span>
                    <span class="schedule-event-detail">${scheduleEventPlayerTag(entry.goalieId)}</span>
                </span>
                <span class="schedule-event-time"></span>
            </div>
        `).join("");

        const latestFirstHtml = events.slice().reverse().map(eventRowHtml).join("");

        return `
            ${inNetHtml ? `
                <div class="schedule-detail-section">
                    <h5>In Net Now</h5>
                    ${inNetHtml}
                </div>
            ` : ""}
            <div class="schedule-detail-section">
                <h5>Game Events — latest first</h5>
                ${latestFirstHtml || `<p class="schedule-detail-empty">Nothing yet. Goals and penalties show here as they happen.</p>`}
            </div>
        `;
    }

    if (!startingGoaliesHtml && !eventsHtml) {
        return `<p class="schedule-detail-empty">No game events recorded for this game.</p>`;
    }

    return `
        ${startingGoaliesHtml ? `
            <div class="schedule-detail-section">
                <h5>Starting Goalies</h5>
                ${startingGoaliesHtml}
            </div>
        ` : ""}
        ${eventsHtml ? `
            <div class="schedule-detail-section">
                <h5>Game Events</h5>
                ${eventsHtml}
            </div>
        ` : ""}
    `;
}


/* =========================================
   SCHEDULE — PRINT / EXPORT ONE-PAGE SCHEDULE
   ========================================= */

const PRINT_MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "MMM DD, YYYY" date for the printable sheet -- no weekday (every JOHL
// game is a Sunday, so it'd just be dead weight) and built by hand rather
// than left to toLocaleDateString so the format never varies, and kept on
// one line via white-space:nowrap in the print CSS.
function formatDateCompact(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return `${PRINT_MONTH_ABBR[m - 1]} ${String(d).padStart(2, "0")}, ${y}`;
}

// Builds the hidden print sheet's markup: every game in the season (not
// just whichever team filter is active on screen -- the printable copy is
// always the full schedule), plus a sponsors line-up at the bottom. Called
// fresh every time the print button is used so it always reflects the
// latest schedule data.
function printableScheduleRowHtml(game) {
    const isTbd = game.home === "TBD" || game.away === "TBD";
    const matchup = isTbd
        ? `${teamName(game.away)} vs. ${teamName(game.home)}`
        : `${teamName(game.away)} @ ${teamName(game.home)}`;
    const locationLabel = game.location && game.location !== "Jordan Arena" ? ` — ${game.location}` : "";
    let resultLabel = "";
    if (game.status === "final") {
        resultLabel = ` &nbsp;<strong>${game.awayScore ?? 0}–${game.homeScore ?? 0}</strong>${game.wentOT ? " (OT)" : ""}`;
    }

    return `
        <div class="print-game-row">
            <span class="print-game-date">${formatDateCompact(game.date)}</span>
            <span class="print-game-time">${formatTime12h(game.time)}</span>
            <span class="print-game-matchup">${matchup}${locationLabel}${resultLabel}</span>
        </div>
    `;
}

function printableRosterRowHtml(player) {
    return `
        <div class="print-roster-row">
            <span>${player.first} ${player.last}${isGoaliePosition(player.position) ? " (G)" : ""}</span>
            <span>${player.number != null ? "#" + player.number : ""}</span>
        </div>
    `;
}

// Builds the hidden print sheet's markup. When "All Teams" is selected on
// screen it's the whole season plus every sponsor; when a specific team's
// filter is active, the print/export only includes that team's own games
// (who they play and when) plus that team's roster (name + number) and
// sponsor, since that's what a player from that team actually wants on a
// one-page printout. Called fresh every time the print button is used so
// it always reflects the latest schedule data and whichever filter is
// currently selected.
function buildPrintableScheduleHtml(teamCode) {
    const filterActive = !!teamCode && teamCode !== "ALL";

    let games = SCHEDULE.filter(g => !g.noGames);
    if (filterActive) {
        games = games.filter(g => g.home === teamCode || g.away === teamCode);
    }
    games = games.slice().sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));

    let columnsHtml;

    if (filterActive) {
        // One column of that team's games, plus a roster column alongside
        // it -- no need to split the (much shorter) game list in two.
        const gamesHtml = games.map(printableScheduleRowHtml).join("") ||
            `<p class="schedule-detail-empty">No games scheduled yet.</p>`;

        const roster = PLAYERS
            .filter(p => p.team === teamCode)
            .slice()
            .sort((a, b) => {
                if (a.number != null && b.number != null) return a.number - b.number;
                if (a.number != null) return -1;
                if (b.number != null) return 1;
                return a.last.localeCompare(b.last);
            });
        const rosterHtml = roster.map(printableRosterRowHtml).join("") ||
            `<p class="schedule-detail-empty">No players listed.</p>`;

        columnsHtml = `
            <div class="print-column print-column-schedule">${gamesHtml}</div>
            <div class="print-column print-roster-column">
                <h4>Roster</h4>
                ${rosterHtml}
            </div>
        `;
    } else {
        // Split the full season into two columns ourselves (rather than
        // relying on CSS multi-column, which several mobile browsers'
        // print/PDF engines render unreliably -- collapsing to one column
        // and spilling onto a second page). Two plain side-by-side blocks
        // print consistently everywhere.
        const midpoint = Math.ceil(games.length / 2);
        columnsHtml = `
            <div class="print-column">${games.slice(0, midpoint).map(printableScheduleRowHtml).join("")}</div>
            <div class="print-column">${games.slice(midpoint).map(printableScheduleRowHtml).join("")}</div>
        `;
    }

    // Always a full team-by-team sponsor directory at the bottom, listing
    // every team in the league and its sponsor -- regardless of whether a
    // team filter is active, since the ask here is specifically "list all
    // the teams and their sponsors", not just the filtered team's own.
    const allSponsors = typeof SPONSORS !== "undefined" ? SPONSORS : [];
    const sponsorsHtml = TEAMS.map(t => {
        const sponsor = allSponsors.find(s => s.team === t.code);
        if (!sponsor) return "";
        return `<span class="print-sponsor-item"><strong>${t.name}</strong> — ${sponsor.name}${sponsor.url ? ` (${sponsor.url.replace(/^https?:\/\//, "").replace(/\/$/, "")})` : ""}</span>`;
    }).filter(Boolean).join("");

    const team = filterActive ? getTeam(teamCode) : null;
    const subtitle = filterActive
        ? `${team ? team.name : teamCode} — 2026–27 Season Schedule`
        : "2026–27 Season Schedule — Jordan Arena unless noted";

    return `
        <div class="print-sheet-header">
            <h1>Jordan Oldtimers Hockey League</h1>
            <p>${subtitle}</p>
        </div>
        <div class="print-sheet-columns">
            ${columnsHtml}
        </div>
        ${sponsorsHtml ? `
            <div class="print-sponsors">
                <h4>Teams &amp; Sponsors</h4>
                <div class="print-sponsors-list">${sponsorsHtml}</div>
            </div>
        ` : ""}
    `;
}

// Populates the hidden print sheet and opens the browser's print dialog,
// where the person can print to a physical printer or choose "Save as
// PDF" to export it. Uses whichever team filter is currently selected on
// screen, so a player who's filtered to their own team gets just their
// games and roster. Restores the normal page view once printing is done
// (or cancelled) via the "afterprint" event.
function printFullSchedule() {
    const sheet = document.getElementById("schedule-print-sheet");
    if (!sheet) return;

    sheet.innerHTML = buildPrintableScheduleHtml(currentScheduleFilter);
    document.body.classList.add("printing-schedule");

    const restore = () => {
        document.body.classList.remove("printing-schedule");
        window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);

    window.print();
}

// Tracks whichever team filter is currently selected on schedule.html so a
// live update (from subscribeToGameUpdates) can re-render with the same
// filter still applied instead of resetting it to "ALL".
let currentScheduleFilter = "ALL";

function setupScheduleFilters() {
    const buttons = document.querySelectorAll(".filter-button");
    if (buttons.length === 0) return;

    // Honour ?team= query param on load
    const params = new URLSearchParams(window.location.search);
    const initialTeam = params.get("team");

    buttons.forEach(button => {
        if (initialTeam && button.dataset.team === initialTeam) {
            buttons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
        }

        button.addEventListener("click", () => {
            buttons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            currentScheduleFilter = button.dataset.team;
            renderSchedule(currentScheduleFilter);
            updateSchedulePrintButtonLabel(currentScheduleFilter);
        });
    });

    currentScheduleFilter = initialTeam || "ALL";
    renderSchedule(currentScheduleFilter);
    updateSchedulePrintButtonLabel(currentScheduleFilter);
}

// Keeps the print button's own label honest about what it's about to
// export, since pressing it now only exports the selected team's games
// (plus their roster) once a team filter is active.
function updateSchedulePrintButtonLabel(teamCode) {
    const button = document.getElementById("schedule-print-button");
    if (!button) return;

    if (!teamCode || teamCode === "ALL") {
        button.textContent = "🖨️ Print / Export Full Schedule";
    } else {
        const team = getTeam(teamCode);
        button.textContent = `🖨️ Print / Export ${team ? team.name : teamCode} Schedule`;
    }
}


/* =========================================
   PLAYERS / ROSTERS (players.html)
   ========================================= */

function renderPlayers() {
    const element = document.getElementById("players-table");
    if (!element) return;

    const search = document.getElementById("player-search")?.value.toLowerCase() || "";
    const selectedTeam = document.getElementById("player-team")?.value || "ALL";

    const filtered = PLAYERS
        .filter(player => {
            const fullName = `${player.first} ${player.last}`.toLowerCase();
            const matchesSearch = fullName.includes(search);
            const matchesTeam = selectedTeam === "ALL" || player.team === selectedTeam;
            return matchesSearch && matchesTeam;
        })
        .sort((a, b) => {
            if (a.team !== b.team) return a.team.localeCompare(b.team);
            // Numbered players first, ordered by number; unnumbered players
            // fall to the end, sorted by last name.
            if (a.number != null && b.number != null) return a.number - b.number;
            if (a.number != null) return -1;
            if (b.number != null) return 1;
            return a.last.localeCompare(b.last);
        });

    if (filtered.length === 0) {
        element.innerHTML = `<tr><td colspan="4">No players found.</td></tr>`;
        return;
    }

    element.innerHTML = filtered.map(player => `
        <tr class="clickable-row" onclick="window.location.href='players.html?player=${player.id}'">
            <td>${player.number != null ? `#${player.number}` : "—"}</td>
            <td><strong>${player.last}, ${player.first}</strong></td>
            <td>
                <div class="roster-team">
                    ${teamBadge(player.team)}
                    <span>${teamName(player.team)}</span>
                </div>
            </td>
            <td>
                <span class="position-tag ${isGoaliePosition(player.position) ? "goalie" : ""}">
                    ${isGoaliePosition(player.position) ? "Goalie" : "Skater"}
                </span>
            </td>
        </tr>
    `).join("");

    const countEl = document.getElementById("player-count");
    if (countEl) {
        countEl.textContent = `${filtered.length} player${filtered.length === 1 ? "" : "s"}`;
    }
}

// A player, clicked from this table, the Teams roster, or the Leaders
// board (players.html?player=ID) gets a focused view instead of the
// full roster: their season line plus a per-game log. Games only show
// up here if the player has a recorded goal, assist, penalty, or (for a
// goalie) a goalie-period stint in them -- there's no separate "who
// dressed" record to fall back on for a scoreless, penalty-free game.
async function renderPlayerDetail(playerId) {
    const detail = document.getElementById("player-detail");
    if (!detail) return false;

    const player = PLAYERS.find(p => String(p.id) === String(playerId));
    if (!player) {
        detail.style.display = "none";
        return false;
    }

    document.getElementById("players-page-title")?.style.setProperty("display", "none");
    document.querySelector(".player-controls")?.style.setProperty("display", "none");
    document.getElementById("players-roster-wrapper")?.style.setProperty("display", "none");
    detail.style.display = "";

    const isGoalie = isGoaliePosition(player.position);
    const gameLookup = {};
    SCHEDULE.forEach(g => { gameLookup[g.id] = g; });

    function opponentLabel(game) {
        const opponent = game.home === player.team ? game.away : game.home;
        const atOrVs = game.home === player.team ? "vs" : "@";
        return `${atOrVs} ${teamName(opponent)}`;
    }

    function gameSortKey(game) {
        return `${game.date} ${game.time || ""}`;
    }

    let summaryHtml, columnsHtml, rowsHtml;

    if (isGoalie) {
        const stats = await computeGoalieStats();
        const s = stats && stats[player.id];
        const gp = s ? s.games.size : 0;
        const ga = s ? s.ga : 0;
        const minutesPlayed = s ? s.secondsPlayed / 60 : 0;
        const gaa = s ? computeGaa(s.gaTimed, s.secondsPlayed) : 0;

        summaryHtml = `
            <div class="player-detail-stats">
                <div><span>${gp}</span><label>GP</label></div>
                <div><span>${minutesPlayed.toFixed(1)}</span><label>Minutes</label></div>
                <div><span>${ga}</span><label>GA</label></div>
                <div><span>${gaa.toFixed(2)}</span><label>GAA</label></div>
            </div>
        `;

        columnsHtml = `<th>Date</th><th>Opponent</th><th>Time</th><th>GA</th>`;

        const games = s
            ? Object.keys(s.perGame).map(id => ({
                  game: gameLookup[id],
                  ga: s.perGame[id],
                  seconds: s.perGameSeconds[id] || 0
              })).filter(r => r.game)
            : [];
        games.sort((a, b) => gameSortKey(a.game).localeCompare(gameSortKey(b.game)));

        rowsHtml = games.map(row => `
            <tr>
                <td>${formatDateISO(row.game.date)}</td>
                <td>${opponentLabel(row.game)}</td>
                <td>${formatSecondsAsClock(row.seconds)}</td>
                <td>${row.ga}</td>
            </tr>
        `).join("");
    } else {
        const stats = await computeSkaterStats();
        const s = stats && stats[player.id];
        const gp = s ? s.games.size : 0;
        const goals = s ? s.goals : 0;
        const assists = s ? s.assists : 0;

        summaryHtml = `
            <div class="player-detail-stats">
                <div><span>${gp}</span><label>GP</label></div>
                <div><span>${goals}</span><label>G</label></div>
                <div><span>${assists}</span><label>A</label></div>
                <div><span>${goals + assists}</span><label>PTS</label></div>
            </div>
        `;

        columnsHtml = `<th>Date</th><th>Opponent</th><th>G</th><th>A</th><th>PTS</th>`;

        const games = s
            ? Object.keys(s.perGame).map(id => ({ game: gameLookup[id], line: s.perGame[id] })).filter(r => r.game)
            : [];
        games.sort((a, b) => gameSortKey(a.game).localeCompare(gameSortKey(b.game)));

        rowsHtml = games.map(row => `
            <tr>
                <td>${formatDateISO(row.game.date)}</td>
                <td>${opponentLabel(row.game)}</td>
                <td>${row.line.goals}</td>
                <td>${row.line.assists}</td>
                <td><strong>${row.line.goals + row.line.assists}</strong></td>
            </tr>
        `).join("");
    }

    detail.innerHTML = `
        <a href="players.html" class="link-button">← All players</a>

        <div class="player-detail-card">
            ${teamBadge(player.team)}
            <div>
                <h2>${player.first} ${player.last} ${player.number != null ? `<span class="player-detail-number">#${player.number}</span>` : ""}</h2>
                <p>${teamName(player.team)} &middot; ${isGoalie ? "Goalie" : "Skater"}</p>
            </div>
        </div>

        ${summaryHtml}

        <h4>Game Log</h4>
        ${rowsHtml ? `
            <div class="table-wrapper">
                <table class="standings-table">
                    <thead><tr>${columnsHtml}</tr></thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        ` : `<p class="roster-empty">No recorded games yet this season.</p>`}
    `;

    return true;
}

function setupPlayerFilters() {
    const search = document.getElementById("player-search");
    const team = document.getElementById("player-team");

    const params = new URLSearchParams(window.location.search);

    // A specific player (from the Teams roster, this table, or Leaders)
    // gets the focused game-log view instead of the roster table.
    const playerId = params.get("player");
    if (playerId && document.getElementById("player-detail")) {
        renderPlayerDetail(playerId);
        return;
    }

    // Honour ?team= query param on load (from a team card link)
    const initialTeam = params.get("team");
    if (initialTeam && team) {
        team.value = initialTeam;
    }

    if (search) search.addEventListener("input", renderPlayers);
    if (team) team.addEventListener("change", renderPlayers);

    renderPlayers();
}


/* =========================================
   SPONSORS (home page)
   ========================================= */

function renderSponsors() {
    const element = document.getElementById("sponsor-grid");
    if (!element) return;

    element.innerHTML = SPONSORS.map(sponsor => {
        const team = getTeam(sponsor.team);
        const teamLabel = team ? `Proud sponsor of the ${team.name}` : "";
        const inner = `
            <div class="sponsor-name">${sponsor.name}</div>
            ${teamLabel ? `<p class="sponsor-team">${teamLabel}</p>` : ""}
            ${sponsor.blurb ? `<p class="sponsor-blurb">${sponsor.blurb}</p>` : ""}
        `;

        if (sponsor.url) {
            return `<a class="sponsor-card" href="${sponsor.url}" target="_blank" rel="noopener">${inner}</a>`;
        }
        return `<div class="sponsor-card">${inner}</div>`;
    }).join("");
}


/* =========================================
   STANDINGS (standings.html)
   ========================================= */

// Standard beer-league points: Win = 2, OT/shootout loss = 1, Tie = 1,
// regulation loss = 0. Only "final" games count; live/scheduled games
// (and bye weeks) are ignored until they're marked final in admin.
function computeStandings() {
    const stats = {};

    TEAMS.forEach(team => {
        stats[team.code] = { code: team.code, gp: 0, w: 0, l: 0, t: 0, otl: 0, gf: 0, ga: 0 };
    });

    SCHEDULE.forEach(game => {
        if (game.noGames || game.status !== "final") return;
        if (game.home === "TBD" || game.away === "TBD") return;

        const home = stats[game.home];
        const away = stats[game.away];
        if (!home || !away) return;

        const homeScore = game.homeScore ?? 0;
        const awayScore = game.awayScore ?? 0;

        home.gp++; away.gp++;
        home.gf += homeScore; home.ga += awayScore;
        away.gf += awayScore; away.ga += homeScore;

        if (homeScore === awayScore) {
            home.t++; away.t++;
        } else if (homeScore > awayScore) {
            home.w++;
            if (game.wentOT) away.otl++; else away.l++;
        } else {
            away.w++;
            if (game.wentOT) home.otl++; else home.l++;
        }
    });

    return Object.values(stats)
        .map(s => ({ ...s, pts: s.w * 2 + s.otl + s.t }))
        .sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.w !== a.w) return b.w - a.w;
            const diffA = a.gf - a.ga;
            const diffB = b.gf - b.ga;
            if (diffB !== diffA) return diffB - diffA;
            if (b.gf !== a.gf) return b.gf - a.gf;
            return teamName(a.code).localeCompare(teamName(b.code));
        });
}

function renderStandings() {
    const element = document.getElementById("standings-table");
    if (!element) return;

    const standings = computeStandings();

    element.innerHTML = standings.map(s => `
        <tr>
            <td class="team-name-cell">
                <a class="standings-team" href="teams.html?team=${s.code}">
                    ${teamBadge(s.code)}
                    <span>${teamName(s.code)}</span>
                </a>
            </td>
            <td>${s.gp}</td>
            <td>${s.w}</td>
            <td>${s.l}</td>
            <td>${s.t}</td>
            <td>${s.otl}</td>
            <td>${s.gf}</td>
            <td>${s.ga}</td>
            <td><strong>${s.pts}</strong></td>
        </tr>
    `).join("");
}


/* =========================================
   LEADERS (leaders.html)
   ========================================= */

// Skater stats (goals, assists, games played), keyed by player id --
// shared by the Leaders page, the Teams page roster, and a player's own
// game log. GP counts any game the player recorded a goal, an assist, or
// a penalty in; a game with none of those for a given skater won't show
// up, since the site has no separate "who dressed" record to fall back
// on. Cached for the life of the page since these pages don't need it
// to update live.
let SKATER_STATS_CACHE = null;

async function computeSkaterStats() {
    if (SKATER_STATS_CACHE) return SKATER_STATS_CACHE;

    const [{ data: goals, error: goalsError }, { data: penalties, error: penaltiesError }] = await Promise.all([
        supabaseClient.from("game_goals").select("game_id, scorer_id, assist1_id, assist2_id"),
        supabaseClient.from("game_penalties").select("game_id, player_id")
    ]);

    if (goalsError || penaltiesError) {
        console.error("Error loading skater stats:", goalsError || penaltiesError);
        return null;
    }

    const stats = {};
    function statsFor(playerId) {
        if (!stats[playerId]) {
            stats[playerId] = { playerId, games: new Set(), goals: 0, assists: 0, perGame: {} };
        }
        return stats[playerId];
    }
    function bump(gameId, playerId, field) {
        if (!playerId) return;
        const s = statsFor(playerId);
        s.games.add(gameId);
        if (!s.perGame[gameId]) s.perGame[gameId] = { goals: 0, assists: 0 };
        if (field) {
            s[field]++;
            s.perGame[gameId][field]++;
        }
    }

    (goals || []).forEach(g => {
        bump(g.game_id, g.scorer_id, "goals");
        bump(g.game_id, g.assist1_id, "assists");
        bump(g.game_id, g.assist2_id, "assists");
    });
    // A penalty with no points still counts as a game appearance.
    (penalties || []).forEach(p => bump(p.game_id, p.player_id, null));

    SKATER_STATS_CACHE = stats;
    return stats;
}

// Turns the raw computeSkaterStats() map into display-ready rows, sorted
// points-then-goals-then-name -- shared by the Leaders page and the
// Teams page roster.
function skaterStatsRows(stats) {
    return Object.values(stats)
        .map(s => {
            const player = PLAYERS.find(p => String(p.id) === String(s.playerId));
            if (!player) return null;
            const team = TEAMS.find(t => t.code === player.team);
            const points = s.goals + s.assists;
            return { player, team, gp: s.games.size, goals: s.goals, assists: s.assists, points };
        })
        .filter(row => row !== null)
        .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goals !== a.goals) return b.goals - a.goals;
            return (a.player.last || "").localeCompare(b.player.last || "");
        });
}

async function renderLeaders() {
    const table = document.getElementById("leaders-table");
    if (!table) return;

    const stats = await computeSkaterStats();
    if (!stats) {
        table.innerHTML = `<tr><td colspan="8">Unable to load the leaderboard right now.</td></tr>`;
        return;
    }

    const rows = skaterStatsRows(stats).filter(row => !isGoaliePosition(row.player.position));

    if (!rows.length) {
        table.innerHTML = `<tr><td colspan="8">No goals have been recorded yet this season.</td></tr>`;
        return;
    }

    table.innerHTML = rows.map((row, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${row.player.number != null ? "#" + row.player.number : "—"}</td>
            <td>${row.player.last}, ${row.player.first}</td>
            <td>${row.team ? row.team.name : ""}</td>
            <td>${row.gp}</td>
            <td>${row.goals}</td>
            <td>${row.assists}</td>
            <td><strong>${row.points}</strong></td>
        </tr>
    `).join("");
}


/* =========================================
   GOALIE STATS (leaders.html)

   Goals-against only (no shots-against are tracked, so no save %).

   Each team's goalies for a game are entered the way the paper score
   sheet records them: one row per goalie, in the order they played,
   with the period and clock time that goalie CAME OUT of the net
   (game_goalie_periods.period / time_out). The goalie who finished the
   game has no time, because he never came out.

   From that, the game is laid out on one running clock from the opening
   faceoff, and each goalie owns the stretch from the moment the previous
   goalie came out to the moment he came out himself. A goal is charged
   to whoever owned the stretch it was scored in. A goal scored at the
   exact time a goalie came out is charged to the goalie coming OUT
   (it's the last goal he let in), the same way the score sheet tallies it.
   ========================================= */

const GOALIE_STATS_PERIOD_ORDER = ["1", "2", "3", "OT", "SO"];

// Periods with a running clock -- the ones a goalie can come out in. A
// shootout has no clock, so it's never a "came out" period.
const GOALIE_CLOCK_PERIODS = ["1", "2", "3", "OT"];

// Regulation periods are always 20 minutes per the constitution. OT is a
// 10-minute sudden-death period in the normal case; a championship
// game's OT runs a full 20 minutes instead (see overtimeLengthSeconds).
const REGULATION_PERIOD_SECONDS = 1200;
const REGULATION_GAME_SECONDS = 3600;
const DEFAULT_OT_SECONDS = 600;

// How long a game's OT period was. Normally 10 minutes; if anything in
// that OT (a goal, or a goalie coming out) was recorded with more than
// 10:00 on the clock, it must have been a 20-minute championship OT.
function overtimeLengthSeconds(gameGoals, gameGoalieRows) {
    const readings = [];
    (gameGoals || []).forEach(goal => {
        if (goal.period === "OT") readings.push(parseClockToSeconds(goal.game_time));
    });
    (gameGoalieRows || []).forEach(row => {
        if (row.period === "OT") readings.push(parseClockToSeconds(row.time_out));
    });
    return readings.some(secs => secs != null && secs > DEFAULT_OT_SECONDS)
        ? REGULATION_PERIOD_SECONDS
        : DEFAULT_OT_SECONDS;
}

// Converts a period + clock reading into seconds elapsed since the
// opening faceoff. The clock counts DOWN within a period, so 9:48 left in
// the 2nd is 20:00 (all of the 1st) + 10:12 = 30:12 into the game.
// Returns null if the period has no running clock or the time is unknown.
function gameElapsedSeconds(period, clockSeconds, otSeconds) {
    const index = GOALIE_CLOCK_PERIODS.indexOf(period);
    if (index === -1 || clockSeconds == null) return null;

    const isOT = period === "OT";
    const length = isOT ? otSeconds : REGULATION_PERIOD_SECONDS;
    const start = isOT ? REGULATION_GAME_SECONDS : index * REGULATION_PERIOD_SECONDS;
    return start + (length - Math.min(clockSeconds, length));
}

// Where the game ended on the running clock. Regulation always runs its
// full 60 minutes. OT is sudden death, so it ends the instant somebody
// scores (that goal's own recorded time); an OT with no timed goal --
// one that expired and went to a shootout, say -- ran its full length.
// Shootouts have no continuous ice time, so they add nothing.
function gameEndElapsedSeconds(gameGoals, gameGoalieRows, otSeconds) {
    const wentPastRegulation =
        (gameGoals || []).some(goal => goal.period === "OT" || goal.period === "SO") ||
        (gameGoalieRows || []).some(row => row.period === "OT");
    if (!wentPastRegulation) return REGULATION_GAME_SECONDS;

    const otGoal = (gameGoals || []).find(goal => goal.period === "OT");
    const secs = otGoal ? parseClockToSeconds(otGoal.game_time) : null;
    return secs != null
        ? gameElapsedSeconds("OT", secs, otSeconds)
        : REGULATION_GAME_SECONDS + otSeconds;
}

// Turns ONE team's goalie rows for ONE game into the order they played,
// as [{ goalieId, start, end, row }] with start/end in elapsed seconds.
// Each row needs { goalie_id, period, time_out } -- the period and clock
// time that goalie came out (both blank for the goalie who finished).
//
// The first goalie starts at the opening faceoff; each one after starts
// when the one before came out. The last goalie in the list always runs
// to the end of the game, whether or not a time was recorded for him.
function buildGoalieTimeline(rows, otSeconds) {
    const stints = (rows || []).map((row, index) => ({
        row,
        index,
        goalieId: row.goalie_id,
        end: gameElapsedSeconds(row.period, parseClockToSeconds(row.time_out), otSeconds)
    }));

    // Earliest "came out" first; a goalie with no time recorded never came
    // out, so he goes last. Ties keep the order the rows were given in.
    stints.sort((a, b) => {
        const aEnd = a.end == null ? Infinity : a.end;
        const bEnd = b.end == null ? Infinity : b.end;
        if (aEnd !== bEnd) return aEnd - bEnd;
        return a.index - b.index;
    });

    let start = 0;
    stints.forEach((stint, i) => {
        stint.start = start;
        if (stint.end == null || i === stints.length - 1) stint.end = Infinity;
        start = stint.end;
    });

    return stints;
}

// Where a goal falls on the game's running clock. A goal with no usable
// time is placed just after the start of its period, so it's charged to
// whoever was in net when that period began. Shootout goals come after
// everything else, so they land on the goalie who finished the game.
function goalElapsedSeconds(goal, otSeconds) {
    if (goal.period === "SO") return Infinity;

    const index = GOALIE_CLOCK_PERIODS.indexOf(goal.period);
    if (index === -1) return 0.5;

    const elapsed = gameElapsedSeconds(goal.period, parseClockToSeconds(goal.game_time), otSeconds);
    if (elapsed != null) return elapsed;

    const periodStart = goal.period === "OT" ? REGULATION_GAME_SECONDS : index * REGULATION_PERIOD_SECONDS;
    return periodStart + 0.5;
}

// Which goalie was in net at a given point on the running clock. The
// comparison is "at or before the time he came out", which is what
// charges a goal at the exact change time to the goalie coming out.
function goalieStintAt(timeline, elapsed) {
    if (!timeline.length) return null;
    return timeline.find(stint => elapsed <= stint.end) || timeline[timeline.length - 1];
}

// Goals against for each of one team's goalie rows in one game, as a
// Map of row -> count. Shared by the stats below and by Admin's Enter
// Game Results screen, which shows the tally beside each goalie so it
// can be checked against the "Goals" box on the paper score sheet.
function goalsAgainstByGoalieRow(rows, opponentGoals, otSeconds) {
    const timeline = buildGoalieTimeline(rows, otSeconds);
    const counts = new Map(timeline.map(stint => [stint.row, 0]));

    (opponentGoals || []).forEach(goal => {
        const stint = goalieStintAt(timeline, goalElapsedSeconds(goal, otSeconds));
        if (stint) counts.set(stint.row, counts.get(stint.row) + 1);
    });

    return counts;
}

// Works out every goalie's season numbers from the raw goalie rows and
// goals (all games). Kept separate from the Supabase fetch below so the
// arithmetic can be checked on its own.
//
// Ice time is real clock time, not whole periods: a goalie who starts and
// comes out at 9:48 of the 2nd is credited with 30:12, and the goalie who
// replaces him with the other 29:48.
function buildGoalieStats(goalieRows, goals) {
    const rowsByGame = {};
    (goalieRows || []).forEach(row => {
        if (!rowsByGame[row.game_id]) rowsByGame[row.game_id] = [];
        rowsByGame[row.game_id].push(row);
    });

    const goalsByGame = {};
    (goals || []).forEach(goal => {
        if (!goalsByGame[goal.game_id]) goalsByGame[goal.game_id] = [];
        goalsByGame[goal.game_id].push(goal);
    });

    const stats = {};
    function statsFor(goalieId) {
        if (!stats[goalieId]) {
            stats[goalieId] = {
                goalieId, games: new Set(), periodsPlayed: new Set(),
                ga: 0, gaTimed: 0, secondsPlayed: 0, perGame: {}, perGameSeconds: {}
            };
        }
        return stats[goalieId];
    }

    Object.keys(rowsByGame).forEach(gameId => {
        const gameRows = rowsByGame[gameId];
        const gameGoals = goalsByGame[gameId] || [];
        const otSeconds = overtimeLengthSeconds(gameGoals, gameRows);
        const gameEnd = gameEndElapsedSeconds(gameGoals, gameRows, otSeconds);

        const teamIds = [...new Set(gameRows.map(row => String(row.team_id)))];

        teamIds.forEach(teamId => {
            const timeline = buildGoalieTimeline(
                gameRows.filter(row => String(row.team_id) === teamId),
                otSeconds
            );

            timeline.forEach(stint => {
                const s = statsFor(stint.goalieId);
                s.games.add(gameId);
                if (s.perGame[gameId] == null) s.perGame[gameId] = 0;
                if (s.perGameSeconds[gameId] == null) s.perGameSeconds[gameId] = 0;

                const from = Math.min(stint.start, gameEnd);
                const to = Math.min(stint.end, gameEnd);
                const seconds = Math.max(0, to - from);
                s.secondsPlayed += seconds;
                s.perGameSeconds[gameId] += seconds;

                GOALIE_CLOCK_PERIODS.forEach((period, index) => {
                    const periodStart = period === "OT" ? REGULATION_GAME_SECONDS : index * REGULATION_PERIOD_SECONDS;
                    const periodEnd = period === "OT" ? gameEnd : periodStart + REGULATION_PERIOD_SECONDS;
                    if (Math.min(to, periodEnd) - Math.max(from, periodStart) > 0) {
                        s.periodsPlayed.add(`${gameId}|${period}`);
                    }
                });
            });

            // Every goal the OTHER team scored in this game went in against
            // whichever of this team's goalies was in net at that moment.
            gameGoals
                .filter(goal => String(goal.team_id) !== teamId)
                .forEach(goal => {
                    const stint = goalieStintAt(timeline, goalElapsedSeconds(goal, otSeconds));
                    if (!stint) return;
                    const s = statsFor(stint.goalieId);
                    s.ga++;
                    s.perGame[gameId] = (s.perGame[gameId] || 0) + 1;
                    // GAA is a rate stat measured against ice time, and
                    // shootout goals don't count against it (standard
                    // hockey convention -- a shootout has no ice time).
                    if (goal.period !== "SO") s.gaTimed++;
                });
        });
    });

    return stats;
}

// Computes goals-against for every goalie who has appeared in a game,
// keyed by player id -- shared by the Leaders page, the Teams page
// roster, and a player's own game log. Cached for the life of the page
// since none of these pages need it to update live.
let GOALIE_STATS_CACHE = null;

async function computeGoalieStats() {
    if (GOALIE_STATS_CACHE) return GOALIE_STATS_CACHE;

    const [{ data: goalieRows, error: goalieRowsError }, { data: goals, error: goalsError }] = await Promise.all([
        supabaseClient.from("game_goalie_periods").select("id, game_id, team_id, goalie_id, period, time_out").order("id"),
        supabaseClient.from("game_goals").select("game_id, team_id, period, game_time")
    ]);

    if (goalieRowsError || goalsError) {
        console.error("Error loading goalie stats:", goalieRowsError || goalsError);
        return null;
    }

    GOALIE_STATS_CACHE = buildGoalieStats(goalieRows || [], goals || []);
    return GOALIE_STATS_CACHE;
}

// GAA (goals-against average) is the standard hockey rate stat: goals
// against per 60 minutes of actual ice time, not per game or per period.
function computeGaa(goalsAgainst, secondsPlayed) {
    return secondsPlayed > 0 ? (goalsAgainst * 3600) / secondsPlayed : 0;
}

// Turns the raw computeGoalieStats() map into display-ready rows (one
// per goalie, sorted best GAA first) for the Leaders page and the
// Teams page roster.
function goalieStatsRows(stats) {
    return Object.values(stats)
        .map(s => {
            const player = PLAYERS.find(p => String(p.id) === String(s.goalieId));
            if (!player) return null;
            const team = TEAMS.find(t => t.code === player.team);
            return {
                player,
                team,
                gp: s.games.size,
                periodsPlayed: s.periodsPlayed.size,
                minutesPlayed: s.secondsPlayed / 60,
                ga: s.ga,
                gaa: computeGaa(s.gaTimed, s.secondsPlayed)
            };
        })
        .filter(row => row !== null)
        .sort((a, b) => {
            if (a.gaa !== b.gaa) return a.gaa - b.gaa;
            return (a.player.last || "").localeCompare(b.player.last || "");
        });
}

async function renderGoalieStats() {
    const table = document.getElementById("goalies-table");
    if (!table) return;

    const stats = await computeGoalieStats();
    if (!stats) {
        table.innerHTML = `<tr><td colspan="7">Unable to load goalie stats right now.</td></tr>`;
        return;
    }

    const rows = goalieStatsRows(stats);

    if (!rows.length) {
        table.innerHTML = `<tr><td colspan="7">No goalie appearances have been recorded yet this season.</td></tr>`;
        return;
    }

    table.innerHTML = rows.map(row => `
        <tr>
            <td>${row.player.number != null ? "#" + row.player.number : "—"}</td>
            <td>${row.player.last}, ${row.player.first}</td>
            <td>${row.team ? row.team.name : ""}</td>
            <td>${row.gp}</td>
            <td>${row.minutesPlayed.toFixed(1)}</td>
            <td>${row.ga}</td>
            <td><strong>${row.gaa.toFixed(2)}</strong></td>
        </tr>
    `).join("");
}


/* =========================================
   NAV — LOGIN / LOGOUT / ADMIN LINK
   ========================================= */

async function setupAuthNav() {
    const slot = document.getElementById("nav-auth-slot");
    if (!slot) return;

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        // Just the link goes in the nav. The dropdown itself is built
        // separately, attached to <body> (see setupLoginDropdown()) so
        // its size can never push the header/nav layout around.
        slot.innerHTML = `<a href="#" id="nav-login-link">Login</a>`;

        setupLoginDropdown();
        return;
    }

    let isAdmin = false;
    let isTimekeeper = false;

    const { data: profile } = await supabaseClient
        .from("profiles")
        .select("is_admin, is_timekeeper")
        .eq("id", session.user.id)
        .single();

    if (profile && profile.is_admin) {
        isAdmin = true;
    }

    // The Score Sheet goes by its own role, not by admin.
    if (profile && profile.is_timekeeper) {
        isTimekeeper = true;
    }

    slot.innerHTML = `
        ${isTimekeeper ? `<a href="sheet.html">Score Sheet</a>` : ""}
        ${isAdmin ? `<a href="admin.html">Admin</a>` : ""}
        <a href="#" id="nav-logout-link">Logout</a>
    `;

    document.getElementById("nav-logout-link").addEventListener("click", function(event) {
        event.preventDefault();
        logout();
    });
}


/* =========================================
   LOGIN DROPDOWN (pop-out login modal)
   ========================================= */

function setupLoginDropdown() {
    const loginLink = document.getElementById("nav-login-link");
    if (!loginLink) return;

    // The dropdown is built once and attached directly to <body>, not
    // nested inside the header/nav. That way its content can NEVER
    // affect the header's height or push the page layout around --
    // it's always positioned with fixed pixel coordinates computed
    // from the Login link's own position, recalculated every time it
    // opens (and on resize), instead of depending on CSS positioning
    // context or load order.
    let dropdown = document.getElementById("login-dropdown");

    if (!dropdown) {
        dropdown = document.createElement("div");
        dropdown.id = "login-dropdown";
        dropdown.className = "login-dropdown";
        dropdown.hidden = true;
        dropdown.innerHTML = `
            <div class="login-card login-card-compact">

                <div id="nav-login-view">
                    <h3>Member Login</h3>

                    <form id="nav-login-form">
                        <label for="nav-login-email">Email</label>
                        <input type="email" id="nav-login-email" required autocomplete="email">

                        <label for="nav-login-password">Password</label>
                        <input type="password" id="nav-login-password" required autocomplete="current-password">

                        <button type="submit" class="btn btn-primary">Login</button>
                    </form>

                    <p id="nav-login-message"></p>

                    <a href="#" id="nav-forgot-link" class="login-dropdown-link">Forgot password?</a>
                </div>

                <div id="nav-forgot-view" hidden>
                    <h3>Reset Password</h3>
                    <p>Enter your email and we'll send you a link to reset your password.</p>

                    <form id="nav-forgot-form">
                        <label for="nav-forgot-email">Email</label>
                        <input type="email" id="nav-forgot-email" required autocomplete="email">

                        <button type="submit" class="btn btn-primary">Send Reset Link</button>
                    </form>

                    <p id="nav-forgot-message"></p>

                    <a href="#" id="nav-back-to-login-link" class="login-dropdown-link">Back to login</a>
                </div>

            </div>
        `;
        document.body.appendChild(dropdown);
    }

    const loginView = document.getElementById("nav-login-view");
    const forgotView = document.getElementById("nav-forgot-view");

    const loginForm = document.getElementById("nav-login-form");
    const forgotForm = document.getElementById("nav-forgot-form");

    const loginMessage = document.getElementById("nav-login-message");
    const forgotMessage = document.getElementById("nav-forgot-message");

    function positionDropdown() {
        const rect = loginLink.getBoundingClientRect();
        const width = Math.min(320, window.innerWidth - 24);

        let left = rect.right - width;
        if (left < 12) left = 12;
        if (left + width > window.innerWidth - 12) {
            left = window.innerWidth - 12 - width;
        }

        dropdown.style.position = "fixed";
        dropdown.style.top = (rect.bottom + 10) + "px";
        dropdown.style.left = left + "px";
        dropdown.style.width = width + "px";
    }

    function openDropdown() {
        positionDropdown();
        dropdown.hidden = false;
    }

    function closeDropdown() {
        dropdown.hidden = true;
        loginView.hidden = false;
        forgotView.hidden = true;
        loginMessage.textContent = "";
        forgotMessage.textContent = "";
    }

    function toggleDropdown() {
        if (dropdown.hidden) {
            openDropdown();
        } else {
            closeDropdown();
        }
    }

    loginLink.addEventListener("click", function(event) {
        event.preventDefault();
        event.stopPropagation();
        toggleDropdown();
    });

    // Close when clicking anywhere outside the dropdown (or the link).
    document.addEventListener("click", function(event) {
        if (!dropdown.contains(event.target) && event.target !== loginLink) {
            closeDropdown();
        }
    });

    // Don't let clicks inside the dropdown bubble up and close it.
    dropdown.addEventListener("click", function(event) {
        event.stopPropagation();
    });

    // Keep it anchored to the Login link if the window is resized while open.
    window.addEventListener("resize", function() {
        if (!dropdown.hidden) positionDropdown();
    });

    document.getElementById("nav-forgot-link").addEventListener("click", function(event) {
        event.preventDefault();
        loginView.hidden = true;
        forgotView.hidden = false;
        loginMessage.textContent = "";
    });

    document.getElementById("nav-back-to-login-link").addEventListener("click", function(event) {
        event.preventDefault();
        forgotView.hidden = true;
        loginView.hidden = false;
        forgotMessage.textContent = "";
    });

    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("nav-login-email").value.trim();
        const password = document.getElementById("nav-login-password").value;

        loginMessage.textContent = "Logging in...";

        const { error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error(error);
            loginMessage.textContent = "Login failed. Please check your email and password.";
            return;
        }

        loginMessage.textContent = "Success! Redirecting...";

        // If checkLogin() sent us here from a gated page, send the visitor
        // back there now that they're signed in. Otherwise just reload this
        // page (minus the ?login=1 flag) so the nav reflects the new session.
        const params = new URLSearchParams(window.location.search);
        const requestedRedirect = params.get("redirect");

        // Only ever redirect to one of our own bare .html filenames --
        // never to an absolute URL or path someone crafted in the query string.
        const redirectTo =
            requestedRedirect && /^[a-zA-Z0-9_-]+\.html$/.test(requestedRedirect)
                ? requestedRedirect
                : null;

        if (redirectTo) {
            window.location.href = redirectTo;
        } else {
            const url = new URL(window.location.href);
            url.searchParams.delete("login");
            url.searchParams.delete("redirect");
            window.location.href = url.toString();
        }
    });

    forgotForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("nav-forgot-email").value.trim();

        forgotMessage.textContent = "Sending reset email...";

        const { error } = await supabaseClient.auth.resetPasswordForEmail(email);

        if (error) {
            console.error(error);
            forgotMessage.textContent = "There was a problem sending the reset email.";
            return;
        }

        forgotMessage.textContent = "Check your email for a password reset link.";
    });

    // If we were sent here by checkLogin() (index.html?login=1), open the
    // dropdown automatically so the visitor isn't left guessing.
    if (new URLSearchParams(window.location.search).get("login") === "1") {
        openDropdown();
    }
}


/* =========================================
   PAGE TABS (reusable tab strip, e.g. Leaders' Skaters/Goalies)
   ========================================= */

function setupPageTabs(tabsSelector, panelIdPrefix) {
    const container = document.querySelector(tabsSelector);
    if (!container) return;

    container.querySelectorAll(".page-tab").forEach(btn => {
        btn.addEventListener("click", () => {
            container.querySelectorAll(".page-tab").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            document.querySelectorAll(`[id^="${panelIdPrefix}-"]`).forEach(panel => panel.classList.remove("active"));
            const panel = document.getElementById(`${panelIdPrefix}-${btn.dataset.tab}`);
            if (panel) panel.classList.add("active");
        });
    });
}


/* =========================================
   MOBILE NAV TOGGLE
   ========================================= */

function setupMobileNav() {
    const toggle = document.getElementById("nav-toggle");
    const nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("open");
        toggle.classList.toggle("open", isOpen);
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Close the menu automatically once a link is tapped
    nav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            nav.classList.remove("open");
            toggle.classList.remove("open");
            toggle.setAttribute("aria-expanded", "false");
        });
    });
}


/* =========================================
   START WEBSITE
   ========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    // setupMobileNav() and setupAuthNav() are now kicked off by
    // js/header.js once it has fetched and injected the shared
    // header partial -- calling them here would be a no-op anyway
    // since the header elements wouldn't exist in the DOM yet.

    const loaded = await loadLeagueData();

    if (!loaded) {
        console.error("Could not load JOHL data from Supabase.");
        return;
    }

    renderNextGame();
    renderTeamsPage();
    setupScheduleFilters();
    renderPlayers();
    setupPlayerFilters();
    renderStandings();
    renderSponsors();
    renderLeaders();
    renderGoalieStats();

    // Live updates: whenever a game is added/edited/deleted (e.g. an admin
    // saving a score from the admin panel), Supabase pushes the change here
    // in real time. Re-render whatever's currently on screen so the Home
    // "next game" box, the Schedule page and Standings all stay current
    // without anyone needing to refresh.
    subscribeToGameUpdates(() => {
        renderNextGame();
        renderSchedule(currentScheduleFilter);
        renderStandings();
    });

});
