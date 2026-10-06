/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   SCORE SHEET — PRACTICE GAME (sheet.html?practice)

   A place to learn the Score Sheet without touching a real game. It
   takes the next game on the schedule -- the real teams, the real
   rosters -- and opens a COPY of it. Everything written on that copy is
   kept in this page's memory and nowhere else:

     - js/sheet.js does all its reading and writing of game data through
       sheetDb(). On the real sheet that is the Supabase client. In
       practice it is sheetPracticeDb below, which answers the same
       questions out of a few arrays. Nothing is sent to the database, so
       the Home page, the Schedule and the standings never hear about it.
     - The copy's id is the word "practice", not the real game's number,
       so even a write that somehow got past this file couldn't land on a
       real game.
     - Reloading the page throws the practice game away.

   Along the bottom of the screen the "coach" walks a new timekeeper
   through a game night one step at a time, ticking each step off as it
   is actually done on the sheet.

   This file loads before js/sheet.js.
   ========================================= */

const SHEET_PRACTICE = new URLSearchParams(window.location.search).has("practice");
const SHEET_PRACTICE_GAME_ID = "practice";


/* =========================================
   THE STAND-IN DATABASE
   ========================================= */

const sheetPracticeStore = {
    games: [],
    game_goals: [],
    game_penalties: [],
    game_goalie_periods: [],
    game_attendance: []
};

let sheetPracticeSeq = 0;

function sheetPracticeClone(value) {
    return JSON.parse(JSON.stringify(value));
}

// Answers the handful of query shapes js/sheet.js uses: select / insert /
// update / delete, narrowed with .eq(), ordered with .order(), and
// .single() for "give me the one row back".
function sheetPracticeRun(query) {
    return new Promise(resolve => {
        // A short wait, so "Saving…" shows the way it does on the real sheet.
        setTimeout(() => {
            const rows = sheetPracticeStore[query.table];
            if (!rows) {
                resolve({ data: null, error: { message: `The practice game has no "${query.table}".` } });
                return;
            }

            const matches = row => query.filters.every(filter => String(row[filter.column]) === String(filter.value));

            if (query.op === "insert") {
                const row = Object.assign({ id: ++sheetPracticeSeq }, sheetPracticeClone(query.payload));
                rows.push(row);
                resolve({ data: query.single ? sheetPracticeClone(row) : [sheetPracticeClone(row)], error: null });
                return;
            }

            if (query.op === "update") {
                rows.filter(matches).forEach(row => Object.assign(row, sheetPracticeClone(query.payload)));
                resolve({ data: null, error: null });
                return;
            }

            if (query.op === "delete") {
                sheetPracticeStore[query.table] = rows.filter(row => !matches(row));
                resolve({ data: null, error: null });
                return;
            }

            const found = rows.filter(matches).map(sheetPracticeClone);
            found.sort((a, b) => {
                for (const column of query.orders) {
                    if (a[column] < b[column]) return -1;
                    if (a[column] > b[column]) return 1;
                }
                return 0;
            });

            if (query.single) {
                resolve(found.length === 1 ? { data: found[0], error: null } : { data: null, error: { message: "Not found" } });
                return;
            }

            resolve({ data: found, error: null });
        }, 90);
    });
}

const sheetPracticeDb = {
    from(table) {
        const query = { table, op: "select", payload: null, filters: [], orders: [], single: false };
        const api = {
            select() { return api; },
            insert(payload) { query.op = "insert"; query.payload = payload; return api; },
            update(payload) { query.op = "update"; query.payload = payload; return api; },
            delete() { query.op = "delete"; return api; },
            eq(column, value) { query.filters.push({ column, value }); return api; },
            order(column) { query.orders.push(column); return api; },
            single() { query.single = true; return api; },
            then(resolve, reject) { return sheetPracticeRun(query).then(resolve, reject); }
        };
        return api;
    }
};

