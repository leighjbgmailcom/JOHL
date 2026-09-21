/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   Admin — Schedule Management
   ========================================= */

let ADMIN_GAMES = [];
let ADMIN_SEASON_ID = null;
let editingGameId = null;


/* =========================================
   ACCESS CONTROL
   ========================================= */

async function requireAdmin() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "login.html";
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
   LOAD DATA
   ========================================= */

async function loadActiveSeason() {
    const { data, error } = await supabaseClient
        .from("seasons")
        .select("id")
        .eq("active", true)
        .limit(1)
        .single();

    if (!error && data) {
        ADMIN_SEASON_ID = data.id;
    }
}

async function loadAdminGames() {

    const { data, error } = await supabaseClient
        .from("games")
        .select(`
            id,
            season_id,
            game_no,
            game_date,
            game_time,
            location,
            away_team_id,
            home_team_id,
            away_score,
            home_score,
            note,
            no_games,
            status
        `)
        .order("game_date")
        .order("game_time");

    if (error) {
        console.error("Error loading games:", error);
        return;
    }

    ADMIN_GAMES = data;
    renderAdminGamesTable();
}


/* =========================================
   TEAM SELECT OPTIONS
   ========================================= */

function teamOptionsHtml(selectedId) {
    const sorted = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name));
    return `<option value="">— Select team —</option>` +
        sorted.map(team =>
            `<option value="${team.id}" ${String(team.id) === String(selectedId) ? "selected" : ""}>${team.name}</option>`
        ).join("");
}

function teamNameById(id) {
    const team = TEAMS.find(t => String(t.id) === String(id));
    return team ? team.name : (id ? `Team #${id}` : "TBD");
}


/* =========================================
   RENDER GAMES TABLE
   ========================================= */

