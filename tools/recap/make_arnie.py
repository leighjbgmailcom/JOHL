#!/usr/bin/env python3
"""Builds the data that animates Arnie for one recap.

    python3 tools/recap/make_arnie.py 2026-11-08

Reads, for that game date:
  - recaps/recaps.json          the recap's paragraphs (proper spellings) and audio file
  - recaps/audio/DATE.mp3       Arnie's recording
  - the league database         that night's games and goals (read-only, public key)

and writes recaps/arnie/DATE.json, which js/arnie-player.js uses to:
  - move Arnie's mouth with the loudness of his voice
  - show the words underneath as he says them
  - flip a notebook page at the start of every paragraph
  - run the scoreboard behind him: the clock ticks down through each game
    and the score changes when he says the scorer's name.

Needs python3, numpy and ffmpeg. Run it after the MP3 is made, and again
whenever the audio is re-recorded.
"""
import json, os, re, subprocess, sys, urllib.request, urllib.parse
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SUPABASE_URL = "https://wjsxpywxwjordtzzjrue.supabase.co"
# The site's public (publishable) key, the same one in js/supabase.js. It can only read.
SUPABASE_KEY = "sb_publishable_g61gG7QXf9nZr9u0gFjGvg_Kn4jIM_n"

BOARD_NAME = {"TML": "LEAFS", "CAN": "CANUCKS", "NOR": "NORDIQUES", "SEN": "SENATORS", "OIL": "OILERS", "MTL": "HABS"}
TEAM_WORDS = {
    "TML": ["leafs", "coldbreak"], "CAN": ["canucks", "keg"], "NOR": ["nordiques", "regatta", "regattasport"],
    "SEN": ["senators", "sens", "timbit"], "OIL": ["oilers", "dawson's"], "MTL": ["habs", "canadiens", "culp"],
}
PERIOD_LEN = 1200
FRAME = 0.04


