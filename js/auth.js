// =====================================================
// INVITATION REDIRECT
// =====================================================

(function () {

    const hashParams = new URLSearchParams(
        window.location.hash.substring(1)
    );

    if (
        hashParams.get("type") === "invite" &&
        (
            window.location.pathname === "/" ||
            window.location.pathname.endsWith("/index.html")
        )
    ) {

        console.log("JOHL invitation detected.");

        window.location.replace(
            "accept-invite.html" + window.location.hash
        );

    }

})();


// =====================================================
// CHECK LOGIN
// =====================================================
//
// Page-gating for members-only pages. Logged-out visitors are sent
// back to the homepage with ?login=1 so the login dropdown (in
// js/app.js, wired up by setupAuthNav()/setupLoginDropdown()) opens
// automatically, rather than to a separate full-page login screen.

async function checkLogin() {

    // -------------------------------------------------
    // CHECK FOR SUPABASE INVITATION
    // -------------------------------------------------

    const hashParams = new URLSearchParams(
        window.location.hash.substring(1)
    );

    const searchParams = new URLSearchParams(
        window.location.search
    );

    const inviteType =
        hashParams.get("type") ||
        searchParams.get("type");

    const isHomePage =
        window.location.pathname === "/" ||
        window.location.pathname.endsWith("/index.html");

    if (inviteType === "invite" && isHomePage) {

        console.log("JOHL invitation detected.");

        window.location.replace(
            "accept-invite.html" +
            window.location.search +
            window.location.hash
        );

        return false;
    }


    // -------------------------------------------------
    // NORMAL LOGIN CHECK
    // -------------------------------------------------

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {

        const currentPage =
            window.location.pathname.split("/").pop() || "index.html";

        window.location.href =
            "index.html?login=1&redirect=" + encodeURIComponent(currentPage);

        return false;
    }

    return true;

}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

const { error } = await supabaseClient.auth.signOut();

if (error) {

    console.error(error);

    return;
}

window.location.href = "index.html";

}
