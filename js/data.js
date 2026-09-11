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
        "code": "TML",
        "name": "Maple Leafs",
        "class": "Leafs"
    },
    {
        "code": "CAN",
        "name": "Canucks",
        "class": "Canucks"
    },
    {
        "code": "NOR",
        "name": "Nordiques ",
        "class": "Nordiques "
    },
    {
        "code": "OIL",
        "name": "Oilers",
        "class": "Oilers"
    },
    {
        "code": "MTL",
        "name": "Canadiens",
        "class": "Canadiens"
    },
    {
        "code": "SEN",
        "name": "Senators",
        "class": "Senators"
    }
];

const PLAYERS = [
    {
        "first": "Mark",
        "last": "Abrams",
        "team": "OIL",
        "position": "Skater"
    },
    {
        "first": "Mark",
        "last": "Adams",
        "team": "TML",
        "position": "Skater"
    },
    {
        "first": "Kres",
        "last": "Andersen",
        "team": "NOR",
        "position": "Skater"
    },
    {
        "first": "Will",
        "last": "Beckett",
        "team": "CAN",
        "position": "Skater"
    },
    {
        "first": "Peter",
        "last": "Beukema",
        "team": "OIL",
        "position": "Skater"
    },
    {
        "first": "Andrew",
        "last": "BeCAN",
        "team": "SEN",
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
        "team": "SEN",
        "position": "Skater"
    },
    {
        "first": "Steve",
        "last": "Bowen",
        "team": "CAN",
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
        "team": "NOR",
        "position": "Skater"
    },
    {
        "first": "Leigh",
        "last": "Brown",
        "team": "OIL",
        "position": "Skater"
    },
    {
        "first": "Bruce",
        "last": "Buynink",
        "team": "SEN",
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
        "team": "TML",
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
        "team": "NOR",
        "position": "Skater"
    },
    {
        "first": "Darren",
        "last": "Craig",
        "team": "OIL",
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
        "team": "SEN",
        "position": "Skater"
    },
    {
        "first": "Andy",
        "last": "Dawson",
        "team": "OIL",
        "position": "G"
    },
    {
        "first": "Brad",
        "last": "Deakon",
        "team": "SEN",
        "position": "Skater"
    },
    {
        "first": "Rob",
        "last": "DeBolster",
        "team": "NOR",
        "position": "Skater"
    },
    {
        "first": "Derrick",
        "last": "DeBolster",
        "team": "OIL",
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
        "team": "NOR",
        "position": "Skater"
    },
    {
        "first": "Bob",
        "last": "Fernick",
        "team": "TML",
        "position": "Skater"
    },
    {
        "first": "Andrew",
        "last": "Fissel",
        "team": "NOR",
        "position": "Skater"
    },
    {
        "first": "Mike",
        "last": "Foran",
        "team": "OIL",
        "position": "Skater"
    },
    {
        "first": "Steve",
        "last": "Fox",
        "team": "TML",
        "position": "Skater"
    },
    {
        "first": "Jeff",
        "last": "Gates",
        "team": "TML",
        "position": "Skater"
    },
    {
        "first": "Adam",
        "last": "Goodbrand",
        "team": "CAN",
        "position": "Skater"
    },
    {
        "first": "Jeff",
        "last": "Grossi",
        "team": "OIL",
        "position": "Skater"
    },
    {
        "first": "Nick",
        "last": "Hageman",
        "team": "SEN",
        "position": "Skater"
    },
    {
        "first": "Jeff",
        "last": "Haroutunian",
        "team": "CAN",
        "position": "Skater"
    },
    {
        "first": "Adam",
        "last": "Hendricks",
        "team": "SEN",
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
        "team": "SEN",
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
        "team": "TML",
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
        "team": "CAN",
        "position": "Skater"
    },
    {
        "first": "Nick",
        "last": "Langlois",
        "team": "NOR",
        "position": "Skater"
    },
    {
        "first": "Doug",
        "last": "Lawrence",
        "team": "NOR",
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
        "team": "CAN",
        "position": "Skater"
    },
    {
        "first": "Dave",
        "last": "Mable",
        "team": "NOR",
        "position": "Skater"
    },
    {
        "first": "Rudy",
        "last": "Mallet",
        "team": "TML",
        "position": "G"
    },
    {
        "first": "Nick",
        "last": "Mansion",
        "team": "OIL",
        "position": "Skater"
    },
    {
        "first": "Craig",
        "last": "Martin",
        "team": "CAN",
        "position": "Skater"
    },
    {
        "first": "Jason",
        "last": "McKay",
        "team": "NOR",
        "position": "G"
    },
    {
        "first": "Steve",
        "last": "McMillan",
        "team": "CAN",
        "position": "Skater"
    },
    {
        "first": "Ron",
        "last": "McPherson",
        "team": "OIL",
        "position": "Skater"
    },
    {
        "first": "ScSEN",
        "last": "Mills",
        "team": "NOR",
        "position": "Skater"
    },
    {
        "first": "John",
        "last": "Misek",
        "team": "OIL",
        "position": "Skater"
    },
    {
        "first": "Josh",
        "last": "Moore",
        "team": "NOR",
        "position": "Skater"
    },
    {
        "first": "Simon",
        "last": "Murphy",
        "team": "SEN",
        "position": "Skater"
    },
    {
        "first": "Colin",
        "last": "Murphy",
        "team": "CAN",
        "position": "Skater"
    },
    {
        "first": "Matt",
        "last": "O'Brien",
        "team": "SEN",
        "position": "Skater"
    },
    {
        "first": "Jamie",
        "last": "O'Brien",
        "team": "OIL",
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
        "team": "TML",
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
        "team": "TML",
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
        "team": "CAN",
        "position": "Skater"
    },
    {
        "first": "Kevin",
        "last": "Pierce",
        "team": "TML",
        "position": "Skater"
    },
    {
        "first": "Michael",
        "last": "Pulo",
        "team": "NOR",
        "position": "Skater"
    },
    {
        "first": "Dave",
        "last": "Pundyk",
        "team": "CAN",
        "position": "Skater"
    },
    {
        "first": "Emilio",
        "last": "Raimondo",
        "team": "OIL",
        "position": "G"
    },
    {
        "first": "Adam",
        "last": "Regular",
        "team": "TML",
        "position": "Skater"
    },
    {
        "first": "Jeff",
        "last": "Reimer",
        "team": "TML",
        "position": "Skater"
    },
    {
        "first": "Dave",
        "last": "Rennie",
        "team": "CAN",
        "position": "G"
    },
    {
        "first": "Chris",
        "last": "Riediger",
        "team": "SEN",
        "position": "Skater"
    },
    {
        "first": "Michael",
        "last": "Robertson",
        "team": "OIL",
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
        "team": "NOR",
        "position": "G"
    },
    {
        "first": "Colin",
        "last": "Roy",
        "team": "NOR",
        "position": "Skater"
    },
    {
        "first": "Ryan",
        "last": "Rozon",
        "team": "TML",
        "position": "G"
    },
    {
        "first": "Keith",
        "last": "Schmidt",
        "team": "SEN",
        "position": "Skater"
    },
    {
        "first": "Tim",
        "last": "Shannon",
        "team": "SEN",
        "position": "G"
    },
    {
        "first": "Dave",
        "last": "Sheridan",
        "team": "SEN",
        "position": "Skater"
    },
    {
        "first": "Wes",
        "last": "Short",
        "team": "CAN",
        "position": "Skater"
    },
    {
        "first": "Adam",
        "last": "Short",
        "team": "CAN",
        "position": "Skater"
    },
    {
        "first": "Andrew",
        "last": "Smith",
        "team": "OIL",
        "position": "Skater"
    },
    {
        "first": "Joe",
        "last": "Snihur",
        "team": "TML",
        "position": "Skater"
    },
    {
        "first": "Adam",
        "last": "Steele",
        "team": "TML",
        "position": "Skater"
    },
    {
        "first": "Daryl",
        "last": "Strong",
        "team": "CAN",
        "position": "Skater"
    },
    {
        "first": "Jeff",
        "last": "Stuart",
        "team": "OIL",
        "position": "Skater"
    },
    {
        "first": "Andy",
        "last": "Suggitt",
        "team": "TML",
        "position": "Skater"
    },
    {
        "first": "Cam",
        "last": "TourcSENe",
        "team": "SEN",
        "position": "Skater"
    },
    {
        "first": "Waylon",
        "last": "Tweedy",
        "team": "CAN",
        "position": "Skater"
    },
    {
        "first": "Marcel",
        "last": "CANRuyven",
        "team": "TML",
        "position": "Skater"
    },
    {
        "first": "Wayne",
        "last": "Wall",
        "team": "OIL",
        "position": "Skater"
    },
    {
        "first": "Tim",
        "last": "Warden",
        "team": "NOR",
        "position": "Skater"
    },
    {
        "first": "Greg",
        "last": "Wells",
        "team": "SEN",
        "position": "Skater"
    },
    {
        "first": "Brody",
        "last": "Whetlam",
        "team": "NOR",
        "position": "Skater"
    },
    {
        "first": "Tyler",
        "last": "Williams",
        "team": "SEN",
        "position": "Skater"
    },
    {
        "first": "Derek",
        "last": "Yendt",
        "team": "CAN",
        "position": "G"
    }
];

