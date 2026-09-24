/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   Admin — Schedule Management
   ========================================= */

let ADMIN_GAMES = [];
let ADMIN_TEAMS = [];
let ADMIN_SPONSORS = [];
let ADMIN_PLAYERS = [];
let ADMIN_SEASON_ID = null;
let editingGameId = null;
let editingTeamId = null;
let editingSponsorId = null;
let editingPlayerId = null;
let resultGoalRows = { away: [], home: [] };
let resultPenaltyRows = { away: [], home: [] };
let resultRowSeq = 0;


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
        window.location.href = "index.html?login=1&redirect=admin.html";
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
   PLAYERS ADMIN
   ========================================= */

async function loadAdminPlayers() {
    const { data, error } = await supabaseClient
        .from("players")
        .select("id, first_name, last_name, position, team_id, email, jersey_number")
        .order("last_name");

    if (error) {
        console.error("Error loading players:", error);
        return;
    }

    ADMIN_PLAYERS = data;
    renderAdminPlayersTable();
}

function renderAdminPlayersTable() {
    const element = document.getElementById("admin-players-table");
    if (!element) return;

    const search = document.getElementById("admin-player-search")?.value.toLowerCase() || "";
    const teamFilter = document.getElementById("admin-player-team-filter")?.value || "ALL";

    const filtered = ADMIN_PLAYERS
        .filter(player => {
            const fullName = `${player.first_name} ${player.last_name}`.toLowerCase();
            const matchesSearch = fullName.includes(search);
            const matchesTeam = teamFilter === "ALL" || String(player.team_id) === String(teamFilter);
            return matchesSearch && matchesTeam;
        })
        .sort((a, b) => {
            if (a.jersey_number != null && b.jersey_number != null) return a.jersey_number - b.jersey_number;
            if (a.jersey_number != null) return -1;
            if (b.jersey_number != null) return 1;
            return a.last_name.localeCompare(b.last_name);
        });

    if (filtered.length === 0) {
        element.innerHTML = `<tr><td colspan="6">No players found.</td></tr>`;
        return;
    }

    element.innerHTML = filtered.map(player => `
        <tr>
            <td>${player.jersey_number != null ? `#${player.jersey_number}` : "—"}</td>
            <td>${player.last_name}, ${player.first_name}</td>
            <td>${teamNameById(player.team_id)}</td>
            <td>${player.position || "Skater"}</td>
            <td>${player.email || `<span style="color:#c8102e;">missing</span>`}</td>
            <td>
                <button class="link-button" onclick="editPlayer(${player.id})">Edit</button>
                <button class="link-button danger" onclick="deletePlayer(${player.id})">Delete</button>
                ${player.email ? `<button class="link-button" onclick="inviteOnePlayer(${player.id}, this)">Invite</button>` : ""}
            </td>
        </tr>
    `).join("");
}

function resetPlayerForm() {
    editingPlayerId = null;
    document.getElementById("player-form-title").textContent = "Add a Player";
    document.getElementById("player-form").reset();
    document.getElementById("player-id").value = "";
    document.getElementById("player-team-select").innerHTML = teamOptionsHtml();
}

function editPlayer(id) {
    const player = ADMIN_PLAYERS.find(p => p.id === id);
    if (!player) return;

    editingPlayerId = id;
    document.getElementById("player-form-title").textContent = `Edit ${player.first_name} ${player.last_name}`;
    document.getElementById("player-id").value = player.id;
    document.getElementById("player-first-name").value = player.first_name;
    document.getElementById("player-last-name").value = player.last_name;
    document.getElementById("player-email").value = player.email || "";
    document.getElementById("player-jersey-number").value = player.jersey_number ?? "";
    document.getElementById("player-team-select").innerHTML = teamOptionsHtml(player.team_id);
    document.getElementById("player-position-select").value = player.position || "Skater";

    document.getElementById("player-form-panel").scrollIntoView({ behavior: "smooth" });
}

async function savePlayer(event) {
    event.preventDefault();

    const message = document.getElementById("player-form-message");
    message.textContent = "Saving...";

    const jerseyNumberRaw = document.getElementById("player-jersey-number").value.trim();

    const payload = {
        season_id: ADMIN_SEASON_ID,
        first_name: document.getElementById("player-first-name").value.trim(),
        last_name: document.getElementById("player-last-name").value.trim(),
        email: document.getElementById("player-email").value.trim() || null,
        team_id: document.getElementById("player-team-select").value || null,
        position: document.getElementById("player-position-select").value,
        jersey_number: jerseyNumberRaw === "" ? null : Number(jerseyNumberRaw)
    };

    if (!payload.first_name || !payload.last_name) {
        message.textContent = "Please enter a first and last name.";
        return;
    }

    let error;

    if (editingPlayerId) {
        ({ error } = await supabaseClient
            .from("players")
            .update(payload)
            .eq("id", editingPlayerId));
    } else {
        ({ error } = await supabaseClient
            .from("players")
            .insert(payload));
    }

    if (error) {
        console.error(error);
        message.textContent = "There was a problem saving this player.";
        return;
    }

    message.textContent = editingPlayerId ? "Player updated." : "Player added.";
    resetPlayerForm();
    await loadAdminPlayers();
    await loadLeagueData();
}

async function deletePlayer(id) {
    if (!confirm("Delete this player? This cannot be undone.")) return;

    const { error } = await supabaseClient
        .from("players")
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        alert("This player can't be deleted — they likely have goals or penalties recorded against them.");
        return;
    }

    await loadAdminPlayers();
    await loadLeagueData();
}


/* =========================================
   PLAYER INVITES
   ========================================= */

async function callInviteFunction(emails, options = {}) {
    const { data, error } = await supabaseClient.functions.invoke("invite-players", {
        body: { emails, force: options.force === true }
    });

    if (error) {
        console.error(error);
        throw error;
    }

    return data;
}

async function inviteOnePlayer(id, buttonEl) {
    const player = ADMIN_PLAYERS.find(p => p.id === id);
    if (!player || !player.email) return;

    const originalText = buttonEl.textContent;
    buttonEl.textContent = "Sending...";
    buttonEl.disabled = true;

    try {
        // force: true -- a deliberate click on a single player's Invite/Resend
        // button should always send, regardless of whether they're already
        // confirmed or were emailed recently (unlike the bulk "Send All").
        const data = await callInviteFunction([player.email], { force: true });
        const result = data.results && data.results[0];

        if (result && result.ok) {
            buttonEl.textContent = result.note ? "Resent" : "Invited";
        } else {
            buttonEl.textContent = "Failed";
            console.error(result);
            const errorText = result ? result.error : "unknown error";
            if (/rate limit/i.test(errorText)) {
                alert(`Could not invite ${player.email}: this Supabase project's email rate limit has been reached. Wait a while and try again (the limit resets hourly).`);
            } else {
                alert(`Could not invite ${player.email}: ${errorText}`);
            }
        }
    } catch (err) {
        buttonEl.textContent = "Failed";
        alert(`There was a problem sending this invite. ${err.message || ""}`);
    }

    setTimeout(() => {
        buttonEl.textContent = originalText;
        buttonEl.disabled = false;
    }, 3000);
}

