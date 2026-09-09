/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   DUMMY DATA
   ========================================= */


/* =========================================
   TEAMS
   ========================================= */

const teams = [

    {
        id: 1,
        name: "Toronto Maple Leafs",
        short: "TOR",
        className: "toronto"
    },

    {
        id: 2,
        name: "Vancouver Canucks",
        short: "VAN",
        className: "vancouver"
    },

    {
        id: 3,
        name: "Québec Nordiques",
        short: "QUE",
        className: "quebec"
    },

    {
        id: 4,
        name: "Edmonton Oilers",
        short: "EDM",
        className: "edmonton"
    },

    {
        id: 5,
        name: "Montréal Canadiens",
        short: "MTL",
        className: "montreal"
    },

    {
        id: 6,
        name: "Ottawa Senators",
        short: "OTT",
        className: "ottawa"
    }

];


/* =========================================
   STANDINGS
   ========================================= */

const standings = [

    {
        team: "TOR",
        gp: 8,
        w: 6,
        l: 1,
        t: 1,
        ot: 0,
        gf: 42,
        ga: 27,
        pts: 13
    },

    {
        team: "EDM",
        gp: 8,
        w: 5,
        l: 2,
        t: 1,
        ot: 0,
        gf: 39,
        ga: 29,
        pts: 11
    },

    {
        team: "MTL",
        gp: 8,
        w: 4,
        l: 3,
        t: 1,
        ot: 0,
        gf: 35,
        ga: 31,
        pts: 9
    },

    {
        team: "VAN",
        gp: 8,
        w: 4,
        l: 4,
        t: 0,
        ot: 0,
        gf: 33,
        ga: 34,
        pts: 8
    },

    {
        team: "OTT",
        gp: 8,
        w: 3,
        l: 4,
        t: 1,
        ot: 0,
        gf: 30,
        ga: 35,
        pts: 7
    },

    {
        team: "QUE",
        gp: 8,
        w: 2,
        l: 5,
        t: 1,
        ot: 0,
        gf: 26,
        ga: 41,
        pts: 5
    }

];


/* =========================================
   PLAYERS
   ========================================= */

const players = [

    {
        number: 91,
        name: "John Smith",
        team: "TOR",
        position: "F",
        gp: 8,
        goals: 7,
        assists: 9,
        points: 16
    },

    {
        number: 22,
        name: "Mike Johnson",
        team: "EDM",
        position: "F",
        gp: 8,
        goals: 6,
        assists: 8,
        points: 14
    },

    {
        number: 17,
        name: "Chris Brown",
        team: "MTL",
        position: "D",
        gp: 8,
        goals: 3,
        assists: 10,
        points: 13
    },

    {
        number: 88,
        name: "Dave Wilson",
        team: "VAN",
        position: "F",
        gp: 8,
        goals: 5,
        assists: 7,
        points: 12
    },

    {
        number: 14,
        name: "Steve Miller",
        team: "OTT",
        position: "F",
        gp: 8,
        goals: 6,
        assists: 5,
        points: 11
    },

    {
        number: 9,
        name: "Paul Anderson",
        team: "QUE",
        position: "F",
        gp: 8,
        goals: 4,
        assists: 6,
        points: 10
    },

    {
        number: 4,
        name: "Rob Thompson",
        team: "TOR",
        position: "D",
        gp: 8,
        goals: 2,
        assists: 8,
        points: 10
    },

    {
        number: 30,
        name: "Mark Davis",
        team: "EDM",
        position: "G",
        gp: 8,
        goals: 0,
        assists: 1,
        points: 1
    },

    {
        number: 7,
        name: "Jason White",
        team: "MTL",
        position: "F",
        gp: 8,
        goals: 4,
        assists: 5,
        points: 9
    },

    {
        number: 19,
        name: "Dan Clark",
        team: "VAN",
        position: "D",
        gp: 8,
        goals: 2,
        assists: 6,
        points: 8
    }

];


/* =========================================
   GAMES
   ========================================= */

