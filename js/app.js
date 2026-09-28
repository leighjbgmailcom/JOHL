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

// Parses a "M:SS" game-clock string into total seconds. Returns null for
// anything blank or unparseable. Used to figure out which goalie stint a
// given goal falls under (see renderGoalieStats below).
function parseClockToSeconds(value) {
    if (!value) return null;
    const match = String(value).trim().match(/^(\d+):([0-5]\d)$/);
    if (!match) return null;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
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

                    return `
                    <div class="homepage-game ${isLive ? "is-live" : ""}">
                        <div class="homepage-game-time">
                            ${isLive ? `<span class="live-badge">Live</span>` : formatTime12h(game.time)}
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
                `;
                }).join("")}
            </div>

        </div>
    `;
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
    if (!s) return { gp: 0, periodsPlayed: 0, ga: 0, gaPerGame: 0 };
    const gp = s.games.size;
    return { gp, periodsPlayed: s.periodsPlayed.size, ga: s.ga, gaPerGame: gp ? s.ga / gp : 0 };
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
                                    <tr><th>#</th><th>Player</th><th>GP</th><th>GA</th><th>GA/Game</th></tr>
                                </thead>
                                <tbody>
                                    ${goalies.map(row => rosterRowHtml(row.player, `
                                        <td>${row.stats.gp}</td>
                                        <td>${row.stats.ga}</td>
                                        <td><strong>${row.stats.gaPerGame.toFixed(2)}</strong></td>
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

    element.innerHTML = groups.map(group => {
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

                ${group.entries.map(game => {
                    const isTbd = game.home === "TBD" || game.away === "TBD";
                    const isLive = game.status === "live";
                    const isFinal = game.status === "final";

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
                        <div class="schedule-game-wrapper" id="schedule-wrapper-${game.id}">
                            <div class="schedule-game ${isTbd ? "is-tbd" : ""} ${isLive ? "is-live" : ""} ${isFinal ? "is-clickable" : ""}"
                                ${isFinal ? `onclick="toggleScheduleGameDetail(${game.id})"` : ""}>

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
                                    ${isFinal ? `<div class="schedule-expand-chevron">Tap for game details ▾</div>` : ""}
                                </div>

                                <div class="schedule-score">
                                    ${scoreHtml}
                                </div>

                            </div>
                            ${isFinal ? `<div class="schedule-game-detail" id="schedule-detail-${game.id}"></div>` : ""}
                        </div>
                    `;
                }).join("")}
            </div>
        `;
    }).join("");
}

/* =========================================
   SCHEDULE — PAST GAME DETAIL (goals, goalie in net, attendance)
   ========================================= */

// Cache of per-game detail (goals + goalie stints + attendance), so
// re-opening an already-expanded game doesn't re-fetch it.
const SCHEDULE_DETAIL_CACHE = {};

// Toggles a final game's inline detail panel open/closed. Fetches the
// game's goals, penalties and goalie stints from Supabase the first time
// it's opened, then reuses the cached result on subsequent clicks. This
// public view is deliberately player-anonymous -- team logo and event type
// only, no scorer/assist/goalie/attendance names (those live in Admin).
async function toggleScheduleGameDetail(gameId) {
    const wrapper = document.getElementById(`schedule-wrapper-${gameId}`);
    const panel = document.getElementById(`schedule-detail-${gameId}`);
    if (!wrapper || !panel) return;

    const isOpen = wrapper.classList.contains("open");
    if (isOpen) {
        wrapper.classList.remove("open");
        return;
    }

    wrapper.classList.add("open");

    if (SCHEDULE_DETAIL_CACHE[gameId]) {
        panel.innerHTML = SCHEDULE_DETAIL_CACHE[gameId];
        return;
    }

    panel.innerHTML = `<p class="schedule-detail-loading">Loading game details…</p>`;

    const game = SCHEDULE.find(g => String(g.id) === String(gameId));
    if (!game) return;

    const [{ data: goals, error: goalsError }, { data: periods, error: periodsError }, { data: penalties, error: penaltiesError }] = await Promise.all([
        supabaseClient.from("game_goals").select("*").eq("game_id", gameId),
        supabaseClient.from("game_goalie_periods").select("*").eq("game_id", gameId),
        supabaseClient.from("game_penalties").select("*").eq("game_id", gameId)
    ]);

    if (goalsError || periodsError || penaltiesError) {
        console.error("Error loading game detail:", goalsError || periodsError || penaltiesError);
        panel.innerHTML = `<p class="schedule-detail-empty">Couldn't load game details right now.</p>`;
        return;
    }

    const html = renderScheduleGameDetail(game, goals || [], periods || [], penalties || []);
    SCHEDULE_DETAIL_CACHE[gameId] = html;
    panel.innerHTML = html;
}

// "#<number> First Last" tag for an event row.
function scheduleEventPlayerTag(playerId) {
    if (playerId == null) return "";
    const player = PLAYERS.find(p => String(p.id) === String(playerId));
    if (!player) return "";
    const name = `${player.first} ${player.last}`;
    return player.number != null ? `#${player.number} ${name}` : name;
}

// Builds the game detail markup: a "Starting Goalies" section up front for
// any goalie entry with no recorded time (an admin enters those without a
// clock time specifically because that goalie started the period rather
// than swapping in mid-play), followed by the chronological feed of goals,
// penalties and any timed (mid-period) goalie changes. Each row shows the
// team's logo, the event type, and the player(s) involved by full name --
// this is the public schedule view, so it stays lighter on detail than
// Admin's full Enter Game Results screen.
function renderScheduleGameDetail(game, goals, periods, penalties) {
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
    function sortKey(period, time) {
        const periodIndex = GOALIE_STATS_PERIOD_ORDER.indexOf(period);
        const seconds = parseClockToSeconds(time);
        return [periodIndex, seconds == null ? Infinity : -seconds];
    }

    // A goalie entry with no time is the goalie who started that period,
    // not a mid-period swap -- pull those out into their own "Starting
    // Goalies" list instead of mixing them into the timeline.
    const startingGoalieEntries = periods.filter(gp => parseClockToSeconds(gp.time_in) == null);
    const midPeriodGoalieEntries = periods.filter(gp => parseClockToSeconds(gp.time_in) != null);

    const startingGoaliesHtml = startingGoalieEntries
        .slice()
        .sort((a, b) => GOALIE_STATS_PERIOD_ORDER.indexOf(a.period) - GOALIE_STATS_PERIOD_ORDER.indexOf(b.period))
        .map(gp => `
            <div class="schedule-event-row is-starting-goalie">
                <span class="schedule-event-team">${teamBadge(sideCodeForTeamId(gp.team_id))}</span>
                <span class="schedule-event-main">
                    <span class="schedule-event-label">Starting Goalie</span>
                    <span class="schedule-event-detail">${scheduleEventPlayerTag(gp.goalie_id)}</span>
                </span>
                <span class="schedule-event-time">P${gp.period}</span>
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
            timeLabel: periodTimeLabel(goal.period, goal.game_time),
            key: sortKey(goal.period, goal.game_time)
        });
    });

    penalties.forEach(penalty => {
        events.push({
            teamCode: sideCodeForTeamId(penalty.team_id),
            label: penalty.minutes ? `Penalty (${penalty.minutes} min)` : "Penalty",
            detail: scheduleEventPlayerTag(penalty.player_id),
            subDetail: "",
            cssClass: "is-penalty",
            timeLabel: periodTimeLabel(penalty.period, penalty.game_time),
            key: sortKey(penalty.period, penalty.game_time)
        });
    });

    // Mid-period goalie changes only -- the starting goalies are already
    // shown up top, so they don't also appear in this timeline.
    midPeriodGoalieEntries.forEach(gp => {
        events.push({
            teamCode: sideCodeForTeamId(gp.team_id),
            label: "Goalie Shift",
            detail: scheduleEventPlayerTag(gp.goalie_id),
            subDetail: "",
            cssClass: "is-goalie-shift",
            timeLabel: periodTimeLabel(gp.period, gp.time_in),
            key: sortKey(gp.period, gp.time_in)
        });
    });

    events.sort((a, b) => {
        if (a.key[0] !== b.key[0]) return a.key[0] - b.key[0];
        return a.key[1] - b.key[1];
    });

    const eventsHtml = events.map(event => `
        <div class="schedule-event-row ${event.cssClass}">
            <span class="schedule-event-team">${teamBadge(event.teamCode)}</span>
            <span class="schedule-event-main">
                <span class="schedule-event-label">${event.label}</span>
                ${event.detail ? `<span class="schedule-event-detail">${event.detail}</span>` : ""}
                ${event.subDetail ? `<span class="schedule-event-subdetail">(${event.subDetail})</span>` : ""}
            </span>
            <span class="schedule-event-time">${event.timeLabel}</span>
        </div>
    `).join("");

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
        const gaPerGame = gp ? ga / gp : 0;

        summaryHtml = `
            <div class="player-detail-stats">
                <div><span>${gp}</span><label>GP</label></div>
                <div><span>${ga}</span><label>GA</label></div>
                <div><span>${gaPerGame.toFixed(2)}</span><label>GA/Game</label></div>
            </div>
        `;

        columnsHtml = `<th>Date</th><th>Opponent</th><th>GA</th>`;

        const games = s
            ? Object.keys(s.perGame).map(id => ({ game: gameLookup[id], ga: s.perGame[id] })).filter(r => r.game)
            : [];
        games.sort((a, b) => gameSortKey(a.game).localeCompare(gameSortKey(b.game)));

        rowsHtml = games.map(row => `
            <tr>
                <td>${formatDateISO(row.game.date)}</td>
                <td>${opponentLabel(row.game)}</td>
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

   Goals-against only (no shots-against are tracked, so no save %) --
   each game's crease is split into goalie "stints" in admin ("Goalies"
   section of Enter Game Results, or the Live Game screen). A team can
   have more than one stint within the same period (e.g. a mid-period
   injury swap), each with its own M:SS clock time showing when that
   goalie took over. A goalie is charged with every goal scored, in a
   period they're assigned to, while their stint was the one in net --
   worked out by comparing the goal's own recorded time against the
   stints' start times (see attributeGoalieStint below).
   ========================================= */

// Given a period's stints (already sorted with the earliest-starting
// stint first -- see below) and a goal's clock time in seconds, finds
// which stint was in net when that goal went in. The clock counts down
// within a period, so a stint that started at a HIGHER time reading
// happened EARLIER; the right stint is the most recent one that had
// already started by the time of the goal (the smallest start time
// that's still >= the goal's time). Falls back to the period's starting
// stint when the goal has no recorded time, or when nothing lines up.
function attributeGoalieStint(sortedStints, goalSeconds) {
    if (!sortedStints.length) return null;
    if (goalSeconds == null) return sortedStints[0];

    let best = null;
    sortedStints.forEach(stint => {
        if (stint.seconds != null && stint.seconds < goalSeconds) return;
        if (best === null) { best = stint; return; }
        // Prefer a stint with a known, closer start time over one with an
        // unknown ("assume period start") start time.
        if (stint.seconds == null) return;
        if (best.seconds == null || stint.seconds < best.seconds) best = stint;
    });

    return best || sortedStints[0];
}

const GOALIE_STATS_PERIOD_ORDER = ["1", "2", "3", "OT", "SO"];

// Computes goals-against for every goalie who has appeared in a game,
// keyed by player id -- shared by the Leaders page, the Teams page
// roster, and a player's own game log. Cached for the life of the page
// since none of these pages need it to update live.
let GOALIE_STATS_CACHE = null;

async function computeGoalieStats() {
    if (GOALIE_STATS_CACHE) return GOALIE_STATS_CACHE;

    const [{ data: periods, error: periodsError }, { data: goals, error: goalsError }] = await Promise.all([
        supabaseClient.from("game_goalie_periods").select("game_id, team_id, period, goalie_id, time_in"),
        supabaseClient.from("game_goals").select("game_id, team_id, period, game_time")
    ]);

    if (periodsError || goalsError) {
        console.error("Error loading goalie stats:", periodsError || goalsError);
        return null;
    }

    // Group goalie-period rows into per game+team, per-period "stint
    // lists", each sorted so the stint that started the period comes
    // first (unknown start times are treated as "started at the top of
    // the period", so they sort ahead of any known, later start time).
    const stintsByGameTeam = {}; // `${gameId}|${teamId}` -> { period: stints[] }
    (periods || []).forEach(gp => {
        const gtKey = `${gp.game_id}|${gp.team_id}`;
        if (!stintsByGameTeam[gtKey]) stintsByGameTeam[gtKey] = {};
        if (!stintsByGameTeam[gtKey][gp.period]) stintsByGameTeam[gtKey][gp.period] = [];
        stintsByGameTeam[gtKey][gp.period].push({ goalieId: gp.goalie_id, seconds: parseClockToSeconds(gp.time_in) });
    });
    Object.values(stintsByGameTeam).forEach(periodMap => {
        Object.values(periodMap).forEach(stints => {
            stints.sort((a, b) => {
                if (a.seconds == null && b.seconds == null) return 0;
                if (a.seconds == null) return -1;
                if (b.seconds == null) return 1;
                return b.seconds - a.seconds;
            });
        });
    });

    // A period with no goalie entered explicitly carries forward whoever
    // finished the most recent earlier period with one (same rule as the
    // Live Game screen), as a single stint covering the whole period.
    function stintsForPeriod(gtKey, period) {
        const periodMap = stintsByGameTeam[gtKey];
        if (!periodMap) return [];
        if (periodMap[period] && periodMap[period].length) return periodMap[period];

        const index = GOALIE_STATS_PERIOD_ORDER.indexOf(period);
        for (let i = index - 1; i >= 0; i--) {
            const earlier = GOALIE_STATS_PERIOD_ORDER[i];
            if (periodMap[earlier] && periodMap[earlier].length) {
                const mostRecent = periodMap[earlier][periodMap[earlier].length - 1];
                return [{ goalieId: mostRecent.goalieId, seconds: null }];
            }
        }
        return [];
    }

    // Which periods actually happened in each game (had a goal or a
    // goalie entry), so carry-forward doesn't invent phantom OT/SO periods.
    const periodsByGame = {};
    (periods || []).forEach(gp => {
        if (!periodsByGame[gp.game_id]) periodsByGame[gp.game_id] = new Set();
        periodsByGame[gp.game_id].add(gp.period);
    });
    (goals || []).forEach(g => {
        if (!periodsByGame[g.game_id]) periodsByGame[g.game_id] = new Set();
        periodsByGame[g.game_id].add(g.period);
    });

    const stats = {};
    function statsFor(goalieId) {
        if (!stats[goalieId]) {
            stats[goalieId] = { goalieId, games: new Set(), periodsPlayed: new Set(), ga: 0, perGame: {} };
        }
        return stats[goalieId];
    }

    Object.keys(stintsByGameTeam).forEach(gtKey => {
        const [gameId, teamId] = gtKey.split("|");
        const gamePeriods = periodsByGame[gameId] || new Set();

        GOALIE_STATS_PERIOD_ORDER.filter(period => gamePeriods.has(period)).forEach(period => {
            const stints = stintsForPeriod(gtKey, period);
            if (!stints.length) return;

            stints.forEach(stint => {
                const s = statsFor(stint.goalieId);
                s.games.add(gameId);
                s.periodsPlayed.add(`${gameId}|${period}`);
                if (s.perGame[gameId] == null) s.perGame[gameId] = 0;
            });

            // Every goal scored in this same game+period by the OTHER
            // team (not this team) went in against whichever of this
            // team's stints was in net at that moment.
            (goals || [])
                .filter(g =>
                    String(g.game_id) === String(gameId) &&
                    g.period === period &&
                    String(g.team_id) !== String(teamId)
                )
                .forEach(goal => {
                    const stint = attributeGoalieStint(stints, parseClockToSeconds(goal.game_time));
                    if (!stint) return;
                    const s = statsFor(stint.goalieId);
                    s.ga++;
                    s.perGame[gameId] = (s.perGame[gameId] || 0) + 1;
                });
        });
    });

    GOALIE_STATS_CACHE = stats;
    return stats;
}

// Turns the raw computeGoalieStats() map into display-ready rows (one
// per goalie, sorted best GA/Game first) for the Leaders page and the
// Teams page roster.
function goalieStatsRows(stats) {
    return Object.values(stats)
        .map(s => {
            const player = PLAYERS.find(p => String(p.id) === String(s.goalieId));
            if (!player) return null;
            const team = TEAMS.find(t => t.code === player.team);
            const gp = s.games.size;
            return {
                player,
                team,
                gp,
                periodsPlayed: s.periodsPlayed.size,
                ga: s.ga,
                gaPerGame: gp ? s.ga / gp : 0
            };
        })
        .filter(row => row !== null)
        .sort((a, b) => {
            if (a.gaPerGame !== b.gaPerGame) return a.gaPerGame - b.gaPerGame;
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
            <td>${row.periodsPlayed}</td>
            <td>${row.ga}</td>
            <td><strong>${row.gaPerGame.toFixed(2)}</strong></td>
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

    const { data: profile } = await supabaseClient
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

    if (profile && profile.is_admin) {
        isAdmin = true;
    }

    slot.innerHTML = `
        ${isAdmin ? `<a href="live.html">Live Game</a>` : ""}
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
