```javascript
/* =========================================
   SIX CITY HOCKEY LEAGUE
   MAIN JAVASCRIPT
========================================= */


/* ---------- TEAMS ---------- */

const teams = [

    {
        id: 1,
        name: "Toronto Maple Leafs",
        short: "TOR",
        class: "leafs"
    },

    {
        id: 2,
        name: "Vancouver Canucks",
        short: "VAN",
        class: "canucks"
    },

    {
        id: 3,
        name: "Nordiques",
        short: "NOR",
        class: "nordiques"
    },

    {
        id: 4,
        name: "Edmonton Oilers",
        short: "EDM",
        class: "oilers"
    },

    {
        id: 5,
        name: "Montréal Canadiens",
        short: "MTL",
        class: "canadiens"
    },

    {
        id: 6,
        name: "Ottawa Senators",
        short: "OTT",
        class: "senators"
    }

];


/* ---------- STANDINGS ---------- */

const standings = [

    {
        team: 1,
        gp: 8,
        w: 6,
        l: 1,
        t: 1,
        ot: 0,
        gf: 42,
        ga: 25,
        pts: 13
    },

    {
        team: 4,
        gp: 8,
        w: 5,
        l: 2,
        t: 1,
        ot: 0,
        gf: 38,
        ga: 27,
        pts: 11
    },

    {
        team: 5,
        gp: 8,
        w: 4,
        l: 3,
        t: 1,
        ot: 0,
        gf: 34,
        ga: 31,
        pts: 9
    },

    {
        team: 2,
        gp: 8,
        w: 4,
        l: 4,
        t: 0,
        ot: 0,
        gf: 32,
        ga: 33,
        pts: 8
    },

    {
        team: 6,
        gp: 8,
        w: 3,
        l: 4,
        t: 1,
        ot: 0,
        gf: 29,
        ga: 35,
        pts: 7
    },

    {
        team: 3,
        gp: 8,
        w: 2,
        l: 5,
        t: 1,
        ot: 0,
        gf: 24,
        ga: 41,
        pts: 5
    }

];


/* ---------- PLAYERS ---------- */

const players = [

    {
        number: 91,
        name: "John Smith",
        team: 1,
        position: "F",
        gp: 8,
        goals: 9,
        assists: 8,
        points: 17
    },

    {
        number: 87,
        name: "Mike Johnson",
        team: 1,
        position: "F",
        gp: 8,
        goals: 7,
        assists: 9,
        points: 16
    },

    {
        number: 22,
        name: "Chris Wilson",
        team: 2,
        position: "F",
        gp: 8,
        goals: 8,
        assists: 6,
        points: 14
    },

    {
        number: 19,
        name: "Dave Brown",
        team: 4,
        position: "F",
        gp: 8,
        goals: 6,
        assists: 7,
        points: 13
    },

    {
        number: 12,
        name: "Ryan Miller",
        team: 5,
        position: "F",
        gp: 8,
        goals: 5,
        assists: 7,
        points: 12
    },

    {
        number: 44,
        name: "Steve Wilson",
        team: 6,
        position: "D",
        gp: 8,
        goals: 3,
        assists: 8,
        points: 11
    },

    {
        number: 9,
        name: "Mark Davis",
        team: 3,
        position: "F",
        gp: 8,
        goals: 5,
        assists: 5,
        points: 10
    }

];


/* ---------- GAMES ---------- */

const games = [

    {
        date: "September 10",
        time: "7:00 PM",
        home: 1,
        away: 2,
        homeScore: 5,
        awayScore: 3,
        location: "Community Arena",
        status: "Final"
    },

    {
        date: "September 10",
        time: "8:30 PM",
        home: 4,
        away: 5,
        homeScore: 4,
        awayScore: 2,
        location: "Community Arena",
        status: "Final"
    },

    {
        date: "September 11",
        time: "7:30 PM",
        home: 6,
        away: 3,
        homeScore: 3,
        awayScore: 3,
        location: "Community Arena",
        status: "Final"
    },

    {
        date: "September 17",
        time: "7:30 PM",
        home: 1,
        away: 4,
        homeScore: null,
        awayScore: null,
        location: "Community Arena",
        status: "Upcoming"
    },

    {
        date: "September 17",
        time: "9:00 PM",
        home: 2,
        away: 6,
        homeScore: null,
        awayScore: null,
        location: "Community Arena",
        status: "Upcoming"
    },

    {
        date: "September 18",
        time: "7:30 PM",
        home: 5,
        away: 3,
        homeScore: null,
        awayScore: null,
        location: "Community Arena",
        status: "Upcoming"
    }

];


/* ---------- HELPER ---------- */

function getTeam(id) {

    return teams.find(team => team.id === id);

}


/* =========================================
   HOME PAGE — STANDINGS
========================================= */

const homeStandings =
    document.getElementById("homeStandings");


if (homeStandings) {

    standings.forEach((row, index) => {

        const team = getTeam(row.team);

        homeStandings.innerHTML += `

            <tr>

                <td>${index + 1}</td>

                <td>
                    <strong>${team.name}</strong>
                </td>

                <td>${row.gp}</td>

                <td>${row.w}</td>

                <td>${row.l}</td>

                <td>${row.t}</td>

                <td>
                    <strong>${row.pts}</strong>
                </td>

            </tr>

        `;

    });

}


/* =========================================
   HOME PAGE — TEAMS
========================================= */

const homeTeams =
    document.getElementById("homeTeams");


function createTeamCard(team) {

    const record =
        standings.find(x => x.team === team.id);


    return `

        <div class="team-card">

            <div class="team-card-top">

                <div class="team-logo ${team.class}">
                    ${team.short}
                </div>

                <div>

                    <h3>${team.name}</h3>

                    <small>
                        ${record.w}-${record.l}-${record.t}
                    </small>

                </div>

            </div>


            <div class="team-record">

                <div>

                    <small>POINTS</small>

                    <strong>
                        ${record.pts}
                    </strong>

                </div>

                <div>

                    <small>GP</small>

                    <strong>
                        ${record.gp}
                    </strong>

                </div>

            </div>

        </div>

    `;

}


if (homeTeams) {

    teams.forEach(team => {

        homeTeams.innerHTML +=
            createTeamCard(team);

    });

}


/* =========================================
   HOME PAGE — RECENT GAMES
========================================= */

const recentGames =
    document.getElementById("recentGames");


if (recentGames) {

    games
        .filter(game => game.status === "Final")
        .forEach(game => {

            const home = getTeam(game.home);

            const away = getTeam(game.away);


            recentGames.innerHTML += `

                <div class="result-card">

                    <div class="result-date">
                        ${game.date}
                    </div>

                    <div class="result-teams">

                        ${home.name}

                        <br>

                        ${away.name}

                    </div>

                    <div class="result-score">

                        ${game.homeScore}
                        -
                        ${game.awayScore}

                    </div>

                </div>

            `;

        });

}


/* =========================================
   TEAMS PAGE
========================================= */

const allTeams =
    document.getElementById("allTeams");


if (allTeams) {

    teams.forEach(team => {

        allTeams.innerHTML +=
            createTeamCard(team);

    });

}


/* =========================================
   STANDINGS PAGE
========================================= */

const standingsTable =
    document.getElementById("standingsTable");


if (standingsTable) {

    standings.forEach((row, index) => {

        const team =
            getTeam(row.team);


        standingsTable.innerHTML += `

            <tr>

                <td>${index + 1}</td>

                <td>
                    <strong>${team.name}</strong>
                </td>

                <td>${row.gp}</td>

                <td>${row.w}</td>

                <td>${row.l}</td>

                <td>${row.t}</td>

                <td>${row.ot}</td>

                <td>${row.gf}</td>

                <td>${row.ga}</td>

                <td>
                    <strong>${row.pts}</strong>
                </td>

            </tr>

        `;

    });

}


/* =========================================
   SCHEDULE PAGE
========================================= */

const fullSchedule =
    document.getElementById("fullSchedule");


if (fullSchedule) {

    games.forEach(game => {

        const home =
            getTeam(game.home);

        const away =
            getTeam(game.away);


        fullSchedule.innerHTML += `

            <div class="schedule-game">

                <div class="schedule-time">

                    <strong>${game.date}</strong>

                    <br>

                    ${game.time}

                </div>


                <div class="schedule-matchup">

                    ${away.name}

                    <br>

                    @ ${home.name}

                    ${
                        game.status === "Final"
                        ?
                        `<br><strong>
                            ${game.awayScore} -
                            ${game.homeScore}
                        </strong>`
                        :
                        ""
                    }

                </div>


                <div class="schedule-location">

                    ${game.location}

                    <br>

                    ${game.status}

                </div>

            </div>

        `;

    });

}


/* =========================================
   PLAYERS PAGE
========================================= */

const playersTable =
    document.getElementById("playersTable");


const teamFilter =
    document.getElementById("teamFilter");


const playerSearch =
    document.getElementById("playerSearch");


function renderPlayers() {

    if (!playersTable) return;


    const search =
        playerSearch
        ?
        playerSearch.value.toLowerCase()
        :
        "";


    const filter =
        teamFilter
        ?
        teamFilter.value
        :
        "all";


    playersTable.innerHTML = "";


    players
        .filter(player => {

            const matchesSearch =
                player.name
                    .toLowerCase()
                    .includes(search);


            const matchesTeam =
                filter === "all"
                ||
                player.team == filter;


            return matchesSearch && matchesTeam;

        })
        .forEach(player => {

            const team =
                getTeam(player.team);


            playersTable.innerHTML += `

                <tr>

                    <td>
                        <strong>
                            ${player.number}
                        </strong>
                    </td>

                    <td>
                        ${player.name}
                    </td>

                    <td>
                        ${team.name}
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

        });

}


if (teamFilter) {

    teams.forEach(team => {

        teamFilter.innerHTML += `

            <option value="${team.id}">
                ${team.name}
            </option>

        `;

    });

}


if (playerSearch) {

    playerSearch.addEventListener(
        "input",
        renderPlayers
    );

}


if (teamFilter) {

    teamFilter.addEventListener(
        "change",
        renderPlayers
    );

}


renderPlayers();
```
