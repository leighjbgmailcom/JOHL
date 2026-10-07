/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   RINKSIDE REPORT (recaps.html) — the weekly game-night recap

   Each recap is an entry in recaps/recaps.json: the game date, a title,
   the audio file, and the words as paragraphs. This page lists them
   newest first, with that night's final scores (from the schedule)
   beside the player. Adding a week is adding an entry and an MP3 -- see
   tools/recap/README.md.

   recaps.html?date=2026-10-04 opens straight to that night's recap,
   which is what the email to the players links to.

   A recap marked "draft": true is waiting for the league's OK. It stays
   off this page (and the home page) for everyone except whoever opens
   the preview link, recaps.html?date=...&preview.
   ========================================= */

function recapEsc(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// That night's finished games, in the order they were played.
function recapScoresHtml(date) {
    const games = SCHEDULE
        .filter(game => game.date === date && !game.noGames && game.status === "final")
        .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

    if (!games.length) return "";

    return `
        <div class="recap-scores">
            ${games.map(game => `
                <div class="recap-score">
                    <span class="recap-score-team">${teamBadge(game.away)}<span>${recapEsc(teamName(game.away))}</span></span>
                    <span class="recap-score-line">${game.awayScore ?? 0} – ${game.homeScore ?? 0}</span>
                    <span class="recap-score-team is-home"><span>${recapEsc(teamName(game.home))}</span>${teamBadge(game.home)}</span>
                </div>
            `).join("")}
        </div>
    `;
}

function recapHtml(recap, show, host, isFeatured) {
    return `
        <article class="recap ${isFeatured ? "is-featured" : ""} ${recap.draft ? "is-draft" : ""}" id="recap-${recapEsc(recap.date)}">
            ${recap.draft ? `<p class="recap-draft-note"><strong>Draft</strong> Only people with this preview link can see it. It isn't on the Recaps page or in anyone's inbox yet.</p>` : ""}
            <p class="eyebrow">${recapEsc(formatDateISO(recap.date))}</p>
            <h3>${recapEsc(recap.title)}</h3>

            ${recapScoresHtml(recap.date)}

            <audio class="recap-audio" controls preload="${isFeatured ? "metadata" : "none"}" src="${recapEsc(recap.audio)}">
                Your browser can't play this here. <a href="${recapEsc(recap.audio)}">Download the recap</a>.
            </audio>

            <details class="recap-words">
                <summary>Read the recap</summary>
                ${(recap.text || []).map(paragraph => `<p>${recapEsc(paragraph)}</p>`).join("")}
                <p class="recap-signoff">— ${recapEsc(host)}, ${recapEsc(show)}</p>
            </details>
        </article>
    `;
}

async function renderRecaps() {
    const element = document.getElementById("recap-list");
    if (!element) return;

    let data;
    try {
        // The file changes every week, so it's never read from the browser's cache.
        const response = await fetch("recaps/recaps.json", { cache: "no-store" });
        if (!response.ok) throw new Error("HTTP " + response.status);
        data = await response.json();
    } catch (error) {
        console.error("Could not load the recaps:", error);
        element.innerHTML = `<p class="recap-empty">The recaps couldn't be loaded right now. Try again in a minute.</p>`;
        return;
    }

    // Scores come from the schedule; the recaps still show without them.
    await loadLeagueData();

    const params = new URLSearchParams(window.location.search);
    const showDrafts = params.has("preview");

    const recaps = (data.recaps || [])
        .filter(recap => showDrafts || !recap.draft)
        .sort((a, b) => b.date.localeCompare(a.date));

    if (!recaps.length) {
        element.innerHTML = `<p class="recap-empty">No recaps yet. The first one lands the day after the next game night.</p>`;
        return;
    }

    // The one asked for in the link, or else the latest, is the one up top
    // and ready to play.
    const wanted = params.get("date");
    const featured = recaps.find(recap => recap.date === wanted) || recaps[0];

    element.innerHTML = recaps
        .map(recap => recapHtml(recap, data.show, data.host, recap === featured))
        .join("");

    if (wanted && featured.date === wanted && featured !== recaps[0]) {
        document.getElementById(`recap-${featured.date}`).scrollIntoView({ block: "start" });
    }
}

document.addEventListener("DOMContentLoaded", renderRecaps);
