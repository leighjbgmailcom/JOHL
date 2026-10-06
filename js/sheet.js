/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   SCORE SHEET — the timekeeper's paper-style entry screen

   Same job as live.html (goals, penalties, goalies and who was on the
   ice, written straight to Supabase as they happen), laid out like the
   paper game sheet instead of buttons and pop-ups: a line-up to check
   off, ruled Scoring and Penalties boxes filled in by sweater number,
   and a Goalkeepers box that records the time each goalie CAME OUT.

   Nothing here has a Save button. A line is saved the moment it has
   enough on it to mean something (a scorer for a goal, a player for a
   penalty, a goalie for a goalkeeper line), and saved again every time
   it's changed. The games table is subscribed to by every visitor's
   Home/Schedule/Standings page, so the score updates for them too.

   Shared helpers (clock parsing, the goalie maths, the infraction list,
   teamBadge and friends) come from js/app.js, loaded before this file.
   ========================================= */

// Home on the left, Visitor on the right -- the order on the paper sheet.
const SHEET_SIDES = ["home", "away"];
const SHEET_SIDE_LABEL = { home: "Home", away: "Visitor" };
const SHEET_PERIODS = ["1", "2", "3", "OT", "SO"];

// How many blank lines each box starts with. A box always keeps at least
// one blank line at the bottom, so it can never fill up.
const SHEET_BLANK_LINES = { goal: 10, pen: 6, goalie: 3 };

// JOHL minors are 3 minutes, so that's what a new penalty line starts at.
const SHEET_DEFAULT_PENALTY_MINUTES = 3;

let SHEET_GAMES = [];
let sheetGame = null;
let sheetRows = null;        // { goal: { home: [], away: [] }, pen: {...}, goalie: {...} }
let sheetAttendance = null;  // { home: Set(playerId), away: Set(playerId) }
let sheetKeySeq = 0;
let sheetPendingSaves = 0;
let sheetScoreChain = Promise.resolve();
let sheetActiveSide = "home"; // which team is showing on a phone-width screen


/* =========================================
   ACCESS CONTROL (same rule as admin.html / live.html)
   ========================================= */

async function requireSheetAdmin() {
    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "index.html?login=1&redirect=sheet.html";
        return false;
    }

    const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

    if (error || !profile || !profile.is_admin) {
        window.location.href = "index.html";
        return false;
    }

    return true;
}


/* =========================================
   HELPERS
   ========================================= */

