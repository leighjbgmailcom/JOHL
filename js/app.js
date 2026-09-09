/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
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
   FIND NEXT SUNDAY
   ========================================= */

function getNextSunday() {

    const today = new Date();

    const day = today.getDay();

    let daysUntilSunday = 7 - day;

    if (daysUntilSunday === 0) {
        daysUntilSunday = 7;
    }

    const nextSunday = new Date(today);

    nextSunday.setDate(
        today.getDate() + daysUntilSunday
    );

    nextSunday.setHours(0, 0, 0, 0);

    return nextSunday;

}


/* =========================================
   FORMAT DATE
   ========================================= */

function formatDate(date) {

    return date.toLocaleDateString(
        "en-CA",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );

}


/* =========================================
   CREATE NEXT GAME DAY
   ========================================= */

function getNextGameDay() {

    const nextSunday = getNextSunday();

    return [

        {
            date: nextSunday,
            time: "6:30 PM",
            home: "Toronto Maple Leafs",
            away: "Montréal Canadiens",
            homeShort: "TOR",
            awayShort: "MTL",
            homeScore: null,
            awayScore: null
        },

        {
            date: nextSunday,
            time: "7:50 PM",
            home: "Edmonton Oilers",
            away: "Vancouver Canucks",
            homeShort: "EDM",
            awayShort: "VAN",
            homeScore: null,
            awayScore: null
        },

        {
            date: nextSunday,
            time: "9:10 PM",
            home: "Ottawa Senators",
            away: "Québec Nordiques",
            homeShort: "OTT",
            awayShort: "QUE",
            homeScore: null,
            awayScore: null
        }

    ];

}


/* =========================================
   HELPER FUNCTIONS
   ========================================= */

function getTeam(short) {

    return teams.find(
        team => team.short === short
    );

}


function teamName(short) {

    const team = getTeam(short);

    return team
        ? team.name
        : short;

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
        document.getElementById(
            "standings-preview"
        );

    if (!element) {
        return;
    }

    element.innerHTML =
        standings.map((team, index) => {

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

                    <td>
                        <strong>
                            ${team.pts}
                        </strong>
                    </td>

                </tr>

            `;

        }).join("");

}


/* =========================================
   FULL STANDINGS
   ========================================= */

function renderFullStandings() {

    const element =
        document.getElementById(
            "standings-table"
        );

    if (!element) {
        return;
    }

    element.innerHTML =
        standings.map((team, index) => {

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

                    <td>
                        <strong>
                            ${team.pts}
                        </strong>
                    </td>

                </tr>

            `;

        }).join("");

}


/* =========================================
   TEAM CARDS
   ========================================= */

function renderTeams() {

    const elements = [

        document.getElementById(
            "team-grid"
        ),

        document.getElementById(
            "all-teams"
        )

    ];


    elements.forEach(container => {

        if (!container) {
            return;
        }


        container.innerHTML =
            teams.map(team => {

                return `

                    <div class="team-card">

                        ${teamBadge(team.short)}

                        <div>

                            <h3>
                                ${team.name}
                            </h3>

                            <p>
                                Jordan Oldtimers
                                Hockey League
                            </p>

                        </div>

                    </div>

                `;

            }).join("");

    });

}


/* =========================================
   NEXT GAME
   ========================================= */

function renderNextGame() {

    const element =
        document.getElementById(
            "next-game"
        );

    if (!element) {
        return;
    }


    const games =
        getNextGameDay();


    const game = games[0];


    element.innerHTML = `

        <div class="next-game">

            <div class="game-team">

                ${teamBadge(game.awayShort)}

                <h3>
                    ${game.away}
                </h3>

            </div>


            <div class="game-info">

                <div class="game-date">

                    ${formatDate(game.date)}

                </div>

                <div class="game-time">

                    ${game.time}

                </div>

                <div class="game-location">

                    Jordan Arena

                </div>

            </div>


            <div class="game-team">

                ${teamBadge(game.homeShort)}

                <h3>
                    ${game.home}
                </h3>

            </div>

        </div>

    `;

}


/* =========================================
   SCHEDULE
   ========================================= */

function renderSchedule(filter = "ALL") {

    const element =
        document.getElementById(
            "schedule-list"
        );

    if (!element) {
        return;
    }


    let games =
        getNextGameDay();


    if (filter !== "ALL") {

        games =
            games.filter(game =>

                game.homeShort === filter ||
                game.awayShort === filter

            );

    }


    const gameDate =
        games.length > 0
            ? formatDate(games[0].date)
            : "";


    if (games.length === 0) {

        element.innerHTML = `
            <p>No games scheduled.</p>
        `;

        return;

    }


    element.innerHTML = `

        <div class="schedule-day">

            <div class="schedule-date">

                ${gameDate}

            </div>


            ${games.map(game => {

                return `

                    <div class="schedule-game">

                        <div class="schedule-time">

                            ${game.time}

                        </div>


                        <div class="schedule-matchup">

                            ${teamName(game.awayShort)}

                            <span class="at-symbol">
                                vs.
                            </span>

                            ${teamName(game.homeShort)}

                        </div>


                        <div class="schedule-score">

                            GAME

                        </div>

                    </div>

                `;

            }).join("")}

        </div>

    `;

}


/* =========================================
   PLAYERS
   ========================================= */

function renderPlayers() {

    const element =
        document.getElementById(
            "players-table"
        );

    if (!element) {
        return;
    }


    const search =
        document.getElementById(
            "player-search"
        )?.value
        .toLowerCase() || "";


    const selectedTeam =
        document.getElementById(
            "player-team"
        )?.value || "ALL";


    const filtered =
        players.filter(player => {

            const matchesSearch =
                player.name
                    .toLowerCase()
                    .includes(search);


            const matchesTeam =
                selectedTeam === "ALL" ||
                player.team === selectedTeam;


            return (
                matchesSearch &&
                matchesTeam
            );

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
   SCHEDULE FILTERS
   ========================================= */

function setupScheduleFilters() {

    const buttons =
        document.querySelectorAll(
            ".filter-button"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                buttons.forEach(btn =>
                    btn.classList.remove(
                        "active"
                    )
                );


                button.classList.add(
                    "active"
                );


                const team =
                    button.dataset.team;


                renderSchedule(team);

            }
        );

    });

}


/* =========================================
   PLAYER FILTERS
   ========================================= */

function setupPlayerFilters() {

    const search =
        document.getElementById(
            "player-search"
        );


    const team =
        document.getElementById(
            "player-team"
        );


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

        renderNextGame();

        renderSchedule();

        renderPlayers();

        setupScheduleFilters();

        setupPlayerFilters();

    }
);
