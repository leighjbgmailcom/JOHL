// 1. Complete JOHL Schedule Data
const scheduleData = [
    {
        date: "Sunday, September 27, 2026",
        games: [
            { time: "6:30 PM", home: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" }, away: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" } },
            { time: "7:50 PM", home: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" }, away: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" } },
            { time: "9:10 PM", home: { name: "Québec Nordiques", code: "QUE", class: "badge-que" }, away: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" } }
        ]
    },
    {
        date: "Sunday, October 4, 2026",
        games: [
            { time: "6:30 PM", home: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" }, away: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" } },
            { time: "7:50 PM", home: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" }, away: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" } },
            { time: "9:10 PM", home: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" }, away: { name: "Québec Nordiques", code: "QUE", class: "badge-que" } }
        ]
    },
    {
        date: "Sunday, October 11, 2026",
        games: [
            { time: "6:30 PM", home: { name: "Québec Nordiques", code: "QUE", class: "badge-que" }, away: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" } },
            { time: "7:50 PM", home: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" }, away: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" } },
            { time: "9:10 PM", home: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" }, away: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" } }
        ]
    },
    {
        date: "Sunday, October 18, 2026",
        games: [
            { time: "6:30 PM", home: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" }, away: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" } },
            { time: "7:50 PM", home: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" }, away: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" } },
            { time: "9:10 PM", home: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" }, away: { name: "Québec Nordiques", code: "QUE", class: "badge-que" } }
        ]
    },
    {
        date: "Sunday, October 25, 2026",
        games: [
            { time: "6:30 PM", home: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" }, away: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" } },
            { time: "7:50 PM", home: { name: "Québec Nordiques", code: "QUE", class: "badge-que" }, away: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" } },
            { time: "9:10 PM", home: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" }, away: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" } }
        ]
    }
];

// 2. League Standings Data
const standingsData = [
    { rank: 1, code: "TOR", name: "Toronto Maple Leafs", class: "badge-tor", gp: 0, w: 0, l: 0, t: 0, pts: 0, gf: 0, ga: 0, diff: 0 },
    { rank: 2, code: "VAN", name: "Vancouver Canucks", class: "badge-van", gp: 0, w: 0, l: 0, t: 0, pts: 0, gf: 0, ga: 0, diff: 0 },
    { rank: 3, code: "QUE", name: "Québec Nordiques", class: "badge-que", gp: 0, w: 0, l: 0, t: 0, pts: 0, gf: 0, ga: 0, diff: 0 },
    { rank: 4, code: "EDM", name: "Edmonton Oilers", class: "badge-edm", gp: 0, w: 0, l: 0, t: 0, pts: 0, gf: 0, ga: 0, diff: 0 },
    { rank: 5, code: "MTL", name: "Montréal Canadiens", class: "badge-mtl", gp: 0, w: 0, l: 0, t: 0, pts: 0, gf: 0, ga: 0, diff: 0 },
    { rank: 6, code: "OTT", name: "Ottawa Senators", class: "badge-ott", gp: 0, w: 0, l: 0, t: 0, pts: 0, gf: 0, ga: 0, diff: 0 }
];

// 3. Teams List
const teamsData = [
    { code: "TOR", name: "Toronto Maple Leafs", class: "badge-tor", captain: "TBD", color: "Blue & White" },
    { code: "VAN", name: "Vancouver Canucks", class: "badge-van", captain: "TBD", color: "Blue, Green & White" },
    { code: "QUE", name: "Québec Nordiques", class: "badge-que", captain: "TBD", color: "Blue & Red" },
    { code: "EDM", name: "Edmonton Oilers", class: "badge-edm", captain: "TBD", color: "Navy & Orange" },
    { code: "MTL", name: "Montréal Canadiens", class: "badge-mtl", captain: "TBD", color: "Red, White & Blue" },
    { code: "OTT", name: "Ottawa Senators", class: "badge-ott", captain: "TBD", color: "Red, Black & Gold" }
];

// 4. Players Statistics Data
const playersData = [
    { name: "Player 1", teamCode: "TOR", teamClass: "badge-tor", pos: "F", gp: 0, g: 0, a: 0, pts: 0, pim: 0 },
    { name: "Player 2", teamCode: "VAN", teamClass: "badge-van", pos: "F", gp: 0, g: 0, a: 0, pts: 0, pim: 0 },
    { name: "Player 3", teamCode: "QUE", teamClass: "badge-que", pos: "D", gp: 0, g: 0, a: 0, pts: 0, pim: 0 },
    { name: "Player 4", teamCode: "EDM", teamClass: "badge-edm", pos: "F", gp: 0, g: 0, a: 0, pts: 0, pim: 0 },
    { name: "Player 5", teamCode: "MTL", teamClass: "badge-mtl", pos: "D", gp: 0, g: 0, a: 0, pts: 0, pim: 0 },
    { name: "Player 6", teamCode: "OTT", teamClass: "badge-ott", pos: "G", gp: 0, g: 0, a: 0, pts: 0, pim: 0 }
];