function sheetEsc(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function sheetOtherSide(side) {
    return side === "home" ? "away" : "home";
}

function sheetTeamId(side) {
    return side === "away" ? sheetGame.away_team_id : sheetGame.home_team_id;
}

function sheetTeam(side) {
    return TEAMS.find(t => String(t.id) === String(sheetTeamId(side))) || null;
}

function sheetTeamName(side) {
    const team = sheetTeam(side);
    return team ? team.name : "TBD";
}

function sheetSideForTeamId(teamId) {
    return String(teamId) === String(sheetGame.away_team_id) ? "away" : "home";
}

// One team's roster in sweater-number order, the way it's printed on the sheet.
function sheetRoster(side) {
    const team = sheetTeam(side);
    if (!team) return [];
    return PLAYERS
        .filter(p => p.team === team.code)
        .sort((a, b) => {
            if (a.number != null && b.number != null) return a.number - b.number;
            if (a.number != null) return -1;
            if (b.number != null) return 1;
            return a.last.localeCompare(b.last);
        });
}

function sheetPlayer(id) {
    if (id == null) return null;
    return PLAYERS.find(p => String(p.id) === String(id)) || null;
}

// The player on this team wearing the number that was written down.
function sheetPlayerByNumber(side, text) {
    const digits = String(text || "").replace(/^#/, "").trim();
    if (!/^\d{1,3}$/.test(digits)) return null;
    const number = parseInt(digits, 10);
    return sheetRoster(side).find(p => p.number === number) || null;
}

function sheetNumberOf(playerId) {
    const player = sheetPlayer(playerId);
    return player && player.number != null ? String(player.number) : "";
}

function sheetLastName(playerId) {
    const player = sheetPlayer(playerId);
    return player ? player.last : "";
}

// Reads a time as it was written. Blank is fine (no time recorded);
// anything that isn't a clock reading, or is more than a full period,
// comes back as a problem to show beside the line.
function sheetReadClock(text) {
    const typed = String(text || "").trim();
    if (!typed) return { value: null };
    // A bare "12" could be 12:00 or 0:12, so it isn't guessed at.
    if (/^\d{1,2}$/.test(typed)) {
        const n = parseInt(typed, 10);
        const asSeconds = `0${String(n).padStart(2, "0")}`;
        return {
            bad: n <= 20 && n > 0
                ? `Is "${typed}" ${n}:00 or 0:${String(n).padStart(2, "0")}? Write ${n}00 or ${asSeconds}`
                : `Write "${typed}" seconds as ${asSeconds}`
        };
    }

    const seconds = parseClockToSeconds(typed);
    if (seconds == null || seconds > REGULATION_PERIOD_SECONDS) {
        return { bad: `Can't read "${typed}" as a time — write it like 948 or 9:48` };
    }
    return { value: formatSecondsAsClock(seconds) };
}

// The latest period anything has been written in so far -- how far the
// game has got, for the score-by-period box.
function sheetCurrentPeriod() {
    let latest = 0;
    ["goal", "pen"].forEach(kind => {
        SHEET_SIDES.forEach(side => {
            sheetRows[kind][side].forEach(row => {
                const index = SHEET_PERIODS.indexOf(row.period);
                if (index > latest && sheetRowHasEntry(kind, row)) latest = index;
            });
        });
    });
    return SHEET_PERIODS[latest];
}

function sheetFindRow(kind, side, key) {
    return sheetRows[kind][side].find(row => String(row.key) === String(key)) || null;
}

function sheetRowEl(row) {
    return document.querySelector(`.gs-row[data-key="${row.key}"]`);
}


/* =========================================
   LINES ("rows") — one per goal, penalty or goalie

   A row keeps what was written (sweater numbers as text) beside what it
   resolved to (player ids), so a number that isn't on the roster can be
   shown back for fixing without anything wrong reaching the database.
   ========================================= */

function sheetNewGoalRow(db) {
    return {
        key: ++sheetKeySeq,
        id: db ? db.id : null,
        period: db ? db.period : null,
        time: db ? normalizeClockText(db.game_time) : null,
        g: db ? sheetNumberOf(db.scorer_id) : "",
        a1: db ? sheetNumberOf(db.assist1_id) : "",
        a2: db ? sheetNumberOf(db.assist2_id) : "",
        gId: db ? db.scorer_id : null,
        a1Id: db ? db.assist1_id : null,
        a2Id: db ? db.assist2_id : null,
        bad: {},
        failed: false,
        chain: Promise.resolve()
    };
}

function sheetNewPenRow(db) {
    return {
        key: ++sheetKeySeq,
        id: db ? db.id : null,
        period: db ? db.period : null,
        time: db ? normalizeClockText(db.game_time) : null,
        no: db ? sheetNumberOf(db.player_id) : "",
        playerId: db ? db.player_id : null,
        minutes: db ? db.minutes : null,
        infraction: db ? (db.infraction || "").trim() || null : null,
        bad: {},
        failed: false,
        chain: Promise.resolve()
    };
}

function sheetNewGoalieRow(db) {
    const timeOut = db ? normalizeClockText(db.time_out) : null;
    return {
        key: ++sheetKeySeq,
        id: db ? db.id : null,
        goalieId: db ? db.goalie_id : null,
        period: db && timeOut && GOALIE_CLOCK_PERIODS.includes(db.period) ? db.period : null,
        timeOut,
        bad: {},
        failed: false,
        chain: Promise.resolve()
    };
}

const SHEET_NEW_ROW = { goal: sheetNewGoalRow, pen: sheetNewPenRow, goalie: sheetNewGoalieRow };

// Does this line have anything written on it at all?
function sheetRowHasEntry(kind, row) {
    if (row.id) return true;
    if (kind === "goal") return !!(row.time || row.g || row.a1 || row.a2);
    if (kind === "pen") return !!(row.time || row.no || row.infraction);
    return !!(row.goalieId || row.timeOut);
}

// Is there enough on the line to save it?
function sheetRowIsComplete(kind, row) {
    if (Object.values(row.bad).some(Boolean)) return false;
    return !sheetRowMissing(kind, row);
}

// What a line still needs before it can be saved, in the timekeeper's
// words -- or null if it has everything. Nothing is assumed: the period
// has to be written on every line, the same as on paper, because a goal
// or a goalie change in the wrong period charges goals to the wrong goalie.
function sheetRowMissing(kind, row) {
    if (kind === "goal") {
        if (!row.gId) return "write who scored (G)";
        if (!row.period) return "write the period";
        return null;
    }
    if (kind === "pen") {
        if (!row.playerId) return "write the player's number";
        if (!row.period) return "write the period";
        return null;
    }
    if (!row.goalieId) return "pick the goalkeeper";
    if (row.timeOut && !row.period) return "write the period he came out in";
    return null;
}

// Goals in the order they were scored: by period, then by the clock
// counting down, with untimed goals at the end of their period.
function sheetChronological(a, b) {
    const pa = SHEET_PERIODS.indexOf(a.period);
    const pb = SHEET_PERIODS.indexOf(b.period);
    if (pa !== pb) return pa - pb;
    const sa = parseClockToSeconds(a.game_time);
    const sb = parseClockToSeconds(b.game_time);
    if (sa !== sb) return (sb == null ? -1 : sb) - (sa == null ? -1 : sa);
    return a.id - b.id;
}

// Tops a box up with blank lines: the starting number of lines, and
// always at least one blank one after the last line that's been used.
function sheetPadRows(kind, side) {
    const rows = sheetRows[kind][side];
    let lastUsed = -1;
    rows.forEach((row, index) => {
        if (sheetRowHasEntry(kind, row)) lastUsed = index;
    });
    const wanted = Math.max(SHEET_BLANK_LINES[kind], lastUsed + 2);
    let added = false;
    while (rows.length < wanted) {
        rows.push(SHEET_NEW_ROW[kind](null));
        added = true;
    }
    return added;
}


/* =========================================
   LOAD GAME LIST
   ========================================= */

// The next 3 games coming up (plus any game that's live right now), the
// same short list as the Live Game screen -- and the last couple of days'
// finished games, so a sheet can be reopened to fix something after the
// game's been marked final.
async function loadSheetGames() {
    const { data, error } = await supabaseClient
        .from("games")
        .select("id, game_no, game_date, game_time, location, away_team_id, home_team_id, away_score, home_score, status, went_ot, no_games")
        .eq("no_games", false)
        .order("game_date", { ascending: true })
        .order("game_time", { ascending: true });

    if (error) {
        console.error("Error loading games:", error);
        return;
    }

    const today = todayISO();
    const recent = new Date();
    recent.setDate(recent.getDate() - 2);
    const recentIso = `${recent.getFullYear()}-${String(recent.getMonth() + 1).padStart(2, "0")}-${String(recent.getDate()).padStart(2, "0")}`;

    const all = data || [];
    const upcoming = all
        .filter(game => game.status !== "final" && (game.status === "live" || game.game_date >= today))
        .slice(0, 3);
    const justFinished = all.filter(game => game.status === "final" && game.game_date >= recentIso);

    SHEET_GAMES = [...justFinished, ...upcoming];

    // Whatever sheet is open stays in the list, whatever its date or status.
    if (sheetGame && !SHEET_GAMES.some(game => String(game.id) === String(sheetGame.id))) {
        SHEET_GAMES.unshift(sheetGame);
    }

    const select = document.getElementById("sheet-game-select");
    const current = sheetGame ? String(sheetGame.id) : "";

    select.innerHTML = `<option value="">— Select a game —</option>` +
        SHEET_GAMES.map(game => {
            const team = id => {
                const t = TEAMS.find(x => String(x.id) === String(id));
                return t ? t.name : "TBD";
            };
            const tag = game.status === "live" ? " (Live)" : game.status === "final" ? " (Final)" : "";
            const label = `${game.game_date} ${formatTime12h(game.game_time ? game.game_time.substring(0, 5) : "")} — ` +
                `${team(game.away_team_id)} @ ${team(game.home_team_id)}${tag}`;
            return `<option value="${game.id}">${sheetEsc(label)}</option>`;
        }).join("");

    if (current && SHEET_GAMES.some(game => String(game.id) === current)) {
        select.value = current;
    }
}


/* =========================================
   OPENING A GAME'S SHEET
   ========================================= */

async function onSheetGameChange() {
    const gameId = document.getElementById("sheet-game-select").value;
    const sheet = document.getElementById("sheet");
    const empty = document.getElementById("sheet-empty");
    const printButton = document.getElementById("sheet-print-button");

    if (!gameId) {
        sheetGame = null;
        sheetRows = null;
        sheet.hidden = true;
        empty.hidden = false;
        printButton.hidden = true;
        updateSheetSaveStatus();
        return;
    }

    const game = SHEET_GAMES.find(g => String(g.id) === String(gameId));
    if (!game) return;

    empty.hidden = true;
    sheet.hidden = false;
    sheet.innerHTML = `<p class="gs-loading">Opening the sheet…</p>`;

    const [goals, penalties, goaliePeriods, attendance] = await Promise.all([
        supabaseClient.from("game_goals").select("*").eq("game_id", game.id),
        supabaseClient.from("game_penalties").select("*").eq("game_id", game.id),
        supabaseClient.from("game_goalie_periods").select("*").eq("game_id", game.id),
        supabaseClient.from("game_attendance").select("*").eq("game_id", game.id)
    ]);

    // Somebody picked a different game while this one was loading.
    if (document.getElementById("sheet-game-select").value !== String(gameId)) return;

    const failed = [goals, penalties, goaliePeriods, attendance].find(result => result.error);
    if (failed) {
        console.error(failed.error);
        sheet.innerHTML = `<p class="gs-loading">Couldn't open this sheet. Check the connection and pick the game again.</p>`;
        return;
    }

    sheetGame = game;
    sheetRows = {
        goal: { home: [], away: [] },
        pen: { home: [], away: [] },
        goalie: { home: [], away: [] }
    };
    sheetAttendance = { home: new Set(), away: new Set() };

    (goals.data || []).slice().sort(sheetChronological).forEach(db => {
        sheetRows.goal[sheetSideForTeamId(db.team_id)].push(sheetNewGoalRow(db));
    });

    (penalties.data || []).slice().sort(sheetChronological).forEach(db => {
        sheetRows.pen[sheetSideForTeamId(db.team_id)].push(sheetNewPenRow(db));
    });

    // Goalies go on the sheet in the order they played.
    const otSeconds = overtimeLengthSeconds(goals.data || [], goaliePeriods.data || []);
    SHEET_SIDES.forEach(side => {
        const teamRows = (goaliePeriods.data || [])
            .filter(db => sheetSideForTeamId(db.team_id) === side)
            .sort((a, b) => a.id - b.id);
        buildGoalieTimeline(teamRows, otSeconds).forEach(stint => {
            sheetRows.goalie[side].push(sheetNewGoalieRow(stint.row));
        });
    });

    (attendance.data || []).forEach(db => {
        sheetAttendance[sheetSideForTeamId(db.team_id)].add(String(db.player_id));
    });

    ["goal", "pen", "goalie"].forEach(kind => {
        SHEET_SIDES.forEach(side => sheetPadRows(kind, side));
    });

    printButton.hidden = false;
    renderSheet();
    updateSheetSaveStatus();
}


/* =========================================
   DRAWING THE SHEET
   ========================================= */

function sheetPeriodOptionsHtml(periods, selected) {
    return `<option value=""></option>` + periods.map(p =>
        `<option value="${p}" ${p === selected ? "selected" : ""}>${p}</option>`
    ).join("");
}

function sheetInputHtml(field, value, label, extra = "") {
    return `<input type="text" class="gs-ink" data-field="${field}" value="${sheetEsc(value || "")}" aria-label="${label}" autocomplete="off" autocapitalize="off" spellcheck="false" ${extra}>`;
}

function sheetEraseHtml() {
    return `<button type="button" class="gs-erase" data-action="erase" aria-label="Erase this line" title="Erase this line">✕</button>`;
}

function sheetGoalRowHtml(side, row, index) {
    return `
        <div class="gs-row" data-kind="goal" data-side="${side}" data-key="${row.key}">
            <span class="gs-cell gs-num">${index + 1}</span>
            <span class="gs-cell"><select class="gs-ink" data-field="period" aria-label="Period">${sheetPeriodOptionsHtml(SHEET_PERIODS, row.period)}</select></span>
            <span class="gs-cell">${sheetInputHtml("time", row.time, "Time", `inputmode="numeric"`)}</span>
            <span class="gs-cell">${sheetInputHtml("g", row.g, "Goal scored by, sweater number", `inputmode="numeric" maxlength="3"`)}</span>
            <span class="gs-cell">${sheetInputHtml("a1", row.a1, "First assist, sweater number", `inputmode="numeric" maxlength="3"`)}</span>
            <span class="gs-cell">${sheetInputHtml("a2", row.a2, "Second assist, sweater number", `inputmode="numeric" maxlength="3"`)}</span>
            <span class="gs-cell gs-note"></span>
            <span class="gs-cell gs-erase-cell">${sheetEraseHtml()}</span>
        </div>
    `;
}

// The offence list, with the sheet's short codes. A loaded offence that
// isn't on the standard list (an older free-typed one) gets its own entry
// so it's shown as written.
function sheetOffenceOptionsHtml(selected) {
    const known = isKnownInfraction(selected);
    return `<option value=""></option>` +
        INFRACTION_TYPES.map(t =>
            `<option value="${sheetEsc(t.name)}" ${selected === t.name ? "selected" : ""}>${sheetEsc(t.code)} · ${sheetEsc(t.name)}</option>`
        ).join("") +
        (selected && !known ? `<option value="${sheetEsc(selected)}" selected>${sheetEsc(selected)}</option>` : "") +
        `<option value="__other__">Other…</option>`;
}

function sheetPenRowHtml(side, row) {
    return `
        <div class="gs-row" data-kind="pen" data-side="${side}" data-key="${row.key}">
            <span class="gs-cell"><select class="gs-ink" data-field="period" aria-label="Period">${sheetPeriodOptionsHtml(SHEET_PERIODS, row.period)}</select></span>
            <span class="gs-cell">${sheetInputHtml("no", row.no, "Penalized player, sweater number", `inputmode="numeric" maxlength="3"`)}</span>
            <span class="gs-cell">${sheetInputHtml("minutes", row.minutes == null ? "" : row.minutes, "Minutes", `inputmode="numeric" maxlength="2"`)}</span>
            <span class="gs-cell gs-offence"><select class="gs-ink" data-field="infraction" aria-label="Offence">${sheetOffenceOptionsHtml(row.infraction)}</select></span>
            <span class="gs-cell">${sheetInputHtml("time", row.time, "Time", `inputmode="numeric"`)}</span>
            <span class="gs-cell gs-note"></span>
            <span class="gs-cell gs-erase-cell">${sheetEraseHtml()}</span>
        </div>
    `;
}

// A team's goalies -- plus whoever is already on this line, if he isn't
// listed as a goalie on the roster.
function sheetGoalieOptionsHtml(side, selectedId) {
    const goalies = sheetRoster(side).filter(p => isGoaliePosition(p.position));
    const selected = sheetPlayer(selectedId);
    if (selected && !goalies.some(p => String(p.id) === String(selected.id))) goalies.push(selected);

    return `<option value=""></option>` + goalies.map(p =>
        `<option value="${p.id}" ${String(p.id) === String(selectedId) ? "selected" : ""}>${p.number != null ? p.number + " " : ""}${sheetEsc(p.first)} ${sheetEsc(p.last)}</option>`
    ).join("");
}

function sheetGoalieRowHtml(side, row) {
    return `
        <div class="gs-row" data-kind="goalie" data-side="${side}" data-key="${row.key}">
            <span class="gs-cell gs-goalie-name"><select class="gs-ink" data-field="goalieId" aria-label="Goalkeeper">${sheetGoalieOptionsHtml(side, row.goalieId)}</select></span>
            <span class="gs-cell"><select class="gs-ink" data-field="period" aria-label="Period he came out in">${sheetPeriodOptionsHtml(GOALIE_CLOCK_PERIODS, row.period)}</select></span>
            <span class="gs-cell">${sheetInputHtml("timeOut", row.timeOut, "Time he came out", `inputmode="numeric"`)}</span>
            <span class="gs-cell gs-ga" title="Goals against, worked out from the goal times"></span>
            <span class="gs-cell gs-note"></span>
            <span class="gs-cell gs-erase-cell">${sheetEraseHtml()}</span>
        </div>
    `;
}

const SHEET_ROW_HTML = {
    goal: sheetGoalRowHtml,
    pen: (side, row) => sheetPenRowHtml(side, row),
    goalie: (side, row) => sheetGoalieRowHtml(side, row)
};

function sheetRowsHtml(kind, side) {
    return sheetRows[kind][side].map((row, index) => SHEET_ROW_HTML[kind](side, row, index)).join("");
}

function sheetLineupHtml(side) {
    const roster = sheetRoster(side);
    if (!roster.length) return `<p class="gs-lineup-empty">No players on this roster yet.</p>`;

    return roster.map(p => `
        <label class="gs-lineup-row">
            <input type="checkbox" data-action="attendance" data-side="${side}" data-player="${p.id}" ${sheetAttendance[side].has(String(p.id)) ? "checked" : ""}>
            <span class="gs-check" aria-hidden="true"></span>
            <span class="gs-lineup-no">${p.number != null ? p.number : ""}</span>
            <span class="gs-lineup-name">${sheetEsc(p.last)}, ${sheetEsc(p.first)}</span>
            ${isGoaliePosition(p.position) ? `<em class="gs-lineup-goalie" title="Goalie">G</em>` : ""}
        </label>
    `).join("");
}

function sheetTeamHtml(side) {
    const team = sheetTeam(side);
    return `
        <section class="gs-team" data-side="${side}">

            <div class="gs-team-head">
                <span class="gs-printed">${SHEET_SIDE_LABEL[side]} Team</span>
                <span class="gs-team-name">${team ? teamBadge(team.code) : ""}<strong>${sheetEsc(sheetTeamName(side))}</strong></span>
            </div>

            <div class="gs-box">
                <div class="gs-box-title">Line-up <small>check off everyone who's on the ice tonight</small></div>
                <div class="gs-lineup">${sheetLineupHtml(side)}</div>
            </div>

            <div class="gs-box gs-box-goal">
                <div class="gs-box-title">Scoring <small>sweater numbers</small></div>
                <div class="gs-row gs-head">
                    <span class="gs-cell">No.</span>
                    <span class="gs-cell">Per.</span>
                    <span class="gs-cell">Time</span>
                    <span class="gs-cell">G</span>
                    <span class="gs-cell">A</span>
                    <span class="gs-cell">A</span>
                    <span class="gs-cell gs-note"></span>
                    <span class="gs-cell gs-erase-cell"></span>
                </div>
                <div class="gs-rows" id="sheet-goal-${side}">${sheetRowsHtml("goal", side)}</div>
            </div>

            <div class="gs-box gs-box-pen">
                <div class="gs-box-title">Penalties</div>
                <div class="gs-row gs-head">
                    <span class="gs-cell">Per.</span>
                    <span class="gs-cell">No.</span>
                    <span class="gs-cell">Min.</span>
                    <span class="gs-cell gs-offence">Offence</span>
                    <span class="gs-cell">Time</span>
                    <span class="gs-cell gs-note"></span>
                    <span class="gs-cell gs-erase-cell"></span>
                </div>
                <div class="gs-rows" id="sheet-pen-${side}">${sheetRowsHtml("pen", side)}</div>
            </div>

            <div class="gs-box gs-box-goalie">
                <div class="gs-box-title">Goalkeepers <small>in the order they played</small></div>
                <div class="gs-row gs-head">
                    <span class="gs-cell gs-goalie-name">Goalkeeper</span>
                    <span class="gs-cell">Per.</span>
                    <span class="gs-cell">Time out</span>
                    <span class="gs-cell">Goals</span>
                    <span class="gs-cell gs-note"></span>
                    <span class="gs-cell gs-erase-cell"></span>
                </div>
                <div class="gs-rows" id="sheet-goalie-${side}">${sheetRowsHtml("goalie", side)}</div>
                <p class="gs-box-foot" id="sheet-goalie-foot-${side}"></p>
            </div>

        </section>
    `;
}

function renderSheet() {
    const game = sheetGame;
    const sheet = document.getElementById("sheet");

    sheet.innerHTML = `
        <div class="gs-masthead">
            <img src="images/sm_JOHL_LOGO.png" alt="" class="gs-masthead-logo">
            <div class="gs-masthead-title">
                <strong>Jordan Oldtimers Hockey League</strong>
                <span>Official Game Sheet</span>
            </div>
            <div class="gs-stamp" id="sheet-stamp" hidden>Final</div>
        </div>

        <div class="gs-fields">
            <div class="gs-field"><span class="gs-printed">Game No.</span><span class="gs-written">${game.game_no != null ? sheetEsc(game.game_no) : ""}</span></div>
            <div class="gs-field gs-field-wide"><span class="gs-printed">Date</span><span class="gs-written">${sheetEsc(formatDateISO(game.game_date))}</span></div>
            <div class="gs-field"><span class="gs-printed">Time</span><span class="gs-written">${sheetEsc(formatTime12h(game.game_time ? game.game_time.substring(0, 5) : ""))}</span></div>
            <div class="gs-field gs-field-wide"><span class="gs-printed">Arena</span><span class="gs-written">${sheetEsc(game.location || "")}</span></div>
        </div>

        <div class="gs-scorebox">
            <div class="gs-score-row gs-score-head">
                <span class="gs-score-team gs-printed">Score by period</span>
                ${SHEET_PERIODS.map(p => `<span>${p}</span>`).join("")}
                <span class="gs-score-total">Final</span>
            </div>
            ${["away", "home"].map(side => `
                <div class="gs-score-row" id="sheet-score-${side}">
                    <span class="gs-score-team"><span class="gs-printed">${SHEET_SIDE_LABEL[side]}</span> ${sheetEsc(sheetTeamName(side))}</span>
                    ${SHEET_PERIODS.map(p => `<span class="gs-written" data-period="${p}"></span>`).join("")}
                    <span class="gs-written gs-score-total" data-period="total"></span>
                </div>
            `).join("")}
        </div>

        <div class="gs-side-tabs" role="tablist">
            ${SHEET_SIDES.map(side => `
                <button type="button" role="tab" data-action="show-side" data-side="${side}">
                    <span class="gs-printed">${SHEET_SIDE_LABEL[side]}</span> ${sheetEsc(sheetTeamName(side))}
                </button>
            `).join("")}
        </div>

        <div class="gs-teams">
            ${SHEET_SIDES.map(sheetTeamHtml).join("")}
        </div>

        <div class="gs-signoff">
            <label class="gs-ot">
                <input type="checkbox" id="sheet-went-ot" ${game.went_ot ? "checked" : ""}>
                <span class="gs-check" aria-hidden="true"></span>
                <span>Game went to overtime <small>(loser gets the overtime point)</small></span>
            </label>
            <div class="gs-signoff-actions gs-screen-only">
                <span class="gs-signoff-message" id="sheet-signoff-message"></span>
                <button type="button" class="gs-tool-button" id="sheet-start-button" data-action="start">Start game — go live</button>
                <button type="button" class="button" id="sheet-final-button" data-action="final">Game over — mark final</button>
                <button type="button" class="gs-tool-button" id="sheet-reopen-button" data-action="reopen">Reopen game</button>
            </div>
        </div>
    `;

    ["goal", "pen", "goalie"].forEach(kind => {
        SHEET_SIDES.forEach(side => {
            sheetRows[kind][side].forEach(row => refreshSheetRow(kind, side, row));
        });
    });

    refreshSheetTotals();
    refreshSheetStatus();
    setSheetActiveSide(sheetActiveSide);
}

// Shows one team at a time on a phone; on anything wider both are side by
// side and the tabs are hidden (see css/sheet.css).
function setSheetActiveSide(side) {
    sheetActiveSide = side;
    const sheet = document.getElementById("sheet");
    sheet.dataset.activeSide = side;
    sheet.querySelectorAll(".gs-side-tabs button").forEach(button => {
        const active = button.dataset.side === side;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", active ? "true" : "false");
    });
}

// Appends any newly added blank lines to a box that's already on screen.
function appendSheetRows(kind, side) {
    const container = document.getElementById(`sheet-${kind}-${side}`);
    if (!container) return;
    const rows = sheetRows[kind][side];
    for (let index = container.children.length; index < rows.length; index++) {
        container.insertAdjacentHTML("beforeend", SHEET_ROW_HTML[kind](side, rows[index], index));
        refreshSheetRow(kind, side, rows[index]);
    }
}


/* =========================================
   KEEPING THE SHEET UP TO DATE
   ========================================= */

// The pencilled note at the end of a line: who the numbers are, or
// what's wrong with the line.
function sheetRowNote(kind, side, row) {
    const problem = Object.values(row.bad).find(Boolean);
    if (problem) return { text: problem, problem: true };

    if (row.failed) return { text: "Not saved — tap here to try again", problem: true, retry: true };

    if (!sheetRowHasEntry(kind, row)) return { text: "" };

    const missing = sheetRowMissing(kind, row);
    if (missing) {
        // Already saved once: what's in the database is the line as it
        // was before this change, so say so.
        if (row.id) return { text: `Change not saved — ${missing}, or ✕ to erase the line`, problem: true };
        return { text: missing, pending: true };
    }

    if (kind === "goal") {
        const assists = [row.a1Id, row.a2Id].map(sheetLastName).filter(Boolean);
        return { text: sheetLastName(row.gId) + (assists.length ? ` (${assists.join(", ")})` : "") };
    }

    if (kind === "pen") return { text: sheetLastName(row.playerId) };

    if (!row.timeOut) return { text: sheetGame.status === "final" ? "finished the game" : "in net" };
    return { text: "" };
}

// Redraws one line's state from its row: values tidied the way they were
// saved, problem cells in red, the pencilled note, and whether it's ink
// (saved) or pencil (not saved yet).
function refreshSheetRow(kind, side, row, justWritten) {
    const el = sheetRowEl(row);
    if (!el) return;

    el.querySelectorAll("[data-field]").forEach(control => {
        const field = control.dataset.field;
        const value = row[field] == null ? "" : String(row[field]);
        // Tidy the box to what was saved ("948" -> "9:48"). A box that's
        // being typed in right now is left alone, unless it's the one
        // that was just written.
        const typing = document.activeElement === control && control !== justWritten;
        if (!typing && control.value !== value) {
            control.value = value;
        }
        control.closest(".gs-cell").classList.toggle("is-bad", !!row.bad[field]);
    });

    const note = sheetRowNote(kind, side, row);
    const noteEl = el.querySelector(".gs-note");
    noteEl.textContent = note.text;
    noteEl.classList.toggle("is-problem", !!note.problem);
    noteEl.classList.toggle("is-retry", !!note.retry);

    const used = sheetRowHasEntry(kind, row);
    el.classList.toggle("is-used", used);
    el.classList.toggle("is-saved", !!row.id && !note.problem);
    el.classList.toggle("is-pencil", used && (!row.id || !!note.problem));
}

// Score by period, the big totals, and each goalie's goals against --
// all worked out from the goals that are saved on the sheet.
function refreshSheetTotals() {
    if (!sheetGame) return;

    const savedGoals = side => sheetRows.goal[side].filter(row => row.id);
    const started = sheetAnyEntries();
    const reachedIndex = sheetGame.status === "final" ? 2 : SHEET_PERIODS.indexOf(sheetCurrentPeriod());

    ["away", "home"].forEach(side => {
        const rowEl = document.getElementById(`sheet-score-${side}`);
        if (!rowEl) return;
        const goals = savedGoals(side);
        SHEET_PERIODS.forEach((period, index) => {
            const count = goals.filter(row => row.period === period).length;
            // A period nothing's been written in yet stays blank, like the
            // paper; a period that's been reached shows its 0.
            const reached = started && index <= reachedIndex && index < 3;
            rowEl.querySelector(`[data-period="${period}"]`).textContent = count || (reached ? "0" : "");
        });
        rowEl.querySelector(`[data-period="total"]`).textContent = goals.length;
    });

    // Goals against, charged to whoever was in net when each goal went in.
    const stintsFor = side => sheetRows.goalie[side]
        .filter(row => row.goalieId)
        .map(row => ({ goalie_id: row.goalieId, period: row.timeOut ? row.period : null, time_out: row.timeOut, sheetRow: row }));
    const goalsFor = side => savedGoals(side)
        .filter(row => row.gId)
        .map(row => ({ period: row.period, game_time: row.time }));

    const stints = { home: stintsFor("home"), away: stintsFor("away") };
    const otSeconds = overtimeLengthSeconds(
        [...goalsFor("home"), ...goalsFor("away")],
        [...stints.home, ...stints.away]
    );

    SHEET_SIDES.forEach(side => {
        const counts = goalsAgainstByGoalieRow(stints[side], goalsFor(sheetOtherSide(side)), otSeconds);
        sheetRows.goalie[side].forEach(row => {
            const el = sheetRowEl(row);
            if (!el) return;
            const stint = stints[side].find(st => st.sheetRow === row);
            el.querySelector(".gs-ga").textContent = stint ? counts.get(stint) : "";
        });

        // More than one goalie with no time out: there's no telling who
        // was in net for which goal.
        const foot = document.getElementById(`sheet-goalie-foot-${side}`);
        if (foot) {
            const stillIn = stints[side].filter(st => !st.time_out).length;
            foot.textContent = stillIn > 1
                ? "Write the time the first goalie came out, so each goal is charged to the right goalie."
                : "";
        }
    });
}

function sheetAnyEntries() {
    return ["goal", "pen"].some(kind =>
        SHEET_SIDES.some(side => sheetRows[kind][side].some(row => sheetRowHasEntry(kind, row)))
    );
}

// The Final stamp and which of the sign-off buttons apply.
function refreshSheetStatus() {
    if (!sheetGame) return;
    const status = sheetGame.status;

    const stamp = document.getElementById("sheet-stamp");
    if (!stamp) return;
    stamp.hidden = status !== "final" && status !== "live";
    stamp.textContent = status === "final" ? "Final" : "Live";
    stamp.classList.toggle("is-live", status === "live");

    SHEET_SIDES.forEach(side => {
        sheetRows.goalie[side].forEach(row => refreshSheetRow("goalie", side, row));
    });

    document.getElementById("sheet-start-button").hidden = status !== "scheduled";
    document.getElementById("sheet-final-button").hidden = status === "final";
    document.getElementById("sheet-reopen-button").hidden = status !== "final";
}

// "All saved" / "Saving…" / "n lines not saved" beside the game picker.
function updateSheetSaveStatus() {
    const el = document.getElementById("sheet-save-status");
    if (!el) return;

    el.classList.remove("is-saving", "is-problem");

    if (!sheetGame || !sheetRows) {
        el.textContent = "";
        return;
    }

    const failed = [];
    ["goal", "pen", "goalie"].forEach(kind => {
        SHEET_SIDES.forEach(side => {
            sheetRows[kind][side].forEach(row => {
                if (row.failed) failed.push({ kind, side, row });
            });
        });
    });

    if (sheetPendingSaves > 0) {
        el.textContent = "Saving…";
        el.classList.add("is-saving");
    } else if (failed.length) {
        el.innerHTML = `${failed.length} line${failed.length === 1 ? "" : "s"} not saved <button type="button" class="gs-retry" data-action="retry-all">Try again</button>`;
        el.classList.add("is-problem");
    } else {
        el.textContent = "✓ Everything on the sheet is saved";
    }
}


/* =========================================
   SAVING

   Every save for one line goes through that line's own queue, so a
   second change made while the first is still on its way can't overtake
   it (or insert the same goal twice).
   ========================================= */

const SHEET_TABLE = { goal: "game_goals", pen: "game_penalties", goalie: "game_goalie_periods" };

function sheetRowPayload(kind, row) {
    if (kind === "goal") {
        return {
            period: row.period,
            game_time: row.time || null,
            scorer_id: row.gId,
            assist1_id: row.a1Id || null,
            assist2_id: row.a2Id || null
        };
    }
    if (kind === "pen") {
        return {
            period: row.period,
            game_time: row.time || null,
            player_id: row.playerId,
            minutes: row.minutes || SHEET_DEFAULT_PENALTY_MINUTES,
            infraction: row.infraction || null
        };
    }
    return {
        goalie_id: row.goalieId,
        period: row.timeOut ? row.period : null,
        time_out: row.timeOut || null
    };
}

function queueSheetRowSave(kind, side, row) {
    const game = sheetGame;
    const rows = sheetRows;
    const teamId = sheetTeamId(side);

    sheetPendingSaves++;
    updateSheetSaveStatus();

    row.chain = row.chain.then(async () => {
        // The line may have been erased, or changed again, while waiting.
        if (row.erased || !sheetRowIsComplete(kind, row)) return;

        const payload = sheetRowPayload(kind, row);
        let result;

        if (row.id) {
            result = await supabaseClient.from(SHEET_TABLE[kind]).update(payload).eq("id", row.id);
        } else {
            result = await supabaseClient
                .from(SHEET_TABLE[kind])
                .insert({ game_id: game.id, team_id: teamId, ...payload })
                .select()
                .single();
            if (!result.error && result.data) row.id = result.data.id;
        }

        if (result.error) throw result.error;
        row.failed = false;
    }).catch(error => {
        console.error("Score sheet save failed:", error);
        row.failed = true;
    }).then(() => {
        sheetPendingSaves--;
        if (rows === sheetRows) {
            refreshSheetRow(kind, side, row);
            refreshSheetTotals();
        }
        updateSheetSaveStatus();
        if (kind === "goal") queueSheetScoreSync(game, rows);
    });

    return row.chain;
}

// Takes a line off the sheet (and out of the database, if it was saved).
function queueSheetRowErase(kind, side, row) {
    const game = sheetGame;
    const rows = sheetRows;

    row.erased = true;
    sheetPendingSaves++;
    updateSheetSaveStatus();

    row.chain = row.chain.then(async () => {
        if (!row.id) return;
        const { error } = await supabaseClient.from(SHEET_TABLE[kind]).delete().eq("id", row.id);
        if (error) throw error;
        row.id = null;
    }).then(() => {
        // Gone: put a fresh blank line in its place.
        const list = rows[kind][side];
        const index = list.indexOf(row);
        if (index !== -1) list.splice(index, 1);
        if (rows === sheetRows) {
            sheetPadRows(kind, side);
            const container = document.getElementById(`sheet-${kind}-${side}`);
            if (container) {
                container.innerHTML = sheetRowsHtml(kind, side);
                list.forEach(r => refreshSheetRow(kind, side, r));
            }
        }
    }).catch(error => {
        console.error("Score sheet erase failed:", error);
        row.erased = false;
        row.failed = true;
        alert("That line couldn't be erased. Check the connection and try again.");
    }).then(() => {
        sheetPendingSaves--;
        if (rows === sheetRows) {
            refreshSheetRow(kind, side, row);
            refreshSheetTotals();
        }
        updateSheetSaveStatus();
        if (kind === "goal") queueSheetScoreSync(game, rows);
    });

    return row.chain;
}

// After any goal is added, changed or erased: count the goals saved on
// the sheet and write the score back to the game (so the score can never
// drift from the goals), and mark the game "live" the first time a goal
// goes on a sheet that's still "scheduled". One at a time, in order.
function queueSheetScoreSync(game, rows) {
    sheetScoreChain = sheetScoreChain.then(async () => {
        const awayScore = rows.goal.away.filter(row => row.id).length;
        const homeScore = rows.goal.home.filter(row => row.id).length;

        const updates = {};
        if (game.away_score !== awayScore) updates.away_score = awayScore;
        if (game.home_score !== homeScore) updates.home_score = homeScore;
        if (game.status === "scheduled" && awayScore + homeScore > 0) updates.status = "live";
        if (!Object.keys(updates).length) return;

        const { error } = await supabaseClient.from("games").update(updates).eq("id", game.id);
        if (error) throw error;

        Object.assign(game, updates);
        if (game === sheetGame) refreshSheetStatus();
    }).catch(error => {
        console.error("Score sheet couldn't update the game score:", error);
        const el = document.getElementById("sheet-signoff-message");
        if (el && game === sheetGame) el.textContent = "The score on the schedule may be behind — it will catch up with the next goal.";
    });

    return sheetScoreChain;
}

function retrySheetRow(kind, side, row) {
    row.failed = false;
    refreshSheetRow(kind, side, row);
    if (sheetRowIsComplete(kind, row)) queueSheetRowSave(kind, side, row);
    else updateSheetSaveStatus();
}

function retryAllSheetRows() {
    ["goal", "pen", "goalie"].forEach(kind => {
        SHEET_SIDES.forEach(side => {
            sheetRows[kind][side].filter(row => row.failed).forEach(row => retrySheetRow(kind, side, row));
        });
    });
}


/* =========================================
   WRITING ON THE SHEET
   ========================================= */

// A sweater number written in a G / A / No. box.
function sheetSetPlayerField(side, row, field, idField, typed) {
    const text = String(typed || "").trim();
    row[field] = text;

    if (!text) {
        row[idField] = null;
        row.bad[field] = null;
        return;
    }

    const player = sheetPlayerByNumber(side, text);
    if (!player) {
        row[idField] = null;
        row.bad[field] = `No #${text.replace(/^#/, "")} on ${sheetTeamName(side)}`;
        return;
    }

    row[field] = String(player.number);
    row[idField] = player.id;
    row.bad[field] = null;
}

function sheetSetClockField(row, field, typed) {
    const read = sheetReadClock(typed);
    if (read.bad) {
        row[field] = String(typed).trim();
        row.bad[field] = read.bad;
    } else {
        row[field] = read.value;
        row.bad[field] = null;
    }
}

function onSheetFieldChange(control) {
    const el = control.closest(".gs-row");
    if (!el || !sheetRows) return;

    const kind = el.dataset.kind;
    const side = el.dataset.side;
    const row = sheetFindRow(kind, side, el.dataset.key);
    if (!row) return;

    const field = control.dataset.field;
    const value = control.value;
    const wasBlank = !sheetRowHasEntry(kind, row);

    if (kind === "goal") {
        if (field === "period") row.period = value || null;
        else if (field === "time") sheetSetClockField(row, "time", value);
        else sheetSetPlayerField(side, row, field, field + "Id", value);

        // The same player can't be on one goal twice.
        ["a1", "a2"].forEach(f => {
            if (row.bad[f] && row.bad[f].startsWith("Same")) row.bad[f] = null;
        });
        if (row.a1Id && String(row.a1Id) === String(row.gId)) row.bad.a1 = "Same player as the goal scorer";
        if (row.a2Id && (String(row.a2Id) === String(row.gId) || String(row.a2Id) === String(row.a1Id))) row.bad.a2 = "Same player twice on one goal";
    } else if (kind === "pen") {
        if (field === "period") row.period = value || null;
        else if (field === "time") sheetSetClockField(row, "time", value);
        else if (field === "no") sheetSetPlayerField(side, row, "no", "playerId", value);
        else if (field === "minutes") {
            const text = value.trim();
            const minutes = parseInt(text, 10);
            if (!text) {
                row.minutes = null;
                row.bad.minutes = null;
            } else if (!/^\d{1,2}$/.test(text) || minutes < 1) {
                row.minutes = text;
                row.bad.minutes = `Can't read "${text}" as minutes`;
            } else {
                row.minutes = minutes;
                row.bad.minutes = null;
            }
        } else if (field === "infraction") {
            if (value === "__other__") {
                const written = (prompt("Write the offence:") || "").trim();
                row.infraction = written || null;
                // Rebuild the list so the written offence shows as chosen.
                control.innerHTML = sheetOffenceOptionsHtml(row.infraction);
            } else {
                row.infraction = value || null;
            }
        }
    } else {
        if (field === "goalieId") row.goalieId = value || null;
        else if (field === "period") row.period = value || null;
        else if (field === "timeOut") {
            sheetSetClockField(row, "timeOut", value);
            // No time out means he's still in net, so there's no period either.
            if (!row.timeOut) row.period = null;
        }
    }

    // First mark on a fresh penalty line: fill in the usual minutes.
    if (kind === "pen" && wasBlank && sheetRowHasEntry(kind, row) && field !== "minutes" && row.minutes == null) {
        row.minutes = SHEET_DEFAULT_PENALTY_MINUTES;
    }

    if (sheetPadRows(kind, side)) appendSheetRows(kind, side);

    refreshSheetRow(kind, side, row, control);
    refreshSheetTotals();

    // Any OT or shootout goal means the game went to overtime.
    if (kind === "goal" && (row.period === "OT" || row.period === "SO")) {
        const ot = document.getElementById("sheet-went-ot");
        if (ot && !ot.checked) {
            ot.checked = true;
            onSheetOvertimeChange();
        }
    }

    if (sheetRowIsComplete(kind, row)) {
        queueSheetRowSave(kind, side, row);
    } else {
        updateSheetSaveStatus();
    }
}

function onSheetErase(button) {
    const el = button.closest(".gs-row");
    if (!el || !sheetRows) return;

    const kind = el.dataset.kind;
    const side = el.dataset.side;
    const row = sheetFindRow(kind, side, el.dataset.key);
    if (!row || !sheetRowHasEntry(kind, row)) return;

    const what = { goal: "goal", pen: "penalty", goalie: "goalkeeper line" }[kind];
    if (row.id && !confirm(`Erase this ${what} from the sheet?`)) return;

    queueSheetRowErase(kind, side, row);
}


/* =========================================
   LINE-UP (who's on the ice)
   ========================================= */

async function onSheetAttendanceChange(checkbox) {
    const game = sheetGame;
    const side = checkbox.dataset.side;
    const playerId = checkbox.dataset.player;
    const attendance = sheetAttendance;
    const checked = checkbox.checked;

    sheetPendingSaves++;
    updateSheetSaveStatus();

    let error;
    if (checked) {
        ({ error } = await supabaseClient
            .from("game_attendance")
            .insert({ game_id: game.id, team_id: sheetSideTeamId(game, side), player_id: playerId }));
    } else {
        ({ error } = await supabaseClient
            .from("game_attendance")
            .delete()
            .eq("game_id", game.id)
            .eq("player_id", playerId));
    }

    sheetPendingSaves--;

    if (error) {
        console.error(error);
        // Put the check mark back the way it's actually saved.
        checkbox.checked = !checked;
        alert("That check mark didn't save. Check the connection and tap it again.");
    } else if (checked) {
        attendance[side].add(String(playerId));
    } else {
        attendance[side].delete(String(playerId));
    }

    updateSheetSaveStatus();
}

function sheetSideTeamId(game, side) {
    return side === "away" ? game.away_team_id : game.home_team_id;
}


/* =========================================
   GAME STATUS (start / final / reopen / overtime)
   ========================================= */

async function setSheetGameStatus(updates, failureMessage) {
    const game = sheetGame;
    const message = document.getElementById("sheet-signoff-message");
    message.textContent = "Saving…";

    const { error } = await supabaseClient.from("games").update(updates).eq("id", game.id);

    if (error) {
        console.error(error);
        if (game === sheetGame) message.textContent = failureMessage;
        return false;
    }

    Object.assign(game, updates);
    if (game === sheetGame) {
        message.textContent = "";
        refreshSheetStatus();
    }
    await loadSheetGames();
    return true;
}

function startSheetGame() {
    return setSheetGameStatus({ status: "live" }, "There was a problem going live.");
}

function sheetUnsavedLineCount() {
    let count = 0;
    ["goal", "pen", "goalie"].forEach(kind => {
        SHEET_SIDES.forEach(side => {
            sheetRows[kind][side].forEach(row => {
                if (sheetRowHasEntry(kind, row) && (!row.id || row.failed || !sheetRowIsComplete(kind, row))) count++;
            });
        });
    });
    return count;
}

async function finalizeSheetGame() {
    // Let anything still on its way finish first.
    if (sheetPendingSaves > 0) {
        document.getElementById("sheet-signoff-message").textContent = "Still saving — try again in a second.";
        return;
    }

    const unsaved = sheetUnsavedLineCount();
    if (unsaved) {
        alert(`${unsaved} line${unsaved === 1 ? " isn't" : "s aren't"} saved yet (marked in yellow or red). Finish or erase ${unsaved === 1 ? "it" : "them"} before marking the game final.`);
        return;
    }

    const away = sheetRows.goal.away.filter(row => row.id).length;
    const home = sheetRows.goal.home.filter(row => row.id).length;
    const wentOT = document.getElementById("sheet-went-ot").checked;
    const fromSheet = away + home > 0 || sheetGame.away_score == null || sheetGame.home_score == null;
    const summary = `${sheetTeamName("away")} ${fromSheet ? away : sheetGame.away_score}, ` +
        `${sheetTeamName("home")} ${fromSheet ? home : sheetGame.home_score}${wentOT ? " (overtime)" : ""}`;

    if (!confirm(`Mark this game Final?\n\n${summary}\n\nYou can still fix the sheet afterward.`)) return;

    // The score comes from the goals on the sheet. A game with no goals on
    // the sheet only gets 0-0 written if it has no score at all yet, so a
    // score entered on its own in Admin is never wiped out from here.
    const updates = { status: "final", went_ot: wentOT };
    if (away + home > 0 || sheetGame.away_score == null || sheetGame.home_score == null) {
        updates.away_score = away;
        updates.home_score = home;
    }

    await setSheetGameStatus(updates, "There was a problem marking the game final.");
}

function reopenSheetGame() {
    if (!confirm("Reopen this game? It comes off the standings until it's marked Final again.")) return;
    return setSheetGameStatus({ status: "live" }, "There was a problem reopening the game.");
}

// Before the game's final the overtime box is just a note on the sheet
// (saved when the game's marked final). Once it's final, changing it
// changes the standings, so it's saved straight away.
function onSheetOvertimeChange() {
    if (!sheetGame || sheetGame.status !== "final") return;
    setSheetGameStatus(
        { went_ot: document.getElementById("sheet-went-ot").checked },
        "There was a problem saving the overtime box."
    );
}


/* =========================================
   INIT
   ========================================= */

function setupSheetEvents() {
    const sheet = document.getElementById("sheet");

    sheet.addEventListener("change", event => {
        const target = event.target;
        if (target.dataset.field) onSheetFieldChange(target);
        else if (target.dataset.action === "attendance") onSheetAttendanceChange(target);
        else if (target.id === "sheet-went-ot") onSheetOvertimeChange();
    });

    sheet.addEventListener("click", event => {
        const retryNote = event.target.closest(".gs-note.is-retry");
        if (retryNote) {
            const el = retryNote.closest(".gs-row");
            const row = sheetFindRow(el.dataset.kind, el.dataset.side, el.dataset.key);
            if (row) retrySheetRow(el.dataset.kind, el.dataset.side, row);
            return;
        }

        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const action = button.dataset.action;
        if (action === "erase") onSheetErase(button);
        else if (action === "show-side") setSheetActiveSide(button.dataset.side);
        else if (action === "start") startSheetGame();
        else if (action === "final") finalizeSheetGame();
        else if (action === "reopen") reopenSheetGame();
    });

    // Enter moves to the next box on the line, like tabbing across the sheet.
    sheet.addEventListener("keydown", event => {
        if (event.key !== "Enter" || !event.target.matches("input.gs-ink")) return;
        event.preventDefault();
        const boxes = Array.from(sheet.querySelectorAll(".gs-team input.gs-ink, .gs-team select.gs-ink"))
            .filter(box => box.offsetParent !== null);
        const next = boxes[boxes.indexOf(event.target) + 1];
        if (next) next.focus();
        else event.target.blur();
    });

    document.getElementById("sheet-save-status").addEventListener("click", event => {
        if (event.target.closest("[data-action='retry-all']")) retryAllSheetRows();
    });

    document.getElementById("sheet-game-select").addEventListener("change", onSheetGameChange);
    document.getElementById("sheet-print-button").addEventListener("click", () => window.print());

    // Don't let the tab be closed with a line still on its way to the database.
    window.addEventListener("beforeunload", event => {
        if (sheetPendingSaves > 0) {
            event.preventDefault();
            event.returnValue = "";
        }
    });
}

async function initSheetPage() {
    const ok = await requireSheetAdmin();
    if (!ok) return;

    document.getElementById("sheet-page-content").style.display = "";

    const loaded = await loadLeagueData();
    if (!loaded) {
        console.error("Could not load JOHL data from Supabase.");
        document.getElementById("sheet-empty").textContent = "Couldn't load the league's teams and players. Check the connection and reload the page.";
        return;
    }

    setupSheetEvents();
    await loadSheetGames();
}

// Note: js/app.js's own DOMContentLoaded listener already runs
// loadLeagueData() for this page (its render calls are no-ops here since
// their elements don't exist); js/header.js builds the header and nav.
document.addEventListener("DOMContentLoaded", () => {
    initSheetPage();
});
