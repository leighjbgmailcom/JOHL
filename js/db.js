/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   Supabase Database Layer
   ========================================= */

let TEAMS = [];
let PLAYERS = [];
let SPONSORS = [];
let SCHEDULE = [];


/* =========================================
   LOAD TEAMS
   ========================================= */

async function loadTeams() {

    const { data, error } = await supabaseClient
        .from("teams")
        .select("*")
        .order("code");

    if (error) {
        console.error("Error loading teams from Supabase:", error);
        return false;
    }

    TEAMS = data.map(team => ({
        id: team.id,
        code: team.code,
        name: team.name,
        class: team.class,
        logo: team.logo
    }));

    console.log("Teams loaded from Supabase:", TEAMS);

    return true;
}


/* =========================================
   LOAD ALL LEAGUE DATA
   ========================================= */

async function loadLeagueData() {

    const teamsLoaded = await loadTeams();

    if (!teamsLoaded) {
        console.error("League data could not be loaded.");
        return false;
    }

    return true;
}
