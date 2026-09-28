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
let currentLiveGoalieStints = { away: {}, home: {} }; // period -> [{ id, goalieId, timeIn }, ...]
let currentLiveAttendance = { away: new Set(), home: new Set() }; // player ids on the ice
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
    return playersForLiveTeam(teamId).filter(p => isGoaliePosition(p.position));
}

function playerLabel(p) {
    return p.number != null ? `#${p.number} ${p.first} ${p.last}` : `${p.first} ${p.last}`;
}


/* =========================================
   LOAD GAME LIST
   ========================================= */

// Shows just the next 3 games coming up (today or later, not already
// final) -- not the full season and not anything a week or two out, so
// the timekeeper isn't hunting through a long list rink-side. A game
// that's already "live" always stays in this list too, however its date
// compares, so an in-progress game is never dropped mid-entry.
async function loadLiveGames() {
    const todayIso = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabaseClient
        .from("games")
        .select("id, game_no, game_date, game_time, away_team_id, home_team_id, away_score, home_score, status, went_ot, no_games")
        .eq("no_games", false)
        .neq("status", "final")
        .order("game_date", { ascending: true })
        .order("game_time", { ascending: true });

    if (error) {
        console.error("Error loading games:", error);
        return;
    }

    LIVE_GAMES = (data || [])
        .filter(game => game.status === "live" || game.game_date >= todayIso)
        .slice(0, 3);

    const select = document.getElementById("live-game-select");
    select.innerHTML = `<option value="">— Select a game —</option>` +
        LIVE_GAMES.map(game => {
            const label = `${game.game_date} ${formatTime12h(game.game_time ? game.game_time.substring(0, 5) : "")} — ` +
                `${liveTeamNameById(game.away_team_id)} @ ${liveTeamNameById(game.home_team_id)}` +
                (game.status === "live" ? " (Live)" : "");
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
    renderLiveGoalieStints();
    renderLiveGoalsLists();
    renderLivePenaltiesLists();
    renderLiveAttendance();
}

async function loadLiveGameDetails() {
    const gameId = currentLiveGame.id;

    const [{ data: goals }, { data: penalties }, { data: goaliePeriods }, { data: attendance }] = await Promise.all([
        supabaseClient.from("game_goals").select("*").eq("game_id", gameId),
        supabaseClient.from("game_penalties").select("*").eq("game_id", gameId),
        supabaseClient.from("game_goalie_periods").select("*").eq("game_id", gameId),
        supabaseClient.from("game_attendance").select("*").eq("game_id", gameId)
    ]);

    currentLiveGoals = goals || [];
    currentLivePenalties = penalties || [];

    currentLiveGoalieStints = { away: {}, home: {} };
    (goaliePeriods || []).forEach(row => {
        const side = String(row.team_id) === String(currentLiveGame.away_team_id) ? "away" : "home";
        if (!currentLiveGoalieStints[side][row.period]) currentLiveGoalieStints[side][row.period] = [];
        currentLiveGoalieStints[side][row.period].push({ id: row.id, goalieId: row.goalie_id, timeIn: row.time_in });
    });

    currentLiveAttendance = { away: new Set(), home: new Set() };
    (attendance || []).forEach(row => {
        const side = String(row.team_id) === String(currentLiveGame.away_team_id) ? "away" : "home";
        currentLiveAttendance[side].add(String(row.player_id));
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
            renderLiveGoalieStints();
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

// A period can now have more than one goalie stint (an injury swap
// mid-period, say), each with its own M:SS clock reading for when that
// goalie took over. Sorted so the stint that started the period comes
// first -- a stint with no time recorded is treated as "started at the
// top of the period" (parseClockToSeconds/isGoaliePosition come from
// js/app.js, loaded before this file).
function sortedGoalieStints(stints) {
    return (stints || []).slice().sort((a, b) => {
        const as = parseClockToSeconds(a.timeIn);
        const bs = parseClockToSeconds(b.timeIn);
        if (as == null && bs == null) return 0;
        if (as == null) return -1;
        if (bs == null) return 1;
        return bs - as;
    });
}

// For display only, when a period has no stints of its own yet: whoever
// finished the most recent earlier period is presumed to still be in net,
// same rule the goalie stats page uses. Nothing is written to the
// database until a stint is actually added for this period.
function carriedForwardGoalieId(side, period) {
    const index = LIVE_PERIODS.indexOf(period);
    for (let i = index - 1; i >= 0; i--) {
        const earlier = LIVE_PERIODS[i];
        const stints = currentLiveGoalieStints[side][earlier];
        if (stints && stints.length) {
            const sorted = sortedGoalieStints(stints);
            return sorted[sorted.length - 1].goalieId;
        }
    }
    return "";
}

function goalieStintOptionsHtml(teamId, selectedId) {
    const goalies = goaliesForLiveTeam(teamId);
    return `<option value="">— Select goalie —</option>` +
        goalies.map(p => `<option value="${p.id}" ${String(p.id) === String(selectedId) ? "selected" : ""}>${playerLabel(p)}</option>`).join("");
}

function renderLiveGoalieStints() {
    ["away", "home"].forEach(side => {
        const teamId = liveTeamIdForSide(side);
        const container = document.getElementById(`live-${side}-goalie-stints`);
        if (!container) return;

        const stints = sortedGoalieStints(currentLiveGoalieStints[side][currentLivePeriod]);
        let html = "";

        if (!stints.length) {
            const carriedId = carriedForwardGoalieId(side, currentLivePeriod);
            const carriedPlayer = carriedId ? PLAYERS.find(p => String(p.id) === String(carriedId)) : null;
            if (carriedPlayer) {
                html += `<div class="live-goalie-carried">Continuing: ${playerLabel(carriedPlayer)}</div>`;
            }
        }

        html += stints.map(stint => `
            <div class="live-goalie-stint-row">
                <select onchange="updateLiveGoalieStint('${side}', ${stint.id}, 'goalieId', this.value)">
                    ${goalieStintOptionsHtml(teamId, stint.goalieId)}
                </select>
                <input type="text" class="live-time-input" placeholder="M:SS" inputmode="numeric" value="${stint.timeIn || ""}"
                    onchange="updateLiveGoalieStint('${side}', ${stint.id}, 'timeIn', this.value)">
                <button type="button" class="live-stint-remove" onclick="removeLiveGoalieStint('${side}', ${stint.id})">✕</button>
            </div>
        `).join("");

        html += `
            <div class="live-goalie-stint-row live-goalie-add-row">
                <select id="live-${side}-new-goalie">${goalieStintOptionsHtml(teamId, "")}</select>
                <input type="text" class="live-time-input" id="live-${side}-new-goalie-time" placeholder="M:SS" inputmode="numeric">
                <button type="button" class="live-stint-add" onclick="addLiveGoalieStint('${side}')">+ Add</button>
            </div>
        `;

        container.innerHTML = html;
    });
}

// Adds a new goalie stint to the CURRENT period (a starting goalie, or a
// mid-period change) -- inserted right away so it's live the moment it's
// entered.
async function addLiveGoalieStint(side) {
    const goalieSelect = document.getElementById(`live-${side}-new-goalie`);
    const timeInput = document.getElementById(`live-${side}-new-goalie-time`);
    const goalieId = goalieSelect.value;
    const timeIn = timeInput.value.trim() || null;

    if (!goalieId) {
        goalieSelect.focus();
        return;
    }

    const teamId = liveTeamIdForSide(side);
    const { data, error } = await supabaseClient
        .from("game_goalie_periods")
        .insert({ game_id: currentLiveGame.id, team_id: teamId, period: currentLivePeriod, goalie_id: goalieId, time_in: timeIn })
        .select()
        .single();

    if (error) {
        console.error(error);
        return;
    }

    if (!currentLiveGoalieStints[side][currentLivePeriod]) currentLiveGoalieStints[side][currentLivePeriod] = [];
    currentLiveGoalieStints[side][currentLivePeriod].push({ id: data.id, goalieId: data.goalie_id, timeIn: data.time_in });
    renderLiveGoalieStints();
}

// Edits one field of an existing stint. Clearing the goalie on an
// existing stint just removes it, rather than leaving a blank one behind.
async function updateLiveGoalieStint(side, id, field, value) {
    const stints = currentLiveGoalieStints[side][currentLivePeriod] || [];
    const stint = stints.find(s => String(s.id) === String(id));
    if (!stint) return;

    if (field === "goalieId" && !value) {
        await removeLiveGoalieStint(side, id);
        return;
    }

    const patch = field === "goalieId" ? { goalie_id: value } : { time_in: value.trim() || null };
    const { error } = await supabaseClient.from("game_goalie_periods").update(patch).eq("id", id);

    if (error) {
        console.error(error);
        return;
    }

    if (field === "goalieId") stint.goalieId = value;
    else stint.timeIn = value.trim() || null;

    renderLiveGoalieStints();
}

async function removeLiveGoalieStint(side, id) {
    const { error } = await supabaseClient.from("game_goalie_periods").delete().eq("id", id);

    if (error) {
        console.error(error);
        return;
    }

    currentLiveGoalieStints[side][currentLivePeriod] =
        (currentLiveGoalieStints[side][currentLivePeriod] || []).filter(s => String(s.id) !== String(id));
    renderLiveGoalieStints();
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
   ATTENDANCE ("ON ICE")
   ========================================= */

function renderLiveAttendance() {
    ["away", "home"].forEach(side => {
        const teamId = liveTeamIdForSide(side);
        document.getElementById(`live-attendance-${side}-label`).textContent = liveTeamNameById(teamId);

        const container = document.getElementById(`live-${side}-attendance`);
        if (!container) return;

        const roster = playersForLiveTeam(teamId);

        container.innerHTML = roster.map(p => `
            <label class="attendance-row">
                <input type="checkbox"
                    ${currentLiveAttendance[side].has(String(p.id)) ? "checked" : ""}
                    onchange="toggleLiveAttendance('${side}', '${p.id}', this.checked)">
                <span>${playerLabel(p)}</span>
            </label>
        `).join("") || `<p style="color:#97a3ac;">No players on this roster yet.</p>`;
    });
}

async function toggleLiveAttendance(side, playerId, checked) {
    const teamId = liveTeamIdForSide(side);

    if (checked) {
        const { error } = await supabaseClient
            .from("game_attendance")
            .insert({ game_id: currentLiveGame.id, team_id: teamId, player_id: playerId });
        if (error) {
            console.error(error);
        } else {
            currentLiveAttendance[side].add(String(playerId));
        }
    } else {
        const { error } = await supabaseClient
            .from("game_attendance")
            .delete()
            .eq("game_id", currentLiveGame.id)
            .eq("player_id", playerId);
        if (error) {
            console.error(error);
        } else {
            currentLiveAttendance[side].delete(String(playerId));
        }
    }
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

    // Goalie stint rows are (re)generated by renderLiveGoalieStints() with
    // their own inline handlers, since the number of rows changes as
    // stints are added/removed -- nothing to wire up here.
}

// Note: js/app.js's own DOMContentLoaded listener already runs
// setupMobileNav()/loadLeagueData() for this page via js/header.js
// (its other render calls are no-ops here since their elements don't exist).
document.addEventListener("DOMContentLoaded", () => {
    initLivePage();
});