const games = [

    {
        date: "September 15, 2026",
        time: "7:00 PM",
        home: "TOR",
        away: "MTL",
        homeScore: 4,
        awayScore: 2
    },

    {
        date: "September 15, 2026",
        time: "8:30 PM",
        home: "EDM",
        away: "VAN",
        homeScore: 3,
        awayScore: 3
    },

    {
        date: "September 16, 2026",
        time: "7:00 PM",
        home: "OTT",
        away: "QUE",
        homeScore: 5,
        awayScore: 2
    },

    {
        date: "September 22, 2026",
        time: "7:00 PM",
        home: "QUE",
        away: "TOR",
        homeScore: null,
        awayScore: null
    },

    {
        date: "September 22, 2026",
        time: "8:30 PM",
        home: "MTL",
        away: "EDM",
        homeScore: null,
        awayScore: null
    },

    {
        date: "September 23, 2026",
        time: "7:00 PM",
        home: "VAN",
        away: "OTT",
        homeScore: null,
        awayScore: null
    },

    {
        date: "September 29, 2026",
        time: "7:00 PM",
        home: "TOR",
        away: "EDM",
        homeScore: null,
        awayScore: null
    },

    {
        date: "September 29, 2026",
        time: "8:30 PM",
        home: "QUE",
        away: "MTL",
        homeScore: null,
        awayScore: null
    }

];


/* =========================================
   HELPER FUNCTIONS
   ========================================= */

function getTeam(short) {

    return teams.find(team => team.short === short);

}


function teamName(short) {

    const team = getTeam(short);

    return team ? team.name : short;

}


function teamBadge(short) {

    const team = getTeam(short);

    if (!team) {
        return "";
    }

    return `
        <div class="team-badge ${team.className}">
            ${team.short}
        </div>
    `;

}


/* =========================================
   HOME PAGE - STANDINGS
   ========================================= */

function renderStandingsPreview() {

    const element =
        document.getElementById("standings-preview");

    if (!element) {
        return;
    }

    element.innerHTML = standings.map((team, index) => {

        return `

            <tr>

                <td class="rank">
                    ${index + 1}
                </td>

                <td class="team-name-cell">
                    ${teamName(team.team)}
                </td>

                <td>${team.gp}</td>

                <td>${team.w}</td>

                <td>${team.l}</td>

                <td>${team.t}</td>

                <td><strong>${team.pts}</strong></td>

            </tr>

        `;

    }).join("");

}


/* =========================================
   FULL STANDINGS
   ========================================= */

function renderFullStandings() {

    const element =
        document.getElementById("standings-table");

    if (!element) {
        return;
    }

    element.innerHTML = standings.map((team, index) => {

        return `

            <tr>

                <td class="rank">
                    ${index + 1}
                </td>

                <td class="team-name-cell">
                    ${teamName(team.team)}
                </td>

                <td>${team.gp}</td>

                <td>${team.w}</td>

                <td>${team.l}</td>

                <td>${team.t}</td>

                <td>${team.ot}</td>

                <td>${team.gf}</td>

                <td>${team.ga}</td>

                <td><strong>${team.pts}</strong></td>

            </tr>

        `;

    }).join("");

}


/* =========================================
   TEAM CARDS
   ========================================= */

function renderTeams() {

    const elements = [

        document.getElementById("team-grid"),

        document.getElementById("all-teams")

    ];


    elements.forEach(container => {

        if (!container) {
            return;
        }


        container.innerHTML = teams.map(team => {

            return `

                <div class="team-card">

                    ${teamBadge(team.short)}

                    <div>

                        <h3>
                            ${team.name}
                        </h3>

                        <p>
                            Jordan Oldtimers Hockey League
                        </p>

                    </div>

                </div>

            `;

        }).join("");

    });

}


/* =========================================
   RECENT GAMES
   ========================================= */

