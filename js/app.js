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
                    const isFinal = game.status === "final";

                    const awayWon = isFinal && game.awayScore > game.homeScore;
                    const homeWon = isFinal && game.homeScore > game.awayScore;
                    const awayLost = isFinal && game.awayScore < game.homeScore;
                    const homeLost = isFinal && game.homeScore < game.awayScore;

                    return `
                        <div class="schedule-game ${isTbd ? "is-tbd" : ""}">

                            <div class="schedule-time">
                                ${game.time || ""}
                            </div>

                            <div>
                                <div class="schedule-matchup">
                                    <div class="schedule-team ${awayWon ? "schedule-winner" : ""} ${awayLost ? "schedule-loser" : ""}">
                                        ${teamBadge(game.away)}
                                        <span>${teamName(game.away)}</span>
                                    </div>
                                    <span class="at-symbol">vs.</span>
                                    <div class="schedule-team ${homeWon ? "schedule-winner" : ""} ${homeLost ? "schedule-loser" : ""}">
                                        ${teamBadge(game.home)}
                                        <span>${teamName(game.home)}</span>
                                    </div>
                                    ${game.note ? `<span class="note-tag">${game.note}</span>` : ""}
                                </div>
                                ${game.location ? `<div class="schedule-location">${game.location}</div>` : ""}
                            </div>

                            <div class="schedule-score">
                                ${
                                    isTbd
                                        ? "TBD"
                                        : isFinal
                                            ? `<span class="score-final-badge">FINAL</span><span class="score-value">${game.awayScore} – ${game.homeScore}</span>`
                                            : "GAME " + game.gameNo
                                }
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
   STANDINGS
   Calculated from GOALS + completed games.
   Points: 2 for a win (regulation, OT, or SO),
   1 for an OT/SO loss, 1 each for a tie,
   0 for a regulation loss.
   ========================================= */

function calculateStandings() {

    const table = {};

    TEAMS.forEach(team => {
        table[team.code] = {
            team: team,
            gp: 0, w: 0, l: 0, t: 0, ot: 0,
            gf: 0, ga: 0, pts: 0
        };
    });

    const finalGames = SCHEDULE.filter(
        game => !game.noGames && game.status === "final"
    );

    finalGames.forEach(game => {
        const homeGoals = GOALS.filter(
            g => String(g.gameId) === String(game.id) && g.team === game.home
        );
        const awayGoals = GOALS.filter(
            g => String(g.gameId) === String(game.id) && g.team === game.away
        );

        const isExtraTime = p => p === "OT" || p === "SO";

        const homeReg = homeGoals.filter(g => !isExtraTime(g.period)).length;
        const awayReg = awayGoals.filter(g => !isExtraTime(g.period)).length;

        const homeFinal = homeGoals.length;
        const awayFinal = awayGoals.length;

        const home = table[game.home];
        const away = table[game.away];

        if (!home || !away) return; // TBD / playoff placeholder games

        home.gp++;
        away.gp++;
        home.gf += homeFinal;
        home.ga += awayFinal;
        away.gf += awayFinal;
        away.ga += homeFinal;

        if (homeFinal === awayFinal) {
            // Tied at the final buzzer, no OT/SO played -- a tie.
            home.t++;
            away.t++;
            home.pts += 1;
            away.pts += 1;
        } else if (homeReg === awayReg) {
            // Tied after regulation, decided in OT/SO.
            const winner = homeFinal > awayFinal ? home : away;
            const loser = homeFinal > awayFinal ? away : home;
            winner.w++;
            winner.pts += 2;
            loser.ot++;
            loser.pts += 1;
        } else {
            // Decided in regulation.
            const winner = homeFinal > awayFinal ? home : away;
            const loser = homeFinal > awayFinal ? away : home;
            winner.w++;
            winner.pts += 2;
            loser.l++;
        }
    });

    return Object.values(table).sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gf - b.ga !== a.gf - a.ga) return (b.gf - b.ga) - (a.gf - a.ga);
        return a.team.name.localeCompare(b.team.name);
    });
}

function renderStandings() {
    const element = document.getElementById("standings-table");
    if (!element) return;

    const standings = calculateStandings();

    element.innerHTML = standings.map(row => `
        <tr>
            <td class="team-name-cell">
                <div class="standings-team">
                    ${teamBadge(row.team.code)}
                    <span>${row.team.name}</span>
                </div>
            </td>
            <td>${row.gp}</td>
            <td>${row.w}</td>
            <td>${row.l}</td>
            <td>${row.t}</td>
            <td>${row.ot}</td>
            <td>${row.gf}</td>
            <td>${row.ga}</td>
            <td><strong>${row.pts}</strong></td>
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
   AUTH NAV (Login / Logout link + protected
   nav items)
   ========================================= */