function renderAdminGamesTable() {
    const element = document.getElementById("admin-games-table");
    if (!element) return;

    if (ADMIN_GAMES.length === 0) {
        element.innerHTML = `<tr><td colspan="7">No games yet. Add one below.</td></tr>`;
        return;
    }

    element.innerHTML = ADMIN_GAMES.map(game => {
        if (game.no_games) {
            return `
                <tr>
                    <td>${game.game_date}</td>
                    <td colspan="4"><em>${game.note || "No games"}</em></td>
                    <td>
                        <button class="link-button" onclick="editGame(${game.id})">Edit</button>
                        <button class="link-button danger" onclick="deleteGame(${game.id})">Delete</button>
                    </td>
                </tr>
            `;
        }

        const score = game.status === "final"
            ? `${game.away_score ?? 0} – ${game.home_score ?? 0}`
            : "—";

        return `
            <tr>
                <td>${game.game_date}</td>
                <td>${formatTime12h(game.game_time ? game.game_time.substring(0, 5) : "")}</td>
                <td>${teamNameById(game.away_team_id)} @ ${teamNameById(game.home_team_id)}</td>
                <td>${game.status === "final" ? "Final" : "Scheduled"}</td>
                <td>${score}</td>
                <td>${game.game_no ?? ""}</td>
                <td>
                    <button class="link-button" onclick="editGame(${game.id})">Edit</button>
                    <button class="link-button danger" onclick="deleteGame(${game.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join("");
}


/* =========================================
   ADD / EDIT FORM
   ========================================= */

function resetGameForm() {
    editingGameId = null;
    document.getElementById("game-form-title").textContent = "Add a Game";
    document.getElementById("game-form").reset();
    document.getElementById("game-id").value = "";
    document.getElementById("game-location").value = "Jordan Arena";
    document.getElementById("game-no-games").checked = false;
    document.getElementById("game-status").value = "scheduled";
    toggleGameFormSections();
}

function editGame(id) {
    const game = ADMIN_GAMES.find(g => g.id === id);
    if (!game) return;

    editingGameId = id;

    document.getElementById("game-form-title").textContent = `Edit Game${game.game_no ? " #" + game.game_no : ""}`;
    document.getElementById("game-id").value = game.id;
    document.getElementById("game-date").value = game.game_date;
    document.getElementById("game-time").value = game.game_time ? game.game_time.substring(0, 5) : "";
    document.getElementById("game-location").value = game.location || "Jordan Arena";
    document.getElementById("game-no").value = game.game_no || "";
    document.getElementById("game-note").value = game.note || "";
    document.getElementById("game-no-games").checked = !!game.no_games;
    document.getElementById("game-away-team").innerHTML = teamOptionsHtml(game.away_team_id);
    document.getElementById("game-home-team").innerHTML = teamOptionsHtml(game.home_team_id);
    document.getElementById("game-status").value = game.status || "scheduled";
    document.getElementById("game-away-score").value = game.away_score ?? "";
    document.getElementById("game-home-score").value = game.home_score ?? "";

    toggleGameFormSections();

    document.getElementById("game-form-panel").scrollIntoView({ behavior: "smooth" });
}

function toggleGameFormSections() {
    const isByeWeek = document.getElementById("game-no-games").checked;
    const isFinal = document.getElementById("game-status").value === "final";

    document.querySelectorAll(".game-teams-field").forEach(el => {
        el.style.display = isByeWeek ? "none" : "";
    });

    document.getElementById("game-score-fields").style.display =
        (!isByeWeek && isFinal) ? "" : "none";
}

async function saveGame(event) {
    event.preventDefault();

    const message = document.getElementById("game-form-message");
    message.textContent = "Saving...";

    const isByeWeek = document.getElementById("game-no-games").checked;
    const status = document.getElementById("game-status").value;

    const payload = {
        season_id: ADMIN_SEASON_ID,
        game_date: document.getElementById("game-date").value,
        game_time: isByeWeek ? null : (document.getElementById("game-time").value || null),
        location: document.getElementById("game-location").value || "Jordan Arena",
        game_no: document.getElementById("game-no").value || null,
        note: document.getElementById("game-note").value || null,
        no_games: isByeWeek,
        away_team_id: isByeWeek ? null : (document.getElementById("game-away-team").value || null),
        home_team_id: isByeWeek ? null : (document.getElementById("game-home-team").value || null),
        status: isByeWeek ? "scheduled" : status,
        away_score: (!isByeWeek && status === "final") ? Number(document.getElementById("game-away-score").value || 0) : null,
        home_score: (!isByeWeek && status === "final") ? Number(document.getElementById("game-home-score").value || 0) : null
    };

    if (!payload.game_date) {
        message.textContent = "Please choose a date.";
        return;
    }

    if (!isByeWeek && (!payload.away_team_id || !payload.home_team_id)) {
        message.textContent = "Please choose both teams.";
        return;
    }

    let error;

    if (editingGameId) {
        ({ error } = await supabaseClient
            .from("games")
            .update(payload)
            .eq("id", editingGameId));
    } else {
        ({ error } = await supabaseClient
            .from("games")
            .insert(payload));
    }

    if (error) {
        console.error(error);
        message.textContent = "There was a problem saving this game.";
        return;
    }

    message.textContent = editingGameId ? "Game updated." : "Game added.";
    resetGameForm();
    await loadAdminGames();
}

async function deleteGame(id) {
    if (!confirm("Delete this game? This cannot be undone.")) return;

    const { error } = await supabaseClient
        .from("games")
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        alert("There was a problem deleting this game.");
        return;
    }

    await loadAdminGames();
}


/* =========================================
   INIT
   ========================================= */

async function initAdminPage() {

    const ok = await requireAdmin();
    if (!ok) return;

    document.getElementById("admin-page-content").style.display = "";

    const loaded = await loadLeagueData();
    if (!loaded) {
        console.error("Could not load JOHL data from Supabase.");
        return;
    }

    await loadActiveSeason();

    document.getElementById("game-away-team").innerHTML = teamOptionsHtml();
    document.getElementById("game-home-team").innerHTML = teamOptionsHtml();

    document.getElementById("game-form").addEventListener("submit", saveGame);
    document.getElementById("game-no-games").addEventListener("change", toggleGameFormSections);
    document.getElementById("game-status").addEventListener("change", toggleGameFormSections);
    document.getElementById("game-form-cancel").addEventListener("click", resetGameForm);

    toggleGameFormSections();

    await loadAdminGames();
}

// Note: js/app.js's own DOMContentLoaded listener already runs
// setupMobileNav() and loadLeagueData() for this page (its other
// render calls are no-ops here since their elements don't exist).
document.addEventListener("DOMContentLoaded", () => {
    initAdminPage();
});
