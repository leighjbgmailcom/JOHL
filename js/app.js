/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   ========================================= */
// Schedule Data (Sep 27, 2026 – Mar 14, 2027)
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
    },
    {
        date: "Sunday, November 1, 2026",
        games: [
            { time: "6:30 PM", home: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" }, away: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" } },
            { time: "7:50 PM", home: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" }, away: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" } },
            { time: "9:10 PM", home: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" }, away: { name: "Québec Nordiques", code: "QUE", class: "badge-que" } }
        ]
    },
    {
        date: "Sunday, November 8, 2026",
        games: [
            { time: "6:30 PM", home: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" }, away: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" } },
            { time: "7:50 PM", home: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" }, away: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" } },
            { time: "9:10 PM", home: { name: "Québec Nordiques", code: "QUE", class: "badge-que" }, away: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" } }
        ]
    },
    {
        date: "Sunday, November 15, 2026",
        games: [
            { time: "6:30 PM", home: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" }, away: { name: "Québec Nordiques", code: "QUE", class: "badge-que" } },
            { time: "7:50 PM", home: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" }, away: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" } },
            { time: "9:10 PM", home: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" }, away: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" } }
        ]
    },
    {
        date: "Sunday, November 22, 2026",
        games: [
            { time: "6:30 PM", home: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" }, away: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" } },
            { time: "7:50 PM", home: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" }, away: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" } },
            { time: "9:10 PM", home: { name: "Québec Nordiques", code: "QUE", class: "badge-que" }, away: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" } }
        ]
    },
    {
        date: "Sunday, November 29, 2026",
        games: [
            { time: "6:30 PM", home: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" }, away: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" } },
            { time: "7:50 PM", home: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" }, away: { name: "Québec Nordiques", code: "QUE", class: "badge-que" } },
            { time: "9:10 PM", home: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" }, away: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" } }
        ]
    },
    {
        date: "Sunday, December 6, 2026",
        games: [
            { time: "6:30 PM", home: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" }, away: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" } },
            { time: "7:50 PM", home: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" }, away: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" } },
            { time: "9:10 PM", home: { name: "Québec Nordiques", code: "QUE", class: "badge-que" }, away: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" } }
        ]
    },
    {
        date: "Sunday, December 13, 2026",
        games: [
            { time: "6:30 PM", home: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" }, away: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" } },
            { time: "7:50 PM", home: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" }, away: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" } },
            { time: "9:10 PM", home: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" }, away: { name: "Québec Nordiques", code: "QUE", class: "badge-que" } }
        ]
    },
    {
        date: "Sunday, December 20, 2026",
        games: [
            { time: "6:30 PM", home: { name: "Québec Nordiques", code: "QUE", class: "badge-que" }, away: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" } },
            { time: "7:50 PM", home: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" }, away: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" } },
            { time: "9:10 PM", home: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" }, away: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" } }
        ]
    },
    {
        date: "Sunday, December 27, 2026",
        games: [
            { time: "6:30 PM", home: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" }, away: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" } },
            { time: "7:50 PM", home: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" }, away: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" } },
            { time: "9:10 PM", home: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" }, away: { name: "Québec Nordiques", code: "QUE", class: "badge-que" } }
        ]
    },
    {
        date: "Sunday, January 3, 2027",
        games: [
            { time: "6:30 PM", home: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" }, away: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" } },
            { time: "7:50 PM", home: { name: "Québec Nordiques", code: "QUE", class: "badge-que" }, away: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" } },
            { time: "9:10 PM", home: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" }, away: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" } }
        ]
    },
    {
        date: "Sunday, January 10, 2027",
        games: [
            { time: "6:30 PM", home: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" }, away: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" } },
            { time: "7:50 PM", home: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" }, away: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" } },
            { time: "9:10 PM", home: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" }, away: { name: "Québec Nordiques", code: "QUE", class: "badge-que" } }
        ]
    },
    {
        date: "Sunday, January 17, 2027",
        games: [
            { time: "6:30 PM", home: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" }, away: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" } },
            { time: "7:50 PM", home: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" }, away: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" } },
            { time: "9:10 PM", home: { name: "Québec Nordiques", code: "QUE", class: "badge-que" }, away: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" } }
        ]
    },
    {
        date: "Sunday, January 24, 2027",
        games: [
            { time: "6:30 PM", home: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" }, away: { name: "Québec Nordiques", code: "QUE", class: "badge-que" } },
            { time: "7:50 PM", home: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" }, away: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" } },
            { time: "9:10 PM", home: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" }, away: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" } }
        ]
    },
    {
        date: "Sunday, January 31, 2027",
        games: [
            { time: "6:30 PM", home: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" }, away: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" } },
            { time: "7:50 PM", home: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" }, away: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" } },
            { time: "9:10 PM", home: { name: "Québec Nordiques", code: "QUE", class: "badge-que" }, away: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" } }
        ]
    },
    {
        date: "Sunday, February 7, 2027",
        games: [
            { time: "6:30 PM", home: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" }, away: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" } },
            { time: "7:50 PM", home: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" }, away: { name: "Québec Nordiques", code: "QUE", class: "badge-que" } },
            { time: "9:10 PM", home: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" }, away: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" } }
        ]
    },
    {
        date: "Sunday, February 14, 2027",
        games: [
            { time: "6:30 PM", home: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" }, away: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" } },
            { time: "7:50 PM", home: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" }, away: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" } },
            { time: "9:10 PM", home: { name: "Québec Nordiques", code: "QUE", class: "badge-que" }, away: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" } }
        ]
    },
    {
        date: "Sunday, February 21, 2027",
        games: [
            { time: "6:30 PM", home: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" }, away: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" } },
            { time: "7:50 PM", home: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" }, away: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" } },
            { time: "9:10 PM", home: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" }, away: { name: "Québec Nordiques", code: "QUE", class: "badge-que" } }
        ]
    },
    {
        date: "Sunday, February 28, 2027",
        games: [
            { time: "6:30 PM", home: { name: "Québec Nordiques", code: "QUE", class: "badge-que" }, away: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" } },
            { time: "7:50 PM", home: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" }, away: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" } },
            { time: "9:10 PM", home: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" }, away: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" } }
        ]
    },
    {
        date: "Sunday, March 7, 2027",
        games: [
            { time: "6:30 PM", home: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" }, away: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" } },
            { time: "7:50 PM", home: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" }, away: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" } },
            { time: "9:10 PM", home: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" }, away: { name: "Québec Nordiques", code: "QUE", class: "badge-que" } }
        ]
    },
    {
        date: "Sunday, March 14, 2027",
        games: [
            { time: "6:30 PM", home: { name: "Ottawa Senators", code: "OTT", class: "badge-ott" }, away: { name: "Montréal Canadiens", code: "MTL", class: "badge-mtl" } },
            { time: "7:50 PM", home: { name: "Québec Nordiques", code: "QUE", class: "badge-que" }, away: { name: "Vancouver Canucks", code: "VAN", class: "badge-van" } },
            { time: "9:10 PM", home: { name: "Toronto Maple Leafs", code: "TOR", class: "badge-tor" }, away: { name: "Edmonton Oilers", code: "EDM", class: "badge-edm" } }
        ]
    }
];