// Where js/sheet.js keeps a game's goals, penalties, goalies, roster
// ticks and status: the league database, or the practice arrays above.
function sheetDb() {
    return SHEET_PRACTICE ? sheetPracticeDb : supabaseClient;
}


/* =========================================
   THE PRACTICE GAME
   ========================================= */

// Makes the copy: the next game still to be played (or, once the season
// is over, the last one that was). Only READS the real schedule.
async function sheetPracticeBuildGame() {
    if (sheetPracticeStore.games.length) return true;

    const { data, error } = await supabaseClient
        .from("games")
        .select("id, game_no, game_date, game_time, location, away_team_id, home_team_id, status, no_games")
        .eq("no_games", false)
        .order("game_date", { ascending: true })
        .order("game_time", { ascending: true });

    if (error) {
        console.error("Practice game: couldn't read the schedule:", error);
        return false;
    }

    const playable = (data || []).filter(game => game.away_team_id && game.home_team_id);
    const today = todayISO();
    const source = playable.find(game => game.status !== "final" && game.game_date >= today) || playable[playable.length - 1];
    if (!source) return false;

    sheetPracticeStore.games.push({
        id: SHEET_PRACTICE_GAME_ID,
        practiceOf: source.id,
        game_no: source.game_no,
        game_date: source.game_date,
        game_time: source.game_time,
        location: source.location,
        away_team_id: source.away_team_id,
        home_team_id: source.home_team_id,
        away_score: null,
        home_score: null,
        status: "scheduled",
        went_ot: false,
        no_games: false
    });

    return true;
}

// Dresses the page for practice: the heading, the toolbar buttons and
// the coach. On the real sheet it only shows the way in.
function setupSheetPractice() {
    const link = document.getElementById("sheet-practice-link");
    const restart = document.getElementById("sheet-practice-restart");
    const exit = document.getElementById("sheet-practice-exit");

    if (!SHEET_PRACTICE) {
        if (link) link.hidden = false;
        return;
    }

    document.body.classList.add("gs-practising");

    const title = document.querySelector("#sheet-page-content .page-title");
    if (title) {
        title.querySelector(".eyebrow").textContent = "TIMEKEEPER · PRACTICE";
        title.querySelector("h2").textContent = "Practice Game";
        title.querySelector("p:not(.eyebrow)").textContent =
            "A copy of the next game on the schedule, with the real rosters. Tap anything you like: nothing here is saved, and nothing shows up on the site.";
    }

    document.querySelector("label[for='sheet-game-select']").textContent = "Practice game";
    document.getElementById("sheet-empty").textContent = "Setting up the practice game…";

    if (restart) {
        restart.hidden = false;
        // The practice game only lives in this page, so a reload is a clean sheet.
        restart.addEventListener("click", () => window.location.reload());
    }
    if (exit) exit.hidden = false;

    const coach = document.getElementById("sheet-coach");
    if (coach) {
        coach.addEventListener("click", event => {
            const button = event.target.closest("button[data-coach]");
            if (!button) return;

            const action = button.dataset.coach;
            if (action === "show") showSheetCoachTarget();
            else if (action === "skip" || action === "got-it") {
                const step = sheetCoachCurrentStep();
                if (step) sheetCoach.passed.add(step.id);
                sheetCoach.praise = "";
                updateSheetCoach();
            } else if (action === "toggle") {
                sheetCoach.collapsed = !sheetCoach.collapsed;
                updateSheetCoach();
            } else if (action === "restart") {
                window.location.reload();
            }
        });
    }
}


/* =========================================
   THE COACH

   One step at a time, in the order a game night goes. A step is ticked
   off when the sheet shows it has really been done (a goal saved, the
   game started...), so the coach can't get ahead of the timekeeper. A
   step can also be skipped.
   ========================================= */

