/* =========================================
   JORDAN OLDTIMERS HOCKEY LEAGUE
   ARNIE ON CAMERA -- the Rinkside Report as a little animated show

   Replaces the plain audio player on the Recaps page and the home page.
   Arnie sits in row three at Jordan Arena and reads his report: his mouth
   follows his voice, he blinks, nods and flips his notebook, the words run
   underneath, and the scoreboard behind him plays each game out, clock
   ticking down, the score changing as he names the scorer. Out on the
   ice the iA Private Wealth resurfacer does laps, and a fella sleeps in
   the stands.

   The picture is recaps/arnie/scene/ (drawn once, the same every week).
   The week's timing is recaps/arnie/YYYY-MM-DD.json, made from the
   recording and the score sheets by tools/recap/make_arnie.py. A recap
   without one still gets a plain audio player.

       mountArniePlayer(element, recap)   // recap = an entry of recaps.json
   ========================================= */

const ARNIE_ASSET_VERSION = 3;
let ARNIE_ASSETS = null;
const ARNIE_PLAYERS = [];

function arnieLoadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
}

function arnieAssets() {
    if (!ARNIE_ASSETS) {
        const v = "?v=" + ARNIE_ASSET_VERSION;
        ARNIE_ASSETS = Promise.all([
            arnieLoadImage("recaps/arnie/scene/scene.webp" + v),
            arnieLoadImage("recaps/arnie/scene/front.webp" + v),
            arnieLoadImage("recaps/arnie/scene/resurfacer.webp" + v),
            document.fonts ? Promise.all([
                document.fonts.load("900 40px Orbitron"),
                document.fonts.load("700 16px Oswald"),
                document.fonts.load("700 18px Caveat")
            ]).catch(() => null) : null
        ]).then(([scene, front, sprite]) => ({ scene, front, sprite }));
    }
    return ARNIE_ASSETS;
}

// Arnie's Movember moustache, drawn over the picture in scene-image
// pixels, after the mouth so it moves with his head. Only on a recap
// whose recaps.json entry has "moustache": true (Nov 22, 2026).
function drawArnieMoustache(c) {
  c.save();
  c.beginPath();
  c.moveTo(651, 554);
  c.bezierCurveTo(662, 547, 681, 547, 693, 555);
  c.bezierCurveTo(700, 559, 703, 566, 701, 573);
  c.bezierCurveTo(693, 568, 684, 567, 674, 570);
  c.bezierCurveTo(664, 573, 656, 572, 651, 567);
  c.bezierCurveTo(645, 573, 634, 576, 624, 575);
  c.bezierCurveTo(615, 576, 609, 580, 603, 584);
  c.bezierCurveTo(601, 575, 606, 563, 616, 557);
  c.bezierCurveTo(628, 550, 642, 549, 651, 554);
  c.closePath();
  const g = c.createLinearGradient(0, 548, 0, 580);
  g.addColorStop(0, '#9c9893'); g.addColorStop(1, '#6f6b66');
  c.fillStyle = g; c.fill();
  c.lineJoin = 'round'; c.lineWidth = 3; c.strokeStyle = '#1b1b1b'; c.stroke();
  // a few whiskers
  c.lineWidth = 1.4; c.strokeStyle = 'rgba(40,38,36,.55)'; c.lineCap = 'round';
  const W = [[640,556,630,568],[632,557,620,571],[624,560,612,575],[646,558,640,569],
             [662,555,668,566],[671,553,679,565],[680,553,689,564],[656,557,659,567]];
  for (const [a,b,x,y] of W) { c.beginPath(); c.moveTo(a,b); c.quadraticCurveTo((a+x)/2+1,(b+y)/2-2,x,y); c.stroke(); }
  // highlight
  c.lineWidth = 1.6; c.strokeStyle = 'rgba(235,232,226,.55)';
  c.beginPath(); c.moveTo(620,560); c.quadraticCurveTo(634,553,646,555); c.stroke();
  c.beginPath(); c.moveTo(657,555); c.quadraticCurveTo(672,550,686,555); c.stroke();
  c.restore();
}