async function inviteAllPlayers() {
    const emails = ADMIN_PLAYERS.filter(p => p.email).map(p => p.email);

    if (emails.length === 0) {
        alert("No player emails on file yet.");
        return;
    }

    if (!confirm(`Send an invite email to all ${emails.length} players with an email on file?\n\nAnyone already registered will be skipped entirely. Anyone still pending will only get a fresh link if it's been 24+ hours since their last one.`)) {
        return;
    }

    const button = document.getElementById("invite-all-button");
    const status = document.getElementById("invite-all-status");

    button.disabled = true;
    status.textContent = `Checking ${emails.length} players and sending what's needed... this may take a minute.`;

    try {
        const data = await callInviteFunction(emails);
        const notAttempted = data.results.filter(r => !r.ok && /not attempted/i.test(r.error || ""));
        const failed = data.results.filter(r => !r.ok && !/not attempted/i.test(r.error || ""));
        const alreadyRegistered = data.results.filter(r => r.ok && r.skipped && /already registered/i.test(r.note || ""));
        const cooldown = data.results.filter(r => r.ok && r.skipped && !/already registered/i.test(r.note || ""));
        const resent = data.results.filter(r => r.ok && !r.skipped && r.note);
        const invited = data.results.filter(r => r.ok && !r.skipped && !r.note);

        let statusText = `Done: ${invited.length} invited, ${resent.length} resent, ${alreadyRegistered.length} already registered (skipped), ${cooldown.length} waiting on cooldown, ${failed.length} failed.`;
        if (notAttempted.length > 0) {
            statusText += ` ${notAttempted.length} not sent yet (hit the email rate limit) -- wait a bit and click "Send All Invites" again to cover the rest.`;
        }
        status.textContent = statusText;

        if (data.rateLimited) {
            console.warn("Hit the project's email rate limit partway through this batch.", data.results);
            alert(
                `Sent ${invited.length + resent.length} email(s), then hit this Supabase project's email rate limit, so ${notAttempted.length} player(s) haven't been emailed yet.\n\n` +
                `Wait a while (the limit resets hourly) and click "Send All Invites" again -- it will skip anyone already emailed and pick up the rest.\n\n` +
                `To raise this limit permanently: Supabase dashboard -> Authentication -> Rate Limits -> "Rate limit for sending emails" (requires custom SMTP to be configured).`
            );
        } else if (failed.length > 0) {
            console.error("Failed invites:", failed);
            const preview = failed.slice(0, 10).map(f => `${f.email}: ${f.error}`).join("\n");
            const more = failed.length > 10 ? `\n...and ${failed.length - 10} more (see browser console for the full list).` : "";
            alert(`${failed.length} invite(s) failed:\n${preview}${more}`);
        }
    } catch (err) {
        status.textContent = "There was a problem sending invites.";
        alert(err.message || "There was a problem sending invites.");
    }

    button.disabled = false;
}


