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
                ${games.map(game => `
                    <div class="homepage-game">
                        <div class="homepage-game-time">${formatTime12h(game.time)}</div>

                        <div class="homepage-team">
                            ${teamBadge(game.away)}
                            <span>${teamName(game.away)}</span>
                        </div>

                        <div class="homepage-vs">vs.</div>

                        <div class="homepage-team">
                            ${teamBadge(game.home)}
                            <span>${teamName(game.home)}</span>
                        </div>
                    </div>
                `).join("")}
            </div>

        </div>
    `;
}


/* =========================================
   TEAM CARDS (home + teams page)
   ========================================= */

function renderTeams() {
    const elements = [
        document.getElementById("team-grid"),
        document.getElementById("all-teams")
    ];

    elements.forEach(container => {
        if (!container) return;

        container.innerHTML = TEAMS.map(team => {
            const rosterCount = PLAYERS.filter(p => p.team === team.code).length;

            return `
                <a class="team-card" href="players.html?team=${team.code}">
                    ${teamBadge(team.code)}
                    <div>
                        <h3>${team.name}</h3>
                        <p class="roster-count">${rosterCount} players on roster</p>
                    </div>
                </a>
            `;
        }).join("");
    });
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

                    return `
                        <div class="schedule-game ${isTbd ? "is-tbd" : ""}">

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
                            </div>

                            <div class="schedule-score">
                                ${isTbd ? "TBD" : "GAME " + game.gameNo}
                            </div>

                        </div>
                    `;
                }).join("")}
            </div>
        `;
    }).join("");
}

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
            renderSchedule(button.dataset.team);
        });
    });

    renderSchedule(initialTeam || "ALL");
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
        <tr>
            <td>${player.number != null ? `#${player.number}` : "—"}</td>
            <td><strong>${player.last}, ${player.first}</strong></td>
            <td>
                <div class="roster-team">
                    ${teamBadge(player.team)}
                    <span>${teamName(player.team)}</span>
                </div>
            </td>
            <td>
                <span class="position-tag ${player.position === "G" ? "goalie" : ""}">
                    ${player.position === "G" ? "Goalie" : "Skater"}
                </span>
            </td>
        </tr>
    `).join("");

    const countEl = document.getElementById("player-count");
    if (countEl) {
        countEl.textContent = `${filtered.length} player${filtered.length === 1 ? "" : "s"}`;
    }
}

function setupPlayerFilters() {
    const search = document.getElementById("player-search");
    const team = document.getElementById("player-team");

    // Honour ?team= query param on load (from a team card link)
    const params = new URLSearchParams(window.location.search);
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
   STANDINGS (placeholder — pre-season)
   ========================================= */

function renderStandingsPlaceholder() {
    const element = document.getElementById("standings-table");
    if (!element) return;

    const sorted = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name));

    element.innerHTML = sorted.map(team => `
        <tr>
            <td class="team-name-cell">
                <div class="standings-team">
                    ${teamBadge(team.code)}
                    <span>${team.name}</span>
                </div>
            </td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
            <td><strong>0</strong></td>
        </tr>
    `).join("");
}


/* =========================================
   LEADERS (leaders.html)
   ========================================= */

async function renderLeaders() {
    const table = document.getElementById("leaders-table");
    if (!table) return;

    const { data, error } = await supabaseClient
        .from("game_goals")
        .select("scorer_id, assist1_id, assist2_id");

    if (error) {
        console.error("Error loading leaders:", error);
        table.innerHTML = `<tr><td colspan="7">Unable to load the leaderboard right now.</td></tr>`;
        return;
    }

    const stats = {};

    function bump(playerId, field) {
        if (!playerId) return;
        if (!stats[playerId]) {
            stats[playerId] = { goals: 0, assists: 0 };
        }
        stats[playerId][field]++;
    }

    (data || []).forEach(goal => {
        bump(goal.scorer_id, "goals");
        bump(goal.assist1_id, "assists");
        bump(goal.assist2_id, "assists");
    });

    const rows = Object.keys(stats)
        .map(id => {
            const player = PLAYERS.find(p => String(p.id) === String(id));
            if (!player) return null;

            const team = TEAMS.find(t => t.code === player.team);
            const goals = stats[id].goals;
            const assists = stats[id].assists;

            return {
                player,
                team,
                goals,
                assists,
                points: goals + assists
            };
        })
        .filter(row => row !== null);

    rows.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goals !== a.goals) return b.goals - a.goals;
        return (a.player.last || "").localeCompare(b.player.last || "");
    });

    if (!rows.length) {
        table.innerHTML = `<tr><td colspan="7">No goals have been recorded yet this season.</td></tr>`;
        return;
    }

    table.innerHTML = rows.map((row, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${row.player.number != null ? "#" + row.player.number : "—"}</td>
            <td>${row.player.last}, ${row.player.first}</td>
            <td>${row.team ? row.team.name : ""}</td>
            <td>${row.goals}</td>
            <td>${row.assists}</td>
            <td><strong>${row.points}</strong></td>
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
    renderTeams();
    setupScheduleFilters();
    renderPlayers();
    setupPlayerFilters();
    renderStandingsPlaceholder();
    renderSponsors();
    renderLeaders();

});
