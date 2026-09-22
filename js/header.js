/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   SHARED SITE HEADER LOADER

   Every page has a single <div id="site-header-placeholder"></div>
   where the header normally goes. This fetches the one shared
   partials/header.html and drops it in, so the header markup only
   has to be edited in one place instead of on every page.
   ========================================= */

async function loadHeader() {

    const placeholder = document.getElementById("site-header-placeholder");

    if (!placeholder) {
        return;
    }

    try {

        const response = await fetch("partials/header.html");

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const html = await response.text();

        placeholder.outerHTML = html;

    } catch (error) {

        console.error("Could not load site header:", error);

        return;
    }

    // -------------------------------------------------
    // HIGHLIGHT THE CURRENT PAGE'S NAV LINK
    // -------------------------------------------------

    const currentPage =
        window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll("#site-nav a[data-page]").forEach(link => {

        if (link.getAttribute("data-page") === currentPage) {
            link.classList.add("active");
        }

    });

    // -------------------------------------------------
    // NOW THAT THE HEADER EXISTS, WIRE IT UP
    // -------------------------------------------------
    // (setupMobileNav() and setupAuthNav() live in js/app.js and
    // can't run until the header markup above is actually in the DOM.)

    if (typeof setupMobileNav === "function") {
        setupMobileNav();
    }

    if (typeof setupAuthNav === "function") {
        setupAuthNav();
    }

}


document.addEventListener("DOMContentLoaded", loadHeader);