def rest(table, query):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{query}"
    req = urllib.request.Request(url, headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def clock_secs(text):
    if not text:
        return None
    m, s = str(text).split(":")[:2]
    return int(m) * 60 + int(float(s))


def audio_envelope(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.int16).astype(float) / 32768
    n = int(8000 * FRAME)
    f = len(a) // n
    r = np.sqrt((a[:f * n].reshape(f, n) ** 2).mean(1))
    p = np.percentile(r, 95) or 1
    return [round(float(x), 2) for x in np.clip(r / p, 0, 1)], len(a) / 8000


def silences(path):
    out = subprocess.run(["ffmpeg", "-i", path, "-af", "silencedetect=noise=-35dB:d=0.35", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    return list(zip(starts, ends))


def paragraph_times(path, n, duration):
    """Start and end of each paragraph: the recording puts a pause between
    paragraphs that is longer than any pause inside one."""
    sil = silences(path)
    first = sil[0][1] if sil and sil[0][0] < 0.05 else 0.05
    last = sil[-1][0] if sil and sil[-1][1] >= duration - 0.05 else duration
    inner = [s for s in sil if s[0] > first + 0.5 and s[1] < last - 0.5]
    gaps = sorted(sorted(inner, key=lambda s: s[1] - s[0], reverse=True)[:n - 1])
    if len(gaps) < n - 1:   # fall back to an even split
        step = (last - first) / n
        return [(first + i * step, first + (i + 1) * step) for i in range(n)]
    starts = [first] + [g[1] for g in gaps]
    ends = [g[0] for g in gaps] + [last]
    return list(zip(starts, ends))


def is_assist(text, pos):
    """True when the name at pos is in a "from X and Y" assist list."""
    clause = re.split(r"[.;!?]", text[max(0, pos - 60):pos])[-1]
    m = None
    for m in re.finditer(r"\b(from|set up by|assisted by|assists? (from|to))\b", clause, re.I):
        pass
    if not m:
        return False
    between = clause[m.end():]
    return "," not in between and len(between.split()) <= 3


def word_re(name):
    return re.compile(r"(?<![A-Za-z])" + re.escape(name) + r"(?![A-Za-z])", re.I)


def main(date):
    recaps = json.load(open(os.path.join(ROOT, "recaps", "recaps.json")))["recaps"]
    recap = next((r for r in recaps if r["date"] == date), None)
    if not recap:
        sys.exit(f"No entry for {date} in recaps/recaps.json")
    audio = os.path.join(ROOT, recap["audio"].split("?")[0])
    paras = [re.sub(r"\s+", " ", p).strip() for p in recap.get("text", []) if p.strip()]
    script_path = os.path.join(ROOT, "recaps", "scripts", f"{date}.txt")
    if not paras and os.path.exists(script_path):
        paras = [re.sub(r"\s+", " ", p).strip() for p in open(script_path).read().split("\n\n") if p.strip()]

    env, duration = audio_envelope(audio)
    ptimes = paragraph_times(audio, len(paras), duration)

    def at(pi, pos):
        s, e = ptimes[pi]
        return round(s + pos / max(1, len(paras[pi])) * (e - s), 2)

    # Captions: a sentence or two at a time.
    caps = []
    for pi, p in enumerate(paras):
        sents = re.split(r"(?<=[.!?])\s+", p)
        cur, cstart, pos = "", 0, 0
        for s in sents:
            spos = p.find(s, pos)
            pos = spos + len(s)
            if cur and len(cur) + len(s) > 110:
                caps.append([at(pi, cstart), cur])
                cur, cstart = s, spos
            else:
                if not cur:
                    cstart = spos
                cur = (cur + " " + s).strip()
        if cur:
            caps.append([at(pi, cstart), cur])

    # The night's games and goals.
    teams = {t["id"]: t["code"] for t in rest("teams", "select=id,code")}
    games = rest("games", "select=id,game_time,home_team_id,away_team_id,status,no_games"
                 f"&game_date=eq.{date}&order=game_time")
    games = [g for g in games if not g.get("no_games")]
    ids = ",".join(str(g["id"]) for g in games)
    goals = rest("game_goals", f"select=game_id,team_id,period,game_time,scorer_id&game_id=in.({ids})") if ids else []
    players = {p["id"]: p for p in rest("players", "select=id,team_id,first_name,last_name,nickname")}

    def names_for(pid):
        p = players.get(pid) or {}
        out = []
        if p.get("nickname"):
            out.append(p["nickname"])
        if p.get("last_name"):
            out.append(p["last_name"])
        return out

    # Which paragraphs are about which game: count the team names and the
    # names of the players on each team, then keep the games in order.
    def team_terms(team_id):
        code = teams.get(team_id, "")
        terms = list(TEAM_WORDS.get(code, []))
        for p in players.values():
            if p.get("team_id") == team_id:
                terms += [n for n in (p.get("nickname"), p.get("last_name")) if n and len(n) > 2]
        return [word_re(t) for t in set(terms)]

    gterms = [team_terms(g["home_team_id"]) + team_terms(g["away_team_id"]) for g in games]
    G = len(games)
    score = [[sum(len(r.findall(p)) for r in gterms[g]) for g in range(G)] for p in paras]
    # dynamic programme over states -1 (intro), 0..G-1 (games), G (sign-off)
    NEG = -1e9
    P = len(paras)
    best = [[NEG] * (G + 2) for _ in range(P)]
    back = [[0] * (G + 2) for _ in range(P)]
    gain = lambda pi, st: (score[pi][st - 1] if 1 <= st <= G else 0.3 * (pi == 0 or pi == P - 1))
    for st in range(G + 2):
        best[0][st] = gain(0, st) if st <= 1 else NEG
    for pi in range(1, P):
        for st in range(G + 2):
            prev = max(range(st + 1), key=lambda s: best[pi - 1][s])
            # every game gets at least one paragraph: no skipping a game
            cands = [s for s in range(st + 1) if st - s <= 1]
            prev = max(cands, key=lambda s: best[pi - 1][s])
            best[pi][st] = best[pi - 1][prev] + gain(pi, st)
            back[pi][st] = prev
    st = max(range(G, G + 2), key=lambda s: best[P - 1][s])
    assign = [0] * P
    for pi in range(P - 1, -1, -1):
        assign[pi] = st - 1
        st = back[pi][st]

    kf = []
    board_games = []
    for gi, g in enumerate(games):
        home, away = g["home_team_id"], g["away_team_id"]
        board_games.append({"home": BOARD_NAME.get(teams.get(home), "HOME"), "guest": BOARD_NAME.get(teams.get(away), "GUEST")})
        mine = [pi for pi in range(P) if assign[pi] == gi]
        if not mine:
            continue
        seg0, seg1 = ptimes[mine[0]][0], ptimes[mine[-1]][1]
        text = " ".join(paras[pi] for pi in mine)
        offsets = []
        for pi in mine:
            offsets.append(sum(len(paras[q]) + 1 for q in mine if q < pi))

        def pos_time(pos):
            for pi, off in zip(mine, offsets):
                if pos < off + len(paras[pi]) + 1:
                    return at(pi, pos - off)
            return seg1

        gg = [x for x in goals if x["game_id"] == g["id"]]
        order = {"1": 0, "2": 1, "3": 2, "OT": 3, "SO": 4}

        def elapsed(x):
            per = str(x["period"])
            if per == "SO":
                return 3 * PERIOD_LEN + 1
            sec = clock_secs(x["game_time"]) or 0
            return order.get(per, 2) * PERIOD_LEN + (PERIOD_LEN - sec)
        gg.sort(key=lambda x: (order.get(str(x["period"]), 5), elapsed(x)))

        # Anchor each goal to the moment Arnie says the scorer's name
        # (skipping the "from So-and-so" assist mentions), in order.
        anchors = [(0.0, seg0)]
        cursor = 0
        prev_scorer = None
        times = []
        for x in gg:
            found = None
            for n in names_for(x["scorer_id"]):
                for m in word_re(n).finditer(text, cursor):
                    if is_assist(text, m.start()):
                        continue
                    if found is None or m.start() < found.start():
                        found = m
                    break
            if found:
                t = pos_time(found.start())
                # "scored twice" is one mention for two goals: don't chase a
                # stray mention of the same man much later on
                same = prev_scorer == x["scorer_id"] and t - anchors[-1][1] > 12
                if t > anchors[-1][1] and not same:
                    cursor = found.end()
                    anchors.append((elapsed(x), t))
            prev_scorer = x["scorer_id"]
            times.append(None)
        went_so = any(str(x["period"]) == "SO" for x in gg)
        end_e = 3 * PERIOD_LEN + (1 if went_so else 0)
        if anchors[-1][0] < end_e:
            # once the last goal he names is in, the rest of the game goes by quickly
            left = sum(1 for x in gg if elapsed(x) > anchors[-1][0])
            end_t = min(seg1, anchors[-1][1] + 4 + 3 * left) if len(anchors) > 1 else seg1
            anchors.append((end_e, max(end_t, anchors[-1][1] + 0.5)))
        anchors.sort()
        AE = np.array([a[0] for a in anchors], float)
        AT = np.maximum.accumulate(np.array([a[1] for a in anchors], float))
        T = lambda e: round(float(np.interp(e, AE, AT)), 2)

        h = a = 0
        events = []
        for p in range(3):
            events.append((p * PERIOD_LEN + 0.001, str(p + 1), PERIOD_LEN, None))
            for x in gg:
                if str(x["period"]) == str(p + 1) or (p == 2 and str(x["period"]) == "OT"):
                    events.append((elapsed(x), str(p + 1), clock_secs(x["game_time"]) or 0, x))
            events.append(((p + 1) * PERIOD_LEN - 0.001, str(p + 1), 0, None))
        for x in gg:
            if str(x["period"]) == "SO":
                events.append((elapsed(x), "SO", 0, x))
        events.sort(key=lambda e: e[0])
        last_t = -1
        for i, (e, per, clk, x) in enumerate(events):
            if x is not None:
                if x["team_id"] == home:
                    h += 1
                else:
                    a += 1
            t = max(T(e), last_t + 0.02)
            last_t = t
            final = (i == len(events) - 1)
            name = (names_for(x["scorer_id"]) or ["GOAL"])[0].upper() if x else None
            kf.append({"t": round(t, 2), "g": gi, "per": per, "clk": int(clk), "h": h, "a": a, "goal": name, "final": final})

    out = {"date": date, "caps": caps, "kf": kf, "games": board_games,
           "flips": [round(s - 0.2, 2) for s, _ in ptimes[1:]], "env": env}
    path = os.path.join(ROOT, "recaps", "arnie", f"{date}.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    goals_on_board = sum(1 for k in kf if k["goal"])
    print(f"Wrote {os.path.relpath(path, ROOT)}: {len(paras)} paragraphs, {len(games)} games, "
          f"{goals_on_board} goals on the scoreboard, games by paragraph {assign}")


if __name__ == "__main__":
    if len(sys.argv) != 2 or not re.match(r"^\d{4}-\d\d-\d\d$", sys.argv[1]):
        sys.exit("usage: make_arnie.py YYYY-MM-DD")
    main(sys.argv[1])
