const SUPABASE_URL = "https://wjsxpywxwjordtzzjrue.supabase.co";
const SUPABASE_KEY = "sb_publishable_g61gG7QXf9nZr9u0gFjGvg_Kn4jIM_n";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

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


                // Check passwords match

                if (newPassword !== confirmPassword) {

                    message.textContent =
                        "The passwords do not match.";

                    return;
                }


                // Minimum password length

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


                // Give the user a moment to see the message

                setTimeout(function() {

                    window.location.href = "login.html";

                }, 2000);

            }
        );
    }
}


);