/* =========================================
   GAME RESULTS ADMIN
   ========================================= */

function resultGameOptionsHtml() {
    const playable = ADMIN_GAMES.filter(g => !g.no_games);
    return `<option value="">— Select a game —</option>` +
        playable.map(game => {
            const label = `${game.game_date} — ${teamNameById(game.away_team_id)} @ ${teamNameById(game.home_team_id)}` +
                (game.status === "final" ? " (Final)" : "");
            return `<option value="${game.id}">${label}</option>`;
        }).join("");
}

function playersForTeam(teamId) {
    return PLAYERS.filter(p => {
        const team = TEAMS.find(t => t.code === p.team);
        return team && String(team.id) === String(teamId);
    });
}

function playerOptionsHtml(teamId, selectedId) {
    const players = [...playersForTeam(teamId)].sort((a, b) => {
        if (a.number != null && b.number != null) return a.number - b.number;
        if (a.number != null) return -1;
        if (b.number != null) return 1;
        return a.last.localeCompare(b.last);
    });

    return `<option value="">—</option>` +
        players.map(p => {
            const label = p.number != null ? `#${p.number} ${p.first} ${p.last}` : `${p.first} ${p.last}`;
            return `<option value="${p.id}" ${String(p.id) === String(selectedId) ? "selected" : ""}>${label}</option>`;
        }).join("");
}

function periodOptionsHtml(selected) {
    return ["1", "2", "3", "OT", "SO"].map(p =>
        `<option value="${p}" ${p === selected ? "selected" : ""}>${p === "1" || p === "2" || p === "3" ? "Period " + p : p}</option>`
    ).join("");
}

async function onResultGameChange() {
    const gameId = document.getElementById("result-game-select").value;
    const editor = document.getElementById("result-editor");

    if (!gameId) {
        editor.style.display = "none";
        return;
    }

    const game = ADMIN_GAMES.find(g => String(g.id) === String(gameId));
    if (!game) return;

    editor.style.display = "";
    document.getElementById("result-away-team-name").textContent = teamNameById(game.away_team_id);
    document.getElementById("result-home-team-name").textContent = teamNameById(game.home_team_id);
    document.getElementById("result-is-final").checked = game.status === "final";

    resultGoalRows = { away: [], home: [] };
    resultPenaltyRows = { away: [], home: [] };

    const [{ data: goals }, { data: penalties }] = await Promise.all([
        supabaseClient.from("game_goals").select("*").eq("game_id", gameId),
        supabaseClient.from("game_penalties").select("*").eq("game_id", gameId)
    ]);

    (goals || []).forEach(goal => {
        const side = String(goal.team_id) === String(game.away_team_id) ? "away" : "home";
        resultGoalRows[side].push({
            key: ++resultRowSeq,
            id: goal.id,
            scorer_id: goal.scorer_id,
            assist1_id: goal.assist1_id,
            assist2_id: goal.assist2_id,
            period: goal.period,
            game_time: goal.game_time
        });
    });

    (penalties || []).forEach(penalty => {
        const side = String(penalty.team_id) === String(game.away_team_id) ? "away" : "home";
        resultPenaltyRows[side].push({
            key: ++resultRowSeq,
            id: penalty.id,
            player_id: penalty.player_id,
            infraction: penalty.infraction,
            minutes: penalty.minutes,
            period: penalty.period,
            game_time: penalty.game_time
        });
    });

    renderResultRows();
}

