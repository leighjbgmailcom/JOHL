/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   Admin — game results entry
   Depends on: db.js (TEAMS, PLAYERS, SCHEDULE),
   app.js (teamBadge, teamName), supabaseClient
   ========================================= */

let rowCounter = 0;


/* =========================================
   HELPERS
   ========================================= */

function playersForTeamCode(code) {
    return PLAYERS.filter(p => p.team === code)
        .sort((a, b) => a.last.localeCompare(b.last));
}

function playerOptionsHtml(teamCode, selectedId, allowNone) {
    const players = playersForTeamCode(teamCode);

    const none = allowNone
        ? `<option value="">${allowNone === "assist" ? "No assist" : "Select player"}</option>`
        : "";

    return none + players.map(p => `
        <option value="${p.id}" ${String(p.id) === String(selectedId) ? "selected" : ""}>
            ${p.first} ${p.last}
        </option>
    `).join("");
}

function periodOptionsHtml(selected) {
    return ["1", "2", "3", "OT", "SO"].map(p => `
        <option value="${p}" ${p === selected ? "selected" : ""}>
            ${p === "1" ? "1st" : p === "2" ? "2nd" : p === "3" ? "3rd" : p}
        </option>
    `).join("");
}


/* =========================================
   ROW BUILDERS
   ========================================= */

function addGoalRow(side, teamCode, existing) {
    const container = document.getElementById(`${side}-goals-list`);
    const id = `goal-row-${rowCounter++}`;

    const wrapper = document.createElement("div");
    wrapper.className = "admin-row";
    wrapper.id = id;
    wrapper.dataset.teamCode = teamCode;

    wrapper.innerHTML = `
        <select class="admin-period">${periodOptionsHtml(existing?.period)}</select>
        <input type="text" class="admin-time" placeholder="mm:ss" value="${existing?.game_time || ""}">
        <select class="admin-scorer">${playerOptionsHtml(teamCode, existing?.scorer_id)}</select>
        <select class="admin-assist1">${playerOptionsHtml(teamCode, existing?.assist1_id, "assist")}</select>
        <select class="admin-assist2">${playerOptionsHtml(teamCode, existing?.assist2_id, "assist")}</select>
        <button type="button" class="admin-remove-btn" aria-label="Remove">&times;</button>
    `;

    wrapper.querySelector(".admin-remove-btn").addEventListener("click", () => {
        wrapper.remove();
        updateScorePreview();
    });

    wrapper.querySelectorAll("select, input").forEach(el => {
        el.addEventListener("change", updateScorePreview);
    });

    container.appendChild(wrapper);
    updateScorePreview();
}

function addPenaltyRow(side, teamCode, existing) {
    const container = document.getElementById(`${side}-penalties-list`);
    const id = `penalty-row-${rowCounter++}`;

    const wrapper = document.createElement("div");
    wrapper.className = "admin-row";
    wrapper.id = id;
    wrapper.dataset.teamCode = teamCode;

    wrapper.innerHTML = `
        <select class="admin-period">${periodOptionsHtml(existing?.period)}</select>
        <input type="text" class="admin-time" placeholder="mm:ss" value="${existing?.game_time || ""}">
        <select class="admin-player">${playerOptionsHtml(teamCode, existing?.player_id)}</select>
        <input type="text" class="admin-infraction" placeholder="Tripping" value="${existing?.infraction || ""}">
        <select class="admin-minutes">
            ${[2, 4, 5, 10].map(m => `<option value="${m}" ${existing?.minutes === m ? "selected" : ""}>${m} min</option>`).join("")}
        </select>
        <button type="button" class="admin-remove-btn" aria-label="Remove">&times;</button>
    `;

    wrapper.querySelector(".admin-remove-btn").addEventListener("click", () => wrapper.remove());

    container.appendChild(wrapper);
}


/* =========================================
   LIVE SCORE PREVIEW
   ========================================= */

function updateScorePreview() {
    const preview = document.getElementById("admin-score-preview");
    if (!preview) return;

    const awayCode = document.getElementById("admin-game-editor").dataset.away;
    const homeCode = document.getElementById("admin-game-editor").dataset.home;

    const awayGoals = document.querySelectorAll("#away-goals-list .admin-row").length;
    const homeGoals = document.querySelectorAll("#home-goals-list .admin-row").length;

    preview.innerHTML = `
        <div class="admin-score-line">
            ${teamBadge(awayCode)}
            <span>${teamName(awayCode)}</span>
            <strong>${awayGoals}</strong>
            <span class="at-symbol">vs.</span>
            <strong>${homeGoals}</strong>
            <span>${teamName(homeCode)}</span>
            ${teamBadge(homeCode)}
        </div>
    `;
}


/* =========================================
   LOAD A GAME INTO THE EDITOR
   ========================================= */

