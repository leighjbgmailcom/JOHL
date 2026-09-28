/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   LIVE GAME — timekeeper's rink-side entry screen

   Every action here writes straight to Supabase as it happens (no
   "Save" button for goals), and the games table is subscribed to by
   every visitor's Home/Schedule/Standings page (see js/db.js's
   subscribeToGameUpdates), so a goal logged here shows up for anyone
   watching within a second or two.
   ========================================= */

const LIVE_PERIODS = ["1", "2", "3", "OT", "SO"];

let LIVE_GAMES = [];
let currentLiveGame = null;
let currentLivePeriod = "1";
let currentLiveGoals = [];
let currentLivePenalties = [];
let currentLiveGoaliePeriods = { away: {}, home: {} }; // period -> { goalieId, timeIn }
let pendingGoalSide = null; // "away" | "home", while the goal modal is open
let pendingPenaltySide = null; // "away" | "home", while the penalty modal is open


/* =========================================
   ACCESS CONTROL (same rule as admin.html)
   ========================================= */

async function requireLiveAdmin() {
    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "index.html?login=1&redirect=live.html";
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

function liveTeamNameById(id) {
    const team = TEAMS.find(t => String(t.id) === String(id));
    return team ? team.name : "TBD";
}

function liveTeamIdForSide(side) {
    if (!currentLiveGame) return null;
    return side === "away" ? currentLiveGame.away_team_id : currentLiveGame.home_team_id;
}

function playersForLiveTeam(teamId) {
    return PLAYERS.filter(p => {
        const team = TEAMS.find(t => t.code === p.team);
        return team && String(team.id) === String(teamId);
    }).sort((a, b) => {
        if (a.number != null && b.number != null) return a.number - b.number;
        if (a.number != null) return -1;
        if (b.number != null) return 1;
        return a.last.localeCompare(b.last);
    });
}

function goaliesForLiveTeam(teamId) {
    return playersForLiveTeam(teamId).filter(p => p.position === "G" || p.position === "Goalie");
}

function playerLabel(p) {
    return p.number != null ? `#${p.number} ${p.first} ${p.last}` : `${p.first} ${p.last}`;
}


/* =========================================
   LOAD GAME LIST
   ========================================= */

async function loadLiveGames() {
    const { data, error } = await supabaseClient
        .from("games")
        .select("id, game_no, game_date, game_time, away_team_id, home_team_id, away_score, home_score, status, went_ot, no_games")
        .eq("no_games", false)
        .order("game_date", { ascending: false })
        .order("game_time", { ascending: false });

    if (error) {
        console.error("Error loading games:", error);
        return;
    }

    LIVE_GAMES = data;

    const select = document.getElementById("live-game-select");
    select.innerHTML = `<option value="">— Select a game —</option>` +
        LIVE_GAMES.map(game => {
            const label = `${game.game_date} ${formatTime12h(game.game_time ? game.game_time.substring(0, 5) : "")} — ` +
                `${liveTeamNameById(game.away_team_id)} @ ${liveTeamNameById(game.home_team_id)}` +
                (game.status === "final" ? " (Final)" : game.status === "live" ? " (Live)" : "");
            return `<option value="${game.id}">${label}</option>`;
        }).join("");
}


/* =========================================
   SELECTING A GAME
   ========================================= */

async function onLiveGameChange() {
    const gameId = document.getElementById("live-game-select").value;
    const panel = document.getElementById("live-game-panel");

    if (!gameId) {
        panel.style.display = "none";
        currentLiveGame = null;
        return;
    }

    currentLiveGame = LIVE_GAMES.find(g => String(g.id) === String(gameId));
    if (!currentLiveGame) return;

    panel.style.display = "";
    currentLivePeriod = "1";
    document.getElementById("live-went-ot").checked = !!currentLiveGame.went_ot;
    document.getElementById("live-finalize-message").textContent = "";
    document.getElementById("live-status-message").textContent = "";

    await loadLiveGameDetails();
    renderLivePeriodTabs();
    renderLiveScoreboard();
    renderLiveGoalieSelects();
    renderLiveGoalsLists();
    renderLivePenaltiesLists();
}

async function loadLiveGameDetails() {
    const gameId = currentLiveGame.id;

    const [{ data: goals }, { data: penalties }, { data: goaliePeriods }] = await Promise.all([
        supabaseClient.from("game_goals").select("*").eq("game_id", gameId),
        supabaseClient.from("game_penalties").select("*").eq("game_id", gameId),
        supabaseClient.from("game_goalie_periods").select("*").eq("game_id", gameId)
    ]);

    currentLiveGoals = goals || [];
    currentLivePenalties = penalties || [];

    currentLiveGoaliePeriods = { away: {}, home: {} };
    (goaliePeriods || []).forEach(row => {
        const side = String(row.team_id) === String(currentLiveGame.away_team_id) ? "away" : "home";
        currentLiveGoaliePeriods[side][row.period] = { goalieId: row.goalie_id, timeIn: row.time_in };
    });
}


/* =========================================
   RENDERING
   ========================================= */

function renderLivePeriodTabs() {
    const container = document.getElementById("live-period-tabs");
    container.innerHTML = LIVE_PERIODS.map(period => `
        <button type="button" class="live-period-tab ${period === currentLivePeriod ? "active" : ""}" data-period="${period}">${period}</button>
    `).join("");

    container.querySelectorAll(".live-period-tab").forEach(btn => {
        btn.addEventListener("click", () => {
            currentLivePeriod = btn.dataset.period;
            renderLivePeriodTabs();
            renderLiveGoalieSelects();
        });
    });
}

function renderLiveScoreboard() {
    document.getElementById("live-away-name").textContent = liveTeamNameById(currentLiveGame.away_team_id);
    document.getElementById("live-home-name").textContent = liveTeamNameById(currentLiveGame.home_team_id);

    const awayGoals = currentLiveGoals.filter(g => String(g.team_id) === String(currentLiveGame.away_team_id)).length;
    const homeGoals = currentLiveGoals.filter(g => String(g.team_id) === String(currentLiveGame.home_team_id)).length;

    document.getElementById("live-away-score").textContent = awayGoals;
    document.getElementById("live-home-score").textContent = homeGoals;

    const badge = document.getElementById("live-status-badge");
    badge.classList.remove("is-live", "is-final");

    if (currentLiveGame.status === "live") {
        badge.textContent = "Live";
        badge.classList.add("is-live");
    } else if (currentLiveGame.status === "final") {
        badge.textContent = "Final";
        badge.classList.add("is-final");
    } else {
        badge.textContent = "Scheduled";
    }

    document.getElementById("live-go-button").textContent =
        currentLiveGame.status === "scheduled" ? "Start / Go Live" : "Already Live";
    document.getElementById("live-go-button").disabled = currentLiveGame.status !== "scheduled";
}

// Finds the goalie assigned to a period, falling back to whatever the most
// recent earlier period had (so a goalie "carries forward" across periods
// until someone actually changes them, instead of resetting to blank).
// The time-in is NOT carried forward -- it's specific to when that goalie
// actually took over, so a carried-forward period starts with a blank time.
function goalieForPeriod(side, period) {
    if (currentLiveGoaliePeriods[side][period]) return currentLiveGoaliePeriods[side][period].goalieId;

    const index = LIVE_PERIODS.indexOf(period);
    for (let i = index - 1; i >= 0; i--) {
        const earlier = LIVE_PERIODS[i];
        if (currentLiveGoaliePeriods[side][earlier]) return currentLiveGoaliePeriods[side][earlier].goalieId;
    }
    return "";
}

function timeInForPeriod(side, period) {
    const entry = currentLiveGoaliePeriods[side][period];
    return (entry && entry.timeIn) || "";
}

function renderLiveGoalieSelects() {
    ["away", "home"].forEach(side => {
        const teamId = liveTeamIdForSide(side);
        const select = document.getElementById(`live-${side}-goalie`);
        const goalies = goaliesForLiveTeam(teamId);
        const selected = goalieForPeriod(side, currentLivePeriod);

        select.innerHTML = `<option value="">— No goalie assigned —</option>` +
            goalies.map(p => `<option value="${p.id}" ${String(p.id) === String(selected) ? "selected" : ""}>${playerLabel(p)}</option>`).join("");

        document.getElementById(`live-${side}-goalie-time`).value = timeInForPeriod(side, currentLivePeriod);
    });
}

function renderLiveGoalsLists() {
    ["away", "home"].forEach(side => {
        const teamId = liveTeamIdForSide(side);
        const container = document.getElementById(`live-${side}-goals`);

        const goals = currentLiveGoals
            .filter(g => String(g.team_id) === String(teamId))
            .slice()
            .reverse();

        if (goals.length === 0) {
            container.innerHTML = `<p style="color:#97a3ac;">No goals yet.</p>`;
            return;
        }

        container.innerHTML = goals.map(goal => {
            const scorer = PLAYERS.find(p => String(p.id) === String(goal.scorer_id));
            const label = scorer ? `${scorer.first} ${scorer.last}` : "Unknown";
            const timeLabel = goal.game_time ? ` @ ${goal.game_time}` : "";
            return `
                <div class="live-goal-item">
                    <span>P${goal.period}${timeLabel} — ${label}</span>
                    <button type="button" class="link-button danger" onclick="deleteLiveGoal(${goal.id})">✕</button>
                </div>
            `;
        }).join("");
    });
}

function renderLivePenaltiesLists() {
    ["away", "home"].forEach(side => {
        const teamId = liveTeamIdForSide(side);
        const container = document.getElementById(`live-${side}-penalties`);

        const penalties = currentLivePenalties
            .filter(p => String(p.team_id) === String(teamId))
            .slice()
            .reverse();

        if (penalties.length === 0) {
            container.innerHTML = `<p style="color:#97a3ac;">No penalties yet.</p>`;
            return;
        }

        container.innerHTML = penalties.map(penalty => {
            const player = PLAYERS.find(p => String(p.id) === String(penalty.player_id));
            const label = player ? `${player.first} ${player.last}` : "Unknown";
            const timeLabel = penalty.game_time ? ` @ ${penalty.game_time}` : "";
            const infractionLabel = penalty.infraction ? ` (${penalty.infraction})` : "";
            return `
                <div class="live-goal-item">
                    <span>P${penalty.period}${timeLabel} — ${label}, ${penalty.minutes}min${infractionLabel}</span>
                    <button type="button" class="link-button danger" onclick="deleteLivePenalty(${penalty.id})">✕</button>
                </div>
            `;
        }).join("");
    });
}


/* =========================================
   GOAL ENTRY
   ========================================= */

function openLiveGoalModal(side) {
    pendingGoalSide = side;
    const teamId = liveTeamIdForSide(side);
    const players = playersForLiveTeam(teamId);

    document.getElementById("live-goal-modal-title").textContent =
        `${liveTeamNameById(teamId)} Goal — Period ${currentLivePeriod}`;

    const optionsHtml = `<option value="">—</option>` +
        players.map(p => `<option value="${p.id}">${playerLabel(p)}</option>`).join("");

    document.getElementById("live-goal-scorer").innerHTML = optionsHtml;
    document.getElementById("live-goal-assist1").innerHTML = optionsHtml;
    document.getElementById("live-goal-assist2").innerHTML = optionsHtml;
    document.getElementById("live-goal-time").value = "";

    document.getElementById("live-goal-modal").hidden = false;
    document.getElementById("live-goal-scorer").focus();
}

function closeLiveGoalModal() {
    document.getElementById("live-goal-modal").hidden = true;
    pendingGoalSide = null;
}

async function saveLiveGoal() {
    const scorerId = document.getElementById("live-goal-scorer").value;
    if (!scorerId) {
        alert("Pick who scored.");
        return;
    }

    const teamId = liveTeamIdForSide(pendingGoalSide);
    const assist1Id = document.getElementById("live-goal-assist1").value || null;
    const assist2Id = document.getElementById("live-goal-assist2").value || null;
    const gameTime = document.getElementById("live-goal-time").value.trim() || null;

    const { error } = await supabaseClient.from("game_goals").insert({
        game_id: currentLiveGame.id,
        team_id: teamId,
        scorer_id: scorerId,
        assist1_id: assist1Id,
        assist2_id: assist2Id,
        period: currentLivePeriod,
        game_time: gameTime
    });

    if (error) {
        console.error(error);
        alert("There was a problem saving that goal.");
        return;
    }

    closeLiveGoalModal();
    await refreshLiveScoreAndStatus();
}

async function deleteLiveGoal(goalId) {
    if (!confirm("Remove this goal?")) return;

    const { error } = await supabaseClient.from("game_goals").delete().eq("id", goalId);

    if (error) {
        console.error(error);
        alert("There was a problem removing that goal.");
        return;
    }

    await refreshLiveScoreAndStatus();
}


/* =========================================
   PENALTY ENTRY
   ========================================= */

function openLivePenaltyModal(side) {
    pendingPenaltySide = side;
    const teamId = liveTeamIdForSide(side);
    const players = playersForLiveTeam(teamId);

    document.getElementById("live-penalty-modal-title").textContent =
        `${liveTeamNameById(teamId)} Penalty — Period ${currentLivePeriod}`;

    const optionsHtml = `<option value="">—</option>` +
        players.map(p => `<option value="${p.id}">${playerLabel(p)}</option>`).join("");

    document.getElementById("live-penalty-player").innerHTML = optionsHtml;
    document.getElementById("live-penalty-infraction").value = "";
    document.getElementById("live-penalty-minutes").value = 2;
    document.getElementById("live-penalty-time").value = "";

    document.getElementById("live-penalty-modal").hidden = false;
    document.getElementById("live-penalty-player").focus();
}

function closeLivePenaltyModal() {
    document.getElementById("live-penalty-modal").hidden = true;
    pendingPenaltySide = null;
}

async function saveLivePenalty() {
    const playerId = document.getElementById("live-penalty-player").value;
    if (!playerId) {
        alert("Pick who took the penalty.");
        return;
    }

    const teamId = liveTeamIdForSide(pendingPenaltySide);
    const infraction = document.getElementById("live-penalty-infraction").value.trim() || null;
    const minutes = Number(document.getElementById("live-penalty-minutes").value) || 2;
    const gameTime = document.getElementById("live-penalty-time").value.trim() || null;

    const { error } = await supabaseClient.from("game_penalties").insert({
        game_id: currentLiveGame.id,
        team_id: teamId,
        player_id: playerId,
        infraction,
        minutes,
        period: currentLivePeriod,
        game_time: gameTime
    });

    if (error) {
        console.error(error);
        alert("There was a problem saving that penalty.");
        return;
    }

    closeLivePenaltyModal();
    await loadLiveGameDetails();
    renderLivePenaltiesLists();
}

async function deleteLivePenalty(penaltyId) {
    if (!confirm("Remove this penalty?")) return;

    const { error } = await supabaseClient.from("game_penalties").delete().eq("id", penaltyId);

    if (error) {
        console.error(error);
        alert("There was a problem removing that penalty.");
        return;
    }

    await loadLiveGameDetails();
    renderLivePenaltiesLists();
}

// After any goal is added/removed: reload goals, recompute the score from
// them (so the score can never drift from the actual goal log), write the
// new score back to the games row, and mark the game "live" the first time
// this happens if it's still sitting as "scheduled".
async function refreshLiveScoreAndStatus() {
    await loadLiveGameDetails();

    const awayScore = currentLiveGoals.filter(g => String(g.team_id) === String(currentLiveGame.away_team_id)).length;
    const homeScore = currentLiveGoals.filter(g => String(g.team_id) === String(currentLiveGame.home_team_id)).length;

    const updates = { away_score: awayScore, home_score: homeScore };
    if (currentLiveGame.status === "scheduled") {
        updates.status = "live";
    }

    const { error } = await supabaseClient.from("games").update(updates).eq("id", currentLiveGame.id);

    if (error) {
        console.error(error);
    } else {
        Object.assign(currentLiveGame, updates);
    }

    renderLiveScoreboard();
    renderLiveGoalsLists();
}


/* =========================================
   GOALIE ASSIGNMENT
   ========================================= */

// Called when either the goalie <select> or its time-in field changes --
// always reads both together so editing one doesn't clobber the other.
async function onLiveGoalieChange(side) {
    const goalieId = document.getElementById(`live-${side}-goalie`).value;
    const timeIn = document.getElementById(`live-${side}-goalie-time`).value.trim() || null;
    const teamId = liveTeamIdForSide(side);

    if (goalieId) {
        const { error } = await supabaseClient
            .from("game_goalie_periods")
            .upsert(
                { game_id: currentLiveGame.id, team_id: teamId, period: currentLivePeriod, goalie_id: goalieId, time_in: timeIn },
                { onConflict: "game_id,team_id,period" }
            );
        if (error) console.error(error);
        else currentLiveGoaliePeriods[side][currentLivePeriod] = { goalieId, timeIn };
    } else {
        const { error } = await supabaseClient
            .from("game_goalie_periods")
            .delete()
            .eq("game_id", currentLiveGame.id)
            .eq("team_id", teamId)
            .eq("period", currentLivePeriod);
        if (error) console.error(error);
        else delete currentLiveGoaliePeriods[side][currentLivePeriod];
    }
}


/* =========================================
   GAME STATUS
   ========================================= */

async function startLiveGame() {
    const { error } = await supabaseClient
        .from("games")
        .update({ status: "live" })
        .eq("id", currentLiveGame.id);

    if (error) {
        console.error(error);
        document.getElementById("live-status-message").textContent = "There was a problem going live.";
        return;
    }

    currentLiveGame.status = "live";
    renderLiveScoreboard();
}

async function finalizeLiveGame() {
    const wentOT = document.getElementById("live-went-ot").checked;
    const message = document.getElementById("live-finalize-message");

    if (!confirm("Mark this game as Final? You can still fix goals afterward from here or the admin Game Results tab.")) return;

    message.textContent = "Saving...";

    const { error } = await supabaseClient
        .from("games")
        .update({ status: "final", went_ot: wentOT })
        .eq("id", currentLiveGame.id);

    if (error) {
        console.error(error);
        message.textContent = "There was a problem finalizing this game.";
        return;
    }

    currentLiveGame.status = "final";
    currentLiveGame.went_ot = wentOT;
    message.textContent = "Game finalized.";
    renderLiveScoreboard();
    await loadLiveGames();
    document.getElementById("live-game-select").value = currentLiveGame.id;
}


/* =========================================
   INIT
   ========================================= */

async function initLivePage() {
    const ok = await requireLiveAdmin();
    if (!ok) return;

    document.getElementById("live-page-content").style.display = "";

    const loaded = await loadLeagueData();
    if (!loaded) {
        console.error("Could not load JOHL data from Supabase.");
        return;
    }

    await loadLiveGames();

    document.getElementById("live-game-select").addEventListener("change", onLiveGameChange);
    document.getElementById("live-go-button").addEventListener("click", startLiveGame);
    document.getElementById("live-finalize-button").addEventListener("click", finalizeLiveGame);

    document.getElementById("live-away-goal-button").addEventListener("click", () => openLiveGoalModal("away"));
    document.getElementById("live-home-goal-button").addEventListener("click", () => openLiveGoalModal("home"));
    document.getElementById("live-goal-save").addEventListener("click", saveLiveGoal);
    document.getElementById("live-goal-cancel").addEventListener("click", closeLiveGoalModal);
    document.getElementById("live-goal-modal").addEventListener("click", (event) => {
        if (event.target.id === "live-goal-modal") closeLiveGoalModal();
    });

    document.getElementById("live-away-penalty-button").addEventListener("click", () => openLivePenaltyModal("away"));
    document.getElementById("live-home-penalty-button").addEventListener("click", () => openLivePenaltyModal("home"));
    document.getElementById("live-penalty-save").addEventListener("click", saveLivePenalty);
    document.getElementById("live-penalty-cancel").addEventListener("click", closeLivePenaltyModal);
    document.getElementById("live-penalty-modal").addEventListener("click", (event) => {
        if (event.target.id === "live-penalty-modal") closeLivePenaltyModal();
    });

    document.getElementById("live-away-goalie").addEventListener("change", () => onLiveGoalieChange("away"));
    document.getElementById("live-home-goalie").addEventListener("change", () => onLiveGoalieChange("home"));
    document.getElementById("live-away-goalie-time").addEventListener("change", () => onLiveGoalieChange("away"));
    document.getElementById("live-home-goalie-time").addEventListener("change", () => onLiveGoalieChange("home"));
}

// Note: js/app.js's own DOMContentLoaded listener already runs
// setupMobileNav()/loadLeagueData() for this page via js/header.js
// (its other render calls are no-ops here since their elements don't exist).
document.addEventListener("DOMContentLoaded", () => {
    initLivePage();
});
