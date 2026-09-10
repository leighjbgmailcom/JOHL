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
    return `
        <div class="team-badge ${team.class}">
            ${team.code}
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
                <div class="eyebrow">NEXT GAME DAY</div>
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
                                    ${teamName(game.away)}
                                    <span class="at-symbol">vs.</span>
                                    ${teamName(game.home)}
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
            <td>${teamName(player.team)}</td>
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
   STANDINGS (placeholder — pre-season)
   ========================================= */

function renderStandingsPlaceholder() {
    const element = document.getElementById("standings-table");
    if (!element) return;

    const sorted = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name));

    element.innerHTML = sorted.map(team => `
        <tr>
            <td class="team-name-cell">${team.name}</td>
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
   START WEBSITE
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
    renderNextGame();
    renderTeams();
    setupScheduleFilters();
    renderPlayers();
    setupPlayerFilters();
    renderStandingsPlaceholder();
});