const SHEET_COACH_STEPS = [
    {
        id: "roster",
        title: "Tick who's here",
        text: "Before the puck drops, tick the box beside each player who showed up. Try a few now. On a phone, the V and H tabs above the sheet switch between the Visitors and the Home team.",
        target: ".gs-roster",
        praise: "That's the roll call.",
        done: () => SHEET_SIDES.some(side => sheetAttendance[side].size > 0)
    },
    {
        id: "goalies",
        title: "Circle the goalies",
        text: "Each team has a small goalie box (Goals / Time) by its roster. Tap the number of the goalie who's starting and it gets circled. Do it for both teams, Visitors and Home.",
        target: ".gs-goalies",
        praise: "Both goalies are in.",
        done: () => SHEET_SIDES.every(side => {
            const lines = sheetGoalies[side].lines;
            return !lines.length || lines.some(line => line.played || line.timeMin != null || line.timeSec != null);
        })
    },
    {
        id: "start",
        title: "Start the game",
        text: "When the puck drops, tap “Start game — go live”. On a real night, that's what turns on “Watch live” for everybody following along at home.",
        target: "#sheet-start-button",
        praise: "The game's on.",
        done: () => sheetGame.status !== "scheduled"
    },
    {
        id: "goal",
        title: "Write down a goal",
        text: "Somebody scores. On that team's side, take the first line under Goals and pick the period, who scored, and the time on the clock. Add the assists if there were any. There's no Save button — the line saves itself and the score fills in.",
        target: ".gs-box-goal",
        praise: "Goal's on the board.",
        done: () => SHEET_SIDES.some(side => sheetRows.goal[side].some(row => row.id))
    },
    {
        id: "penalty",
        title: "Write down a penalty",
        text: "Under Penalties, pick the period, the player, the time he went OFF, and the S/W — what it was for. ON (when he's allowed back) works itself out.",
        target: ".gs-box-pen",
        praise: "He's in the box.",
        done: () => SHEET_SIDES.some(side => sheetRows.pen[side].some(row => row.id))
    },
    {
        id: "goalie-change",
        title: "A goalie change",
        text: "When a team swaps goalies, pick the period and the time beside the goalie who came OUT. Each goalie's goals against are worked out for you. If he goes back in later, “+ Goalie change” gives you another line.",
        target: ".gs-goalies",
        praise: "Goalie change noted.",
        done: () => SHEET_SIDES.some(side => sheetGoalies[side].lines.some(line => line.timeMin != null || line.timeSec != null))
    },
    {
        id: "fix",
        title: "Fixing a mistake",
        text: "Wrong player or wrong time? Just change it and the line saves again. To wipe out a whole line, tap the ✕ at the end of it. A yellow line isn't saved yet, and a note under it says what's missing. Try changing or erasing one.",
        target: ":is(.gs-box-goal, .gs-box-pen)",
        manual: true,
        praise: "Nothing on the sheet is ever stuck.",
        done: () => false
    },
    {
        id: "final",
        title: "End the game",
        text: "When it's over, scroll to the bottom. If it went to overtime or a shootout, tick that box. Then tap “Game over — mark final” and say OK. That's what puts the result in the standings on a real night.",
        target: "#sheet-final-button",
        praise: "Game over.",
        done: () => sheetGame.status === "final"
    }
];

const sheetCoach = {
    passed: new Set(),   // steps done or skipped
    collapsed: false,
    praise: "",          // a word about the step just finished
    lastStepId: null
};

function sheetCoachCurrentStep() {
    return SHEET_COACH_STEPS.find(step => !sheetCoach.passed.has(step.id)) || null;
}

// The step's spot on the sheet that's actually showing (on a phone only
// one team is on screen at a time).
function sheetCoachTargets(step) {
    if (!step) return [];
    return Array.from(document.querySelectorAll(`#sheet ${step.target}`))
        .filter(el => el.offsetParent !== null && !el.hidden);
}

function showSheetCoachTarget() {
    const targets = sheetCoachTargets(sheetCoachCurrentStep());
    if (!targets.length) return;

    // The first line of a box is where to write, rather than its heading.
    targets[0].scrollIntoView({ behavior: "smooth", block: "center" });
    targets.forEach(el => {
        el.classList.remove("gs-coach-flash");
        void el.offsetWidth;
        el.classList.add("gs-coach-flash");
    });
}

