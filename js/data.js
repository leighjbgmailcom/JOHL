/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   2026-27 SEASON DATA
   -----------------------------------------
   Static data file — no database yet.
   Source: schedule_jordanoldtimershockey.xlsx
           2026-27_JOHL_Team_List.xlsx
   Regenerate this file any time the schedule
   or roster spreadsheet changes.
   ========================================= */

const TEAMS = [
    {
        "code": "TOR",
        "name": "Toronto Maple Leafs",
        "class": "toronto"
    },
    {
        "code": "VAN",
        "name": "Vancouver Canucks",
        "class": "vancouver"
    },
    {
        "code": "QUE",
        "name": "Québec Nordiques",
        "class": "quebec"
    },
    {
        "code": "EDM",
        "name": "Edmonton Oilers",
        "class": "edmonton"
    },
    {
        "code": "MTL",
        "name": "Montréal Canadiens",
        "class": "montreal"
    },
    {
        "code": "OTT",
        "name": "Ottawa Senators",
        "class": "ottawa"
    }
];

const PLAYERS = [
    {
        "first": "Mark",
        "last": "Abrams",
        "team": "EDM",
        "position": "Skater"
    },
    {
        "first": "Mark",
        "last": "Adams",
        "team": "TOR",
        "position": "Skater"
    },
    {
        "first": "Kres",
        "last": "Andersen",
        "team": "QUE",
        "position": "Skater"
    },
    {
        "first": "Will",
        "last": "Beckett",
        "team": "VAN",
        "position": "Skater"
    },
    {
        "first": "Peter",
        "last": "Beukema",
        "team": "EDM",
        "position": "Skater"
    },
    {
        "first": "Andrew",
        "last": "Bevan",
        "team": "OTT",
        "position": "Skater"
    },
    {
        "first": "Chad",
        "last": "Bigger",
        "team": "MTL",
        "position": "Skater"
    },
    {
        "first": "Chris",
        "last": "Boom",
        "team": "OTT",
        "position": "Skater"
    },
    {
        "first": "Steve",
        "last": "Bowen",
        "team": "VAN",
        "position": "Skater"
    },
    {
        "first": "Darrin",
        "last": "Bower",
        "team": "MTL",
        "position": "Skater"
    },
    {
        "first": "Jamie",
        "last": "Brophy",
        "team": "QUE",
        "position": "Skater"
    },
    {
        "first": "Leigh",
        "last": "Brown",
        "team": "EDM",
        "position": "Skater"
    },
    {
        "first": "Bruce",
        "last": "Buynink",
        "team": "OTT",
        "position": "G"
    },
    {
        "first": "Bryan",
        "last": "Chinn",
        "team": "MTL",
        "position": "Skater"
    },
    {
        "first": "Derek",
        "last": "Collini",
        "team": "TOR",
        "position": "Skater"
    },
    {
        "first": "Ty",
        "last": "Cooke",
        "team": "MTL",
        "position": "Skater"
    },
    {
        "first": "Chris",
        "last": "Cookson",
        "team": "QUE",
        "position": "Skater"
    },
    {
        "first": "Darren",
        "last": "Craig",
        "team": "EDM",
        "position": "Skater"
    },
    {
        "first": "Dave",
        "last": "Crandles",
        "team": "MTL",
        "position": "Skater"
    },
    {
        "first": "Jim",
        "last": "Culp",
        "team": "MTL",
        "position": "Skater"
    },
    {
        "first": "Brian",
        "last": "Culp",
        "team": "MTL",
        "position": "Skater"
    },
    {
        "first": "Blaine",
        "last": "Davies",
        "team": "OTT",
        "position": "Skater"
    },
    {
        "first": "Andy",
        "last": "Dawson",
        "team": "EDM",
        "position": "G"
    },
    {
        "first": "Brad",
        "last": "Deakon",
        "team": "OTT",
        "position": "Skater"
    },
    {
        "first": "Rob",
        "last": "DeBolster",
        "team": "QUE",
        "position": "Skater"
    },
    {
        "first": "Derrick",
        "last": "DeBolster",
        "team": "EDM",
        "position": "Skater"
    },
    {
        "first": "Matt",
        "last": "Dixon",
        "team": "MTL",
        "position": "Skater"
    },
    {
        "first": "Joel",
        "last": "Dykstra",
        "team": "QUE",
        "position": "Skater"
    },
    {
        "first": "Bob",
        "last": "Fernick",
        "team": "TOR",
        "position": "Skater"
    },
    {
        "first": "Andrew",
        "last": "Fissel",
        "team": "QUE",
        "position": "Skater"
    },
    {
        "first": "Mike",
        "last": "Foran",
        "team": "EDM",
        "position": "Skater"
    },
    {
        "first": "Steve",
        "last": "Fox",
        "team": "TOR",
        "position": "Skater"
    },
    {
        "first": "Jeff",
        "last": "Gates",
        "team": "TOR",
        "position": "Skater"
    },
    {
        "first": "Adam",
        "last": "Goodbrand",
        "team": "VAN",
        "position": "Skater"
    },
    {
        "first": "Jeff",
        "last": "Grossi",
        "team": "EDM",
        "position": "Skater"
    },
    {
        "first": "Nick",
        "last": "Hageman",
        "team": "OTT",
        "position": "Skater"
    },
    {
        "first": "Jeff",
        "last": "Haroutunian",
        "team": "VAN",
        "position": "Skater"
    },
    {
        "first": "Adam",
        "last": "Hendricks",
        "team": "OTT",
        "position": "Skater"
    },
    {
        "first": "Drew",
        "last": "Hering",
        "team": "MTL",
        "position": "Skater"
    },
    {
        "first": "Rob",
        "last": "Holt",
        "team": "OTT",
        "position": "Skater"
    },
    {
        "first": "Ryan",
        "last": "Horton",
        "team": "MTL",
        "position": "Skater"
    },
    {
        "first": "Darren",
        "last": "Horton",
        "team": "TOR",
        "position": "Skater"
    },
    {
        "first": "Stu",
        "last": "Hunt",
        "team": "MTL",
        "position": "Skater"
    },
    {
        "first": "Paul",
        "last": "Koke",
        "team": "VAN",
        "position": "Skater"
    },
    {
        "first": "Nick",
        "last": "Langlois",
        "team": "QUE",
        "position": "Skater"
    },
    {
        "first": "Doug",
        "last": "Lawrence",
        "team": "QUE",
        "position": "Skater"
    },
    {
        "first": "Dave",
        "last": "Levar",
        "team": "MTL",
        "position": "G"
    },
    {
        "first": "Jon",
        "last": "Leyenhorst",
        "team": "VAN",
        "position": "Skater"
    },
    {
        "first": "Dave",
        "last": "Mable",
        "team": "QUE",
        "position": "Skater"
    },
    {
        "first": "Rudy",
        "last": "Mallet",
        "team": "TOR",
        "position": "G"
    },
    {
        "first": "Nick",
        "last": "Mansion",
        "team": "EDM",
        "position": "Skater"
    },
    {
        "first": "Craig",
        "last": "Martin",
        "team": "VAN",
        "position": "Skater"
    },
    {
        "first": "Jason",
        "last": "McKay",
        "team": "QUE",
        "position": "G"
    },
    {
        "first": "Steve",
        "last": "McMillan",
        "team": "VAN",
        "position": "Skater"
    },
    {
        "first": "Ron",
        "last": "McPherson",
        "team": "EDM",
        "position": "Skater"
    },
    {
        "first": "Scott",
        "last": "Mills",
        "team": "QUE",
        "position": "Skater"
    },
    {
        "first": "John",
        "last": "Misek",
        "team": "EDM",
        "position": "Skater"
    },
    {
        "first": "Josh",
        "last": "Moore",
        "team": "QUE",
        "position": "Skater"
    },
    {
        "first": "Simon",
        "last": "Murphy",
        "team": "OTT",
        "position": "Skater"
    },
    {
        "first": "Colin",
        "last": "Murphy",
        "team": "VAN",
        "position": "Skater"
    },
    {
        "first": "Matt",
        "last": "O'Brien",
        "team": "OTT",
        "position": "Skater"
    },
    {
        "first": "Jamie",
        "last": "O'Brien",
        "team": "EDM",
        "position": "Skater"
    },
    {
        "first": "Sam",
        "last": "Ort",
        "team": "MTL",
        "position": "Skater"
    },
    {
        "first": "Ryan",
        "last": "Parnall",
        "team": "MTL",
        "position": "Skater"
    },
    {
        "first": "David",
        "last": "Parsons",
        "team": "TOR",
        "position": "Skater"
    },
    {
        "first": "Kevin",
        "last": "Paul",
        "team": "MTL",
        "position": "Skater"
    },
    {
        "first": "Larry",
        "last": "Penney",
        "team": "TOR",
        "position": "Skater"
    },
    {
        "first": "Greg",
        "last": "Penney",
        "team": "MTL",
        "position": "Skater"
    },
    {
        "first": "Kurt",
        "last": "Peters",
        "team": "VAN",
        "position": "Skater"
    },
    {
        "first": "Kevin",
        "last": "Pierce",
        "team": "TOR",
        "position": "Skater"
    },
    {
        "first": "Michael",
        "last": "Pulo",
        "team": "QUE",
        "position": "Skater"
    },
    {
        "first": "Dave",
        "last": "Pundyk",
        "team": "VAN",
        "position": "Skater"
    },
    {
        "first": "Emilio",
        "last": "Raimondo",
        "team": "EDM",
        "position": "G"
    },
    {
        "first": "Adam",
        "last": "Regular",
        "team": "TOR",
        "position": "Skater"
    },
    {
        "first": "Jeff",
        "last": "Reimer",
        "team": "TOR",
        "position": "Skater"
    },
    {
        "first": "Dave",
        "last": "Rennie",
        "team": "VAN",
        "position": "G"
    },
    {
        "first": "Chris",
        "last": "Riediger",
        "team": "OTT",
        "position": "Skater"
    },
    {
        "first": "Michael",
        "last": "Robertson",
        "team": "EDM",
        "position": "Skater"
    },
    {
        "first": "Ric",
        "last": "Robinson",
        "team": "MTL",
        "position": "G"
    },
    {
        "first": "Kevin",
        "last": "Rolston",
        "team": "QUE",
        "position": "G"
    },
    {
        "first": "Colin",
        "last": "Roy",
        "team": "QUE",
        "position": "Skater"
    },
    {
        "first": "Ryan",
        "last": "Rozon",
        "team": "TOR",
        "position": "G"
    },
    {
        "first": "Keith",
        "last": "Schmidt",
        "team": "OTT",
        "position": "Skater"
    },
    {
        "first": "Tim",
        "last": "Shannon",
        "team": "OTT",
        "position": "G"
    },
    {
        "first": "Dave",
        "last": "Sheridan",
        "team": "OTT",
        "position": "Skater"
    },
    {
        "first": "Wes",
        "last": "Short",
        "team": "VAN",
        "position": "Skater"
    },
    {
        "first": "Adam",
        "last": "Short",
        "team": "VAN",
        "position": "Skater"
    },
    {
        "first": "Andrew",
        "last": "Smith",
        "team": "EDM",
        "position": "Skater"
    },
    {
        "first": "Joe",
        "last": "Snihur",
        "team": "TOR",
        "position": "Skater"
    },
    {
        "first": "Adam",
        "last": "Steele",
        "team": "TOR",
        "position": "Skater"
    },
    {
        "first": "Daryl",
        "last": "Strong",
        "team": "VAN",
        "position": "Skater"
    },
    {
        "first": "Jeff",
        "last": "Stuart",
        "team": "EDM",
        "position": "Skater"
    },
    {
        "first": "Andy",
        "last": "Suggitt",
        "team": "TOR",
        "position": "Skater"
    },
    {
        "first": "Cam",
        "last": "Tourcotte",
        "team": "OTT",
        "position": "Skater"
    },
    {
        "first": "Waylon",
        "last": "Tweedy",
        "team": "VAN",
        "position": "Skater"
    },
    {
        "first": "Marcel",
        "last": "VanRuyven",
        "team": "TOR",
        "position": "Skater"
    },
    {
        "first": "Wayne",
        "last": "Wall",
        "team": "EDM",
        "position": "Skater"
    },
    {
        "first": "Tim",
        "last": "Warden",
        "team": "QUE",
        "position": "Skater"
    },
    {
        "first": "Greg",
        "last": "Wells",
        "team": "OTT",
        "position": "Skater"
    },
    {
        "first": "Brody",
        "last": "Whetlam",
        "team": "QUE",
        "position": "Skater"
    },
    {
        "first": "Tyler",
        "last": "Williams",
        "team": "OTT",
        "position": "Skater"
    },
    {
        "first": "Derek",
        "last": "Yendt",
        "team": "VAN",
        "position": "G"
    }
];