function addGoalRow(side) {
    resultGoalRows[side].push({ key: ++resultRowSeq, scorer_id: "", assist1_id: "", assist2_id: "", period: "1", game_time: "" });
    renderResultRows();
}

function removeGoalRow(side, key) {
    resultGoalRows[side] = resultGoalRows[side].filter(r => r.key !== key);
    renderResultRows();
}

function addPenaltyRow(side) {
    resultPenaltyRows[side].push({ key: ++resultRowSeq, player_id: "", infraction: "", minutes: 2, period: "1", game_time: "" });
    renderResultRows();
}

function removePenaltyRow(side, key) {
    resultPenaltyRows[side] = resultPenaltyRows[side].filter(r => r.key !== key);
    renderResultRows();
}

function currentResultTeamId(side) {
    const gameId = document.getElementById("result-game-select").value;
    const game = ADMIN_GAMES.find(g => String(g.id) === String(gameId));
    if (!game) return null;
    return side === "away" ? game.away_team_id : game.home_team_id;
}

function renderResultRows() {
    ["away", "home"].forEach(side => {
        const teamId = currentResultTeamId(side);

        document.getElementById(`result-${side}-goals`).innerHTML = resultGoalRows[side].map(row => `
            <div class="result-row" data-key="${row.key}">
                <select onchange="resultGoalRows.${side}.find(r => r.key === ${row.key}).scorer_id = this.value">
                    ${playerOptionsHtml(teamId, row.scorer_id)}
                </select>
                <select onchange="resultGoalRows.${side}.find(r => r.key === ${row.key}).assist1_id = this.value">
                    ${playerOptionsHtml(teamId, row.assist1_id)}
                </select>
                <select onchange="resultGoalRows.${side}.find(r => r.key === ${row.key}).assist2_id = this.value">
                    ${playerOptionsHtml(teamId, row.assist2_id)}
                </select>
                <select onchange="resultGoalRows.${side}.find(r => r.key === ${row.key}).period = this.value">
                    ${periodOptionsHtml(row.period)}
                </select>
                <input type="text" placeholder="Time" value="${row.game_time || ""}" onchange="resultGoalRows.${side}.find(r => r.key === ${row.key}).game_time = this.value">
                <button type="button" class="link-button danger" onclick="removeGoalRow('${side}', ${row.key})">✕</button>
            </div>
        `).join("") || `<p style="color:#97a3ac; font-size:13px;">No goals yet.</p>`;

        document.getElementById(`result-${side}-penalties`).innerHTML = resultPenaltyRows[side].map(row => `
            <div class="result-row penalty-row" data-key="${row.key}">
                <select onchange="resultPenaltyRows.${side}.find(r => r.key === ${row.key}).player_id = this.value">
                    ${playerOptionsHtml(teamId, row.player_id)}
                </select>
                <input type="text" placeholder="Infraction" value="${row.infraction || ""}" onchange="resultPenaltyRows.${side}.find(r => r.key === ${row.key}).infraction = this.value">
                <input type="number" placeholder="Min" min="2" value="${row.minutes ?? 2}" onchange="resultPenaltyRows.${side}.find(r => r.key === ${row.key}).minutes = this.value">
                <select onchange="resultPenaltyRows.${side}.find(r => r.key === ${row.key}).period = this.value">
                    ${periodOptionsHtml(row.period)}
                </select>
                <button type="button" class="link-button danger" onclick="removePenaltyRow('${side}', ${row.key})">✕</button>
            </div>
        `).join("") || `<p style="color:#97a3ac; font-size:13px;">No penalties yet.</p>`;
    });

    const awayGoals = resultGoalRows.away.filter(r => r.scorer_id).length;
    const homeGoals = resultGoalRows.home.filter(r => r.scorer_id).length;
    document.getElementById("result-score-preview").textContent =
        `${document.getElementById("result-away-team-name").textContent} ${awayGoals} — ${homeGoals} ${document.getElementById("result-home-team-name").textContent}`;
}

