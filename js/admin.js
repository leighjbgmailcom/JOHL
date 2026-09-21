/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   Admin — Schedule Management
   ========================================= */

let ADMIN_GAMES = [];
let ADMIN_TEAMS = [];
let ADMIN_SPONSORS = [];
let ADMIN_SEASON_ID = null;
let editingGameId = null;
let editingTeamId = null;
let editingSponsorId = null;


/* =========================================
   TABS
   ========================================= */

function setupAdminTabs() {
    const tabs = document.querySelectorAll(".admin-tab");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".admin-tab-panel").forEach(p => p.classList.remove("active"));

            tab.classList.add("active");
            document.getElementById(`admin-tab-${tab.dataset.tab}`).classList.add("active");
        });
    });
}


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
   TEAMS ADMIN
   ========================================= */

async function loadAdminTeams() {
    const { data, error } = await supabaseClient
        .from("teams")
        .select("id, code, name, class, logo")
        .order("name");

    if (error) {
        console.error("Error loading teams:", error);
        return;
    }

    ADMIN_TEAMS = data;
    renderAdminTeamsTable();
}

function renderAdminTeamsTable() {
    const element = document.getElementById("admin-teams-table");
    if (!element) return;

    if (ADMIN_TEAMS.length === 0) {
        element.innerHTML = `<tr><td colspan="5">No teams yet. Add one below.</td></tr>`;
        return;
    }

    element.innerHTML = ADMIN_TEAMS.map(team => `
        <tr>
            <td><img class="admin-logo-preview" src="${team.logo || ''}" alt="${team.name}" onerror="this.style.visibility='hidden';"></td>
            <td>${team.code}</td>
            <td>${team.name}</td>
            <td>${team.class || ""}</td>
            <td>
                <button class="link-button" onclick="editTeam(${team.id})">Edit</button>
                <button class="link-button danger" onclick="deleteTeam(${team.id})">Delete</button>
            </td>
        </tr>
    `).join("");
}

function resetTeamForm() {
    editingTeamId = null;
    document.getElementById("team-form-title").textContent = "Add a Team";
    document.getElementById("team-form").reset();
    document.getElementById("team-id").value = "";
}

function editTeam(id) {
    const team = ADMIN_TEAMS.find(t => t.id === id);
    if (!team) return;

    editingTeamId = id;
    document.getElementById("team-form-title").textContent = `Edit ${team.name}`;
    document.getElementById("team-id").value = team.id;
    document.getElementById("team-code").value = team.code;
    document.getElementById("team-name").value = team.name;
    document.getElementById("team-class").value = team.class || "";
    document.getElementById("team-logo").value = team.logo || "";

    document.getElementById("team-form-panel").scrollIntoView({ behavior: "smooth" });
}

async function saveTeam(event) {
    event.preventDefault();

    const message = document.getElementById("team-form-message");
    message.textContent = "Saving...";

    const payload = {
        season_id: ADMIN_SEASON_ID,
        code: document.getElementById("team-code").value.trim().toUpperCase(),
        name: document.getElementById("team-name").value.trim(),
        class: document.getElementById("team-class").value.trim() || null,
        logo: document.getElementById("team-logo").value.trim() || null
    };

    if (!payload.code || !payload.name) {
        message.textContent = "Please fill in a code and team name.";
        return;
    }

    let error;

    if (editingTeamId) {
        ({ error } = await supabaseClient
            .from("teams")
            .update(payload)
            .eq("id", editingTeamId));
    } else {
        ({ error } = await supabaseClient
            .from("teams")
            .insert(payload));
    }

    if (error) {
        console.error(error);
        message.textContent = "There was a problem saving this team.";
        return;
    }

    message.textContent = editingTeamId ? "Team updated." : "Team added.";
    resetTeamForm();
    await loadAdminTeams();
    await loadLeagueData();
}

async function deleteTeam(id) {
    if (!confirm("Delete this team? This will fail if the team still has players, games or sponsors linked to it.")) return;

    const { error } = await supabaseClient
        .from("teams")
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        alert("This team can't be deleted — it likely still has players, games or sponsors linked to it.");
        return;
    }

    await loadAdminTeams();
    await loadLeagueData();
}


/* =========================================
   SPONSORS ADMIN
   ========================================= */

async function loadAdminSponsors() {
    const { data, error } = await supabaseClient
        .from("sponsors")
        .select("id, name, url, blurb, team_id")
        .order("name");

    if (error) {
        console.error("Error loading sponsors:", error);
        return;
    }

    ADMIN_SPONSORS = data;
    renderAdminSponsorsTable();
}

