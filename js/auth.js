async function checkLogin() {

    // -------------------------------------------------
    // CHECK FOR SUPABASE INVITATION
    // -------------------------------------------------

    const hashParams = new URLSearchParams(
        window.location.hash.substring(1)
    );

    const inviteType = hashParams.get("type");

    const isHomePage =
        window.location.pathname === "/" ||
        window.location.pathname.endsWith("/index.html");

    if (inviteType === "invite" && isHomePage) {

        console.log("Invitation detected.");

        window.location.replace(
            "accept-invite.html" + window.location.hash
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

        window.location.href = "login.html";

        return false;
    }

    return true;

}
