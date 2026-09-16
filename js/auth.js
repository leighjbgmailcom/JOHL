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
// LOGIN
// =====================================================

const loginForm = document.getElementById("login-form");

if (loginForm) {

loginForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const message = document.getElementById("login-message");

    message.textContent = "Logging in...";

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {

        console.error(error);

        message.textContent =
            "Login failed. Please check your email and password.";

        return;
    }

    window.location.href = "index.html";
});

}


// =====================================================
// CHECK LOGIN
// =====================================================

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

        window.location.href = "login.html";

        return false;
    }

    return true;

}


// =====================================================
// CHECK ADMIN
// For pages that require not just login, but the
// current user's profiles.is_admin flag to be true.
// Call AFTER checkLogin() (or instead of it, since this
// also verifies a session exists first).
// =====================================================

async function checkAdmin() {

    const isLoggedIn = await checkLogin();

    if (!isLoggedIn) {
        return false;
    }

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    const { data: profile, error } =
        await supabaseClient
            .from("profiles")
            .select("is_admin")
            .eq("id", session.user.id)
            .single();

    if (error || !profile || !profile.is_admin) {

        console.warn("Admin access denied.");

        window.location.href = "index.html";

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

window.location.href = "login.html";

}


// =====================================================
// FORGOT PASSWORD
// =====================================================

const forgotPasswordForm =
document.getElementById("forgot-password-form");

if (forgotPasswordForm) {

forgotPasswordForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const email =
        document.getElementById("reset-email").value.trim();

    const message =
        document.getElementById("reset-message");

    message.textContent = "Sending reset email...";

    const { error } =
        await supabaseClient.auth.resetPasswordForEmail(email, {

            redirectTo:
                "https://jordanohl.ca/update-password.html"

        });

    if (error) {

        console.error(error);

        message.textContent =
            "There was a problem sending the reset email.";

        return;
    }

    message.textContent =
        "Check your email for a password reset link.";
});

}


// =====================================================
// PASSWORD RECOVERY
// =====================================================

supabaseClient.auth.onAuthStateChange(
async function(event, session) {

    if (event === "PASSWORD_RECOVERY") {

        console.log("Password recovery session detected.");

        const passwordForm =
            document.getElementById("update-password-form");

        if (!passwordForm) {
            return;
        }

        passwordForm.addEventListener(
            "submit",
            async function(event) {

                event.preventDefault();

                const newPassword =
                    document.getElementById("new-password").value;

                const confirmPassword =
                    document.getElementById("confirm-password").value;

                const message =
                    document.getElementById("password-message");

                if (newPassword !== confirmPassword) {

                    message.textContent =
                        "The passwords do not match.";

                    return;
                }

                if (newPassword.length < 6) {

                    message.textContent =
                        "Your password must be at least 6 characters.";

                    return;
                }

                message.textContent =
                    "Updating your password...";

                const { error } =
                    await supabaseClient.auth.updateUser({

                        password: newPassword

                    });

                if (error) {

                    console.error(error);

                    message.textContent =
                        "There was a problem updating your password.";

                    return;
                }

                message.textContent =
                    "Password updated successfully!";

                setTimeout(function() {

                    window.location.href = "login.html";

                }, 2000);

            }
        );
    }
}

);