function renderAdminSponsorsTable() {
    const element = document.getElementById("admin-sponsors-table");
    if (!element) return;

    if (ADMIN_SPONSORS.length === 0) {
        element.innerHTML = `<tr><td colspan="4">No sponsors yet. Add one below.</td></tr>`;
        return;
    }

    element.innerHTML = ADMIN_SPONSORS.map(sponsor => `
        <tr>
            <td>${sponsor.name}</td>
            <td>${sponsor.team_id ? teamNameById(sponsor.team_id) : "—"}</td>
            <td>${sponsor.url ? `<a href="${sponsor.url}" target="_blank" rel="noopener">${sponsor.url}</a>` : "—"}</td>
            <td>
                <button class="link-button" onclick="editSponsor(${sponsor.id})">Edit</button>
                <button class="link-button danger" onclick="deleteSponsor(${sponsor.id})">Delete</button>
            </td>
        </tr>
    `).join("");
}

function resetSponsorForm() {
    editingSponsorId = null;
    document.getElementById("sponsor-form-title").textContent = "Add a Sponsor";
    document.getElementById("sponsor-form").reset();
    document.getElementById("sponsor-id").value = "";
    document.getElementById("sponsor-team").value = "";
}

function editSponsor(id) {
    const sponsor = ADMIN_SPONSORS.find(s => s.id === id);
    if (!sponsor) return;

    editingSponsorId = id;
    document.getElementById("sponsor-form-title").textContent = `Edit ${sponsor.name}`;
    document.getElementById("sponsor-id").value = sponsor.id;
    document.getElementById("sponsor-name").value = sponsor.name;
    document.getElementById("sponsor-team").value = sponsor.team_id || "";
    document.getElementById("sponsor-url").value = sponsor.url || "";
    document.getElementById("sponsor-blurb").value = sponsor.blurb || "";

    document.getElementById("sponsor-form-panel").scrollIntoView({ behavior: "smooth" });
}

async function saveSponsor(event) {
    event.preventDefault();

    const message = document.getElementById("sponsor-form-message");
    message.textContent = "Saving...";

    const payload = {
        season_id: ADMIN_SEASON_ID,
        name: document.getElementById("sponsor-name").value.trim(),
        team_id: document.getElementById("sponsor-team").value || null,
        url: document.getElementById("sponsor-url").value.trim() || null,
        blurb: document.getElementById("sponsor-blurb").value.trim() || null
    };

    if (!payload.name) {
        message.textContent = "Please enter a sponsor name.";
        return;
    }

    let error;

    if (editingSponsorId) {
        ({ error } = await supabaseClient
            .from("sponsors")
            .update(payload)
            .eq("id", editingSponsorId));
    } else {
        ({ error } = await supabaseClient
            .from("sponsors")
            .insert(payload));
    }

    if (error) {
        console.error(error);
        message.textContent = "There was a problem saving this sponsor.";
        return;
    }

    message.textContent = editingSponsorId ? "Sponsor updated." : "Sponsor added.";
    resetSponsorForm();
    await loadAdminSponsors();
    await loadLeagueData();
}

async function deleteSponsor(id) {
    if (!confirm("Delete this sponsor?")) return;

    const { error } = await supabaseClient
        .from("sponsors")
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        alert("There was a problem deleting this sponsor.");
        return;
    }

    await loadAdminSponsors();
    await loadLeagueData();
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

    setupAdminTabs();

    document.getElementById("game-away-team").innerHTML = teamOptionsHtml();
    document.getElementById("game-home-team").innerHTML = teamOptionsHtml();
    document.getElementById("sponsor-team").innerHTML = teamOptionsHtml();

    document.getElementById("game-form").addEventListener("submit", saveGame);
    document.getElementById("game-no-games").addEventListener("change", toggleGameFormSections);
    document.getElementById("game-status").addEventListener("change", toggleGameFormSections);
    document.getElementById("game-form-cancel").addEventListener("click", resetGameForm);

    document.getElementById("team-form").addEventListener("submit", saveTeam);
    document.getElementById("team-form-cancel").addEventListener("click", resetTeamForm);

    document.getElementById("sponsor-form").addEventListener("submit", saveSponsor);
    document.getElementById("sponsor-form-cancel").addEventListener("click", resetSponsorForm);

    toggleGameFormSections();

    await loadAdminGames();
    await loadAdminTeams();
    await loadAdminSponsors();
}

// Note: js/app.js's own DOMContentLoaded listener already runs
// setupMobileNav() and loadLeagueData() for this page (its other
// render calls are no-ops here since their elements don't exist).
document.addEventListener("DOMContentLoaded", () => {
    initAdminPage();
});
