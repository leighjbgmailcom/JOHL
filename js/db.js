/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   Supabase Database Layer
   ========================================= */

let TEAMS = [];
let PLAYERS = [];
let SPONSORS = [];
let SCHEDULE = [];
let GOALS = [];
let PENALTIES = [];


/* =========================================
   LOAD TEAMS
   ========================================= */

async function loadTeams() {

    const { data, error } = await supabaseClient
        .from("teams")
        .select("*")
        .order("code");

    if (error) {
        console.error("Error loading teams:", error);
        return false;
    }

    TEAMS = data.map(team => ({
        id: team.id,
        code: team.code,
        name: team.name,
        class: team.class,
        logo: team.logo
    }));

    return true;
}


/* =========================================
   LOAD PLAYERS
   ========================================= */

async function loadPlayers() {

    const { data, error } = await supabaseClient
        .from("players")
        .select(`
            id,
            first_name,
            last_name,
            position,
            team_id,
            teams (
                code
            )
        `)
        .order("last_name");

    if (error) {
        console.error("Error loading players:", error);
        return false;
    }

    PLAYERS = data.map(player => ({
        id: player.id,
        first: player.first_name,
        last: player.last_name,
        position: player.position,
        team: player.teams ? player.teams.code : null
    }));

    return true;
}


/* =========================================
   LOAD SPONSORS
   ========================================= */

async function loadSponsors() {

    const { data, error } = await supabaseClient
        .from("sponsors")
        .select(`
            id,
            name,
            url,
            blurb,
            team_id,
            teams (
                code
            )
        `)
        .order("name");

    if (error) {
        console.error("Error loading sponsors:", error);
        return false;
    }

    SPONSORS = data.map(sponsor => ({
        id: sponsor.id,
        name: sponsor.name,
        url: sponsor.url,
        blurb: sponsor.blurb,
        team: sponsor.teams ? sponsor.teams.code : ""
    }));

    return true;
}


/* =========================================
   LOAD SCHEDULE
   ========================================= */

async function loadSchedule() {

    const { data, error } = await supabaseClient
        .from("games")
        .select(`
            id,
            game_no,
            game_date,
            game_time,
            location,
            away_score,
            home_score,
            note,
            no_games,
            status,
            away_team_id,
            home_team_id,
            away_team:teams!games_away_team_id_fkey (
                code
            ),
            home_team:teams!games_home_team_id_fkey (
                code
            )
        `)
        .order("game_date")
        .order("game_time");

    if (error) {
        console.error("Error loading schedule:", error);
        return false;
    }

    SCHEDULE = data.map(game => ({
        id: game.id,
        gameNo: game.game_no,
        date: game.game_date,
        time: game.game_time
            ? game.game_time.substring(0, 5)
            : "",
        location: game.location,
        away: game.away_team ? game.away_team.code : "TBD",
        home: game.home_team ? game.home_team.code : "TBD",
        awayScore: game.away_score,
        homeScore: game.home_score,
        note: game.note,
        noGames: game.no_games,
        status: game.status
    }));

    return true;
}


/* =========================================
   LOAD GOALS
   (only completed games have any -- used to
   calculate standings)
   ========================================= */

async function loadGoals() {

    const { data, error } = await supabaseClient
        .from("game_goals")
        .select(`
            id,
            game_id,
            team_id,
            scorer_id,
            assist1_id,
            assist2_id,
            period,
            teams (
                code
            )
        `);

    if (error) {
        console.error("Error loading goals:", error);
        return false;
    }

    GOALS = data.map(goal => ({
        id: goal.id,
        gameId: goal.game_id,
        team: goal.teams ? goal.teams.code : null,
        scorerId: goal.scorer_id,
        assist1Id: goal.assist1_id,
        assist2Id: goal.assist2_id,
        period: goal.period
    }));

    return true;
}


/* =========================================
   LOAD PENALTIES
   (used for the player leaderboard's PIM column)
   ========================================= */

async function loadPenalties() {

    const { data, error } = await supabaseClient
        .from("game_penalties")
        .select(`
            id,
            game_id,
            team_id,
            player_id,
            minutes,
            teams (
                code
            )
        `);

    if (error) {
        console.error("Error loading penalties:", error);
        return false;
    }

    PENALTIES = data.map(penalty => ({
        id: penalty.id,
        gameId: penalty.game_id,
        team: penalty.teams ? penalty.teams.code : null,
        playerId: penalty.player_id,
        minutes: penalty.minutes
    }));

    return true;
}


/* =========================================
   LOAD EVERYTHING
   ========================================= */

async function loadLeagueData() {

    const results = await Promise.all([
        loadTeams(),
        loadPlayers(),
        loadSponsors(),
        loadSchedule(),
        loadGoals(),
        loadPenalties()
    ]);

    const success = results.every(result => result === true);

    if (success) {
        console.log("JOHL data loaded from Supabase");
        console.log("Teams:", TEAMS.length);
        console.log("Players:", PLAYERS.length);
        console.log("Sponsors:", SPONSORS.length);
        console.log("Schedule entries:", SCHEDULE.length);
        console.log("Goals:", GOALS.length);
        console.log("Penalties:", PENALTIES.length);
    }

    return success;
}