// All the drawing for one recap. Returns frame(now, t, speaking), which
// paints the whole picture onto the canvas for that moment.
function arnieEngine(canvas, data, assets, dateLabel, moustache) {
    const ENV = data.env || [];
    const CAPS = data.caps || [], KF = data.kf || [], GAMES = data.games || [], FLIPS = data.flips || [];
    const DATE_LABEL = dateLabel;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const F = document.createElement("canvas"); F.width = W; F.height = H; const fx = F.getContext("2d");
    const HB = {x:510, y:310, w:340, h:400};
    const HC = document.createElement("canvas"); HC.width = HB.w; HC.height = HB.h; const hx = HC.getContext("2d");
    const img = assets.scene, fgImg = assets.front, spr = assets.sprite;

    // Arnie's face (image pixels)
    const CUT_Y = 578, JAW = {x:598, y:578, w:108, h:56};
    const MOUTH = {cx:651, rx:28};
    const EYES = [{x:612,y:501,rx:16,ry:14},{x:674,y:496,rx:19,ry:15}];
    const SKIN = 'rgb(234,172,136)';
    const PIVOT = {x:670, y:672};
    const HEAD = {cx:668, cy:492, rx:142, ry:170};
    // notebook page and the hands holding it
    const PG = {tl:[410,722], tr:[562,712], bl:[466,940], br:[588,936]};
    const HANDS = [
      [[404,780],[425,774],[446,789],[456,810],[461,840],[456,863],[440,864],[419,851],[406,831],[399,800]],
      [[533,822],[539,811],[580,804],[611,809],[631,819],[641,855],[631,896],[600,901],[569,898],[544,888],[534,870],[531,845]]
    ];

    let open = 0, nextBlink = performance.now() + 2500, blinkUntil = 0;

    function level(t) { const i = Math.floor(t / 0.04); return (i < 0 || i >= ENV.length) ? 0 : ENV[i]; }
    function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
    function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
    function fitText(c, text, maxW, size, weight, family) {
      let s = size; c.font = `${weight} ${s}px ${family}`;
      while (c.measureText(text).width > maxW && s > 5) { s -= 0.5; c.font = `${weight} ${s}px ${family}`; }
    }

    function boardState(t) {
      if (!KF.length || t < KF[0].t) return null;
      let k = 0; while (k + 1 < KF.length && KF[k + 1].t <= t) k++;
      const a = KF[k], b = KF[k + 1];
      let clk = a.clk;
      if (b && b.g === a.g && b.per === a.per && !a.final) clk = a.clk + (b.clk - a.clk) * (t - a.t) / (b.t - a.t);
      let goal = null, side = null;
      for (let j = k; j >= 0 && KF[j].g === a.g; j--) {
        if (KF[j].goal) {
          if (t - KF[j].t < 3.5) { goal = KF[j].goal; const p = KF[j - 1]; side = (p && p.g === KF[j].g && KF[j].a > p.a) ? 'a' : 'h'; }
          break;
        }
      }
      return {g:a.g, per:a.per, clk, h:a.h, a:a.a, final:a.final, goal, side};
    }

    // live numbers painted into the scoreboard that hangs in the picture
    function drawBoard(c, t, now) {
      const s = boardState(t);
      const box = (x0, y0, x1, y1, col) => { c.fillStyle = col || '#0b0d10'; rr(c, x0, y0, x1 - x0, y1 - y0, 2); c.fill(); };
      const txt = (str, cx, cy, maxW, size, color, weight) => { c.fillStyle = color; fitText(c, str, maxW, size, weight || 800, 'Orbitron, monospace'); c.fillText(str, cx, cy); };
      c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
      box(732, 232, 776, 266); box(787, 232, 873, 269); box(882, 232, 928, 266);
      box(729, 276, 783, 291, '#2b2f36'); box(794, 276, 836, 291, '#2b2f36'); box(841, 276, 864, 291, '#2b2f36'); box(876, 276, 931, 291, '#2b2f36');
      box(731, 295, 781, 326); box(799, 295, 821, 326); box(837, 295, 859, 326); box(877, 295, 931, 326);
      const RED = '#ff3b30', AMB = '#ffb627', DIM = '#7d8796';
      if (!s) {
        txt('0', 754, 250, 40, 26, RED); txt('0', 905, 250, 40, 26, RED); txt('20:00', 830, 251, 80, 22, AMB);
        txt('HOME', 756, 284, 50, 8, '#fff', 700); txt('PERIOD', 815, 284, 38, 7, DIM, 700); txt('GM', 852.5, 284, 20, 7, DIM, 700); txt('GUEST', 903.5, 284, 50, 8, '#fff', 700);
        txt('JOHL', 756, 311, 46, 12, AMB); txt('1', 810, 311, 18, 20, AMB); txt('1', 848, 311, 18, 20, AMB); txt(DATE_LABEL, 904, 311, 50, 11, AMB);
      } else {
        const G = GAMES[s.g];
        const flash = s.goal && Math.floor(now / 230) % 2 === 0;
        txt(String(s.h), 754, 250, 40, 28, (s.side === 'h' && flash) ? '#fff' : RED);
        txt(String(s.a), 905, 250, 40, 28, (s.side === 'a' && flash) ? '#fff' : RED);
        if (s.final) txt('FINAL', 830, 251, 78, 20, AMB); else txt(fmt(s.clk), 830, 251, 80, 24, AMB);
        txt(G.home, 756, 284, 50, 8, '#fff', 700); txt(s.per === 'SO' ? 'SHOOTOUT' : 'PERIOD', 815, 284, 38, 7, DIM, 700);
        txt('GM', 852.5, 284, 20, 7, DIM, 700); txt(G.guest, 903.5, 284, 50, 8, '#fff', 700);
        txt(s.per === 'SO' ? 'S' : s.per, 810, 311, 18, 20, AMB); txt(String(s.g + 1), 848, 311, 18, 20, AMB);
        const hb = s.goal && s.side === 'h', ab = s.goal && s.side === 'a';
        txt(hb ? (flash ? 'GOAL!' : s.goal) : 'HOME', 756, 311, 46, hb ? 12 : 10, hb ? RED : DIM);
        txt(ab ? (flash ? 'GOAL!' : s.goal) : 'GUEST', 904, 311, 50, ab ? 12 : 10, ab ? RED : DIM);
      }
      c.restore();
    }

    // The fan asleep in the stands: a different fella each week, in the
    // colours of the night's biggest loser (data.sleeper from make_arnie.py).
    const SLEEP_TEAMS = {
      TML: ['#0b2d6b', '#ffffff'], CAN: ['#0b6b45', '#0b2346'], NOR: ['#3d8fd9', '#ffffff'],
      SEN: ['#c8102e', '#1b1b1b'], OIL: ['#0b2346', '#f26b21'], MTL: ['#af1e2d', '#1c2f73'],
    };
    const SL = (() => {
      const S = data.sleeper || {team: 'TML', seed: 1};
      let k = (S.seed || 1) % 2147483647;
      const r = () => (k = (k * 16807) % 2147483647) / 2147483647;
      const hair = ['#3b2a1a', '#8a5a2b', '#9a9a9a', '#d8c27a', '#1b1b1b'];
      return {
        col: SLEEP_TEAMS[S.team] || SLEEP_TEAMS.TML,
        cx: 112 + Math.floor(r() * 28), lean: r() < 0.5 ? -1 : 1,
        hat: ['toque', 'cap', 'none'][Math.floor(r() * 3)],
        hair: hair[Math.floor(r() * hair.length)],
        prop: ['finger', 'popcorn', 'coffee', 'none'][Math.floor(r() * 4)],
        pants: ['#3b4a63', '#4a4a4a', '#6b5a3e'][Math.floor(r() * 3)],
        beard: r() < 0.35,
      };
    })();
    function drawSleeper(c, now) {
      const s = now / 1000, br = Math.sin(s * 1.3), {col, cx, lean} = SL;
      c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = '#1b1b1b'; c.lineWidth = 2.5;
      // prop on the bench beside him
      if (SL.prop === 'coffee') {
        c.fillStyle = '#f2efe6'; c.beginPath(); c.moveTo(cx - 34, 452); c.lineTo(cx - 22, 452); c.lineTo(cx - 24, 470); c.lineTo(cx - 32, 470); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#c8102e'; c.fillRect(cx - 33, 458, 10, 5);
      } else if (SL.prop === 'popcorn') {
        c.fillStyle = '#f5e08a'; c.beginPath(); c.arc(cx + 30, 449, 6, 0, Math.PI * 2); c.arc(cx + 37, 450, 5, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.moveTo(cx + 23, 452); c.lineTo(cx + 43, 452); c.lineTo(cx + 40, 470); c.lineTo(cx + 26, 470); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#c8102e'; c.fillRect(cx + 28, 453, 4, 16); c.fillRect(cx + 35, 453, 4, 16);
      }
      // sitting slumped: knees, legs and boots
      c.lineWidth = 3;
      c.fillStyle = SL.pants;
      c.beginPath(); c.roundRect(cx - 18, 474, 11, 19, 3); c.fill(); c.stroke();
      c.beginPath(); c.roundRect(cx + 7, 474, 11, 19, 3); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(cx - 11, 473, 11, 7, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(cx + 11, 473, 11, 7, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#2a2a2a';
      c.beginPath(); c.ellipse(cx - 15, 495, 9, 4, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(cx + 15, 495, 9, 4, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      // slumped body in a team sweater, breathing slowly
      const top = 442 - br * 0.8;
      c.fillStyle = col[0];
      c.beginPath(); c.moveTo(cx - 21, 470); c.quadraticCurveTo(cx - 23, top + 4, cx - 10 + lean * 4, top);
      c.quadraticCurveTo(cx + lean * 4, top - 3, cx + 10 + lean * 4, top);
      c.quadraticCurveTo(cx + 23, top + 4, cx + 21, 470); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = col[1]; c.fillRect(cx - 21, 460, 42, 4);
      // arms hanging, hands on the knees
      for (const side of [-1, 1]) {
        c.lineWidth = 11; c.strokeStyle = '#1b1b1b';
        c.beginPath(); c.moveTo(cx + side * 17, top + 6); c.quadraticCurveTo(cx + side * 22, 458, cx + side * 13, 468); c.stroke();
        c.lineWidth = 7; c.strokeStyle = col[0];
        c.beginPath(); c.moveTo(cx + side * 17, top + 6); c.quadraticCurveTo(cx + side * 22, 458, cx + side * 13, 468); c.stroke();
        c.lineWidth = 2.5; c.strokeStyle = '#1b1b1b'; c.fillStyle = 'rgb(232,184,150)';
        c.beginPath(); c.arc(cx + side * 12, 469, 3.6, 0, Math.PI * 2); c.fill(); c.stroke();
      }
      // head tipped over, mouth open
      const hx0 = cx + lean * 12, hy0 = top - 5;
      c.save(); c.translate(hx0, hy0); c.rotate(lean * 0.6 + br * 0.03);
      c.fillStyle = 'rgb(232,184,150)'; c.beginPath(); c.arc(0, 0, 11, 0, Math.PI * 2); c.fill(); c.stroke();
      if (SL.beard) { c.fillStyle = SL.hair; c.beginPath(); c.arc(0, 3, 10, 0.15 * Math.PI, 0.85 * Math.PI); c.fill(); }
      c.lineWidth = 1.8;
      c.beginPath(); c.arc(-4, 0, 2.6, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
      c.beginPath(); c.arc(4, 0, 2.6, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
      c.fillStyle = '#5a1f1f'; c.beginPath(); c.ellipse(0, 6, 2.2, 1.6 + br * 0.6, 0, 0, Math.PI * 2); c.fill();
      c.lineWidth = 2.5;
      if (SL.hat === 'toque') {
        c.fillStyle = col[0]; c.beginPath(); c.moveTo(-11, -2); c.quadraticCurveTo(-10, -16, 0, -16); c.quadraticCurveTo(10, -16, 11, -2); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = col[1]; c.fillRect(-11, -5, 22, 4); c.beginPath(); c.arc(0, -18, 3.5, 0, Math.PI * 2); c.fill(); c.stroke();
      } else if (SL.hat === 'cap') {
        c.fillStyle = col[0]; c.beginPath(); c.arc(0, -3, 11, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(lean * 9, -3); c.lineTo(lean * 19, -1); c.stroke();
      } else {
        c.fillStyle = SL.hair; c.beginPath(); c.arc(0, -2, 11, Math.PI * 1.05, Math.PI * 1.95); c.fill();
      }
      c.restore();
      // a foam finger slipping out of his hand
      if (SL.prop === 'finger') {
        c.save(); c.translate(cx + 20, 456); c.rotate(0.9);
        c.fillStyle = col[0]; c.beginPath(); c.roundRect(-6, -26, 12, 30, 4); c.fill(); c.stroke();
        c.beginPath(); c.roundRect(-4, -40, 7, 16, 3); c.fill(); c.stroke();
        c.restore();
      }
      c.restore();
      // floating Zzz
      for (let k = 0; k < 3; k++) {
        const p = (s * 0.42 + k / 3) % 1;
        c.globalAlpha = Math.sin(p * Math.PI);
        c.font = `700 ${13 + p * 15}px Oswald, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        const zx = hx0 + 14 + p * 30 + Math.sin(p * 6) * 3, zy = hy0 - 14 - p * 46;
        c.lineWidth = 3.5; c.strokeStyle = '#1c2a44'; c.strokeText('Z', zx, zy); c.fillStyle = '#fff'; c.fillText('Z', zx, zy);
      }
      c.globalAlpha = 1;
    }

    // Arnie's notebook: this week's notes, a page per paragraph (data.pages).
    const PAGES = data.pages || [];
    const PU = [PG.tr[0] - PG.tl[0], PG.tr[1] - PG.tl[1]], PV = [PG.bl[0] - PG.tl[0], PG.bl[1] - PG.tl[1]];
    const LW = 150, LH = 225;
    const SLOTS = [[30, 8, 140], [54, 8, 140], [78, 34, 136], [184, 10, 130], [208, 10, 136]];
    function pageIndex(t) { let i = 0; for (const f of FLIPS) if (t >= f) i++; return Math.min(i, PAGES.length - 1); }
    function drawPageContent(c, idx) {
      const lines = PAGES[idx];
      if (!lines) return;
      c.save();
      c.transform(PU[0] / LW, PU[1] / LW, PV[0] / LH, PV[1] / LH, PG.tl[0], PG.tl[1]);
      c.beginPath(); c.moveTo(2, 12); c.lineTo(148, 12); c.lineTo(148, 223); c.lineTo(2, 223); c.closePath();
      c.fillStyle = '#fbf8ee'; c.fill();
      c.strokeStyle = 'rgba(110,140,190,.28)'; c.lineWidth = 1;
      for (let y = 34; y < 222; y += 24) { c.beginPath(); c.moveTo(3, y + 2); c.lineTo(147, y + 2); c.stroke(); }
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      lines.slice(0, SLOTS.length).forEach((raw, i) => {
        const red = raw.startsWith('!'), text = red ? raw.slice(1) : raw;
        const [y, x0, x1] = SLOTS[i];
        let size = 19; c.font = `700 ${size}px Caveat, 'Comic Sans MS', cursive`;
        while (c.measureText(text).width > x1 - x0 && size > 11) { size -= 1; c.font = `700 ${size}px Caveat, 'Comic Sans MS', cursive`; }
        c.fillStyle = red ? '#c0272d' : (i === 0 ? '#14286e' : '#1f3fa8');
        c.fillText(text, x0, y);
        if (i === 0) { c.strokeStyle = c.fillStyle; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0, y + 3); c.lineTo(x0 + Math.min(c.measureText(text).width, x1 - x0), y + 3); c.stroke(); }
      });
      c.restore();
    }
    function drawHands(c) {
      for (const poly of HANDS) { c.save(); c.beginPath(); poly.forEach((pt, i) => i ? c.lineTo(...pt) : c.moveTo(...pt)); c.closePath(); c.clip(); c.drawImage(img, 0, 0); c.restore(); }
    }

    // the iA Private Wealth ice resurfacer: far side right to left, then back along the near side
    const SW = 235, SH = 142;
    const PASSES = [
      {t0:0,  t1:26, x0:990,  x1:-260, yb:697, sc:1.0,  dir:-1},
      {t0:29, t1:55, x0:-300, x1:650,  yb:768, sc:1.18, dir: 1},
    ];
    const CYCLE = 58;
    function trail(c, p, xNow, age) {
      const fade = Math.max(0, 1 - age / 14);
      if (fade <= 0) return;
      const back = p.dir < 0 ? xNow + SW * p.sc * 0.93 : xNow + SW * p.sc * 0.07;
      const from = p.dir < 0 ? Math.min(p.x0 + SW * p.sc, W) : Math.max(p.x0, -20);
      const a = Math.min(from, back), b = Math.max(from, back);
      if (b - a < 2) return;
      const hh = 13 * p.sc, y = p.yb - 22 * p.sc;
      const g = c.createLinearGradient(from, 0, back, 0);
      g.addColorStop(0, 'rgba(150,195,232,0)'); g.addColorStop(1, `rgba(150,195,232,${0.7 * fade})`);
      c.fillStyle = g; c.fillRect(a, y, b - a, hh);
      const g2 = c.createLinearGradient(from, 0, back, 0);
      g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(1, `rgba(255,255,255,${0.85 * fade})`);
      c.fillStyle = g2; c.fillRect(a, y + hh * 0.35, b - a, 2);
    }
    function drawDriver(c, now) {
      const b = Math.sin(now / 150) * 0.8;
      c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = '#1b1b1b'; c.lineWidth = 3;
      // torso in a work jacket with a reflective stripe
      c.fillStyle = '#e8762c'; c.beginPath(); c.moveTo(176, 22); c.lineTo(174, -6 + b); c.quadraticCurveTo(186, -14 + b, 199, -6 + b); c.lineTo(201, 22); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#f4f15a'; c.fillRect(175, 4 + b, 25, 4);
      // arm out to the wheel
      c.lineWidth = 6; c.strokeStyle = '#1b1b1b'; c.beginPath(); c.moveTo(178, 0 + b); c.lineTo(164, 9); c.stroke();
      c.lineWidth = 3.5; c.strokeStyle = '#e8762c'; c.beginPath(); c.moveTo(178, 0 + b); c.lineTo(164, 9); c.stroke();
      c.strokeStyle = '#1b1b1b'; c.lineWidth = 3; c.beginPath(); c.moveTo(156, 14); c.lineTo(168, 4); c.stroke();
      // face and blue helmet
      c.fillStyle = 'rgb(232,180,145)'; c.beginPath(); c.arc(185, -19 + b, 10, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#1f5fd1'; c.beginPath(); c.moveTo(173, -18 + b); c.quadraticCurveTo(173, -35 + b, 187, -35 + b); c.quadraticCurveTo(200, -34 + b, 198, -17 + b); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(182, -29 + b, 5, 2, -0.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(179, -18 + b, 1.6, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    function drawResurfacer(c, x, yb, sc, dir, now) {
      if (!spr.complete) return;
      const top = yb - SH * sc + Math.sin(now / 140) * 0.6;
      c.save();
      if (dir < 0) { c.translate(x, top); c.scale(sc, sc); }
      else { c.translate(x + SW * sc, top); c.scale(-sc, sc); }
      c.drawImage(spr, 0, 0);
      drawDriver(c, now);
      c.restore();
      // side lettering, never mirrored
      const lx = x + (dir < 0 ? 126 : SW - 126) * sc, ly = top + 49 * sc;
      c.save(); c.textBaseline = 'middle'; c.textAlign = 'left';
      c.translate(lx, ly); c.scale(sc, sc); if (dir > 0) c.transform(1, 0.13, 0, 1, 0, 0); else c.transform(1, -0.13, 0, 1, 0, 0);
      c.fillStyle = '#0a2a5e'; c.font = '800 19px Oswald, sans-serif'; c.fillText('iA', -34, 1);
      c.font = '700 9.5px Oswald, sans-serif'; c.fillText('PRIVATE', -12, -5); c.fillText('WEALTH', -12, 7);
      c.restore();
    }
    function drawIce(c, now) {
      const tc = (now / 1000) % CYCLE;
      for (const p of PASSES) {
        if (tc < p.t0) continue;
        const prog = Math.min(1, (tc - p.t0) / (p.t1 - p.t0));
        const x = p.x0 + (p.x1 - p.x0) * prog;
        trail(c, p, x, Math.max(0, tc - p.t1));
        if (tc <= p.t1) drawResurfacer(c, x, p.yb, p.sc, p.dir, now);
      }
    }

    function flipAmount(t) {
      for (const f of FLIPS) { const d = t - f; if (d >= 0 && d < 0.75) return d / 0.75; }
      return -1;
    }
    function pagePath(c) { c.beginPath(); c.moveTo(...PG.tl); c.lineTo(...PG.tr); c.lineTo(...PG.br); c.lineTo(...PG.bl); c.closePath(); }
    function drawFlip(c, p, sheet) {
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const s = 1 - 1.45 * e;
      const [ox, oy] = PG.tl, ux = PG.tr[0] - ox, uy = PG.tr[1] - oy, vx = PG.bl[0] - ox, vy = PG.bl[1] - oy;
      const det = ux * vy - uy * vx;
      const ia = vy / det, ib = -uy / det, ic = -vx / det, id = ux / det;
      const m11 = ux * ia + s * vx * ib, m12 = ux * ic + s * vx * id;
      const m21 = uy * ia + s * vy * ib, m22 = uy * ic + s * vy * id;
      const T = [m11, m21, m12, m22, ox - m11 * ox - m12 * oy, oy - m21 * ox - m22 * oy];
      c.save(); c.setTransform(...T); pagePath(c); c.clip();
      if (s > 0) { if (PAGES.length) { c.drawImage(img, 0, 0); drawPageContent(c, sheet); } else c.drawImage(img, 0, 0); c.fillStyle = `rgba(0,0,0,${0.25 * (1 - s)})`; c.fillRect(0, 0, W, H); }
      else {
        c.fillStyle = '#efe9da'; c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(120,140,170,.35)'; c.lineWidth = 2;
        for (let y = 760; y < 950; y += 20) { c.beginPath(); c.moveTo(380, y); c.lineTo(620, y - 10); c.stroke(); }
      }
      c.restore();
      c.save(); c.setTransform(...T); pagePath(c); c.restore(); c.strokeStyle = '#222'; c.lineWidth = 3; c.stroke();
      drawHands(c);
    }


    function frame(now, t, speaking) {
      const sec = now / 1000, live = speaking || t > 0;
      fx.drawImage(img, 0, 0);
      drawSleeper(fx, now);
      drawIce(fx, now);
      if (fgImg.complete) fx.drawImage(fgImg, 0, 0);
      drawBoard(fx, live ? t : -1, now);
      const fp = live ? flipAmount(t) : -1;
      const pg = PAGES.length ? (live ? pageIndex(t) : 0) : -1;
      if (pg >= 0) { drawPageContent(fx, pg); drawHands(fx); }
      if (fp >= 0) drawFlip(fx, fp, Math.max(0, pg - 1));
      let target = speaking ? Math.min(1, level(t) * 1.15) : 0;
      if (target < 0.12) target = 0;
      open += (target - open) * (target > open ? 0.55 : 0.3);
      const o = open * 8;
      if (o > 0.4) {
        const TB = [[612,572],[625,578.5],[640,581.5],[651,581],[665,578.5],[680,571.5],[690,565.5]];
        const cy = x => { for (let i = 0; i + 1 < TB.length; i++) { const [x0, y0] = TB[i], [x1, y1] = TB[i + 1]; if (x <= x1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0); } return TB[TB.length - 1][1]; };
        const kx = x => Math.pow(Math.max(0, Math.sin(Math.PI * (x - 612) / 78)), 0.7);
        const BOT = 634;
        // dark gap under the upper teeth
        fx.fillStyle = '#3a0f0f'; fx.beginPath();
        for (let x = 612; x <= 690; x += 2) fx.lineTo(x, cy(x) - 0.5);
        for (let x = 690; x >= 612; x -= 2) fx.lineTo(x, cy(x) + o * kx(x) + 0.5);
        fx.closePath(); fx.fill();
        // lower lip and chin slide down in thin strips, chin line stays put
        for (let x = 612; x < 690; x += 2) {
          const top = Math.ceil(cy(x + 1)) + 1, sh = BOT - top, d = o * kx(x + 1);
          if (sh > 2 && d > 0.2) fx.drawImage(img, x, top, 2, sh, x, top + d, 2, sh - d);
        }
      }
      if (moustache) drawArnieMoustache(fx);
      if (now > nextBlink) { blinkUntil = now + 120; nextBlink = now + 2200 + Math.random() * 3500; }
      if (now < blinkUntil) for (const e of EYES) {
        fx.fillStyle = SKIN; fx.beginPath(); fx.ellipse(e.x, e.y, e.rx, e.ry, 0, 0, Math.PI * 2); fx.fill();
        fx.strokeStyle = '#1b1b1b'; fx.lineWidth = 3;
        fx.beginPath(); fx.moveTo(e.x - e.rx + 2, e.y + 2); fx.quadraticCurveTo(e.x, e.y + 7, e.x + e.rx - 2, e.y + 2); fx.stroke();
      }
      ctx.drawImage(F, 0, 0);
      // only Arnie's head moves: a small tilt and nod
      const ang = (speaking ? (Math.sin(sec * 0.9) * 0.6 + Math.sin(sec * 2.3) * 0.25 + (fp >= 0 ? 0.6 * Math.sin(fp * Math.PI) : 0)) : Math.sin(sec * 0.6) * 0.25) * Math.PI / 180;
      const nod = speaking ? open * 1.4 + (fp >= 0 ? 2.5 * Math.sin(fp * Math.PI) : 0) : 0;
      hx.setTransform(1, 0, 0, 1, 0, 0); hx.globalCompositeOperation = 'source-over'; hx.clearRect(0, 0, HB.w, HB.h);
      hx.translate(PIVOT.x - HB.x, PIVOT.y - HB.y + nod); hx.rotate(ang); hx.translate(-PIVOT.x, -PIVOT.y);
      hx.drawImage(F, 0, 0);
      hx.setTransform(1, 0, 0, 1, 0, 0); hx.globalCompositeOperation = 'destination-in';
      hx.save(); hx.translate(HEAD.cx - HB.x, HEAD.cy - HB.y); hx.scale(1, HEAD.ry / HEAD.rx);
      const gr = hx.createRadialGradient(0, 0, 0, 0, 0, HEAD.rx); gr.addColorStop(0.8, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      hx.fillStyle = gr; hx.beginPath(); hx.arc(0, 0, HEAD.rx, 0, Math.PI * 2); hx.fill(); hx.restore();
      ctx.drawImage(HC, HB.x, HB.y);
      return live;
    }

    return frame;
}

function arnieClock(seconds) {
    const s = Math.max(0, Math.floor(seconds || 0));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

function arnieEsc(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function arnieDateLabel(date) {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const [, m, d] = String(date).split("-").map(Number);
    return m ? `${months[m - 1]} ${d}` : "";
}

// The plain audio player, for a recap that has no Arnie data (yet).
function arniePlainAudio(element, recap) {
    element.innerHTML = `<audio class="recap-audio" controls preload="metadata" src="${arnieEsc(recap.audio)}">
        Your browser can't play this here. <a href="${arnieEsc(recap.audio)}">Download the recap</a>.</audio>`;
    const audio = element.querySelector("audio");
    if (audio) audio.addEventListener("play", () => arnieCountPlay(audio, recap));
}

async function mountArniePlayer(element, recap) {
    if (!element || !recap) return;

    let data;
    try {
        const response = await fetch(`recaps/arnie/${encodeURIComponent(recap.date)}.json`, { cache: "no-cache" });
        if (!response.ok) throw new Error("HTTP " + response.status);
        data = await response.json();
    } catch (error) {
        arniePlainAudio(element, recap);
        return;
    }

    element.innerHTML = `
        <div class="arnie">
            <div class="arnie-stage">
                <canvas width="976" height="1073" aria-label="Arnie Jordan reading the Rinkside Report in the stands at Jordan Arena"></canvas>
                <div class="arnie-onair" hidden><i></i>ON AIR</div>
                <button type="button" class="arnie-big"><span>▶ Play Arnie's report</span></button>
            </div>
            <div class="arnie-caption">Tap play and Arnie will take it from row three.</div>
            <div class="arnie-controls">
                <button type="button" class="arnie-pp">▶ Play</button>
                <div class="arnie-bar" role="slider" aria-label="Position in the report"><div></div></div>
                <span class="arnie-time">0:00</span>
            </div>
            <audio preload="none" src="${arnieEsc(recap.audio)}"></audio>
        </div>
    `;

    const root = element.querySelector(".arnie");
    const canvas = root.querySelector("canvas");
    const audio = root.querySelector("audio");
    const big = root.querySelector(".arnie-big");
    const playPause = root.querySelector(".arnie-pp");
    const caption = root.querySelector(".arnie-caption");
    const fill = root.querySelector(".arnie-bar div");
    const timeText = root.querySelector(".arnie-time");
    const onAir = root.querySelector(".arnie-onair");
    const caps = data.caps || [];

    let frame = null, running = false, lastCap = -1;

    function paint(now) {
        if (!frame) return false;
        const t = audio.currentTime || 0;
        frame(now, t, !audio.paused);
        if (t > 0 || !audio.paused) {
            let k = 0;
            while (k + 1 < caps.length && caps[k + 1][0] <= t) k++;
            if (k !== lastCap && caps[k]) { lastCap = k; caption.textContent = caps[k][1]; }
        }
        const total = audio.duration || (data.env || []).length * 0.04;
        fill.style.width = total ? (Math.min(1, t / total) * 100) + "%" : "0";
        timeText.textContent = arnieClock(t) + (total ? " / " + arnieClock(total) : "");
        return true;
    }

    function loop(now) {
        paint(now);
        if (!audio.paused) requestAnimationFrame(loop);
        else running = false;
    }

    function start() {
        if (running) return;
        running = true;
        requestAnimationFrame(loop);
    }

    arnieAssets().then(assets => {
        frame = arnieEngine(canvas, data, assets, arnieDateLabel(recap.date), !!recap.moustache);
        paint(performance.now());
    }).catch(() => arniePlainAudio(element, recap));

    async function toggle() {
        try {
            if (audio.paused) {
                ARNIE_PLAYERS.forEach(other => { if (other !== audio && !other.paused) other.pause(); });
                await audio.play();
            } else {
                audio.pause();
            }
        } catch (error) {
            caption.textContent = "Tap play again to start the report.";
        }
    }

    audio.addEventListener("play", () => {
        arnieCountPlay(audio, recap);
        big.hidden = true; onAir.hidden = false; playPause.textContent = "❚❚ Pause"; start();
    });
    audio.addEventListener("pause", () => {
        onAir.hidden = true; playPause.textContent = "▶ Play";
        requestAnimationFrame(now => paint(now));
    });
    audio.addEventListener("ended", () => {
        big.hidden = false; big.querySelector("span").textContent = "↻ Play again";
        audio.currentTime = 0; lastCap = -1;
    });
    audio.addEventListener("seeked", () => { if (audio.paused) requestAnimationFrame(now => paint(now)); });
    audio.addEventListener("loadedmetadata", () => paint(performance.now()));

    big.addEventListener("click", toggle);
    playPause.addEventListener("click", toggle);
    root.querySelector(".arnie-bar").addEventListener("click", event => {
        const rect = event.currentTarget.getBoundingClientRect();
        const total = audio.duration || (data.env || []).length * 0.04;
        if (!total) return;
        audio.currentTime = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * total;
        lastCap = -1;
    });

    ARNIE_PLAYERS.push(audio);
}


// Counts the first press of play on a recap for the admin Traffic tab
// (johlTrack is in js/header.js).
function arnieCountPlay(audio, recap) {
    if (audio.dataset.counted) return;
    audio.dataset.counted = "1";
    if (typeof johlTrack === "function") johlTrack("play", recap && recap.date);
}