const SCHEDULE = [
    {
        "date": "2026-09-27",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 1,
        "away": "OIL",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-09-27",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 1,
        "away": "SEN",
        "home": "NOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-09-27",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 1,
        "away": "TML",
        "home": "CAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-04",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 2,
        "away": "CAN",
        "home": "OIL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-04",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 2,
        "away": "TML",
        "home": "NOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-04",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 2,
        "away": "MTL",
        "home": "SEN",
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
        "away": "NOR",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-18",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 3,
        "away": "SEN",
        "home": "CAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-18",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 3,
        "away": "OIL",
        "home": "TML",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-25",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 4,
        "away": "NOR",
        "home": "OIL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-25",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 4,
        "away": "CAN",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-10-25",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 4,
        "away": "TML",
        "home": "SEN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-01",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 5,
        "away": "MTL",
        "home": "TML",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-01",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 5,
        "away": "SEN",
        "home": "OIL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-01",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 5,
        "away": "NOR",
        "home": "CAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-08",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 6,
        "away": "CAN",
        "home": "TML",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-08",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 6,
        "away": "SEN",
        "home": "NOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-08",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 6,
        "away": "OIL",
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
        "home": "SEN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-15",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 7,
        "away": "CAN",
        "home": "OIL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-15",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 7,
        "away": "TML",
        "home": "NOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-22",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 8,
        "away": "NOR",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-22",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 8,
        "away": "SEN",
        "home": "CAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-22",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 8,
        "away": "OIL",
        "home": "TML",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-29",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 9,
        "away": "NOR",
        "home": "OIL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-29",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 9,
        "away": "TML",
        "home": "SEN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-11-29",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 9,
        "away": "MTL",
        "home": "CAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-06",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 10,
        "away": "OIL",
        "home": "SEN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-06",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 10,
        "away": "TML",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-06",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 10,
        "away": "CAN",
        "home": "NOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-13",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 11,
        "away": "CAN",
        "home": "TML",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-13",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 11,
        "away": "MTL",
        "home": "OIL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-13",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 11,
        "away": "SEN",
        "home": "NOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-20",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 12,
        "away": "NOR",
        "home": "TML",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-20",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 12,
        "away": "OIL",
        "home": "CAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-20",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 12,
        "away": "SEN",
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
        "home": "NOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-27",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 13,
        "away": "CAN",
        "home": "SEN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2026-12-27",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 13,
        "away": "OIL",
        "home": "TML",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-03",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 14,
        "away": "TML",
        "home": "SEN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-03",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 14,
        "away": "OIL",
        "home": "NOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-03",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 14,
        "away": "MTL",
        "home": "CAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-10",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 15,
        "away": "NOR",
        "home": "CAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-10",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 15,
        "away": "MTL",
        "home": "TML",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-10",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 15,
        "away": "SEN",
        "home": "OIL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-17",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 16,
        "away": "TML",
        "home": "CAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-17",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 16,
        "away": "NOR",
        "home": "SEN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-17",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 16,
        "away": "OIL",
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
        "home": "SEN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-24",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 17,
        "away": "CAN",
        "home": "OIL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-24",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 17,
        "away": "TML",
        "home": "NOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-31",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 18,
        "away": "TML",
        "home": "OIL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-31",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 18,
        "away": "MTL",
        "home": "NOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-01-31",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 18,
        "away": "SEN",
        "home": "CAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-07",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 19,
        "away": "CAN",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-07",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 19,
        "away": "OIL",
        "home": "NOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-07",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 19,
        "away": "SEN",
        "home": "TML",
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
        "away": "SEN",
        "home": "OIL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-21",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 20,
        "away": "MTL",
        "home": "TML",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-21",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 20,
        "away": "NOR",
        "home": "CAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-28",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 21,
        "away": "NOR",
        "home": "SEN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-28",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 21,
        "away": "MTL",
        "home": "OIL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-02-28",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 21,
        "away": "TML",
        "home": "CAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-07",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 22,
        "away": "OIL",
        "home": "CAN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-07",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 22,
        "away": "NOR",
        "home": "TML",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-07",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 22,
        "away": "SEN",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-14",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 23,
        "away": "CAN",
        "home": "SEN",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-14",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 23,
        "away": "TML",
        "home": "OIL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-14",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 23,
        "away": "MTL",
        "home": "NOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-21",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 24,
        "away": "SEN",
        "home": "TML",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-21",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 24,
        "away": "CAN",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-21",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 24,
        "away": "NOR",
        "home": "OIL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-28",
        "time": "6:30 pm",
        "location": "Jordan Arena",
        "gameNo": 25,
        "away": "CAN",
        "home": "NOR",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-28",
        "time": "7:50 pm",
        "location": "Jordan Arena",
        "gameNo": 25,
        "away": "TML",
        "home": "MTL",
        "note": null,
        "noGames": false
    },
    {
        "date": "2027-03-28",
        "time": "9:10 pm",
        "location": "Jordan Arena",
        "gameNo": 25,
        "away": "OIL",
        "home": "SEN",
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
