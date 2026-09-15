const SUPABASE_URL = "https://wjsxpywxwjordtzzjrue.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_g61gG7QXf9nZr9u0gFjGvg_Kn4jIM_n";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// LOGIN
const loginForm = document.getElementById("login-form");

if (loginForm) {

    loginForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const message = document.getElementById("login-message");

        message.textContent = "Logging in...";

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {

            message.textContent = "Login failed. Check your email and password.";

            console.error(error);

            return;
        }

        window.location.href = "index.html";
    });
}