// Helpers
function buildGameRowHTML(game) {
    return `
        <div class="game-row">
            <div class="game-time">${game.time}</div>
            <div class="game-matchup">
                <div class="team-side">
                    <span class="team-badge ${game.home.class}">${game.home.code}</span>
                    <span class="team-name">${game.home.name}</span>
                </div>
                <span class="vs-label">vs.</span>
                <div class="team-side">
                    <span class="team-badge ${game.away.class}">${game.away.code}</span>
                    <span class="team-name">${game.away.name}</span>
                </div>
            </div>
        </div>
    `;
}

// Page Renderers
function renderUpNextGame() {
    const upNextContainer = document.getElementById("up-next-schedule") || document.getElementById("next-game");
    if (!upNextContainer) return;

    const nextDay = scheduleData[0];
    let html = `<div class="up-next-card"><div class="game-date-title">${nextDay.date}</div>`;
    
    nextDay.games.forEach(game => {
        html += buildGameRowHTML(game);
    });

    html += `</div>`;
    upNextContainer.innerHTML = html;
}

function renderSchedule(filterTeam = "ALL") {
    const container = document.getElementById("schedule-list");
    if (!container) return;

    let html = "";

    scheduleData.forEach(day => {
        const filteredGames = day.games.filter(game => {
            if (filterTeam === "ALL") return true;
            return game.home.code === filterTeam || game.away.code === filterTeam;
        });

        if (filteredGames.length > 0) {
            html += `
                <div class="schedule-day" style="margin-bottom: 24px;">
                    <div class="up-next-card">
                        <div class="game-date-title">${day.date}</div>
            `;

            filteredGames.forEach(game => {
                html += buildGameRowHTML(game);
            });

            html += `
                    </div>
                </div>
            `;
        }
    });

    container.innerHTML = html || `<p style="padding:16px;">No games scheduled for this team.</p>`;
}

function renderStandings() {
    const tbody = document.getElementById("standings-body");
    if (!tbody) return;

    let html = "";
    standingsData.forEach(item => {
        html += `
            <tr>
                <td>${item.rank}</td>
                <td style="display:flex; align-items:center; gap:8px;">
                    <span class="team-badge ${item.class}">${item.code}</span>
                    <strong>${item.name}</strong>
                </td>
                <td>${item.gp}</td>
                <td>${item.w}</td>
                <td>${item.l}</td>
                <td>${item.t}</td>
                <td><strong>${item.pts}</strong></td>
                <td>${item.gf}</td>
                <td>${item.ga}</td>
                <td>${item.diff}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function renderTeams() {
    const container = document.getElementById("teams-grid");
    if (!container) return;

    let html = "";
    teamsData.forEach(team => {
        html += `
            <div class="up-next-card" style="padding: 16px; margin-bottom: 16px;">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                    <span class="team-badge ${team.class}">${team.code}</span>
                    <h3 style="margin:0;">${team.name}</h3>
                </div>
                <p><strong>Captain:</strong> ${team.captain}</p>
                <p><strong>Colors:</strong> ${team.color}</p>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderPlayers() {
    const tbody = document.getElementById("players-body");
    if (!tbody) return;

    let html = "";
    playersData.forEach(player => {
        html += `
            <tr>
                <td><strong>${player.name}</strong></td>
                <td><span class="team-badge ${player.teamClass}">${player.teamCode}</span></td>
                <td>${player.pos}</td>
                <td>${player.gp}</td>
                <td>${player.g}</td>
                <td>${player.a}</td>
                <td><strong>${player.pts}</strong></td>
                <td>${player.pim}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function setupScheduleFilters() {
    const filterContainer = document.querySelector(".filter-buttons");
    if (!filterContainer) return;

    const buttons = filterContainer.querySelectorAll(".filter-button");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            buttons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            const teamCode = button.getAttribute("data-team");
            renderSchedule(teamCode);
        });
    });
}

// Global App Initialization
document.addEventListener("DOMContentLoaded", () => {
    renderUpNextGame();
    renderSchedule("ALL");
    renderStandings();
    renderTeams();
    renderPlayers();
    setupScheduleFilters();
});
