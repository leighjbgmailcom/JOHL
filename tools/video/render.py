"""Renders a Rinkside Report Reel (1080x1920, 30 fps) from a recap's MP3.

    python3 render.py config.json out.mp4

config.json:
{
  "audio": "recaps/audio/2026-11-01.mp3",
  "date_text": "Sunday, November 1",
  "title": "Six Leafs leads, four for KP...",
  "gap": 0.35,
  "segments": [
    {"start": 0.0, "end": 24.3, "text": "caption text as it should read",
     "board": ["LEAFS", "7", "HABS", "8", "FINAL", "SHOOTOUT"],   (optional)
     "finals": [["Habs", "8", "Leafs", "7", "SO"], ...]}           (optional)
  ]
}
Mouth movement comes from the loudness of the audio, frame by frame.
"""
import json, math, os, random, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(__file__))
import arnie
from arnie import W, H, font, NAVY_D, RED

FPS = 30
CAP_TOP, CAP_BOT = 1530, 1790


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def build_audio(cfg, work):
    parts, files = [], []
    run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", str(cfg["gap"]), f"{work}/gap.wav"])
    run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "0.6", f"{work}/lead.wav"])
    files.append(f"{work}/lead.wav")
    t = 0.6
    for i, seg in enumerate(cfg["segments"]):
        f = f"{work}/seg{i}.wav"
        run(["ffmpeg", "-y", "-ss", str(seg["start"]), "-to", str(seg["end"]), "-i", cfg["audio"],
             "-af", "afade=t=in:d=0.03,areverse,afade=t=in:d=0.08,areverse", "-ar", "44100", "-ac", "1", f])
        dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))
        parts.append((t, t + dur, seg))
        files.append(f)
        files.append(f"{work}/gap.wav")
        t += dur + cfg["gap"]
    files.append(f"{work}/lead.wav")
    t += 0.6 - cfg["gap"] + 1.6  # hold the last frame a moment
    with open(f"{work}/list.txt", "w") as fh:
        for f in files:
            fh.write(f"file '{f}'\n")
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", f"{work}/list.txt", "-af", "apad", "-t", f"{t:.3f}",
         "-ar", "44100", "-ac", "1", f"{work}/all.wav"])
    return f"{work}/all.wav", parts, t


def loudness(wav, n_frames):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", wav, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"])
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    per = 16000 // FPS
    vals = []
    for i in range(n_frames):
        chunk = a[i * per:(i + 1) * per]
        vals.append(float(np.sqrt(np.mean(chunk ** 2))) if len(chunk) else 0.0)
    v = np.array(vals)
    ref = np.percentile(v[v > 0.005], 92) if (v > 0.005).any() else 1
    return np.clip(v / ref, 0, 1.2)


def mouth_levels(v):
    lv = []
    for x in v:
        lv.append(0 if x < 0.10 else 1 if x < 0.28 else 2 if x < 0.5 else 3 if x < 0.75 else 4)
    # never jump more than two shapes in one frame; snap shut quickly in pauses
    out = []
    prev = 0
    for x in lv:
        if x > prev + 2:
            x = prev + 2
        out.append(x)
        prev = x
    return out


def caption_chunks(parts):
    """Words of each segment, timed by length, grouped into 2-line captions."""
    chunks = []
    for t0, t1, seg in parts:
        words = seg["text"].split()
        weights = [len(w) + 1 + (5 if w[-1] in ",;:" else 10 if w[-1] in ".!?" else 0) for w in words]
        total = sum(weights)
        times, acc = [], t0
        for w in weights:
            times.append(acc)
            acc += (t1 - t0) * w / total
        group, gstart = [], None
        for i, w in enumerate(words):
            if gstart is None:
                gstart = times[i]
            group.append(w)
            text = " ".join(group)
            end_here = w[-1] in ".!?" or len(text) > 44 or (w[-1] in ",;:" and len(text) > 24)
            if end_here or i == len(words) - 1:
                gend = times[i + 1] if i + 1 < len(words) else t1
                chunks.append((gstart, gend, text))
                group, gstart = [], None
    return chunks


def wrap(d, text, f, width):
    lines, cur = [], ""
    for w in text.split():
        trial = (cur + " " + w).strip()
        if d.textlength(trial, font=f) <= width or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


def balanced(d, text, f, width):
    """One line if it fits, otherwise two lines split as evenly as possible."""
    if d.textlength(text, font=f) <= width:
        return [text]
    words = text.split()
    best = None
    for k in range(1, len(words)):
        a, b = " ".join(words[:k]), " ".join(words[k:])
        wa, wb = d.textlength(a, font=f), d.textlength(b, font=f)
        if max(wa, wb) <= width and (best is None or max(wa, wb) < best[0]):
            best = (max(wa, wb), [a, b])
    return best[1] if best else wrap(d, text, f, width)


