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

// Render full player table or team group grids
document.addEventListener("DOMContentLoaded", () => {
  const playersTableBody = document.getElementById("player-list-body");
  const teamCardsContainer = document.getElementById("teams-container");

  // Populate Players Page Table
  if (playersTableBody) {
    let rowsHTML = "";
    Object.keys(JOHL_ROSTERS).forEach(team => {
      JOHL_ROSTERS[team].forEach(player => {
        rowsHTML += `
          <tr>
            <td>${player.name}</td>
            <td>${team}</td>
            <td><span class="badge ${player.pos === 'G' ? 'badge-goalie' : 'badge-skater'}">${player.pos === 'G' ? 'Goalie' : 'Forward/Defense'}</span></td>
          </tr>`;
      });
    });
    playersTableBody.innerHTML = rowsHTML;
  }

  // Populate Teams Page Cards
  if (teamCardsContainer) {
    let cardsHTML = "";
    Object.keys(JOHL_ROSTERS).forEach(team => {
      cardsHTML += `
        <div class="team-card">
          <h2>${team}</h2>
          <ul class="roster-list">
            ${JOHL_ROSTERS[team].map(p => `<li>${p.name} ${p.pos === 'G' ? '<strong>(G)</strong>' : ''}</li>`).join('')}
          </ul>
        </div>`;
    });
    teamCardsContainer.innerHTML = cardsHTML;
  }
});