async function loadGameIntoEditor(gameId) {
    const game = SCHEDULE.find(g => String(g.id) === String(gameId));
    if (!game) return;

    const editor = document.getElementById("admin-game-editor");
    editor.style.display = "";
    editor.dataset.gameId = game.id;
    editor.dataset.away = game.away;
    editor.dataset.home = game.home;

    document.getElementById("away-team-heading").innerHTML =
        `${teamBadge(game.away)} <span>${teamName(game.away)}</span>`;
    document.getElementById("home-team-heading").innerHTML =
        `${teamBadge(game.home)} <span>${teamName(game.home)}</span>`;

    ["away-goals-list", "home-goals-list", "away-penalties-list", "home-penalties-list"]
        .forEach(id => document.getElementById(id).innerHTML = "");

    document.getElementById("admin-mark-final").checked = (game.status === "final");
    document.getElementById("admin-message").textContent = "";

    // Load any existing goals/penalties for this game so they can be edited.
    const [{ data: goals, error: goalsError }, { data: penalties, error: penError }] =
        await Promise.all([
            supabaseClient
                .from("game_goals")
                .select("*, teams(code)")
                .eq("game_id", game.id),
            supabaseClient
                .from("game_penalties")
                .select("*, teams(code)")
                .eq("game_id", game.id)
        ]);

    if (goalsError) console.error("Error loading existing goals:", goalsError);
    if (penError) console.error("Error loading existing penalties:", penError);

    (goals || []).forEach(g => {
        const side = g.teams?.code === game.away ? "away" : "home";
        addGoalRow(side, g.teams?.code, g);
    });

    (penalties || []).forEach(p => {
        const side = p.teams?.code === game.away ? "away" : "home";
        addPenaltyRow(side, p.teams?.code, p);
    });

    updateScorePreview();
}


/* =========================================
   SAVE
   ========================================= */

async function saveGameResults() {
    const editor = document.getElementById("admin-game-editor");
    const gameId = editor.dataset.gameId;
    const awayCode = editor.dataset.away;
    const homeCode = editor.dataset.home;
    const message = document.getElementById("admin-message");

    message.textContent = "Saving...";

    const goalRows = [];
    document.querySelectorAll("#away-goals-list .admin-row, #home-goals-list .admin-row")
        .forEach(row => {
            const teamCode = row.dataset.teamCode;
            const team = getTeam(teamCode);
            const scorerId = row.querySelector(".admin-scorer").value;

            if (!scorerId) return; // skip incomplete rows

            goalRows.push({
                game_id: gameId,
                team_id: team.id,
                scorer_id: scorerId,
                assist1_id: row.querySelector(".admin-assist1").value || null,
                assist2_id: row.querySelector(".admin-assist2").value || null,
                period: row.querySelector(".admin-period").value,
                game_time: row.querySelector(".admin-time").value || null
            });
        });

    const penaltyRows = [];
    document.querySelectorAll("#away-penalties-list .admin-row, #home-penalties-list .admin-row")
        .forEach(row => {
            const teamCode = row.dataset.teamCode;
            const team = getTeam(teamCode);
            const playerId = row.querySelector(".admin-player").value;

            if (!playerId) return;

            penaltyRows.push({
                game_id: gameId,
                team_id: team.id,
                player_id: playerId,
                infraction: row.querySelector(".admin-infraction").value || null,
                minutes: parseInt(row.querySelector(".admin-minutes").value, 10),
                period: row.querySelector(".admin-period").value,
                game_time: row.querySelector(".admin-time").value || null
            });
        });

    const isFinal = document.getElementById("admin-mark-final").checked;

    const awayScore = document.querySelectorAll("#away-goals-list .admin-row").length;
    const homeScore = document.querySelectorAll("#home-goals-list .admin-row").length;

    // Simplest reliable approach for a small rec league: clear this
    // game's existing goals/penalties, then re-insert the current
    // set from the form.
    const { error: deleteGoalsError } =
        await supabaseClient.from("game_goals").delete().eq("game_id", gameId);

    const { error: deletePenaltiesError } =
        await supabaseClient.from("game_penalties").delete().eq("game_id", gameId);

    if (deleteGoalsError || deletePenaltiesError) {
        console.error(deleteGoalsError || deletePenaltiesError);
        message.textContent = "There was a problem saving (clearing old entries failed).";
        return;
    }

    if (goalRows.length > 0) {
        const { error } = await supabaseClient.from("game_goals").insert(goalRows);
        if (error) {
            console.error(error);
            message.textContent = "There was a problem saving goals: " + error.message;
            return;
        }
    }

    if (penaltyRows.length > 0) {
        const { error } = await supabaseClient.from("game_penalties").insert(penaltyRows);
        if (error) {
            console.error(error);
            message.textContent = "There was a problem saving penalties: " + error.message;
            return;
        }
    }

    const { error: gameUpdateError } =
        await supabaseClient
            .from("games")
            .update({
                status: isFinal ? "final" : "scheduled",
                away_score: awayScore,
                home_score: homeScore
            })
            .eq("id", gameId);

    if (gameUpdateError) {
        console.error(gameUpdateError);
        message.textContent = "Results saved, but updating the game record failed: " + gameUpdateError.message;
        return;
    }

    message.textContent = "Saved!";
}


/* =========================================
   INIT
   ========================================= */

function initAdminPage() {
    const select = document.getElementById("admin-game-select");
    if (!select) return; // not on the admin page

    const games = SCHEDULE
        .filter(g => !g.noGames && g.away !== "TBD" && g.home !== "TBD")
        .slice()
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    select.innerHTML = `<option value="">Select a game&hellip;</option>` +
        games.map(g => `
            <option value="${g.id}">
                ${g.date} — ${teamName(g.away)} @ ${teamName(g.home)}
                ${g.status === "final" ? " (Final)" : ""}
            </option>
        `).join("");

    select.addEventListener("change", () => {
        if (select.value) {
            loadGameIntoEditor(select.value);
        } else {
            document.getElementById("admin-game-editor").style.display = "none";
        }
    });

    document.querySelectorAll(".admin-add-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const side = btn.dataset.side;
            const kind = btn.dataset.kind;
            const teamCode = document.getElementById("admin-game-editor").dataset[side];

            if (kind === "goal") {
                addGoalRow(side, teamCode);
            } else {
                addPenaltyRow(side, teamCode);
            }
        });
    });

    document.getElementById("admin-save-btn")
        .addEventListener("click", saveGameResults);
}