// Only redraws the coach when his words have changed, so a save landing
// in the background can't swallow a tap on one of his buttons.
function setSheetCoachHtml(coach, html) {
    if (coach.dataset.html === html) return;
    coach.dataset.html = html;
    coach.innerHTML = html;
}

// Called by js/sheet.js whenever something on the sheet changes.
function updateSheetCoach() {
    const coach = document.getElementById("sheet-coach");
    if (!SHEET_PRACTICE || !coach) return;

    document.querySelectorAll(".gs-coach-target").forEach(el => el.classList.remove("gs-coach-target"));

    if (!sheetGame || !sheetRows || !sheetGoalies || !sheetAttendance) {
        coach.hidden = true;
        return;
    }

    // Tick off whatever has been done, in order.
    let step = sheetCoachCurrentStep();
    while (step && !step.manual && step.done()) {
        sheetCoach.passed.add(step.id);
        sheetCoach.praise = step.praise;
        step = sheetCoachCurrentStep();
    }

    coach.hidden = false;
    coach.classList.toggle("is-collapsed", sheetCoach.collapsed);

    const total = SHEET_COACH_STEPS.length;

    if (!step) {
        setSheetCoachHtml(coach, `
            <div class="gs-coach-top">
                <span class="gs-coach-count">Practice finished</span>
                <button type="button" class="gs-coach-toggle" data-coach="toggle">${sheetCoach.collapsed ? "Show" : "Hide"}</button>
            </div>
            <div class="gs-coach-body">
                <h3 class="gs-coach-title">That's the whole job.</h3>
                <p class="gs-coach-text">Roll call, goalies, start, goals, penalties, final. On a real night it's exactly this, and every line you write shows up on the site as you write it. Keep poking around here as long as you like.</p>
                <div class="gs-coach-actions">
                    <button type="button" class="gs-coach-button is-main" data-coach="restart">Practise again</button>
                    <a class="gs-coach-button" href="sheet.html">Go to the real Score Sheet</a>
                </div>
            </div>
        `);
        return;
    }

    const number = SHEET_COACH_STEPS.indexOf(step) + 1;
    const dots = SHEET_COACH_STEPS.map(s =>
        `<i class="${sheetCoach.passed.has(s.id) ? "is-done" : s === step ? "is-now" : ""}"></i>`
    ).join("");

    setSheetCoachHtml(coach, `
        <div class="gs-coach-top">
            <span class="gs-coach-count">Step ${number} of ${total}<span class="gs-coach-mini"> · ${sheetEsc(step.title)}</span></span>
            <span class="gs-coach-dots" aria-hidden="true">${dots}</span>
            <button type="button" class="gs-coach-toggle" data-coach="toggle">${sheetCoach.collapsed ? "Show" : "Hide"}</button>
        </div>
        <div class="gs-coach-body">
            ${sheetCoach.praise ? `<p class="gs-coach-praise">✓ ${sheetEsc(sheetCoach.praise)}</p>` : ""}
            <h3 class="gs-coach-title">${sheetEsc(step.title)}</h3>
            <p class="gs-coach-text">${sheetEsc(step.text)}</p>
            <div class="gs-coach-actions">
                <button type="button" class="gs-coach-button is-main" data-coach="show">Show me where</button>
                ${step.manual
                    ? `<button type="button" class="gs-coach-button" data-coach="got-it">Got it — next</button>`
                    : `<button type="button" class="gs-coach-button" data-coach="skip">Skip this step</button>`}
            </div>
        </div>
    `);

    // A steady outline on the part of the sheet this step is about.
    sheetCoachTargets(step).forEach(el => el.classList.add("gs-coach-target"));

    // Each new step is announced once (to a screen reader as well).
    if (sheetCoach.lastStepId !== step.id) {
        sheetCoach.lastStepId = step.id;
        coach.setAttribute("aria-label", `Practice coach, step ${number} of ${total}: ${step.title}`);
    }
}
