/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   SERVICE WORKER

   Exists so phones will offer "Install app" / "Add to Home Screen".

   It deliberately caches NOTHING. Every request goes straight to the
   network, so scores, schedules and new versions of the site always
   show up right away — no stale-cache problems.
   If the phone is offline, page loads get a small "you're offline"
   screen instead of the browser's error page.
   ========================================= */

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {

    // Only step in for page loads; everything else is left alone.
    if (event.request.mode !== "navigate") {
        return;
    }

    event.respondWith(
        fetch(event.request).catch(() =>
            new Response(
                '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
                '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
                '<title>JOHL — Offline</title></head>' +
                '<body style="margin:0;font-family:Arial,sans-serif;background:#071a2b;color:#fff;' +
                'display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px">' +
                '<div><h1 style="font-size:22px">You\'re offline</h1>' +
                '<p style="opacity:.8">Check your connection and try again.</p>' +
                '<button onclick="location.reload()" style="margin-top:12px;background:#c8102e;color:#fff;' +
                'border:0;border-radius:4px;padding:12px 20px;font-weight:bold;font-size:15px">Retry</button>' +
                '</div></body></html>',
                { headers: { "Content-Type": "text/html; charset=utf-8" } }
            )
        )
    );

});