// Function to render full schedule list
function renderFullSchedule(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';

    scheduleData.forEach(day => {
        html += `
            <div class="schedule-day">
                <h3 class="schedule-date">${day.date}</h3>
                <div class="up-next-card">
        `;

        day.games.forEach(game => {
            html += `
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
        });

        html += `
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Function to render "UP NEXT" section on index.html dynamically
function renderUpNextGame() {
    const nextGameContainer = document.getElementById('next-game');
    if (!nextGameContainer) return;

    const nextDay = scheduleData[0]; // Sept 27
    let html = '';

    nextDay.games.forEach(game => {
        html += `
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
    });

    nextGameContainer.innerHTML = html;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    renderUpNextGame();
    renderFullSchedule('full-schedule-list');
});
// 2026-27 JOHL Master Player Roster Data
const JOHL_ROSTERS = {
  Canadiens: [
    { name: "Chad Bigger", pos: "F" }, { name: "Darrin Bower", pos: "F" },
    { name: "Bryan Chinn", pos: "F" }, { name: "Ty Cooke", pos: "F" },
    { name: "Dave Crandles", pos: "F" }, { name: "Jim Culp", pos: "F" },
    { name: "Brian Culp", pos: "F" }, { name: "Matt Dixon", pos: "F" },
    { name: "Drew Hering", pos: "F" }, { name: "Ryan Horton", pos: "F" },
    { name: "Stu Hunt", pos: "F" }, { name: "Dave Levar", pos: "G" },
    { name: "Sam Ort", pos: "F" }, { name: "Ryan Parnall", pos: "F" },
    { name: "Kevin Paul", pos: "F" }, { name: "Greg Penney", pos: "F" },
    { name: "Ric Robinson", pos: "G" }
  ],
  Canucks: [
    { name: "Will Beckett", pos: "F" }, { name: "Steve Bowen", pos: "F" },
    { name: "Adam Goodbrand", pos: "F" }, { name: "Jeff Haroutunian", pos: "F" },
    { name: "Paul Koke", pos: "F" }, { name: "Jon Leyenhorst", pos: "F" },
    { name: "Craig Martin", pos: "F" }, { name: "Steve McMillan", pos: "F" },
    { name: "Colin Murphy", pos: "F" }, { name: "Kurt Peters", pos: "F" },
    { name: "Dave Pundyk", pos: "F" }, { name: "Dave Rennie", pos: "G" },
    { name: "Wes Short", pos: "F" }, { name: "Adam Short", pos: "F" },
    { name: "Daryl Strong", pos: "F" }, { name: "Waylon Tweedy", pos: "F" },
    { name: "Derek Yendt", pos: "G" }
  ],
  Leafs: [
    { name: "Mark Adams", pos: "F" }, { name: "Derek Collini", pos: "F" },
    { name: "Bob Fernick", pos: "F" }, { name: "Steve Fox", pos: "F" },
    { name: "Jeff Gates", pos: "F" }, { name: "Darren Horton", pos: "F" },
    { name: "Rudy Mallet", pos: "G" }, { name: "David Parsons", pos: "F" },
    { name: "Larry Penney", pos: "F" }, { name: "Kevin Pierce", pos: "F" },
    { name: "Adam Regular", pos: "F" }, { name: "Jeff Reimer", pos: "F" },
    { name: "Ryan Rozon", pos: "G" }, { name: "Joe Snihur", pos: "F" },
    { name: "Adam Steele", pos: "F" }, { name: "Andy Suggitt", pos: "F" },
    { name: "Marcel VanRuyven", pos: "F" }
  ],
  Nordiques: [
    { name: "Kres Andersen", pos: "F" }, { name: "Jamie Brophy", pos: "F" },
    { name: "Chris Cookson", pos: "F" }, { name: "Rob DeBolster", pos: "F" },
    { name: "Joel Dykstra", pos: "F" }, { name: "Andrew Fissel", pos: "F" },
    { name: "Nick Langlois", pos: "F" }, { name: "Doug Lawrence", pos: "F" },
    { name: "Dave Mable", pos: "F" }, { name: "Jason McKay", pos: "G" },
    { name: "Scott Mills", pos: "F" }, { name: "Josh Moore", pos: "F" },
    { name: "Michael Pulo", pos: "F" }, { name: "Kevin Rolston", pos: "G" },
    { name: "Colin Roy", pos: "G" }, { name: "Tim Warden", pos: "F" },
    { name: "Brody Whetlam", pos: "F" }
  ],
  Oilers: [
    { name: "Mark Abrams", pos: "F" }, { name: "Peter Beukema", pos: "F" },
    { name: "Leigh Brown", pos: "F" }, { name: "Darren Craig", pos: "F" },
    { name: "Andy Dawson", pos: "G" }, { name: "Derrick DeBolster", pos: "F" },
    { name: "Mike Foran", pos: "F" }, { name: "Jeff Grossi", pos: "F" },
    { name: "Nick Mansion", pos: "F" }, { name: "Ron McPherson", pos: "F" },
    { name: "John Misek", pos: "F" }, { name: "Jamie O'Brien", pos: "F" },
    { name: "Emilio Raimondo", pos: "G" }, { name: "Michael Robertson", pos: "F" },
    { name: "Andrew Smith", pos: "F" }, { name: "Jeff Stuart", pos: "F" },
    { name: "Wayne Wall", pos: "F" }
  ],
  Senators: [
    { name: "Andrew Bevan", pos: "F" }, { name: "Chris Boom", pos: "F" },
    { name: "Bruce Buynink", pos: "G" }, { name: "Blaine Davies", pos: "F" },
    { name: "Brad Deakon", pos: "F" }, { name: "Nick Hageman", pos: "F" },
    { name: "Adam Hendricks", pos: "F" }, { name: "Rob Holt", pos: "F" },
    { name: "Simon Murphy", pos: "F" }, { name: "Matt O'Brien", pos: "F" },
    { name: "Chris Riediger", pos: "F" }, { name: "Keith Schmidt", pos: "F" },
    { name: "Tim Shannon", pos: "G" }, { name: "Dave Sheridan", pos: "F" },
    { name: "Cam Tourcotte", pos: "F" }, { name: "Greg Wells", pos: "F" },
    { name: "Tyler Williams", pos: "F" }
  ]
};

/* =========================================
   TEAMS
   ========================================= */

const teams = [
  { id: 1, name: "Toronto Maple Leafs", short: "TOR", className: "toronto" },
  { id: 2, name: "Vancouver Canucks", short: "VAN", className: "vancouver" },
  { id: 3, name: "Québec Nordiques", short: "QUE", className: "quebec" },
  { id: 4, name: "Edmonton Oilers", short: "EDM", className: "edmonton" },
  { id: 5, name: "Montréal Canadiens", short: "MTL", className: "montreal" },
  { id: 6, name: "Ottawa Senators", short: "OTT", className: "ottawa" }
];

const teamMap = {
  Leafs: "TOR",
  Canucks: "VAN",
  Nordiques: "QUE",
  Oilers: "EDM",
  Canadiens: "MTL",
  Senators: "OTT"
};

/* =========================================
   GENERATE PLAYER LIST FROM JOHL_ROSTERS
   ========================================= */

const players = [];
let playerCounter = 1;

Object.keys(JOHL_ROSTERS).forEach(teamKey => {
  const shortCode = teamMap[teamKey] || "TOR";
  JOHL_ROSTERS[teamKey].forEach((p, idx) => {
    players.push({
      number: idx + 1,
      name: p.name,
      team: shortCode,
      position: p.pos,
      gp: 0,
      goals: 0,
      assists: 0,
      points: 0
    });
  });
});

/* =========================================
   STANDINGS
   ========================================= */

const standings = [
  { team: "TOR", gp: 0, w: 0, l: 0, t: 0, ot: 0, gf: 0, ga: 0, pts: 0 },
  { team: "EDM", gp: 0, w: 0, l: 0, t: 0, ot: 0, gf: 0, ga: 0, pts: 0 },
  { team: "MTL", gp: 0, w: 0, l: 0, t: 0, ot: 0, gf: 0, ga: 0, pts: 0 },
  { team: "VAN", gp: 0, w: 0, l: 0, t: 0, ot: 0, gf: 0, ga: 0, pts: 0 },
  { team: "OTT", gp: 0, w: 0, l: 0, t: 0, ot: 0, gf: 0, ga: 0, pts: 0 },
  { team: "QUE", gp: 0, w: 0, l: 0, t: 0, ot: 0, gf: 0, ga: 0, pts: 0 }
];

/* =========================================
   DATE HELPERS & SCHEDULE
   ========================================= */

function formatDate(date) {
  return date.toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function getNextGameDay() {
  const gameDate = new Date(2026, 8, 27);
  return [
    { date: gameDate, time: "6:30 PM", home: "Toronto Maple Leafs", away: "Montréal Canadiens", homeShort: "TOR", awayShort: "MTL" },
    { date: gameDate, time: "7:50 PM", home: "Edmonton Oilers", away: "Vancouver Canucks", homeShort: "EDM", awayShort: "VAN" },
    { date: gameDate, time: "9:10 PM", home: "Ottawa Senators", away: "Québec Nordiques", homeShort: "OTT", awayShort: "QUE" }
  ];
}

function getTeam(short) {
  return teams.find(team => team.short === short);
}

function teamName(short) {
  const team = getTeam(short);
  return team ? team.name : short;
}

function teamBadge(short) {
  const team = getTeam(short);
  if (!team) return "";
  return `<div class="team-badge ${team.className}">${team.short}</div>`;
}

/* =========================================
   RENDER FUNCTIONS
   ========================================= */

function renderStandingsPreview() {
  const element = document.getElementById("standings-preview");
  if (!element) return;

  element.innerHTML = standings.map((team, index) => `
    <tr>
      <td class="rank">${index + 1}</td>
      <td class="team-name-cell">${teamName(team.team)}</td>
      <td>${team.gp}</td>
      <td>${team.w}</td>
      <td>${team.l}</td>
      <td>${team.t}</td>
      <td><strong>${team.pts}</strong></td>
    </tr>
  `).join("");
}

function renderFullStandings() {
  const element = document.getElementById("standings-table");
  if (!element) return;

  element.innerHTML = standings.map((team, index) => `
    <tr>
      <td class="rank">${index + 1}</td>
      <td class="team-name-cell">${teamName(team.team)}</td>
      <td>${team.gp}</td>
      <td>${team.w}</td>
      <td>${team.l}</td>
      <td>${team.t}</td>
      <td>${team.ot}</td>
      <td>${team.gf}</td>
      <td>${team.ga}</td>
      <td><strong>${team.pts}</strong></td>
    </tr>
  `).join("");
}

function renderTeams() {
  const containers = [
    document.getElementById("team-grid"),
    document.getElementById("all-teams"),
    document.getElementById("teams-container")
  ];

  containers.forEach(container => {
    if (!container) return;
    container.innerHTML = teams.map(team => {
      const rosterKey = Object.keys(teamMap).find(key => teamMap[key] === team.short);
      const roster = JOHL_ROSTERS[rosterKey] || [];
      return `
        <div class="team-card">
          ${teamBadge(team.short)}
          <div>
            <h3>${team.name}</h3>
            <p>Jordan Oldtimers Hockey League</p>
            ${roster.length > 0 ? `
              <ul class="roster-list" style="margin-top: 10px; font-size: 0.9em; list-style: none; padding: 0;">
                ${roster.map(p => `<li>${p.name} ${p.pos === 'G' ? '<strong>(G)</strong>' : ''}</li>`).join('')}
              </ul>` : ''
            }
          </div>
        </div>
      `;
    }).join("");
  });
}

function renderNextGame() {
  const element = document.getElementById("next-game");
  if (!element) return;

  const games = getNextGameDay();
  const gameDate = formatDate(games[0].date);

  element.innerHTML = `
    <div class="next-game-day">
      <div class="next-game-date">
        <div class="eyebrow">NEXT GAME DAY</div>
        <h3>${gameDate}</h3>
      </div>
      <div class="homepage-games">
        ${games.map(game => `
          <div class="homepage-game">
            <div class="homepage-game-time">${game.time}</div>
            <div class="homepage-team">
              ${teamBadge(game.awayShort)}
              <span>${game.away}</span>
            </div>
            <div class="homepage-vs">vs.</div>
            <div class="homepage-team">
              ${teamBadge(game.homeShort)}
              <span>${game.home}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderSchedule(filter = "ALL") {
  const element = document.getElementById("schedule-list");
  if (!element) return;

  let games = getNextGameDay();
  if (filter !== "ALL") {
    games = games.filter(game => game.homeShort === filter || game.awayShort === filter);
  }

  if (games.length === 0) {
    element.innerHTML = `<p>No games scheduled.</p>`;
    return;
  }

  const gameDate = formatDate(games[0].date);

  element.innerHTML = `
    <div class="schedule-day">
      <div class="schedule-date">${gameDate}</div>
      ${games.map(game => `
        <div class="schedule-game">
          <div class="schedule-time">${game.time}</div>
          <div class="schedule-matchup">
            ${teamName(game.awayShort)}
            <span class="at-symbol">vs.</span>
            ${teamName(game.homeShort)}
          </div>
          <div class="schedule-score">SCHEDULED</div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderPlayers() {
  const element = document.getElementById("players-table") || document.getElementById("player-list-body");
  if (!element) return;

  const search = document.getElementById("player-search")?.value.toLowerCase() || "";
  const selectedTeam = document.getElementById("player-team")?.value || "ALL";

  const filtered = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(search);
    const matchesTeam = selectedTeam === "ALL" || player.team === selectedTeam;
    return matchesSearch && matchesTeam;
  });

  element.innerHTML = filtered.map(player => `
    <tr>
      <td><strong>#${player.number}</strong></td>
      <td><strong>${player.name}</strong></td>
      <td>${teamName(player.team)}</td>
      <td><span class="badge ${player.position === 'G' ? 'badge-goalie' : 'badge-skater'}">${player.position === 'G' ? 'Goalie' : 'Forward'}</span></td>
      <td>${player.gp}</td>
      <td>${player.goals}</td>
      <td>${player.assists}</td>
      <td><strong>${player.points}</strong></td>
    </tr>
  `).join("");
}

/* =========================================
   EVENT LISTENERS & INIT
   ========================================= */

function setupScheduleFilters() {
  const buttons = document.querySelectorAll(".filter-button");
  buttons.forEach(button => {
    button.addEventListener("click", () => {
      buttons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      renderSchedule(button.dataset.team);
    });
  });
}

function setupPlayerFilters() {
  const search = document.getElementById("player-search");
  const team = document.getElementById("player-team");

  if (search) search.addEventListener("input", renderPlayers);
  if (team) team.addEventListener("change", renderPlayers);
}

document.addEventListener("DOMContentLoaded", () => {
  renderStandingsPreview();
  renderFullStandings();
  renderTeams();
  renderNextGame();
  renderSchedule();
  renderPlayers();
  setupScheduleFilters();
  setupPlayerFilters();
});