function renderRecentGames() {

    const element =
        document.getElementById("recent-games");

    if (!element) {
        return;
    }


    const completedGames =
        games.filter(game =>
            game.homeScore !== null
        ).slice(0, 5);


    element.innerHTML =
        completedGames.map(game => {

            return `

                <div class="result-card">

                    <div>

                        <div class="result-team">
                            ${teamName(game.away)}
                        </div>

                        <div class="result-team">
                            ${teamName(game.home)}
                        </div>

                    </div>


                    <div class="result-score">

                        ${game.awayScore}

                        -

                        ${game.homeScore}

                    </div>

                </div>

            `;

        }).join("");

}


/* =========================================
   SCHEDULE
   ========================================= */

function renderSchedule(filter = "ALL") {

    const element =
        document.getElementById("schedule-list");

    if (!element) {
        return;
    }


    let filteredGames = games;


    if (filter !== "ALL") {

        filteredGames =
            games.filter(game =>
                game.home === filter ||
                game.away === filter
            );

    }


    const dates = [
        ...new Set(
            filteredGames.map(game => game.date)
        )
    ];


    element.innerHTML =
        dates.map(date => {

            const dateGames =
                filteredGames.filter(
                    game => game.date === date
                );


            return `

                <div class="schedule-day">

                    <div class="schedule-date">
                        ${date}
                    </div>


                    ${dateGames.map(game => {

                        const score =
                            game.homeScore === null
                                ? "VS"
                                : `${game.awayScore} - ${game.homeScore}`;


                        return `

                            <div class="schedule-game">

                                <div class="schedule-time">
                                    ${game.time}
                                </div>


                                <div class="schedule-matchup">

                                    ${teamName(game.away)}

                                    @

                                    ${teamName(game.home)}

                                </div>


                                <div class="schedule-score">
                                    ${score}
                                </div>

                            </div>

                        `;

                    }).join("")}

                </div>

            `;

        }).join("");

}


/* =========================================
   PLAYERS
   ========================================= */

function renderPlayers() {

    const element =
        document.getElementById("players-table");

    if (!element) {
        return;
    }


    const search =
        document.getElementById("player-search")
            ?.value
            .toLowerCase() || "";


    const selectedTeam =
        document.getElementById("player-team")
            ?.value || "ALL";


    const filtered =
        players.filter(player => {

            const matchesSearch =
                player.name
                    .toLowerCase()
                    .includes(search);


            const matchesTeam =
                selectedTeam === "ALL" ||
                player.team === selectedTeam;


            return matchesSearch && matchesTeam;

        });


    element.innerHTML =
        filtered.map(player => {

            return `

                <tr>

                    <td>
                        <strong>
                            ${player.number}
                        </strong>
                    </td>

                    <td>
                        <strong>
                            ${player.name}
                        </strong>
                    </td>

                    <td>
                        ${teamName(player.team)}
                    </td>

                    <td>
                        ${player.position}
                    </td>

                    <td>
                        ${player.gp}
                    </td>

                    <td>
                        ${player.goals}
                    </td>

                    <td>
                        ${player.assists}
                    </td>

                    <td>
                        <strong>
                            ${player.points}
                        </strong>
                    </td>

                </tr>

            `;

        }).join("");

}


/* =========================================
   SCHEDULE FILTER BUTTONS
   ========================================= */

function setupScheduleFilters() {

    const buttons =
        document.querySelectorAll(".filter-button");


    buttons.forEach(button => {

        button.addEventListener("click", () => {

            buttons.forEach(btn =>
                btn.classList.remove("active")
            );


            button.classList.add("active");


            const team =
                button.dataset.team;


            renderSchedule(team);

        });

    });

}


/* =========================================
   PLAYER SEARCH
   ========================================= */

function setupPlayerFilters() {

    const search =
        document.getElementById("player-search");


    const team =
        document.getElementById("player-team");


    if (search) {
        search.addEventListener(
            "input",
            renderPlayers
        );
    }


    if (team) {
        team.addEventListener(
            "change",
            renderPlayers
        );
    }

}


/* =========================================
   START WEBSITE
   ========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderStandingsPreview();

        renderFullStandings();

        renderTeams();

        renderRecentGames();

        renderSchedule();

        renderPlayers();

        setupScheduleFilters();

        setupPlayerFilters();

    }
);