def caption_img(text):
    img = Image.new("RGBA", (W, CAP_BOT - CAP_TOP), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = font("ExtraBold", 54)
    lines = balanced(d, text, f, W - 120)
    lh = 70
    y = (img.height - lh * len(lines)) / 2
    for ln in lines:
        d.text((W / 2, y + lh / 2), ln, font=f, fill=(255, 255, 255), anchor="mm", stroke_width=4, stroke_fill=(0, 0, 0))
        y += lh
    return img


def title_img(title):
    img = Image.new("RGBA", (W, 130), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    size = 38
    while size > 30 and d.textlength(title, font=font("Bold", size)) > W - 140:
        size -= 1
    f = font("Bold", size)
    lines = balanced(d, title, f, W - 140)[:2]
    d.rounded_rectangle((40, 6, W - 40, 124), radius=14, fill=RED)
    y = 65 - (len(lines) - 1) * 22
    for ln in lines:
        d.text((W / 2, y), ln, font=f, fill=(255, 255, 255), anchor="mm")
        y += 44
    return img


def finals_img(finals):
    fb, fs, fn = font("Bold", 27), font("Black", 29), font("SemiBold", 17)
    img = Image.new("RGBA", (356, 76 + 64 * len(finals)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, img.width - 1, img.height - 1), radius=16, fill=(7, 22, 38, 255), outline=(200, 16, 46), width=4)
    d.text((img.width / 2, 36), "FINALS", font=font("Black", 30), fill=(255, 255, 255), anchor="mm")
    y = 100
    for a, sa, b, sb, note in finals:
        bits = [(a + " ", fb, (255, 255, 255)), (sa, fs, (255, 200, 60)), ("  ", fb, None), (b + " ", fb, (255, 255, 255)), (sb, fs, (255, 200, 60))]
        if note:
            bits.append(("  " + note, fn, (159, 182, 204)))
        wtot = sum(d.textlength(tx, font=f) for tx, f, _ in bits)
        x = (img.width - wtot) / 2
        for tx, f, c in bits:
            if c:
                d.text((x, y), tx, font=f, fill=c, anchor="lm")
            x += d.textlength(tx, font=f)
        y += 64
    return img


def main(cfg_path, out):
    cfg = json.load(open(cfg_path))
    work = tempfile.mkdtemp()
    wav, parts, total = build_audio(cfg, work)
    n = int(math.ceil(total * FPS))
    mouths = mouth_levels(loudness(wav, n))
    chunks = caption_chunks(parts)

    print("drawing layers...", flush=True)
    boards = {}
    for _, _, seg in parts:
        key = tuple(seg.get("board") or ())
        if key not in boards:
            boards[key] = arnie.down(arnie.base_layer(cfg["date_text"], list(key) or None))
    fr = arnie.canvas(); arnie.front(fr); front = arnie.down(fr)
    ft = arnie.canvas(); arnie.footer(ft, cfg["date_text"]); foot = arnie.down(ft)
    title = title_img(cfg["title"])
    heads = {}
    box = (300, 300, 780, 900)  # where the head can be
    for m in range(5):
        for e in (True, False):
            for lk in (-1, 0, 1):
                heads[(m, e, lk)] = arnie.head(m, e, lk).crop(box)
    for k in boards:
        b = boards[k]
        b.alpha_composite(foot)
        b.alpha_composite(title, (0, 1410))
    cap_cache = {}
    fin_cache = {}

    # blinks and glances
    rnd = random.Random(3)
    blink = np.zeros(n, bool)
    f = int(1.5 * FPS)
    while f < n:
        blink[f:f + 4] = True
        f += int(rnd.uniform(2.4, 5.0) * FPS)
    look = np.zeros(n, int)
    f = 0
    while f < n:
        span = int(rnd.uniform(2.5, 5.5) * FPS)
        look[f:f + span] = rnd.choice([0, 0, 0, -1, 1])
        f += span

    stills = [int(float(x) * FPS) for x in os.environ.get("STILLS", "").split(",") if x]
    tmp = out[:-4] + ".tmp.mp4"
    enc = None if stills else subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", "-i", wav, "-map", "0:v", "-map", "1:a",
                            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
                            "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-shortest", "-movflags", "+faststart", tmp],
                           stdin=subprocess.PIPE)
    print(f"rendering {n} frames...", flush=True)
    vol = loudness(wav, n)
    smooth = np.convolve(vol, np.ones(6) / 6, mode="same")
    for i in (stills or range(n)):
        t = i / FPS
        seg = parts[-1][2]
        for t0, t1, sg in parts:
            if t < t1 + cfg["gap"]:
                seg = sg
                break
        frame = boards[tuple(seg.get("board") or ())].copy()
        dx = int(round(3 * math.sin(t * 0.8)))
        dy = int(round(2 * math.sin(t * 2.0) - 5 * smooth[i]))
        frame.alpha_composite(heads[(mouths[i], not blink[i], int(look[i]))], (box[0] + dx, box[1] + dy))
        frame.alpha_composite(front)
        if seg.get("finals"):
            key = json.dumps(seg["finals"])
            if key not in fin_cache:
                fin_cache[key] = finals_img(seg["finals"])
            fi = fin_cache[key]
            # slides in from the left over the first half second of the segment
            idx = next(j for j, p in enumerate(parts) if p[2] is seg)
            while idx > 0 and parts[idx - 1][2].get("finals"):
                idx -= 1
            t0 = parts[idx][0]
            k = min(1, max(0, (t - t0) / 0.5))
            k = 1 - (1 - k) ** 3
            frame.alpha_composite(fi, (int(-fi.width + (fi.width + 14) * k), 290))
        for c0, c1, txt in chunks:
            if c0 <= t < c1:
                if txt not in cap_cache:
                    cap_cache[txt] = caption_img(txt)
                frame.alpha_composite(cap_cache[txt], (0, CAP_TOP))
                break
        if stills:
            frame.convert("RGB").save(f"/tmp/still_{i / FPS:.1f}.png")
            continue
        enc.stdin.write(frame.convert("RGB").tobytes())
        if i % 300 == 0:
            print(f"  {i}/{n}", flush=True)
    if stills:
        return
    enc.stdin.close()
    if enc.wait() != 0:
        sys.exit("ffmpeg failed")
    os.replace(tmp, out)
    print("wrote", out, f"{total:.1f}s")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