function setupAuthNav() {
    const link = document.getElementById("auth-link");
    if (!link) return;

    // If js/supabase.js hasn't been loaded on this page for some
    // reason, fail quietly rather than breaking the rest of the nav.
    if (typeof supabaseClient === "undefined") return;

    const protectedLinks = document.querySelectorAll("#site-nav a[data-protected]");

    function showLoggedIn() {
        link.textContent = "Logout";
        link.href = "#";

        protectedLinks.forEach(item => {
            item.style.display = "";
        });
    }

    function showLoggedOut() {
        link.textContent = "Login";
        link.href = "login.html";

        protectedLinks.forEach(item => {
            item.style.display = "none";
        });
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
        // (Logout) state -- otherwise the login modal handler (see
        // setupLoginModal) takes care of the click instead.
        if (link.textContent !== "Logout") return;

        event.preventDefault();

        await supabaseClient.auth.signOut();

        window.location.href = "index.html";
    });

    // Keep the link + protected nav items in sync if auth state
    // changes while the page is open (e.g. session expires, or the
    // user logs out in another tab).
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
   LOGIN MODAL
   ========================================= */

function setupLoginModal() {
    const authLink = document.getElementById("auth-link");
    const modal = document.getElementById("login-modal");
    const modalCard = modal ? modal.querySelector(".modal-card") : null;
    const closeBtn = document.getElementById("login-modal-close");
    const form = document.getElementById("modal-login-form");
    const message = document.getElementById("modal-login-message");

    if (!authLink || !modal || !form) return;

    function positionDropdown() {
        const header = document.querySelector(".site-header");
        if (!header || !modalCard) return;

        const rect = header.getBoundingClientRect();

        modalCard.style.top = (rect.bottom + 10) + "px";
    }

    function openModal() {
        positionDropdown();
        modal.classList.add("open");
        document.getElementById("modal-email")?.focus();
    }

    function closeModal() {
        modal.classList.remove("open");
        message.textContent = "";
        form.reset();
    }

    window.addEventListener("resize", () => {
        if (modal.classList.contains("open")) positionDropdown();
    });

    authLink.addEventListener("click", (event) => {
        // Only intercept the click when we're in the logged-out
        // (Login) state -- the Logout behaviour is handled in
        // setupAuthNav instead.
        if (authLink.textContent !== "Login") return;

        event.preventDefault();
        openModal();
    });

    closeBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("open")) {
            closeModal();
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (typeof supabaseClient === "undefined") return;

        const email = document.getElementById("modal-email").value.trim();
        const password = document.getElementById("modal-password").value;

        message.textContent = "Logging in...";

        const { error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            console.error(error);
            message.textContent =
                "Login failed. Please check your email and password.";
            return;
        }

        message.textContent = "Success! Refreshing...";

        // Reload so nav state, protected links, and any page-level
        // auth guard (checkLogin) all re-evaluate against the fresh
        // session, rather than hard-redirecting away from wherever
        // the person happened to be.
        window.location.reload();
    });

    const forgotLink = document.getElementById("forgot-password-link");

    if (forgotLink) {
        forgotLink.addEventListener("click", async () => {

            if (typeof supabaseClient === "undefined") return;

            const emailField = document.getElementById("modal-email");
            const email = emailField.value.trim();

            if (!email) {
                message.textContent =
                    "Enter your email above first, then click \u201cForgot your password?\u201d again.";
                emailField.focus();
                return;
            }

            message.textContent = "Sending reset link...";

            const { error } =
                await supabaseClient.auth.resetPasswordForEmail(email, {
                    redirectTo: "https://jordanohl.ca/reset-password.html"
                });

            if (error) {
                console.error(error);
                message.textContent =
                    "There was a problem sending the reset email. Please try again.";
                return;
            }

            message.textContent =
                "Check your email for a link to reset your password.";
        });
    }
}


/* =========================================
   ADMIN NAV LINK
   Shows an "Admin" nav item only for users
   whose profiles.is_admin flag is true.
   ========================================= */

async function setupAdminNav() {
    const link = document.getElementById("admin-link");
    if (!link) return;
    if (typeof supabaseClient === "undefined") return;

    async function refresh() {
        const {
            data: { session }
        } = await supabaseClient.auth.getSession();

        if (!session) {
            link.style.display = "none";
            return;
        }

        const { data: profile } =
            await supabaseClient
                .from("profiles")
                .select("is_admin")
                .eq("id", session.user.id)
                .single();

        link.style.display = (profile && profile.is_admin) ? "" : "none";
    }

    supabaseClient.auth.onAuthStateChange(() => refresh());

    refresh();
}


/* =========================================
   START WEBSITE
   ========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    setupMobileNav();
    setupAuthNav();
    setupLoginModal();
    setupAdminNav();

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
    renderStandings();
    renderSponsors();

    if (typeof initAdminPage === "function") {
        initAdminPage();
    }

});