async function saveGameResults() {
    const gameId = document.getElementById("result-game-select").value;
    const message = document.getElementById("result-form-message");
    if (!gameId) return;

    message.textContent = "Saving...";

    const game = ADMIN_GAMES.find(g => String(g.id) === String(gameId));
    const isFinal = document.getElementById("result-is-final").checked;

    // Delete existing goals/penalties for this game, then re-insert current rows.
    await supabaseClient.from("game_goals").delete().eq("game_id", gameId);
    await supabaseClient.from("game_penalties").delete().eq("game_id", gameId);

    const goalRows = [];
    ["away", "home"].forEach(side => {
        const teamId = currentResultTeamId(side);
        resultGoalRows[side].forEach(row => {
            if (!row.scorer_id) return;
            goalRows.push({
                game_id: gameId,
                team_id: teamId,
                scorer_id: row.scorer_id,
                assist1_id: row.assist1_id || null,
                assist2_id: row.assist2_id || null,
                period: row.period,
                game_time: row.game_time || null
            });
        });
    });

    const penaltyRows = [];
    ["away", "home"].forEach(side => {
        const teamId = currentResultTeamId(side);
        resultPenaltyRows[side].forEach(row => {
            if (!row.player_id) return;
            penaltyRows.push({
                game_id: gameId,
                team_id: teamId,
                player_id: row.player_id,
                infraction: row.infraction || null,
                minutes: row.minutes || 2,
                period: row.period,
                game_time: row.game_time || null
            });
        });
    });

    let error;

    if (goalRows.length > 0) {
        ({ error } = await supabaseClient.from("game_goals").insert(goalRows));
        if (error) console.error(error);
    }

    if (!error && penaltyRows.length > 0) {
        ({ error } = await supabaseClient.from("game_penalties").insert(penaltyRows));
        if (error) console.error(error);
    }

    if (error) {
        message.textContent = "There was a problem saving results.";
        return;
    }

    const awayScore = goalRows.filter(g => String(g.team_id) === String(game.away_team_id)).length;
    const homeScore = goalRows.filter(g => String(g.team_id) === String(game.home_team_id)).length;

    const { error: gameError } = await supabaseClient
        .from("games")
        .update({
            status: isFinal ? "final" : "scheduled",
            away_score: isFinal ? awayScore : null,
            home_score: isFinal ? homeScore : null
        })
        .eq("id", gameId);

    if (gameError) {
        console.error(gameError);
        message.textContent = "Results saved, but there was a problem updating the game status.";
        return;
    }

    message.textContent = "Results saved.";
    await loadAdminGames();
    document.getElementById("result-game-select").innerHTML = resultGameOptionsHtml();
    document.getElementById("result-game-select").value = gameId;
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
    document.getElementById("player-team-select").innerHTML = teamOptionsHtml();
    document.getElementById("admin-player-team-filter").innerHTML =
        `<option value="ALL">All Teams</option>` +
        [...TEAMS].sort((a, b) => a.name.localeCompare(b.name))
            .map(team => `<option value="${team.id}">${team.name}</option>`)
            .join("");

    document.getElementById("game-form").addEventListener("submit", saveGame);
    document.getElementById("game-no-games").addEventListener("change", toggleGameFormSections);
    document.getElementById("game-status").addEventListener("change", toggleGameFormSections);
    document.getElementById("game-form-cancel").addEventListener("click", resetGameForm);

    document.getElementById("team-form").addEventListener("submit", saveTeam);
    document.getElementById("team-form-cancel").addEventListener("click", resetTeamForm);

    document.getElementById("sponsor-form").addEventListener("submit", saveSponsor);
    document.getElementById("sponsor-form-cancel").addEventListener("click", resetSponsorForm);

    document.getElementById("player-form").addEventListener("submit", savePlayer);
    document.getElementById("player-form-cancel").addEventListener("click", resetPlayerForm);
    document.getElementById("admin-player-search").addEventListener("input", renderAdminPlayersTable);
    document.getElementById("admin-player-team-filter").addEventListener("change", renderAdminPlayersTable);

    document.getElementById("result-game-select").addEventListener("change", onResultGameChange);

    toggleGameFormSections();

    await loadAdminGames();
    await loadAdminTeams();
    await loadAdminSponsors();
    await loadAdminPlayers();

    document.getElementById("result-game-select").innerHTML = resultGameOptionsHtml();
}

// Note: js/app.js's own DOMContentLoaded listener already runs
// setupMobileNav() and loadLeagueData() for this page (its other
// render calls are no-ops here since their elements don't exist).
document.addEventListener("DOMContentLoaded", () => {
    initAdminPage();
});
