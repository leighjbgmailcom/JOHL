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


/* =========================================
   SITE TRAFFIC
   One row in page_views each time a page opens, and one when someone
   presses play on the Rinkside Report (see
   supabase-migrations/012_page_views.sql). No cookies and nothing
   personal: "visitor" is a random code this browser makes up once and
   keeps, so someone who comes back isn't counted as somebody new.
   Admins see the totals on admin.html's Traffic tab.
   ========================================= */

function johlVisitorId() {
    try {
        let id = localStorage.getItem("johl_visitor");
        if (!id) {
            id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2));
            localStorage.setItem("johl_visitor", id);
        }
        return id.slice(0, 40);
    } catch (error) {
        return "nostorage-" + Math.random().toString(36).slice(2, 12);
    }
}

async function johlTrack(kind, detail) {
    try {
        const host = location.hostname;
        if (host !== "jordanohl.ca" && host !== "www.jordanohl.ca") return;
        const params = new URLSearchParams(location.search);
        if (params.has("preview")) return;
        if (typeof supabaseClient === "undefined") return;

        const page = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
        let referrer = null;
        try {
            const from = document.referrer ? new URL(document.referrer).hostname : "";
            if (from && !from.endsWith("jordanohl.ca")) referrer = from.slice(0, 100);
        } catch (error) { /* ignore */ }

        const width = Math.min(screen.width || 0, screen.height || 0) || window.innerWidth;
        const device = width < 600 ? "phone" : (width < 1000 && "ontouchstart" in window) ? "tablet" : "computer";

        let signedIn = false;
        try {
            const { data } = await supabaseClient.auth.getSession();
            signedIn = !!(data && data.session);
        } catch (error) { /* ignore */ }

        await supabaseClient.from("page_views").insert({
            kind,
            page: page.slice(0, 60),
            detail: (detail || params.get("date") || null),
            visitor: johlVisitorId(),
            referrer,
            device,
            signed_in: signedIn
        });
    } catch (error) {
        // Counting visitors must never get in the way of the page.
    }
}

document.addEventListener("DOMContentLoaded", () => johlTrack("view"));
