// Complete JOHL Schedule Data
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

// Helper to construct a game row HTML string
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

// 1. Render Home Page "Up Next" Block
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

// 2. Render Schedule Page List with Filtering
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

// 3. Attach Filter Listeners on schedule.html
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
    setupScheduleFilters();
});
