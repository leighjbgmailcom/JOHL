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
                        <div class="homepage-game-time">${game.time || ""}</div>

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
                                ${game.time || ""}
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
                                ${game.location ? `<div class="schedule-location">${game.location}</div>` : ""}
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
            return a.last.localeCompare(b.last);
        });

    if (filtered.length === 0) {
        element.innerHTML = `<tr><td colspan="4">No players found.</td></tr>`;
        return;
    }

    element.innerHTML = filtered.map(player => `
        <tr>
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
   AUTH NAV (Login / Logout link)
   ========================================= */

function setupAuthNav() {
    const link = document.getElementById("auth-link");
    if (!link) return;

    // If js/supabase.js hasn't been loaded on this page for some
    // reason, fail quietly rather than breaking the rest of the nav.
    if (typeof supabaseClient === "undefined") return;

    function showLoggedIn() {
        link.textContent = "Logout";
        link.href = "#";
    }

    function showLoggedOut() {
        link.textContent = "Login";
        link.href = "login.html";
    }

    async function refresh() {
        const {
            data: { session }
        } = await supabaseClient.auth.getSession();

        if (session) {
            showLoggedIn();
        } else {
            showLoggedOut();
        }
    }

    link.addEventListener("click", async (event) => {
        // Only intercept the click when we're in the logged-in
        // (Logout) state -- otherwise let it navigate to login.html
        // normally.
        if (link.textContent !== "Logout") return;

        event.preventDefault();

        await supabaseClient.auth.signOut();

        window.location.href = "index.html";
    });

    // Keep the link in sync if auth state changes while the page is
    // open (e.g. session expires, or user logs out in another tab).
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        if (session) {
            showLoggedIn();
        } else {
            showLoggedOut();
        }
    });

    refresh();
}


/* =========================================
   START WEBSITE
   ========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    setupMobileNav();
    setupAuthNav();

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

});
