/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   SCORE SHEET — the timekeeper's paper-style entry screen

   Same job as live.html (goals, penalties, goalies and who was on the
   ice, written straight to Supabase as they happen), laid out like the
   pre-printed paper game sheet:

     Visitors on the left, Home on the right. For each team, top to bottom:
       - the roster (# / last name / first name, goalies at the bottom),
         ticked off in the margin as players show up
       - beside it, the goalie box (Goals / Time for each goalie) and the
         other team's score by period
       - Penalties:  Per. | # | Player | OFF | ON | S/W
       - Scoring:    Per  | Player | Time | Goal | Assist | Assist

   Nothing here has a Save button. A line is saved the moment it has
   enough on it to mean something (a period and a scorer for a goal, a
   period and a player for a penalty), and saved again every time it's
   changed. The games table is subscribed to by every visitor's
   Home/Schedule/Standings page, so the score updates for them too.

   Shared helpers (clock parsing, the goalie maths, the infraction list)
   come from js/app.js, loaded before this file.
   ========================================= */

// Visitors on the left, Home on the right -- the order on the paper sheet.
const SHEET_SIDES = ["away", "home"];
const SHEET_SIDE_TITLE = { away: "Visitors", home: "Home" };
const SHEET_SIDE_LETTER = { away: "V", home: "H" };
const SHEET_SIDE_SHORT = { away: "Visitor", home: "Home" };
const SHEET_PERIODS = ["1", "2", "3", "OT", "SO"];
const SHEET_ROW_KINDS = ["pen", "goal"];

// How many lines each box is printed with. A box always keeps at least
// one blank line at the bottom, so it can never fill up.
const SHEET_LINES = { pen: 10, goal: 13 };

// Penalty lengths, per the constitution (run time).
const SHEET_PENALTY_LENGTHS = [
    { minutes: 3, label: "Minor · 3 min" },
    { minutes: 7, label: "Major · 7 min" }
];
const SHEET_DEFAULT_PENALTY_MINUTES = 3;

// The paper has no period beside a goalie's time: goalies split the game,
// so the change is in the 2nd unless it's changed on the line.
const SHEET_DEFAULT_GOALIE_OUT_PERIOD = "2";
const SHEET_PERIOD_ORDINAL = { "1": "1st", "2": "2nd", "3": "3rd", "OT": "OT" };

let SHEET_GAMES = [];
let sheetGame = null;
let sheetRows = null;        // { goal: { home: [], away: [] }, pen: {...} }
let sheetGoalies = null;     // { home: { rows, dbRows, ... }, away: {...} }
let sheetAttendance = null;  // { home: Set(playerId), away: Set(playerId) }
let sheetKeySeq = 0;
let sheetPendingSaves = 0;
let sheetScoreChain = Promise.resolve();
let sheetActiveSide = "away"; // which team is showing on a phone-width screen


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

function sheetSideTeamId(game, side) {
    return side === "away" ? game.away_team_id : game.home_team_id;
}

function sheetTeamId(side) {
    return sheetSideTeamId(sheetGame, side);
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

function sheetByName(a, b) {
    return a.last.localeCompare(b.last) || a.first.localeCompare(b.first);
}

// One team's roster the way it's printed on the sheet: alphabetical by
// last name.
function sheetRoster(side) {
    const team = sheetTeam(side);
    if (!team) return [];
    return PLAYERS.filter(p => p.team === team.code).sort(sheetByName);
}

function sheetPlayer(id) {
    if (id == null || id === "") return null;
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

// A time is picked in two rolls, minutes (0-20) and seconds (00-59),
// so there's nothing to mis-type. These split a saved "9:05" into its
// two parts and put them back together.
function sheetSplitClock(text) {
    const seconds = parseClockToSeconds(text);
    if (seconds == null || seconds > REGULATION_PERIOD_SECONDS) return { min: null, sec: null };
    return { min: String(Math.floor(seconds / 60)), sec: String(seconds % 60).padStart(2, "0") };
}

// Sets one roll of a time on a row or goalie line and works out the
// whole time from the two: null until both are picked. A period only has
// 20:00 on the clock, so 20 minutes always goes with 00 seconds.
function sheetSetClockPart(target, timeField, part, value) {
    target[part] = value === "" ? null : value;
    if (target.timeMin === "20" && target.timeSec != null) target.timeSec = "00";
    if (target.timeMin === "20" && part === "timeMin") target.timeSec = "00";

    target[timeField] = target.timeMin != null && target.timeSec != null
        ? `${target.timeMin}:${target.timeSec}`
        : null;
}

// Which roll of a half-picked time is still to do, or null.
function sheetClockMissing(target) {
    if (target.timeMin != null && target.timeSec == null) return "pick the seconds";
    if (target.timeMin == null && target.timeSec != null) return "pick the minutes";
    return null;
}

// "Game 3" on the paper is the third game of the night, not the week
// number -- so it's worked out from that night's start times.
function sheetGameSlot(game) {
    const sameNight = SCHEDULE
        .filter(g => g.date === game.game_date && !g.noGames)
        .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    const index = sameNight.findIndex(g => String(g.id) === String(game.id));
    return index === -1 ? null : index + 1;
}

// "October 4, 2026", as printed across the top of the sheet.
function sheetLongDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
}

function sheetFindRow(kind, side, key) {
    return sheetRows[kind][side].find(row => String(row.key) === String(key)) || null;
}

function sheetRowEl(row) {
    return document.querySelector(`.gs-row[data-key="${row.key}"]`);
}

// Everything on the sheet as plain { period, game_time } goals and
// { period, time_out } goalie changes, for the shared OT-length check.
function sheetOvertimeSeconds(rows, goalies) {
    const goals = SHEET_SIDES.flatMap(side => rows.goal[side].map(row => ({ period: row.period, game_time: row.time })));
    const changes = SHEET_SIDES.flatMap(side => goalies[side].rows.map(row => ({ period: row.period, time_out: row.timeOut })));
    return overtimeLengthSeconds(goals, changes);
}


/* =========================================
   LINES ("rows") — one per goal or penalty

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
        timeMin: db ? sheetSplitClock(db.game_time).min : null,
        timeSec: db ? sheetSplitClock(db.game_time).sec : null,
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
        timeMin: db ? sheetSplitClock(db.game_time).min : null,
        timeSec: db ? sheetSplitClock(db.game_time).sec : null,
        no: db ? sheetNumberOf(db.player_id) : "",
        playerId: db ? db.player_id : null,
        minutes: db ? db.minutes : null,
        infraction: db ? (db.infraction || "").trim() || null : null,
        bad: {},
        failed: false,
        chain: Promise.resolve()
    };
}

const SHEET_NEW_ROW = { goal: sheetNewGoalRow, pen: sheetNewPenRow };

// Does this line have anything written on it at all?
function sheetRowHasEntry(kind, row) {
    if (row.id) return true;
    if (row.time || row.timeMin != null || row.timeSec != null) return true;
    if (kind === "goal") return !!(row.g || row.gId || row.a1 || row.a2);
    return !!(row.no || row.playerId || row.infraction);
}

// What a line still needs before it can be saved, in the timekeeper's
// words -- or null if it has everything. The period is never assumed: a
// goal in the wrong period charges it to the wrong goalie.
function sheetRowMissing(kind, row) {
    const clock = sheetClockMissing(row);
    if (clock) return clock;

    if (kind === "goal") {
        if (!row.gId) return "write who scored — his number under Goal, or pick him under Player";
        if (!row.period) return "write the period";
        return null;
    }
    if (!row.playerId) return "write the player's number, or pick him under Player";
    if (!row.period) return "write the period";
    return null;
}

// Is there enough on the line to save it?
function sheetRowIsComplete(kind, row) {
    if (Object.values(row.bad).some(Boolean)) return false;
    return !sheetRowMissing(kind, row);
}

// The order things happened in: by period, then by the clock counting
// down, with untimed entries at the end of their period.
function sheetChronological(a, b) {
    const pa = SHEET_PERIODS.indexOf(a.period);
    const pb = SHEET_PERIODS.indexOf(b.period);
    if (pa !== pb) return pa - pb;
    const sa = parseClockToSeconds(a.game_time);
    const sb = parseClockToSeconds(b.game_time);
    if (sa !== sb) return (sb == null ? -1 : sb) - (sa == null ? -1 : sa);
    return a.id - b.id;
}

// Tops a box up with blank lines: the printed number of lines, and
// always at least one blank one after the last line that's been used.
function sheetPadRows(kind, side) {
    const rows = sheetRows[kind][side];
    let lastUsed = -1;
    rows.forEach((row, index) => {
        if (sheetRowHasEntry(kind, row)) lastUsed = index;
    });
    const wanted = Math.max(SHEET_LINES[kind], lastUsed + 2);
    let added = false;
    while (rows.length < wanted) {
        rows.push(SHEET_NEW_ROW[kind](null));
        added = true;
    }
    return added;
}


/* =========================================
   GOALIES

   The paper prints each team's goalies by number with two boxes beside
   each: Goals and Time. The time is when that goalie CAME OUT, so the
   goalie with a time started and the one without finished.

   On the sheet that's one line per goalie:
     - a time (plus its period, the 2nd unless changed) = he came out then
     - his number circled, no time = he was in net at the end
   and from those the usual one-row-per-stint records are worked out for
   the database (game_goalie_periods), the same shape Admin and the Live
   Game screen write.
   ========================================= */

function sheetNewGoalieLine(goalieId) {
    return { goalieId, played: false, mark: 0, period: null, timeOut: null, timeMin: null, timeSec: null };
}

// The stints, in the order they were played, that one team's goalie
// lines add up to: [{ goalie_id, period, time_out }].
function sheetGoalieStints(lines, otSeconds) {
    const elapsed = line => gameElapsedSeconds(line.period, parseClockToSeconds(line.timeOut), otSeconds);

    const timed = lines
        .filter(line => line.timeOut && line.period)
        .sort((a, b) => elapsed(a) - elapsed(b));
    const stillIn = lines
        .filter(line => line.played && !line.timeOut)
        .sort((a, b) => a.mark - b.mark);

    const stints = timed.map(line => ({ goalie_id: line.goalieId, period: line.period, time_out: line.timeOut }));

    if (stillIn.length) {
        stillIn.forEach(line => stints.push({ goalie_id: line.goalieId, period: null, time_out: null }));
    } else if (timed.length) {
        // Somebody went in when the last goalie came out. With two goalies
        // it can only be the other one.
        const others = lines.filter(line => line !== timed[timed.length - 1]);
        if (others.length === 1) stints.push({ goalie_id: others[0].goalieId, period: null, time_out: null });
    }

    return stints;
}

function sheetSameStints(a, b) {
    return a.length === b.length && a.every((stint, i) =>
        String(stint.goalie_id) === String(b[i].goalie_id) &&
        (stint.period || null) === (b[i].period || null) &&
        (stint.time_out || null) === (b[i].time_out || null)
    );
}

// Builds one team's goalie box from its roster and whatever's already
// saved for the game.
function sheetBuildGoalieBox(side, dbRows, otSeconds) {
    const ordered = buildGoalieTimeline(dbRows.slice().sort((a, b) => a.id - b.id), otSeconds).map(stint => {
        const timeOut = normalizeClockText(stint.row.time_out);
        return {
            id: stint.row.id,
            goalie_id: stint.row.goalie_id,
            period: timeOut && GOALIE_CLOCK_PERIODS.includes(stint.row.period) ? stint.row.period : null,
            time_out: timeOut
        };
    });

    // A line for each goalie on the roster, plus anyone else who's
    // already down as having played goal in this game.
    const ids = sheetRoster(side).filter(p => isGoaliePosition(p.position)).map(p => p.id);
    ordered.forEach(stint => {
        if (!ids.some(id => String(id) === String(stint.goalie_id))) ids.push(stint.goalie_id);
    });

    const lines = ids.map(sheetNewGoalieLine);
    let fits = true;

    ordered.forEach((stint, index) => {
        const line = lines.find(l => String(l.goalieId) === String(stint.goalie_id));
        if (stint.time_out) {
            if (line.timeOut) fits = false; // out twice: more than one line can hold
            line.timeOut = stint.time_out;
            line.timeMin = sheetSplitClock(stint.time_out).min;
            line.timeSec = sheetSplitClock(stint.time_out).sec;
            line.period = stint.period;
        } else {
            line.played = true;
            line.mark = index + 1;
        }
    });

    // Anything the one-line-per-goalie box can't show exactly (a goalie
    // who came out twice, say) is left alone for Admin rather than
    // being rewritten into something it wasn't.
    const readOnly = !fits || !sheetSameStints(sheetGoalieStints(lines, otSeconds), ordered);

    return { lines, rows: lines, dbRows: ordered, readOnly, failed: false, chain: Promise.resolve() };
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
        sheetGoalies = null;
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
        pen: { home: [], away: [] }
    };
    sheetAttendance = { home: new Set(), away: new Set() };

    (goals.data || []).slice().sort(sheetChronological).forEach(db => {
        sheetRows.goal[sheetSideForTeamId(db.team_id)].push(sheetNewGoalRow(db));
    });

    (penalties.data || []).slice().sort(sheetChronological).forEach(db => {
        sheetRows.pen[sheetSideForTeamId(db.team_id)].push(sheetNewPenRow(db));
    });

    const otSeconds = overtimeLengthSeconds(goals.data || [], goaliePeriods.data || []);
    sheetGoalies = {};
    SHEET_SIDES.forEach(side => {
        const teamRows = (goaliePeriods.data || []).filter(db => sheetSideForTeamId(db.team_id) === side);
        sheetGoalies[side] = sheetBuildGoalieBox(side, teamRows, otSeconds);
    });

    (attendance.data || []).forEach(db => {
        sheetAttendance[sheetSideForTeamId(db.team_id)].add(String(db.player_id));
    });

    SHEET_ROW_KINDS.forEach(kind => {
        SHEET_SIDES.forEach(side => sheetPadRows(kind, side));
    });

    printButton.hidden = false;
    renderSheet();
    updateSheetSaveStatus();
}


/* =========================================
   DRAWING THE SHEET
   ========================================= */

function sheetPeriodOptionsHtml(selected) {
    return `<option value=""></option>` + SHEET_PERIODS.map(p =>
        `<option value="${p}" ${p === selected ? "selected" : ""}>${p}</option>`
    ).join("");
}

// The two rolls of a time: minutes 0-20, then seconds 00-59.
function sheetClockHtml(attr, target, label) {
    const minutes = Array.from({ length: 21 }, (_, i) => String(i));
    const seconds = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
    const options = (values, selected) => `<option value=""></option>` +
        values.map(v => `<option value="${v}" ${v === selected ? "selected" : ""}>${v}</option>`).join("");
    return `
        <select class="gs-ink gs-roll" ${attr}="timeMin" aria-label="${label}, minutes">${options(minutes, target.timeMin)}</select>
        <span class="gs-colon" aria-hidden="true">:</span>
        <select class="gs-ink gs-roll" ${attr}="timeSec" aria-label="${label}, seconds">${options(seconds, target.timeSec)}</select>
    `;
}

function sheetInputHtml(field, value, label, extra = "") {
    return `<input type="text" class="gs-ink" data-field="${field}" value="${sheetEsc(value || "")}" aria-label="${label}" autocomplete="off" autocapitalize="off" spellcheck="false" ${extra}>`;
}

function sheetNumberInputHtml(field, value, label) {
    return sheetInputHtml(field, value, label, `inputmode="numeric" maxlength="3"`);
}

// The team's roster for the Player box, number and name together
// ("9 – Bergeron, Ken") in sweater-number order, since the number is
// what gets called out. Whoever's already on the line is always listed,
// even if he's since left the roster.
function sheetPlayerOptionsHtml(side, selectedId) {
    const players = sheetRoster(side).sort((a, b) => {
        if (a.number != null && b.number != null) return a.number - b.number || sheetByName(a, b);
        if (a.number != null) return -1;
        if (b.number != null) return 1;
        return sheetByName(a, b);
    });
    const selected = sheetPlayer(selectedId);
    if (selected && !players.some(p => String(p.id) === String(selected.id))) players.push(selected);

    return `<option value=""></option>` + players.map(p =>
        `<option value="${p.id}" ${String(p.id) === String(selectedId) ? "selected" : ""}>${p.number != null ? p.number + " – " : ""}${sheetEsc(p.last)}, ${sheetEsc(p.first)}</option>`
    ).join("");
}

// The offence list, with its short codes. A loaded offence that isn't on
// the standard list (an older free-typed one) gets its own entry so it's
// shown as written.
function sheetOffenceOptionsHtml(selected) {
    const known = isKnownInfraction(selected);
    return `<option value=""></option>` +
        INFRACTION_TYPES.map(t =>
            `<option value="${sheetEsc(t.name)}" ${selected === t.name ? "selected" : ""}>${sheetEsc(t.name)}</option>`
        ).join("") +
        (selected && !known ? `<option value="${sheetEsc(selected)}" selected>${sheetEsc(selected)}</option>` : "") +
        `<option value="__other__">Other…</option>`;
}

// When the penalized player comes back ON: the time he went OFF less the
// length of the penalty (run time), carried into the next period if the
// period ends first.
function sheetPenaltyOnText(row, minutes) {
    const off = parseClockToSeconds(row.time);
    if (off == null) return `${minutes} min`;

    const on = off - minutes * 60;
    if (on >= 0) return formatSecondsAsClock(on);

    const index = ["1", "2"].indexOf(row.period);
    if (index === -1) return row.period ? "end" : "next per.";
    return `P${index + 2} ${formatSecondsAsClock(REGULATION_PERIOD_SECONDS + on)}`;
}

// The ON box is where the length of the penalty is chosen: it shows the
// time he's back on for a minor, and opens to offer the major instead.
function sheetOnOptionsHtml(row) {
    if (row.minutes == null) return `<option value=""></option>`;

    const lengths = SHEET_PENALTY_LENGTHS.slice();
    if (!lengths.some(l => l.minutes === row.minutes)) {
        lengths.unshift({ minutes: row.minutes, label: `${row.minutes} min` });
    }

    return lengths.map(l => `
        <optgroup label="${sheetEsc(l.label)}">
            <option value="${l.minutes}" ${l.minutes === row.minutes ? "selected" : ""}>${sheetEsc(sheetPenaltyOnText(row, l.minutes))}</option>
        </optgroup>
    `).join("");
}

function sheetEraseHtml() {
    return `<span class="gs-erase-cell"><button type="button" class="gs-erase" data-action="erase" aria-label="Erase this line" title="Erase this line">✕</button></span>`;
}

function sheetPenRowHtml(side, row) {
    return `
        <div class="gs-row" data-kind="pen" data-side="${side}" data-key="${row.key}">
            <span class="gs-cell"><select class="gs-ink" data-field="period" aria-label="Period">${sheetPeriodOptionsHtml(row.period)}</select></span>
            <span class="gs-cell">${sheetNumberInputHtml("no", row.no, "Penalized player, sweater number")}</span>
            <span class="gs-cell gs-name"><select class="gs-ink" data-field="player" aria-label="Penalized player">${sheetPlayerOptionsHtml(side, row.playerId)}</select></span>
            <span class="gs-cell gs-clock">${sheetClockHtml("data-field", row, "Time off")}</span>
            <span class="gs-cell gs-on"><select class="gs-ink" data-field="minutes" aria-label="Time back on (length of penalty)">${sheetOnOptionsHtml(row)}</select></span>
            <span class="gs-cell gs-name"><select class="gs-ink" data-field="infraction" aria-label="Offence">${sheetOffenceOptionsHtml(row.infraction)}</select></span>
            ${sheetEraseHtml()}
            <span class="gs-note"></span>
        </div>
    `;
}

function sheetGoalRowHtml(side, row) {
    return `
        <div class="gs-row" data-kind="goal" data-side="${side}" data-key="${row.key}">
            <span class="gs-cell"><select class="gs-ink" data-field="period" aria-label="Period">${sheetPeriodOptionsHtml(row.period)}</select></span>
            <span class="gs-cell gs-name"><select class="gs-ink" data-field="player" aria-label="Goal scored by">${sheetPlayerOptionsHtml(side, row.gId)}</select></span>
            <span class="gs-cell gs-clock">${sheetClockHtml("data-field", row, "Time of goal")}</span>
            <span class="gs-cell">${sheetNumberInputHtml("g", row.g, "Goal, sweater number")}</span>
            <span class="gs-cell">${sheetNumberInputHtml("a1", row.a1, "First assist, sweater number")}</span>
            <span class="gs-cell">${sheetNumberInputHtml("a2", row.a2, "Second assist, sweater number")}</span>
            ${sheetEraseHtml()}
            <span class="gs-note"></span>
        </div>
    `;
}

const SHEET_ROW_HTML = { goal: sheetGoalRowHtml, pen: sheetPenRowHtml };

function sheetRowsHtml(kind, side) {
    return sheetRows[kind][side].map(row => SHEET_ROW_HTML[kind](side, row)).join("");
}

// The printed roster: # / last name / first name, skaters first and the
// goalies below a gap. The tick goes in the margin beside the name.
function sheetRosterHtml(side) {
    const roster = sheetRoster(side);
    if (!roster.length) return `<p class="gs-roster-empty">No players on this roster yet.</p>`;

    const line = p => `
        <label class="gs-roster-row">
            <input type="checkbox" data-action="attendance" data-side="${side}" data-player="${p.id}" ${sheetAttendance[side].has(String(p.id)) ? "checked" : ""}>
            <span class="gs-tick" aria-hidden="true"></span>
            <span class="gs-roster-no">${p.number != null ? p.number : ""}</span>
            <span class="gs-roster-name">${sheetEsc(p.last)}</span>
            <span class="gs-roster-name">${sheetEsc(p.first)}</span>
        </label>
    `;

    const skaters = roster.filter(p => !isGoaliePosition(p.position));
    const goalies = roster.filter(p => isGoaliePosition(p.position));

    return skaters.map(line).join("") +
        (skaters.length && goalies.length ? `<div class="gs-roster-gap"></div>` : "") +
        goalies.map(line).join("");
}

function sheetGoalieBoxHtml(side) {
    const box = sheetGoalies[side];

    const lines = box.lines.map(line => {
        const player = sheetPlayer(line.goalieId);
        const number = player && player.number != null ? player.number : (player ? player.last : "?");
        const name = player ? `${player.first} ${player.last}` : "Goalie";
        return `
            <div class="gs-goalie-row" data-goalie="${line.goalieId}">
                <button type="button" class="gs-goalie-no" data-action="goalie-played" title="${sheetEsc(name)} — tap if he played">${sheetEsc(number)}</button>
                <span class="gs-cell gs-ga" title="Goals against, worked out from the goal times"></span>
                <span class="gs-cell gs-goalie-time">
                    <select class="gs-ink gs-goalie-period" data-gfield="period" aria-label="Period ${sheetEsc(name)} came out in">
                        <option value=""></option>
                        ${GOALIE_CLOCK_PERIODS.map(p => `<option value="${p}">${SHEET_PERIOD_ORDINAL[p]}</option>`).join("")}
                    </select>
                    ${sheetClockHtml("data-gfield", line, `Time ${sheetEsc(name)} came out`)}
                </span>
            </div>
        `;
    }).join("");

    return `
        <div class="gs-goalies ${box.readOnly ? "is-read-only" : ""}" data-side="${side}">
            <div class="gs-goalie-row gs-goalie-head">
                <span></span>
                <span class="gs-cell">Goals</span>
                <span class="gs-cell">Time</span>
            </div>
            ${lines || `<p class="gs-roster-empty">No goalies on this roster.</p>`}
            <p class="gs-goalie-foot" id="sheet-goalie-foot-${side}"></p>
        </div>
    `;
}

function sheetTeamHtml(side) {
    const other = sheetOtherSide(side);
    return `
        <section class="gs-team" data-side="${side}">

            <div class="gs-top">

                <div class="gs-top-roster">
                    <div class="gs-side-head">
                        <span class="gs-side-letter">${SHEET_SIDE_LETTER[side]}</span>
                        <span class="gs-side-title">${SHEET_SIDE_TITLE[side]}</span>
                    </div>
                    <div class="gs-team-band">${sheetEsc(sheetTeamName(side))}</div>
                    <div class="gs-roster">${sheetRosterHtml(side)}</div>
                </div>

                <div class="gs-top-boxes">
                    ${sheetGoalieBoxHtml(side)}
                    <div class="gs-score" id="sheet-score-${side}" data-shows="${other}"></div>
                </div>

            </div>

            <div class="gs-box gs-box-pen">
                <div class="gs-row gs-head">
                    <span class="gs-cell">Per.</span>
                    <span class="gs-cell">#</span>
                    <span class="gs-cell">${side === "away" ? "Player" : "Players"}</span>
                    <span class="gs-cell">OFF</span>
                    <span class="gs-cell">ON</span>
                    <span class="gs-cell">S/W</span>
                    <span class="gs-erase-cell"></span>
                </div>
                <div class="gs-rows" id="sheet-pen-${side}">${sheetRowsHtml("pen", side)}</div>
            </div>

            <div class="gs-box gs-box-goal">
                <div class="gs-row gs-head">
                    <span class="gs-cell">Per</span>
                    <span class="gs-cell">Player</span>
                    <span class="gs-cell">Time</span>
                    <span class="gs-cell">Goal</span>
                    <span class="gs-cell">Assist</span>
                    <span class="gs-cell">Assist</span>
                    <span class="gs-erase-cell"></span>
                </div>
                <div class="gs-rows" id="sheet-goal-${side}">${sheetRowsHtml("goal", side)}</div>
            </div>

        </section>
    `;
}

function renderSheet() {
    const game = sheetGame;
    const sheet = document.getElementById("sheet");
    const slot = sheetGameSlot(game);

    sheet.innerHTML = `
        <div class="gs-banner">
            <span class="gs-banner-game">Game${slot ? " " + slot : ""}</span>
            <span class="gs-banner-date">${sheetEsc(sheetLongDate(game.game_date))}</span>
            <span class="gs-banner-time">
                ${sheetEsc(formatTime12h(game.game_time ? game.game_time.substring(0, 5) : ""))}
                <span class="gs-stamp" id="sheet-stamp" hidden></span>
            </span>
        </div>

        <div class="gs-side-tabs" role="tablist">
            ${SHEET_SIDES.map(side => `
                <button type="button" role="tab" data-action="show-side" data-side="${side}">
                    <strong>${SHEET_SIDE_LETTER[side]}</strong> ${sheetEsc(sheetTeamName(side))}
                </button>
            `).join("")}
        </div>

        <div class="gs-teams">
            ${SHEET_SIDES.map(sheetTeamHtml).join("")}
        </div>

        <div class="gs-signoff gs-screen-only">
            <label class="gs-ot">
                <input type="checkbox" id="sheet-went-ot" ${game.went_ot ? "checked" : ""}>
                <span class="gs-tick" aria-hidden="true"></span>
                <span>Decided in overtime or a shootout <small>(the loser gets a point)</small></span>
            </label>
            <div class="gs-signoff-actions">
                <span class="gs-signoff-message" id="sheet-signoff-message"></span>
                <button type="button" class="gs-tool-button" id="sheet-start-button" data-action="start">Start game — go live</button>
                <button type="button" class="button" id="sheet-final-button" data-action="final">Game over — mark final</button>
                <button type="button" class="gs-tool-button" id="sheet-reopen-button" data-action="reopen">Reopen game</button>
            </div>
        </div>
    `;

    SHEET_ROW_KINDS.forEach(kind => {
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
        container.insertAdjacentHTML("beforeend", SHEET_ROW_HTML[kind](side, rows[index]));
        refreshSheetRow(kind, side, rows[index]);
    }
}


/* =========================================
   KEEPING THE SHEET UP TO DATE
   ========================================= */

// What's wrong with a line, or what it's still waiting for -- shown
// under it. A line with nothing to say has no note.
function sheetRowNote(kind, row) {
    const problem = Object.values(row.bad).find(Boolean);
    if (problem) return { text: problem, problem: true };

    if (row.failed) return { text: "Not saved — tap here to try again", problem: true, retry: true };

    if (!sheetRowHasEntry(kind, row)) return { text: "" };

    const missing = sheetRowMissing(kind, row);
    if (missing) {
        // Already saved once: what's in the database is the line as it
        // was before this change, so say so.
        if (row.id) return { text: `Change not saved — ${missing}, or ✕ to erase the line`, problem: true };
        return { text: `Not saved yet — ${missing}` };
    }

    return { text: "" };
}

function sheetRowFieldValue(kind, row, field) {
    if (field === "player") return kind === "goal" ? row.gId : row.playerId;
    return row[field];
}

// Redraws one line from its row: boxes tidied to what was saved, problem
// boxes in red, the note underneath, and whether it's ink (saved) or
// still highlighted (not saved yet).
function refreshSheetRow(kind, side, row, justWritten) {
    const el = sheetRowEl(row);
    if (!el) return;

    el.querySelectorAll("[data-field]").forEach(control => {
        const field = control.dataset.field;
        // A box that's being used right now is left alone, unless it's
        // the one that was just written in.
        const busy = document.activeElement === control && control !== justWritten;

        if (field === "minutes") {
            // The ON times depend on the OFF time, so this list is rebuilt.
            if (!busy) control.innerHTML = sheetOnOptionsHtml(row);
        } else if (!busy) {
            const raw = sheetRowFieldValue(kind, row, field);
            const value = raw == null ? "" : String(raw);
            if (control.value !== value) control.value = value;
        }

        if (!field.startsWith("time")) control.closest(".gs-cell").classList.toggle("is-bad", !!row.bad[field]);
    });

    const clock = el.querySelector(".gs-clock");
    if (clock) clock.classList.toggle("has-time", row.timeMin != null || row.timeSec != null);

    const note = sheetRowNote(kind, row);
    const noteEl = el.querySelector(".gs-note");
    noteEl.textContent = note.text;
    noteEl.classList.toggle("is-problem", !!note.problem);
    noteEl.classList.toggle("is-retry", !!note.retry);

    const used = sheetRowHasEntry(kind, row);
    const saved = !!row.id && !note.text;
    el.classList.toggle("is-used", used);
    el.classList.toggle("is-saved", saved);
    el.classList.toggle("is-pencil", used && !saved);
}

// One team's goalie box: who's circled as having played, the times,
// each goalie's goals against, and anything that still needs sorting out.
function refreshSheetGoalies(side, justWritten) {
    const box = sheetGoalies[side];
    const el = document.querySelector(`.gs-goalies[data-side="${side}"]`);
    if (!el) return;

    const otSeconds = sheetOvertimeSeconds(sheetRows, sheetGoalies);
    const stints = box.readOnly
        ? box.dbRows.map(stint => ({ ...stint }))
        : sheetGoalieStints(box.lines, otSeconds);

    // Goals against, charged to whoever was in net when each goal went in.
    const against = sheetRows.goal[sheetOtherSide(side)]
        .filter(row => row.id && row.gId)
        .map(row => ({ period: row.period, game_time: row.time }));
    const counts = goalsAgainstByGoalieRow(stints, against, otSeconds);

    box.lines.forEach(line => {
        const rowEl = el.querySelector(`.gs-goalie-row[data-goalie="${line.goalieId}"]`);
        if (!rowEl) return;

        const mine = stints.filter(stint => String(stint.goalie_id) === String(line.goalieId));
        const playing = mine.length > 0;

        rowEl.querySelector(".gs-goalie-no").classList.toggle("is-playing", playing);
        rowEl.querySelector(".gs-goalie-no").setAttribute("aria-pressed", playing ? "true" : "false");
        rowEl.querySelector(".gs-ga").textContent = playing
            ? mine.reduce((sum, stint) => sum + counts.get(stint), 0)
            : "";

        rowEl.querySelectorAll("[data-gfield]").forEach(control => {
            const field = control.dataset.gfield;
            control.disabled = box.readOnly;
            if (document.activeElement === control && control !== justWritten) return;
            const value = line[field] == null ? "" : String(line[field]);
            if (control.value !== value) control.value = value;
        });

        rowEl.querySelector(".gs-goalie-time").classList.toggle("has-time", line.timeMin != null || line.timeSec != null);
    });

    const foot = document.getElementById(`sheet-goalie-foot-${side}`);
    const halfPicked = box.lines.map(sheetClockMissing).find(Boolean);
    const stillIn = stints.filter(stint => !stint.time_out).length;
    let message = "";
    let retry = false;

    if (box.readOnly) message = "These goalie changes were entered in Admin and don't fit this box — change them there.";
    else if (halfPicked) message = `Not saved yet — ${halfPicked}.`;
    else if (box.failed) { message = "Goalies not saved — tap here to try again"; retry = true; }
    else if (stillIn > 1) message = "Write the time the first goalie came out.";
    else if (stints.length && stillIn === 0) message = "Tap the number of the goalie who went in.";

    foot.textContent = message;
    foot.classList.toggle("is-retry", retry);
}

// The other team's score by period (printed beside this team's goalies),
// and each goalie's goals against -- all worked out from the goals that
// are saved on the sheet.
function refreshSheetTotals() {
    if (!sheetGame) return;

    SHEET_SIDES.forEach(side => {
        const el = document.getElementById(`sheet-score-${side}`);
        if (!el) return;

        const shows = el.dataset.shows;
        const goals = sheetRows.goal[shows].filter(row => row.id);
        const count = period => goals.filter(row => row.period === period).length;

        // The paper has 1, 2, 3 and Total; OT and SO get a box only in a
        // game that has a goal in them.
        const periods = ["1", "2", "3"].concat(["OT", "SO"].filter(count));
        const started = SHEET_SIDES.some(s => sheetRows.goal[s].some(row => row.id));

        el.style.setProperty("--gs-score-columns", periods.length);
        el.innerHTML = `
            <div class="gs-score-label">${SHEET_SIDE_SHORT[shows]}</div>
            <div class="gs-score-grid">
                ${periods.map(p => `<span class="gs-cell gs-score-head">${p}</span>`).join("")}
                <span class="gs-cell gs-score-head">Total</span>
                ${periods.map(p => `<span class="gs-cell gs-written" data-period="${p}">${count(p) || ""}</span>`).join("")}
                <span class="gs-cell gs-written gs-score-total" data-period="total">${started ? goals.length : ""}</span>
            </div>
        `;

        refreshSheetGoalies(side);
    });
}

// The LIVE / FINAL stamp and which of the sign-off buttons apply.
function refreshSheetStatus() {
    if (!sheetGame) return;
    const status = sheetGame.status;

    const stamp = document.getElementById("sheet-stamp");
    if (!stamp) return;
    stamp.hidden = status !== "final" && status !== "live";
    stamp.textContent = status === "final" ? "Final" : "Live";
    stamp.classList.toggle("is-live", status === "live");

    document.getElementById("sheet-start-button").hidden = status !== "scheduled";
    document.getElementById("sheet-final-button").hidden = status === "final";
    document.getElementById("sheet-reopen-button").hidden = status !== "final";
}

function sheetFailedRows() {
    const failed = [];
    SHEET_ROW_KINDS.forEach(kind => {
        SHEET_SIDES.forEach(side => {
            sheetRows[kind][side].forEach(row => {
                if (row.failed) failed.push({ kind, side, row });
            });
        });
    });
    return failed;
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

    const failed = sheetFailedRows().length + SHEET_SIDES.filter(side => sheetGoalies[side].failed).length;

    if (sheetPendingSaves > 0) {
        el.textContent = "Saving…";
        el.classList.add("is-saving");
    } else if (failed) {
        el.innerHTML = `${failed} line${failed === 1 ? "" : "s"} not saved <button type="button" class="gs-retry" data-action="retry-all">Try again</button>`;
        el.classList.add("is-problem");
    } else {
        el.textContent = "✓ Everything on the sheet is saved";
    }
}


/* =========================================
   SAVING

   Every save for one line goes through that line's own queue, so a
   second change made while the first is still on its way can't overtake
   it (or insert the same goal twice). Each team's goalie box has one
   queue of its own for the same reason.
   ========================================= */

const SHEET_TABLE = { goal: "game_goals", pen: "game_penalties" };

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
    return {
        period: row.period,
        game_time: row.time || null,
        player_id: row.playerId,
        minutes: row.minutes || SHEET_DEFAULT_PENALTY_MINUTES,
        infraction: row.infraction || null
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
        // Gone: the lines below move up and a fresh blank one goes on the end.
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

// Makes the saved goalie records for one team match its goalie box:
// existing rows are updated in place, extra ones added or removed.
function queueSheetGoalieSync(side) {
    const game = sheetGame;
    const rows = sheetRows;
    const goalies = sheetGoalies;
    const box = goalies[side];
    const teamId = sheetTeamId(side);

    if (box.readOnly) return box.chain;

    sheetPendingSaves++;
    updateSheetSaveStatus();

    box.chain = box.chain.then(async () => {
        // Worked out when the save actually runs, so it's always the
        // latest state of the box that's written.
        const wanted = sheetGoalieStints(box.lines, sheetOvertimeSeconds(rows, goalies));
        const table = () => supabaseClient.from("game_goalie_periods");

        for (let i = 0; i < wanted.length; i++) {
            const existing = box.dbRows[i];
            if (existing) {
                if (sheetSameStints([existing], [wanted[i]])) continue;
                const { error } = await table().update(wanted[i]).eq("id", existing.id);
                if (error) throw error;
                Object.assign(existing, wanted[i]);
            } else {
                const { data, error } = await table()
                    .insert({ game_id: game.id, team_id: teamId, ...wanted[i] })
                    .select()
                    .single();
                if (error) throw error;
                box.dbRows.push({ id: data.id, ...wanted[i] });
            }
        }

        while (box.dbRows.length > wanted.length) {
            const extra = box.dbRows[box.dbRows.length - 1];
            const { error } = await table().delete().eq("id", extra.id);
            if (error) throw error;
            box.dbRows.pop();
        }

        box.failed = false;
    }).catch(error => {
        console.error("Score sheet goalie save failed:", error);
        box.failed = true;
    }).then(() => {
        sheetPendingSaves--;
        if (goalies === sheetGoalies) refreshSheetGoalies(side);
        updateSheetSaveStatus();
    });

    return box.chain;
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
    sheetFailedRows().forEach(({ kind, side, row }) => retrySheetRow(kind, side, row));
    SHEET_SIDES.filter(side => sheetGoalies[side].failed).forEach(queueSheetGoalieSync);
}


/* =========================================
   WRITING ON THE SHEET
   ========================================= */

// A sweater number written in a Goal / Assist / # box.
function sheetSetPlayerNumber(side, row, field, idField, typed) {
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

// A name picked in a Player box: fills in his number beside it.
function sheetSetPlayerPicked(row, field, idField, playerId) {
    const player = sheetPlayer(playerId);
    row[idField] = player ? player.id : null;
    row[field] = sheetNumberOf(playerId);
    row.bad[field] = null;
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

    if (field === "period") row.period = value || null;
    else if (field === "timeMin" || field === "timeSec") sheetSetClockPart(row, "time", field, value);
    else if (kind === "goal") {
        if (field === "player") sheetSetPlayerPicked(row, "g", "gId", value);
        else sheetSetPlayerNumber(side, row, field, field + "Id", value);

        // The same player can't be on one goal twice.
        ["a1", "a2"].forEach(f => {
            if (row.bad[f] && row.bad[f].startsWith("Same")) row.bad[f] = null;
        });
        if (row.a1Id && String(row.a1Id) === String(row.gId)) row.bad.a1 = "Same player as the goal scorer";
        if (row.a2Id && (String(row.a2Id) === String(row.gId) || String(row.a2Id) === String(row.a1Id))) row.bad.a2 = "Same player twice on one goal";
    } else if (field === "player") sheetSetPlayerPicked(row, "no", "playerId", value);
    else if (field === "no") sheetSetPlayerNumber(side, row, "no", "playerId", value);
    else if (field === "minutes") row.minutes = parseInt(value, 10) || SHEET_DEFAULT_PENALTY_MINUTES;
    else if (field === "infraction") {
        if (value === "__other__") {
            const written = (prompt("Write the offence:") || "").trim();
            row.infraction = written || null;
            // Rebuild the list so the written offence shows as chosen.
            control.innerHTML = sheetOffenceOptionsHtml(row.infraction);
        } else {
            row.infraction = value || null;
        }
    }

    // A penalty is a 3-minute minor unless the ON box says otherwise.
    if (kind === "pen") {
        if (sheetRowHasEntry(kind, row)) {
            if (row.minutes == null) row.minutes = SHEET_DEFAULT_PENALTY_MINUTES;
        } else {
            row.minutes = null;
        }
    }

    if (sheetPadRows(kind, side)) appendSheetRows(kind, side);

    refreshSheetRow(kind, side, row, control);
    refreshSheetTotals();

    // Any OT or shootout goal means the game went past regulation.
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

    if (row.id && !confirm(`Erase this ${kind === "goal" ? "goal" : "penalty"} from the sheet?`)) return;

    queueSheetRowErase(kind, side, row);
}

function sheetGoalieLineFor(target) {
    const rowEl = target.closest(".gs-goalie-row");
    const boxEl = target.closest(".gs-goalies");
    if (!rowEl || !boxEl || !sheetGoalies) return null;

    const side = boxEl.dataset.side;
    const box = sheetGoalies[side];
    const line = box.lines.find(l => String(l.goalieId) === rowEl.dataset.goalie);
    return line && !box.readOnly ? { side, box, line } : null;
}

// A period or a time picked beside a goalie: when he came out. The
// time only counts once both of its rolls are picked.
function onSheetGoalieFieldChange(control) {
    const found = sheetGoalieLineFor(control);
    if (!found) return;
    const { side, line } = found;
    const field = control.dataset.gfield;

    if (field === "period") line.period = control.value || null;
    else {
        sheetSetClockPart(line, "timeOut", field, control.value);
        // Time rubbed out altogether: he didn't come out, so no period either.
        if (line.timeMin == null && line.timeSec == null) line.period = null;
    }

    // The paper has no period beside the time: it's the 2nd unless one
    // was picked.
    if (line.timeOut && !line.period) line.period = SHEET_DEFAULT_GOALIE_OUT_PERIOD;

    refreshSheetGoalies(side, control);
    refreshSheetTotals();

    if (sheetClockMissing(line)) updateSheetSaveStatus();
    else queueSheetGoalieSync(side);
}

// Tapping a goalie's number circles it: he played. (A goalie with a
// time beside him obviously played, so there's nothing to un-circle.)
function onSheetGoaliePlayed(button) {
    const found = sheetGoalieLineFor(button);
    if (!found) return;
    const { side, box, line } = found;

    if (line.timeOut) return;

    line.played = !line.played;
    line.mark = Math.max(0, ...box.lines.map(l => l.mark)) + 1;

    refreshSheetGoalies(side);
    refreshSheetTotals();
    queueSheetGoalieSync(side);
}


/* =========================================
   ROSTER TICKS (who's on the ice)
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
        // Put the tick back the way it's actually saved.
        checkbox.checked = !checked;
        alert("That tick didn't save. Check the connection and tap it again.");
    } else if (checked) {
        attendance[side].add(String(playerId));
    } else {
        attendance[side].delete(String(playerId));
    }

    updateSheetSaveStatus();
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
    let count = SHEET_SIDES.filter(side => sheetGoalies[side].failed || sheetGoalies[side].lines.some(sheetClockMissing)).length;
    SHEET_ROW_KINDS.forEach(kind => {
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
        alert(`${unsaved} line${unsaved === 1 ? " isn't" : "s aren't"} saved yet (highlighted on the sheet). Finish or erase ${unsaved === 1 ? "it" : "them"} before marking the game final.`);
        return;
    }

    const away = sheetRows.goal.away.filter(row => row.id).length;
    const home = sheetRows.goal.home.filter(row => row.id).length;
    const wentOT = document.getElementById("sheet-went-ot").checked;

    // The score comes from the goals on the sheet. A game with no goals on
    // the sheet only gets 0-0 written if it has no score at all yet, so a
    // score entered on its own in Admin is never wiped out from here.
    const fromSheet = away + home > 0 || sheetGame.away_score == null || sheetGame.home_score == null;
    const summary = `${sheetTeamName("away")} ${fromSheet ? away : sheetGame.away_score}, ` +
        `${sheetTeamName("home")} ${fromSheet ? home : sheetGame.home_score}${wentOT ? " (overtime / shootout)" : ""}`;

    const noGoalie = SHEET_SIDES
        .filter(side => !sheetGoalies[side].readOnly && !sheetGoalies[side].dbRows.length)
        .map(side => `No goalie is marked for ${sheetTeamName(side)} — tap the number of the goalie who played.`);

    if (!confirm(`Mark this game Final?\n\n${summary}\n${noGoalie.length ? "\n" + noGoalie.join("\n") + "\n" : ""}\nYou can still fix the sheet afterward.`)) return;

    const updates = { status: "final", went_ot: wentOT };
    if (fromSheet) {
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
        else if (target.dataset.gfield) onSheetGoalieFieldChange(target);
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

        const retryGoalies = event.target.closest(".gs-goalie-foot.is-retry");
        if (retryGoalies) {
            queueSheetGoalieSync(retryGoalies.closest(".gs-goalies").dataset.side);
            return;
        }

        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const action = button.dataset.action;
        if (action === "erase") onSheetErase(button);
        else if (action === "goalie-played") onSheetGoaliePlayed(button);
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
            .filter(box => box.offsetParent !== null && !box.disabled);
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
