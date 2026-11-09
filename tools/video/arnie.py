"""Draws the Rinkside Report scene: Arnie Jordan in row three at Jordan Arena.

Arnie is an original cartoon character: a pale fella about 55 with glasses,
a horseshoe moustache and sideburns, a JOHL toque, a puffy winter jacket and
grey wool fingerless gloves whose mitten flaps are folded back and held with
velcro. He has a coffee in one hand and his notebook in the other.

Everything is drawn at 2x and scaled down so the edges stay smooth.
Layers (all 1080x1920):
  base()            background + body           (static)
  head(mouth, eyes) the head, one per mouth/eye state (pasted with a bob)
  front()           collar, hands, coffee, notebook (static, over the head)
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math, random

W, H = 1080, 1920
S = 2  # supersample

FONT_DIR = "/usr/share/fonts/opentype/inter/"
def font(weight, size):
    return ImageFont.truetype(FONT_DIR + f"Inter-{weight}.otf", int(size))

# palette
NAVY = (11, 34, 57)
NAVY_D = (7, 22, 38)
RED = (200, 16, 46)
RED_D = (150, 10, 34)
RED_L = (226, 66, 84)
SKIN = (244, 218, 200)
SKIN_S = (228, 190, 168)
SKIN_D = (205, 160, 138)
CHEEK = (238, 160, 150)
HAIR = (150, 146, 142)
HAIR_L = (196, 194, 190)
STACHE = (138, 130, 124)
STACHE_L = (190, 186, 182)
WOOL = (138, 140, 146)
WOOL_D = (104, 106, 112)
WOOL_L = (170, 172, 178)
INK = (40, 30, 28)


def s(v):
    return [int(round(x * S)) for x in v] if isinstance(v, (list, tuple)) else int(round(v * S))


def pts(seq):
    return [(x * S, y * S) for x, y in seq]


def canvas(bg=(0, 0, 0, 0)):
    return Image.new("RGBA", (W * S, H * S), bg)


def down(img):
    return img.resize((W, H), Image.LANCZOS)


def ell(d, box, **kw):
    d.ellipse(s(box), **kw)


def rr(d, box, r, **kw):
    d.rounded_rectangle(s(box), radius=s(r), **kw)


def poly(d, p, **kw):
    d.polygon(pts(p), **kw)


def line(d, p, width, **kw):
    d.line(pts(p), width=s(width), joint="curve", **kw)


def bez(p0, p1, p2, p3=None, n=24):
    out = []
    for i in range(n + 1):
        t = i / n
        if p3 is None:
            x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
            y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
        else:
            x = (1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * p1[0] + 3 * (1 - t) * t * t * p2[0] + t ** 3 * p3[0]
            y = (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * p1[1] + 3 * (1 - t) * t * t * p2[1] + t ** 3 * p3[1]
        out.append((x, y))
    return out


# ---------------------------------------------------------------- layout
HEADER_H = 250
SCENE_TOP, SCENE_BOT = HEADER_H, 1390
CX = 540          # Arnie's centre line
HEAD_CY = 660     # centre of his face


# ---------------------------------------------------------------- background
def arena(img, board=None):
    """Jordan Arena as it looks from row three (from Leigh's photos): low
    white ceiling with cream arched beams and hanging lights, a white end
    wall with the flag, the red clock and the scoreboard, white boards with
    a red cap, glass on silver posts, grey bleachers with yellow steps."""
    board = board or ("HOME", "0", "VISITOR", "0", "20:00", "PERIOD 3")
    d = ImageDraw.Draw(img)
    # ceiling: off-white panels
    poly(d, [(0, SCENE_TOP), (W, SCENE_TOP), (W, 520), (0, 520)], fill=(232, 232, 226))
    for x in range(-40, W + 80, 120):
        line(d, [(x, SCENE_TOP), (x + 60, 520)], 2, fill=(214, 214, 206))
    # cream arched beams, getting smaller toward the far wall
    for i, (y, th) in enumerate([(300, 34), (372, 26), (428, 20), (470, 15), (500, 11)]):
        line(d, bez((-20, y + 10), (W / 2, y - 26 + i * 4), (W + 20, y + 10)), th, fill=(222, 214, 186))
        line(d, bez((-20, y + 10 + th * 0.4), (W / 2, y - 26 + i * 4 + th * 0.4), (W + 20, y + 10 + th * 0.4)), max(2, th * 0.25), fill=(196, 188, 160))
        # hanging high-bay lights
        n = [3, 4, 5, 6, 7][i]
        for k in range(n):
            lx = (k + 0.5) * W / n
            ly = y + 10 + th
            r = [26, 20, 15, 11, 8][i]
            line(d, [(lx, y + 4), (lx, ly)], 2, fill=(150, 150, 150))
            poly(d, [(lx - r * 0.5, ly), (lx + r * 0.5, ly), (lx + r, ly + r * 0.8), (lx - r, ly + r * 0.8)], fill=(200, 202, 206))
            ell(d, (lx - r * 1.4, ly + r * 0.6, lx + r * 1.4, ly + r * 1.2), fill=(255, 252, 236))
    # far end wall: white corrugated metal
    poly(d, [(0, 520), (W, 520), (W, 676), (0, 676)], fill=(236, 236, 232))
    for x in range(0, W, 14):
        line(d, [(x, 520), (x, 676)], 1, fill=(218, 218, 214))
    poly(d, [(0, 516), (W, 516), (W, 526), (0, 526)], fill=(120, 120, 124))
    # skating club banner and window at the left
    rr(d, (14, 600, 300, 640), 4, fill=(36, 80, 140))
    d.text((157 * S, 620 * S), "Jordan Skating Club", font=font("Bold", 22 * S), fill=(255, 255, 255), anchor="mm")
    # Canadian flag
    fx, fy, fw, fh = 70, 532, 120, 60
    poly(d, [(fx, fy), (fx + fw, fy), (fx + fw, fy + fh), (fx, fy + fh)], fill=(255, 255, 255))
    poly(d, [(fx, fy), (fx + fw / 4, fy), (fx + fw / 4, fy + fh), (fx, fy + fh)], fill=(214, 30, 40))
    poly(d, [(fx + fw * 3 / 4, fy), (fx + fw, fy), (fx + fw, fy + fh), (fx + fw * 3 / 4, fy + fh)], fill=(214, 30, 40))
    mx, my = fx + fw / 2, fy + fh / 2
    leaf = [(0, -22), (5, -12), (12, -14), (10, -4), (18, -7), (16, 0), (20, 2), (8, 10), (9, 16), (2, 13), (1, 22),
            (-1, 22), (-2, 13), (-9, 16), (-8, 10), (-20, 2), (-16, 0), (-18, -7), (-10, -4), (-12, -14), (-5, -12)]
    poly(d, [(mx + a, my + b) for a, b in leaf], fill=(214, 30, 40))
    # red LED game clock box
    rr(d, (204, 536, 320, 572), 3, fill=(22, 20, 20))
    d.text((262 * S, 554 * S), board[4] if ":" in board[4] else "0:00", font=font("Bold", 26 * S), fill=(255, 40, 30), anchor="mm")
    # scoreboard (right): black, red LED digits, HOME / VISITOR
    bx0, by0, bx1, by1 = 742, 526, 1060, 644
    rr(d, (bx0, by0, bx1, by1), 6, fill=(20, 20, 22), outline=(60, 60, 64), width=s(3))
    rr(d, (bx0 + 8, by0 + 8, bx0 + 86, by0 + 70), 4, fill=(240, 240, 236))
    d.text(((bx0 + 47) * S, (by0 + 30) * S), "JORDAN", font=font("Black", 15 * S), fill=(20, 40, 110), anchor="mm")
    d.text(((bx0 + 47) * S, (by0 + 50) * S), "ARENA", font=font("Bold", 13 * S), fill=(20, 40, 110), anchor="mm")
    rr(d, (bx1 - 86, by0 + 8, bx1 - 8, by0 + 70), 4, fill=(240, 240, 236))
    d.text(((bx1 - 47) * S, (by0 + 30) * S), "JOHL", font=font("Black", 18 * S), fill=(200, 16, 46), anchor="mm")
    d.text(((bx1 - 47) * S, (by0 + 50) * S), "SUNDAYS", font=font("Bold", 11 * S), fill=(60, 60, 60), anchor="mm")
    cxs = (bx0 + bx1) / 2
    clock = board[4] if ":" in board[4] else "0:00"
    d.text((cxs * S, (by0 + 34) * S), clock, font=font("Bold", 34 * S), fill=(255, 40, 30), anchor="mm")
    lab = board[5] if ":" in board[4] else board[4] + "  " + board[5]
    d.text((cxs * S, (by0 + 62) * S), lab, font=font("SemiBold", 11 * S), fill=(220, 220, 220), anchor="mm")
    d.text(((cxs - 44) * S, (by0 + 78) * S), board[0], font=font("Bold", 13 * S), fill=(230, 230, 230), anchor="mm")
    d.text(((cxs + 44) * S, (by0 + 78) * S), board[2], font=font("Bold", 13 * S), fill=(230, 230, 230), anchor="mm")
    d.text(((cxs - 44) * S, (by0 + 101) * S), board[1], font=font("Bold", 28 * S), fill=(255, 40, 30), anchor="mm")
    d.text(((cxs + 44) * S, (by0 + 101) * S), board[3], font=font("Bold", 28 * S), fill=(255, 40, 30), anchor="mm")
    # far boards: glass, white board, red cap, orange kick plate
    poly(d, [(0, 646), (W, 646), (W, 690), (0, 690)], fill=(214, 226, 230))
    for x in range(30, W, 110):
        line(d, [(x, 646), (x, 690)], 2, fill=(170, 176, 180))
    poly(d, [(0, 690), (W, 690), (W, 734), (0, 734)], fill=(248, 248, 246))
    poly(d, [(0, 688), (W, 688), (W, 694), (0, 694)], fill=(200, 30, 40))
    poly(d, [(0, 728), (W, 728), (W, 736), (0, 736)], fill=(230, 150, 50))
    # ice
    poly(d, [(0, 736), (W, 736), (W, 980), (0, 980)], fill=(240, 244, 248))
    poly(d, [(0, 790), (W, 790), (W, 796), (0, 796)], fill=(120, 140, 200))
    poly(d, [(0, 872), (W, 872), (W, 880), (0, 880)], fill=(214, 70, 80))
    ell(d, (CX - 160, 850, CX + 160, 902), outline=(214, 70, 80), width=s(3))
    # near glass on silver posts, netting above
    poly(d, [(0, 930), (W, 930), (W, 1040), (0, 1040)], fill=(222, 234, 238, 255))
    for x in range(0, W, 220):
        rr(d, (x + 96, 920, x + 112, 1044), 6, fill=(184, 188, 194))
        line(d, [(x + 100, 924), (x + 100, 1040)], 2, fill=(230, 232, 236))
    # near boards: white with red cap
    poly(d, [(0, 1040), (W, 1040), (W, 1110), (0, 1110)], fill=(246, 244, 242))
    poly(d, [(0, 1036), (W, 1036), (W, 1048), (0, 1048)], fill=(204, 36, 44))
    for x in range(40, W, 90):
        ell(d, (x - 2, 1076, x + 2, 1080), fill=(170, 170, 170))
    # grey bleachers with yellow step ends, red wall behind
    for i, y in enumerate((1110, 1200, 1290)):
        poly(d, [(0, y), (W, y), (W, y + 90), (0, y + 90)], fill=(150 - i * 10, 152 - i * 10, 158 - i * 10))
        poly(d, [(0, y), (W, y), (W, y + 14), (0, y + 14)], fill=(176, 178, 184))
        poly(d, [(0, y + 84), (W, y + 84), (W, y + 90), (0, y + 90)], fill=(110, 112, 118))
        for x0 in (0, W - 70):
            poly(d, [(x0, y), (x0 + 70, y), (x0 + 70, y + 90), (x0, y + 90)], fill=(236, 196, 30))
            poly(d, [(x0, y), (x0 + 70, y), (x0 + 70, y + 12), (x0, y + 12)], fill=(250, 214, 50))
            line(d, [(x0 + 4, y + 30), (x0 + 66, y + 30)], 2, fill=(60, 60, 60))
    d.text(((W - 36) * S, 1152 * S), "ROW 3", font=font("Black", 17 * S), fill=(40, 40, 46), anchor="mm")
    # red hand rail at the step edge
    line(d, [(78, 1120), (78, 1390)], 6, fill=(190, 30, 40))
    line(d, [(W - 78, 1120), (W - 78, 1390)], 6, fill=(190, 30, 40))
    return img


def header(img):
    d = ImageDraw.Draw(img)
    poly(d, [(0, 0), (W, 0), (W, HEADER_H), (0, HEADER_H)], fill=NAVY_D)
    poly(d, [(0, HEADER_H - 10), (W, HEADER_H - 10), (W, HEADER_H), (0, HEADER_H)], fill=RED)
    d.text((CX * S, 52 * S), "JORDAN OLDTIMERS HOCKEY LEAGUE", font=font("Bold", 26 * S), fill=(159, 182, 204), anchor="mt")
    d.text((CX * S, 96 * S), "RINKSIDE REPORT", font=font("Black", 78 * S), fill=(255, 255, 255), anchor="mt")


def footer(img, date_text):
    d = ImageDraw.Draw(img)
    poly(d, [(0, SCENE_BOT), (W, SCENE_BOT), (W, H), (0, H)], fill=NAVY_D)
    poly(d, [(0, SCENE_BOT), (W, SCENE_BOT), (W, SCENE_BOT + 8), (0, SCENE_BOT + 8)], fill=RED)
    d.text((CX * S, 1848 * S), f"{date_text}  ·  jordanohl.ca", font=font("SemiBold", 30 * S), fill=(159, 182, 204), anchor="mm")


# ---------------------------------------------------------------- Arnie's body
def puffy_band(d, x0, x1, y0, y1, base, dark, light):
    """One quilted baffle of the jacket: a rounded band with a highlight."""
    rr(d, (x0, y0, x1, y1), (y1 - y0) / 2, fill=base)
    rr(d, (x0 + 14, y0 + 6, x1 - 14, y0 + (y1 - y0) * 0.45), (y1 - y0) / 4, fill=light)
    line(d, [(x0 + 10, y1 - 2), (x1 - 10, y1 - 2)], 4, fill=dark)


def body(img):
    d = ImageDraw.Draw(img)
    # torso silhouette, sitting: wide puffy shoulders down past the frame
    top = 850
    poly(d, [(CX - 300, SCENE_BOT), (CX - 330, 1060), (CX - 300, 940), (CX - 220, 880), (CX - 90, top),
             (CX + 90, top), (CX + 220, 880), (CX + 300, 940), (CX + 330, 1060), (CX + 300, SCENE_BOT)], fill=RED_D)
    # baffles
    y = 880
    widths = [(CX - 250, CX + 250), (CX - 300, CX + 300), (CX - 318, CX + 318), (CX - 326, CX + 326),
              (CX - 326, CX + 326), (CX - 320, CX + 320)]
    for x0, x1 in widths:
        puffy_band(d, x0, x1, y, y + 92, RED, RED_D, RED_L)
        y += 86
    # zipper
    line(d, [(CX, 900), (CX, SCENE_BOT)], 6, fill=(60, 10, 20))
    for yy in range(910, SCENE_BOT, 18):
        line(d, [(CX - 5, yy), (CX + 5, yy)], 2, fill=(170, 170, 175))
    # JOHL crest on chest
    ell(d, (CX + 120, 980, CX + 220, 1080), fill=NAVY, outline=(255, 255, 255), width=s(4))
    d.text(((CX + 170) * S, 1030 * S), "JOHL", font=font("Black", 26 * S), fill=(255, 255, 255), anchor="mm")
    # sleeves: shoulder -> elbow (out at his sides) -> wrist (up at the gloves)
    for side, el, wr in ((-1, (CX - 350, 1200), (CX - 400, 1078)), (1, (CX + 340, 1250), (CX + 210, 1215))):
        sh = (CX + side * 290, 960)
        line(d, [sh, el, wr], 150, fill=RED_D)
        line(d, [sh, el, wr], 120, fill=RED)
        for k in range(1, 5):  # quilting across the sleeve
            t = k / 5
            px = sh[0] + (el[0] - sh[0]) * t; py = sh[1] + (el[1] - sh[1]) * t
            line(d, [(px - 58, py - 6), (px + 58, py + 6)], 5, fill=RED_D)
        ell(d, (wr[0] - 78, wr[1] - 58, wr[0] + 78, wr[1] + 58), fill=RED_D)  # cuff


# ---------------------------------------------------------------- head
def head(mouth=0, eyes_open=True, look=0):
    """mouth: 0 (closed) .. 4 (wide).  look: -1/0/1 pupils left/centre/right."""
    img = canvas()
    d = ImageDraw.Draw(img)
    cx, cy = CX, HEAD_CY
    jaw = mouth * 5  # the chin drops a little as he talks

    # neck
    rr(d, (cx - 70, cy + 130, cx + 70, cy + 230), 30, fill=SKIN_S)
    # ears
    for side in (-1, 1):
        ell(d, (cx + side * 158 - 26, cy - 40, cx + side * 158 + 26, cy + 50), fill=SKIN_S)
        ell(d, (cx + side * 158 - 14, cy - 24, cx + side * 158 + 14, cy + 36), fill=CHEEK)
    # face: a soft rounded shape, a touch jowly
    face = bez((cx - 150, cy - 90), (cx - 170, cy + 110), (cx - 90, cy + 190 + jaw), (cx, cy + 192 + jaw), 30) + \
           bez((cx, cy + 192 + jaw), (cx + 90, cy + 190 + jaw), (cx + 170, cy + 110), (cx + 150, cy - 90), 30) + \
           bez((cx + 150, cy - 90), (cx + 140, cy - 190), (cx - 140, cy - 190), (cx - 150, cy - 90), 30)
    poly(d, face, fill=SKIN)
    # jowl shading
    for side in (-1, 1):
        line(d, bez((cx + side * 128, cy + 40), (cx + side * 120, cy + 120), (cx + side * 70, cy + 160 + jaw)), 5, fill=SKIN_S)
    # rosy cold-rink cheeks
    for side in (-1, 1):
        blob = Image.new("RGBA", img.size, (0, 0, 0, 0))
        bd = ImageDraw.Draw(blob)
        ell(bd, (cx + side * 95 - 36, cy + 30, cx + side * 95 + 36, cy + 84), fill=CHEEK + (150,))
        blob = blob.filter(ImageFilter.GaussianBlur(10 * S))
        img.alpha_composite(blob)
    d = ImageDraw.Draw(img)

    # sideburns: grey-brown, down to the bottom of the ear
    for side in (-1, 1):
        poly(d, [(cx + side * 150, cy - 80), (cx + side * 128, cy - 80), (cx + side * 124, cy + 50),
                 (cx + side * 140, cy + 68), (cx + side * 156, cy + 40)], fill=HAIR)
        for k in range(4):
            line(d, [(cx + side * (132 + k * 5), cy - 60 + k * 8), (cx + side * (132 + k * 5), cy + 40)], 2, fill=HAIR_L)

    # he's about 55: forehead lines, bags under the eyes, smile lines, a soft second chin
    for k in range(3):
        line(d, bez((cx - 64 + k * 6, cy - 100 + k * 13), (cx, cy - 110 + k * 13), (cx + 64 - k * 6, cy - 100 + k * 13)), 3, fill=SKIN_D)
    for side in (-1, 1):
        ex = cx + side * 58
        line(d, bez((ex - 22, cy - 2), (ex, cy + 10), (ex + 22, cy - 2)), 3, fill=SKIN_D)
        line(d, bez((ex - 16, cy + 8), (ex, cy + 16), (ex + 16, cy + 8)), 2, fill=SKIN_S)
        line(d, bez((cx + side * 40, cy + 54), (cx + side * 74, cy + 84), (cx + side * 88, cy + 120)), 4, fill=SKIN_D)
    line(d, bez((cx - 50, cy + 204 + jaw), (cx, cy + 216 + jaw), (cx + 50, cy + 204 + jaw)), 4, fill=SKIN_S)

    # eyes
    ey = cy - 30
    for side in (-1, 1):
        ex = cx + side * 58
        if eyes_open:
            ell(d, (ex - 24, ey - 15, ex + 24, ey + 15), fill=(255, 255, 255))
            px = ex + look * 7
            ell(d, (px - 11, ey - 11, px + 11, ey + 11), fill=(70, 90, 110))
            ell(d, (px - 6, ey - 6, px + 6, ey + 6), fill=(20, 20, 24))
            ell(d, (px - 7, ey - 9, px - 2, ey - 4), fill=(255, 255, 255))
            line(d, bez((ex - 26, ey - 4), (ex, ey - 22), (ex + 26, ey - 4)), 3, fill=SKIN_D)  # lid
        else:
            line(d, bez((ex - 24, ey + 2), (ex, ey + 10), (ex + 24, ey + 2)), 4, fill=INK)
        # crow's feet
        for k in (-1, 0, 1):
            line(d, [(ex + side * 34, ey + k * 7), (ex + side * 46, ey + k * 11)], 2, fill=SKIN_D)
        # bushy grey eyebrows
        bw = [(ex - side * 32, ey - 34), (ex, ey - 48), (ex + side * 36, ey - 38)]
        line(d, bez(*bw), 12, fill=HAIR)
        line(d, bez((bw[0][0], bw[0][1] - 3), (bw[1][0], bw[1][1] - 4), (bw[2][0], bw[2][1] - 3)), 4, fill=HAIR_L)

    # glasses: thin dark rounded-rectangle frames
    for side in (-1, 1):
        ex = cx + side * 58
        rr(d, (ex - 44, ey - 30, ex + 44, ey + 32), 16, outline=(52, 44, 40), width=s(6))
        line(d, [(ex - 30, ey - 18), (ex - 16, ey - 26)], 4, fill=(255, 255, 255, 170))
        line(d, [(cx + side * 102, ey - 12), (cx + side * 150, ey - 18)], 6, fill=(52, 44, 40))
    line(d, bez((cx - 14, ey - 6), (cx, ey - 14), (cx + 14, ey - 6)), 6, fill=(52, 44, 40))

    # nose: round, a little red at the tip
    poly(d, bez((cx - 10, ey + 10), (cx - 30, cy + 54), (cx - 34, cy + 66)) + bez((cx + 34, cy + 66), (cx + 30, cy + 54), (cx + 10, ey + 10)), fill=SKIN_S)
    ell(d, (cx - 32, cy + 34, cx + 32, cy + 80), fill=(236, 176, 160))
    ell(d, (cx - 16, cy + 42, cx - 2, cy + 52), fill=(250, 220, 210))
    for side in (-1, 1):
        ell(d, (cx + side * 14 - 7, cy + 66, cx + side * 14 + 7, cy + 76), fill=SKIN_D)

    # mouth (behind the moustache)
    my = cy + 112
    if mouth == 0:
        line(d, bez((cx - 34, my), (cx, my + 8), (cx + 34, my)), 5, fill=(150, 80, 76))
    else:
        h = [0, 12, 24, 36, 48][mouth]
        w = [0, 34, 40, 44, 46][mouth]
        ell(d, (cx - w, my - 10, cx + w, my + h + jaw * 0.6), fill=(92, 28, 32))
        if mouth >= 2:
            rr(d, (cx - w + 8, my - 8, cx + w - 8, my + 6), 4, fill=(250, 248, 240))  # top teeth
        ell(d, (cx - w * 0.6, my + h * 0.45 + jaw * 0.6, cx + w * 0.6, my + h + jaw * 0.6), fill=(200, 96, 104))  # tongue
        line(d, bez((cx - w + 4, my + h + jaw * 0.6 + 4), (cx, my + h + jaw * 0.6 + 12), (cx + w - 4, my + h + jaw * 0.6 + 4)), 4, fill=SKIN_D)  # lower lip shadow

    # horseshoe moustache: thick over the lip, bars down past the corners to the jaw
    st = []
    st += bez((cx - 8, cy + 82), (cx - 50, cy + 74), (cx - 86, cy + 96), (cx - 80, cy + 118))
    st += [(cx - 82, cy + 150), (cx - 80, cy + 186 + jaw), (cx - 58, cy + 190 + jaw), (cx - 56, cy + 150), (cx - 54, cy + 116)]
    st += bez((cx - 54, cy + 116), (cx - 30, cy + 108), (cx + 30, cy + 108), (cx + 54, cy + 116))
    st += [(cx + 56, cy + 150), (cx + 58, cy + 190 + jaw), (cx + 80, cy + 186 + jaw), (cx + 82, cy + 150)]
    st += bez((cx + 80, cy + 118), (cx + 86, cy + 96), (cx + 50, cy + 74), (cx + 8, cy + 82))
    poly(d, st, fill=STACHE)
    for k in range(-5, 6):
        x = cx + k * 9
        line(d, [(x, cy + 86), (x + k * 1.5, cy + 104)], 3, fill=STACHE_L)
    for side in (-1, 1):
        for k in range(3):
            x = cx + side * (62 + k * 6)
            line(d, [(x, cy + 122), (x, cy + 180 + jaw)], 2, fill=STACHE_L)

    # toque: navy, red stripe cuff, JOHL, pom-pom
    ty = cy - 138
    dome = bez((cx - 166, ty + 20), (cx - 170, ty - 170), (cx + 170, ty - 170), (cx + 166, ty + 20), 40)
    poly(d, dome + [(cx + 166, ty + 20), (cx - 166, ty + 20)], fill=NAVY)
    for k in range(-6, 7):
        line(d, bez((cx + k * 22, ty + 10), (cx + k * 18, ty - 60), (cx + k * 6, ty - 118)), 3, fill=(22, 50, 80))
    rr(d, (cx - 176, ty - 8, cx + 176, ty + 62), 26, fill=NAVY_D)
    poly(d, [(cx - 172, ty + 12), (cx + 172, ty + 12), (cx + 172, ty + 36), (cx - 172, ty + 36)], fill=RED)
    for k in range(-15, 16):
        line(d, [(cx + k * 11, ty - 4), (cx + k * 11, ty + 58)], 2, fill=(20, 44, 72))
    d.text((cx * S, (ty + 25) * S), "JOHL", font=font("Black", 36 * S), fill=(255, 255, 255), anchor="mm",
           stroke_width=s(2), stroke_fill=NAVY_D)
    for k in range(14):
        a = k / 14 * math.tau
        ell(d, (cx + math.cos(a) * 26 - 22, ty - 134 + math.sin(a) * 22 - 22, cx + math.cos(a) * 26 + 22, ty - 134 + math.sin(a) * 22 + 22),
            fill=[(255, 255, 255), RED][k % 2])
    ell(d, (cx - 30, ty - 164, cx + 30, ty - 104), fill=(255, 255, 255))
    return down(img)


# ---------------------------------------------------------------- front: collar + hands
def glove(d, x, y, side, holding):
    """A grey wool fingerless glove; the mitten flap folded back over the
    back of the hand and held there with a velcro tab."""
    # palm/back of hand
    rr(d, (x - 62, y - 44, x + 62, y + 52), 30, fill=WOOL)
    # knit ribbing at the cuff
    rr(d, (x - 58, y + 40, x + 58, y + 86), 12, fill=WOOL_D)
    for k in range(-5, 6):
        line(d, [(x + k * 10, y + 44), (x + k * 10, y + 82)], 3, fill=WOOL)
    # bare fingertips poking out of the cut fingers
    for k in range(4):
        fx = x - 44 + k * 29
        rr(d, (fx - 13, y - 92, fx + 13, y - 34), 12, fill=SKIN)
        rr(d, (fx - 15, y - 54, fx + 15, y - 30), 6, fill=WOOL_L)  # rolled finger opening
        ell(d, (fx - 7, y - 92, fx + 7, y - 80), fill=SKIN_S)
    # thumb
    rr(d, (x - side * 70 - 18, y - 40, x - side * 70 + 18, y + 10), 14, fill=SKIN)
    rr(d, (x - side * 70 - 20, y - 6, x - side * 70 + 20, y + 22), 8, fill=WOOL_L)
    # folded-back mitten flap with velcro tab
    rr(d, (x - 50, y - 30, x + 50, y + 24), 24, fill=WOOL_D)
    line(d, bez((x - 44, y - 22), (x, y - 36), (x + 44, y - 22)), 4, fill=WOOL_L)
    rr(d, (x - 20, y - 6, x + 20, y + 14), 4, fill=(58, 58, 64))
    for k in range(-3, 4):
        line(d, [(x + k * 5, y - 4), (x + k * 5, y + 12)], 1, fill=(90, 90, 98))
    # knit texture
    for k in range(6):
        for j in range(3):
            xx, yy = x - 48 + k * 19, y + 30 + j * 0
            line(d, [(xx, y + 32), (xx + 6, y + 36), (xx + 12, y + 32)], 2, fill=WOOL_D)


def front(img):
    d = ImageDraw.Draw(img)
    # stand-up collar of the jacket, over the neck
    poly(d, bez((CX - 200, 900), (CX - 170, 820), (CX - 90, 830), (CX - 60, 870)) +
         [(CX - 70, 960)] + [(CX - 230, 960)], fill=RED)
    poly(d, bez((CX + 60, 870), (CX + 90, 830), (CX + 170, 820), (CX + 200, 900)) +
         [(CX + 230, 960)] + [(CX + 70, 960)], fill=RED)
    poly(d, [(CX - 70, 880), (CX + 70, 880), (CX + 80, 960), (CX - 80, 960)], fill=RED_D)
    line(d, [(CX, 880), (CX, 960)], 6, fill=(60, 10, 20))
    rr(d, (CX - 12, 880, CX + 12, 912), 4, fill=(190, 190, 196))  # zipper pull

    # coffee cup in his right hand (our left)
    cx, cy = CX - 210, 1130
    poly(d, [(cx - 52, cy - 120), (cx + 52, cy - 120), (cx + 40, cy + 30), (cx - 40, cy + 30)], fill=(250, 248, 242))
    poly(d, [(cx - 50, cy - 80), (cx + 50, cy - 80), (cx + 46, cy - 30), (cx - 46, cy - 30)], fill=(140, 90, 50))
    d.text((cx * S, (cy - 55) * S), "ARENA", font=font("Black", 18 * S), fill=(250, 240, 220), anchor="mm")
    rr(d, (cx - 58, cy - 140, cx + 58, cy - 116), 8, fill=(240, 240, 236))
    # steam
    for k, off in enumerate((-18, 4, 24)):
        line(d, bez((cx + off, cy - 150), (cx + off - 16, cy - 186), (cx + off + 10, cy - 216)), 4, fill=(255, 255, 255, 120))
    # his hand wraps around the side of the cup: the glove is drawn upright
    # on its own, turned a quarter turn clockwise so the fingers lie across
    # the front of the cup, and laid on top
    tmp = canvas()
    gx, gy = 200, 200
    glove(ImageDraw.Draw(tmp), gx, gy, -1, True)
    g = tmp.crop(s((gx - 100, gy - 105, gx + 100, gy + 95))).rotate(-90, resample=Image.BICUBIC, expand=True)
    hx, hy = cx - 52, cy - 52           # where the middle of the hand goes
    img.alpha_composite(g, (int((hx - 100) * S), int((hy - 100) * S)))
    d = ImageDraw.Draw(img)

    # notebook in his left hand (our right), with a pencil
    nx, ny = CX + 200, 1100
    poly(d, [(nx - 90, ny - 140), (nx + 70, ny - 160), (nx + 96, ny + 40), (nx - 70, ny + 60)], fill=(250, 236, 140))
    poly(d, [(nx - 90, ny - 140), (nx + 70, ny - 160), (nx + 74, ny - 132), (nx - 86, ny - 112)], fill=(60, 60, 64))
    for k in range(7):
        y0 = ny - 100 + k * 22
        line(d, [(nx - 74, y0 + 4 - k * 0.3), (nx + 80, y0 - 14)], 2, fill=(120, 150, 200))
    for k in range(4):  # scribbles
        y0 = ny - 92 + k * 22
        line(d, [(nx - 60 + j * 14, y0 + (j % 2) * 6 - j * 1.6) for j in range(8 + k)], 3, fill=(50, 50, 60))
    glove(d, nx + 10, ny + 40, 1, True)
    line(d, [(nx - 120, ny + 10), (nx - 10, ny - 70)], 10, fill=(250, 200, 40))
    line(d, [(nx - 10, ny - 70), (nx + 4, ny - 80)], 6, fill=(60, 50, 40))


# ---------------------------------------------------------------- assemble
def base_layer(date_text, board=None):
    img = canvas((0, 0, 0, 255))
    arena(img, board)
    body(img)
    header(img)
    return img


def build(date_text):
    base = base_layer(date_text)
    fr = canvas()
    front(fr)
    base_small = down(base)
    front_small = down(fr)
    foot = canvas()
    footer(foot, date_text)
    foot_small = down(foot)
    heads = {}
    for m in range(5):
        for e in (True, False):
            for lk in (-1, 0, 1):
                heads[(m, e, lk)] = head(m, e, lk)
    return base_small, front_small, foot_small, heads


if __name__ == "__main__":
    b, f, ft, hs = build("Sunday, November 1")
    for key in [(0, True, 0), (3, True, 1), (2, False, 0)]:
        im = b.copy()
        im.alpha_composite(hs[key])
        im.alpha_composite(f)
        im.alpha_composite(ft)
        im.convert("RGB").save(f"/tmp/arnie_{key[0]}{int(key[1])}{key[2]}.png")
    print("ok")
