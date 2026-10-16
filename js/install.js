/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   "ADD TO HOME SCREEN" BUTTON

   - Registers the service worker (sw.js) so phones treat the site
     as installable.
   - Android / Chrome / Edge: shows a button that opens the phone's
     own "Install app" prompt.
   - iPhone / iPad: Apple doesn't allow a one-tap install, so the
     button opens short instructions (Share → Add to Home Screen).
   - Hidden once the site is already running from the home screen,
     and for 3 weeks after someone taps the ×.
   - Never shown on the timekeeper's score sheet, so it can't get in
     the way during a game.
   ========================================= */

(function () {

    const DISMISS_KEY = "johl-install-dismissed";
    const DISMISS_DAYS = 21;
    const ICON = "images/icons/icon-192.png";

    let deferredPrompt = null;

    // -------------------------------------------------
    // SERVICE WORKER
    // -------------------------------------------------

    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("sw.js").catch(error =>
                console.warn("Service worker not registered:", error)
            );
        });
    }

    // -------------------------------------------------
    // WHEN TO SHOW
    // -------------------------------------------------

    const page = window.location.pathname.split("/").pop() || "index.html";

    const isInstalled =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

    const isIOS =
        /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    function recentlyDismissed() {
        try {
            const at = Number(localStorage.getItem(DISMISS_KEY));
            return at && (Date.now() - at) < DISMISS_DAYS * 86400000;
        } catch (e) {
            return false;
        }
    }

    function rememberDismiss() {
        try {
            localStorage.setItem(DISMISS_KEY, String(Date.now()));
        } catch (e) { /* private browsing — just hide for now */ }
    }

    function shouldShow() {
        return !isInstalled && page !== "sheet.html" && !recentlyDismissed();
    }

    // -------------------------------------------------
    // STYLES
    // -------------------------------------------------

    function addStyles() {
        if (document.getElementById("johl-install-styles")) return;

        const style = document.createElement("style");
        style.id = "johl-install-styles";
        style.textContent = `
            .johl-install {
                position: fixed;
                right: 16px;
                bottom: calc(16px + env(safe-area-inset-bottom, 0px));
                z-index: 900;
                display: flex;
                align-items: center;
                background: #071a2b;
                border: 2px solid #c8102e;
                border-radius: 999px;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
                font-family: Arial, Helvetica, sans-serif;
                animation: johl-install-in 0.3s ease-out;
            }
            @keyframes johl-install-in {
                from { transform: translateY(20px); opacity: 0; }
                to   { transform: translateY(0);    opacity: 1; }
            }
            .johl-install-go {
                display: flex;
                align-items: center;
                gap: 10px;
                background: none;
                border: 0;
                color: #fff;
                font: bold 15px Arial, Helvetica, sans-serif;
                padding: 6px 4px 6px 6px;
                cursor: pointer;
            }
            .johl-install-go img {
                width: 34px;
                height: 34px;
                border-radius: 50%;
                object-fit: cover;
            }
            .johl-install-x {
                background: none;
                border: 0;
                color: rgba(255, 255, 255, 0.6);
                font-size: 20px;
                line-height: 1;
                padding: 8px 14px 8px 10px;
                cursor: pointer;
            }
            .johl-install-x:hover { color: #fff; }

            .johl-ios-backdrop {
                position: fixed;
                inset: 0;
                z-index: 1000;
                background: rgba(0, 0, 0, 0.55);
                display: flex;
                align-items: flex-end;
                justify-content: center;
            }
            .johl-ios-sheet {
                background: #fff;
                color: #17212b;
                width: 100%;
                max-width: 440px;
                border-radius: 14px 14px 0 0;
                padding: 22px 22px calc(26px + env(safe-area-inset-bottom, 0px));
                font-family: Arial, Helvetica, sans-serif;
                animation: johl-install-in 0.25s ease-out;
            }
            .johl-ios-head {
                display: flex;
                align-items: center;
                gap: 14px;
                margin-bottom: 18px;
            }
            .johl-ios-head img {
                width: 56px;
                height: 56px;
                border-radius: 12px;
            }
            .johl-ios-head strong { display: block; font-size: 17px; }
            .johl-ios-head span { display: block; font-size: 13px; line-height: 1.35; color: #5a6672; }
            .johl-ios-sheet ol {
                margin: 0 0 20px 20px;
                font-size: 16px;
                line-height: 1.5;
            }
            .johl-ios-sheet li { margin-bottom: 10px; }
            .johl-ios-sheet svg {
                width: 18px;
                height: 18px;
                vertical-align: -3px;
                color: #007aff;
            }
            .johl-ios-done {
                width: 100%;
                background: #c8102e;
                color: #fff;
                border: 0;
                border-radius: 4px;
                padding: 13px;
                font: bold 15px Arial, Helvetica, sans-serif;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }

    // -------------------------------------------------
    // THE BUTTON
    // -------------------------------------------------

    function showButton() {
        if (!shouldShow() || document.querySelector(".johl-install")) return;

        addStyles();

        const wrap = document.createElement("div");
        wrap.className = "johl-install";
        wrap.innerHTML = `
            <button class="johl-install-go" type="button">
                <img src="${ICON}" alt="">
                <span>Add to Home Screen</span>
            </button>
            <button class="johl-install-x" type="button" aria-label="Not now">&times;</button>
        `;

        wrap.querySelector(".johl-install-go").addEventListener("click", onInstallClick);

        wrap.querySelector(".johl-install-x").addEventListener("click", () => {
            rememberDismiss();
            hideButton();
        });

        document.body.appendChild(wrap);
    }

    function hideButton() {
        const wrap = document.querySelector(".johl-install");
        if (wrap) wrap.remove();
    }

    async function onInstallClick() {

        // Android / Chrome / Edge — the phone's own install prompt
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            deferredPrompt = null;
            hideButton();
            if (choice.outcome !== "accepted") rememberDismiss();
            return;
        }

        // iPhone / iPad — show how to do it
        if (isIOS) {
            showIOSInstructions();
        }
    }

    // -------------------------------------------------
    // IPHONE / IPAD INSTRUCTIONS
    // -------------------------------------------------

    const SHARE_ICON = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-label="Share">
            <path d="M12 3v12"/><path d="M8 7l4-4 4 4"/>
            <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/>
        </svg>`;

    const ADD_ICON = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" aria-label="Add">
            <rect x="3" y="3" width="18" height="18" rx="4"/>
            <path d="M12 8v8"/><path d="M8 12h8"/>
        </svg>`;

    function showIOSInstructions() {
        addStyles();

        const backdrop = document.createElement("div");
        backdrop.className = "johl-ios-backdrop";
        backdrop.innerHTML = `
            <div class="johl-ios-sheet" role="dialog" aria-label="Add JOHL to your home screen">
                <div class="johl-ios-head">
                    <img src="${ICON}" alt="">
                    <div>
                        <strong>Add JOHL to your Home Screen</strong>
                        <span>Opens like an app — one tap to scores and the schedule.</span>
                    </div>
                </div>
                <ol>
                    <li>Tap the <b>Share</b> button ${SHARE_ICON} in Safari's toolbar
                        (bottom of the screen on iPhone, top on iPad).</li>
                    <li>Scroll down and tap <b>Add to Home Screen</b> ${ADD_ICON}</li>
                    <li>Tap <b>Add</b> in the top corner.</li>
                </ol>
                <button class="johl-ios-done" type="button">Got it</button>
            </div>
        `;

        const close = () => backdrop.remove();
        backdrop.querySelector(".johl-ios-done").addEventListener("click", close);
        backdrop.addEventListener("click", e => { if (e.target === backdrop) close(); });

        document.body.appendChild(backdrop);
    }

    // -------------------------------------------------
    // WIRE IT UP
    // -------------------------------------------------

    // Chrome / Edge / Android fire this when the site can be installed
    window.addEventListener("beforeinstallprompt", event => {
        event.preventDefault();
        deferredPrompt = event;
        if (document.body) showButton();
        else document.addEventListener("DOMContentLoaded", showButton);
    });

    window.addEventListener("appinstalled", () => {
        deferredPrompt = null;
        hideButton();
    });

    // iPhone / iPad never fire beforeinstallprompt, so show it directly
    if (isIOS) {
        document.addEventListener("DOMContentLoaded", showButton);
    }

})();