const SCHEDULE = [
    {
        "date": "2026-09-27",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 1,
        "away": "EDM",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-09-27",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 1,
        "away": "OTT",
        "home": "QUE",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-09-27",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 1,
        "away": "TOR",
        "home": "VAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-04",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 2,
        "away": "VAN",
        "home": "EDM",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-04",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 2,
        "away": "TOR",
        "home": "QUE",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-04",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 2,
        "away": "MTL",
        "home": "OTT",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-11",
        "noGames": true,
        "note": "Thanksgiving"
    },
    {
        "date": "2026-10-18",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 3,
        "away": "QUE",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-18",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 3,
        "away": "OTT",
        "home": "VAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-18",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 3,
        "away": "EDM",
        "home": "TOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-25",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 4,
        "away": "QUE",
        "home": "EDM",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-25",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 4,
        "away": "VAN",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-25",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 4,
        "away": "TOR",
        "home": "OTT",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-01",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 5,
        "away": "MTL",
        "home": "TOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-01",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 5,
        "away": "OTT",
        "home": "EDM",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-01",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 5,
        "away": "QUE",
        "home": "VAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-08",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 6,
        "away": "VAN",
        "home": "TOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-08",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 6,
        "away": "OTT",
        "home": "QUE",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-08",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 6,
        "away": "EDM",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-15",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 7,
        "away": "MTL",
        "home": "OTT",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-15",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 7,
        "away": "VAN",
        "home": "EDM",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-15",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 7,
        "away": "TOR",
        "home": "QUE",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-22",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 8,
        "away": "QUE",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-22",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 8,
        "away": "OTT",
        "home": "VAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-22",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 8,
        "away": "EDM",
        "home": "TOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-29",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 9,
        "away": "QUE",
        "home": "EDM",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-29",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 9,
        "away": "TOR",
        "home": "OTT",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-29",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 9,
        "away": "MTL",
        "home": "VAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-06",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 10,
        "away": "EDM",
        "home": "OTT",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-06",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 10,
        "away": "TOR",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-06",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 10,
        "away": "VAN",
        "home": "QUE",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-13",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 11,
        "away": "VAN",
        "home": "TOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-13",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 11,
        "away": "MTL",
        "home": "EDM",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-13",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 11,
        "away": "OTT",
        "home": "QUE",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-20",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 12,
        "away": "QUE",
        "home": "TOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-20",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 12,
        "away": "EDM",
        "home": "VAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-20",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 12,
        "away": "OTT",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-27",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 13,
        "away": "MTL",
        "home": "QUE",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-27",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 13,
        "away": "VAN",
        "home": "OTT",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-27",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 13,
        "away": "EDM",
        "home": "TOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-03",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 14,
        "away": "TOR",
        "home": "OTT",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-03",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 14,
        "away": "EDM",
        "home": "QUE",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-03",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 14,
        "away": "MTL",
        "home": "VAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-10",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 15,
        "away": "QUE",
        "home": "VAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-10",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 15,
        "away": "MTL",
        "home": "TOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-10",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 15,
        "away": "OTT",
        "home": "EDM",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-17",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 16,
        "away": "TOR",
        "home": "VAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-17",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 16,
        "away": "QUE",
        "home": "OTT",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-17",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 16,
        "away": "EDM",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-24",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 17,
        "away": "MTL",
        "home": "OTT",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-24",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 17,
        "away": "VAN",
        "home": "EDM",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-24",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 17,
        "away": "TOR",
        "home": "QUE",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-31",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 18,
        "away": "TOR",
        "home": "EDM",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-31",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 18,
        "away": "MTL",
        "home": "QUE",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-31",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 18,
        "away": "OTT",
        "home": "VAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-07",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 19,
        "away": "VAN",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-07",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 19,
        "away": "EDM",
        "home": "QUE",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-07",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 19,
        "away": "OTT",
        "home": "TOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-14",
        "noGames": true,
        "note": "Super Bowl"
    },
    {
        "date": "2027-02-21",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 20,
        "away": "OTT",
        "home": "EDM",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-21",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 20,
        "away": "MTL",
        "home": "TOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-21",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 20,
        "away": "QUE",
        "home": "VAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-28",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 21,
        "away": "QUE",
        "home": "OTT",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-28",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 21,
        "away": "MTL",
        "home": "EDM",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-28",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 21,
        "away": "TOR",
        "home": "VAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-07",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 22,
        "away": "EDM",
        "home": "VAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-07",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 22,
        "away": "QUE",
        "home": "TOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-07",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 22,
        "away": "OTT",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-14",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 23,
        "away": "VAN",
        "home": "OTT",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-14",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 23,
        "away": "TOR",
        "home": "EDM",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-14",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 23,
        "away": "MTL",
        "home": "QUE",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-21",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 24,
        "away": "OTT",
        "home": "TOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-21",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 24,
        "away": "VAN",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-21",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 24,
        "away": "QUE",
        "home": "EDM",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-28",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 25,
        "away": "VAN",
        "home": "QUE",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-28",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 25,
        "away": "TOR",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-28",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 25,
        "away": "EDM",
        "home": "OTT",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-04-04",
        "time": "6:00 pm",
        "location": "Jordan Arena",
        "gameNo": 26,
        "away": "TBD",
        "home": "TBD",
        "note": "Consolation Final",
        "noGames": false
    },
    {
        "date": "2027-04-04",
        "time": "8:00 pm",
        "location": "Jordan Arena",
        "gameNo": 26,
        "away": "TBD",
        "home": "TBD",
        "note": "Championship Game",
        "noGames": false
    }
];
