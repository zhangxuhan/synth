"""Render docs/preview.png — a clean mockup of the Synth 3-pane UI.

Pure-Pillow, no network. Uses the app's dark theme palette so the README
preview matches the running product.
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1240, 760
MARGIN = 16
TOPBAR = 56
GAP = 12
PANEL_Y = TOPBAR + 12
PANEL_BOTTOM = H - MARGIN
PANEL_H = PANEL_BOTTOM - PANEL_Y

LEFT_W = 300
RIGHT_W = 364
MID_X = MARGIN + LEFT_W + GAP
MID_W = W - MARGIN - RIGHT_W - GAP - MID_X

# Palette (mirrors src/styles.css dark theme)
BG = (15, 20, 32)
TOP = (20, 26, 40)
PANEL = (22, 28, 43)
PANEL2 = (28, 35, 52)
BORDER = (255, 255, 255, 26)
TEXT = (226, 235, 248)
MUTED = (138, 151, 173)
ACCENT = (110, 168, 254)
TYPE_COLORS = {
    "concept": (110, 168, 254),
    "definition": (139, 123, 255),
    "fact": (78, 201, 165),
    "step": (240, 163, 94),
    "quote": (214, 167, 74),
    "question": (229, 109, 143),
}
TYPE_LABEL = {
    "concept": "CONCEPT",
    "definition": "DEFINITION",
    "fact": "FACT",
    "step": "STEP",
    "quote": "QUOTE",
    "question": "QUESTION",
}


def font(size, bold=False):
    try:
        # Microsoft YaHei renders both Latin and CJK cleanly.
        path = "C:/Windows/Fonts/msyh.ttc"
        idx = 1 if bold else 0
        return ImageFont.truetype(path, size, index=idx)
    except Exception:
        return ImageFont.load_default()


def rr(draw, box, r, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def text(draw, xy, s, f, fill=TEXT, anchor=None):
    draw.text(xy, s, font=f, fill=fill, anchor=anchor)


img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img, "RGBA")

# ---------- top bar ----------
rr(draw, (0, 0, W, TOPBAR), 0, fill=TOP)
draw.line((0, TOPBAR, W, TOPBAR), fill=BORDER, width=1)
text(draw, (MARGIN + 6, TOPBAR / 2), "Synth", font(22, True), fill=ACCENT, anchor="lm")
text(draw, (MARGIN + 78, TOPBAR / 2), "knowledge cards from any source", font(12), fill=MUTED, anchor="lm")

# top-bar pills (right aligned)
pills = ["中", "EN", "日", "Theme", "Export", "★ Star"]
px = W - MARGIN
for p in reversed(pills):
    f = font(12, True)
    w = draw.textlength(p, font=f) + 18
    px -= w
    rr(draw, (px, 14, px + w, TOPBAR - 14), 8, fill=PANEL2, outline=BORDER)
    text(draw, (px + w / 2, TOPBAR / 2), p, f, fill=TEXT, anchor="mm")
    px -= 8

# ---------- panel chrome ----------
def panel(x, w, title):
    rr(draw, (x, PANEL_Y, x + w, PANEL_BOTTOM), 12, fill=PANEL, outline=BORDER)
    text(draw, (x + 14, PANEL_Y + 16), title, font(13, True), fill=MUTED)
    return PANEL_Y + 40


# ---------- left: sources ----------
ly = panel(MARGIN, LEFT_W, "SOURCES")
# doc chip
chip = (MARGIN + 12, ly, MARGIN + LEFT_W - 12, ly + 54)
rr(draw, chip, 10, fill=PANEL2, outline=BORDER)
text(draw, (chip[0] + 12, chip[1] + 13), "Transformer 入門（サンプル）", font(13, True), fill=TEXT)
text(draw, (chip[0] + 12, chip[1] + 33), "PDF · 6 cards", font(11), fill=MUTED)
# faux source text lines
ty = chip[3] + 18
for i, (ln, a) in enumerate(
    [
        ("アテンションとは、モデルがあるトークンを", 200),
        ("処理するときに、入力の中のどのトークン", 150),
        ("に注目すべきかを動的に決める仕組みです。", 120),
        ("各トークンはクエリ・キー・バリューの", 90),
        ("三つのベクトルに射影されます。", 60),
    ]
):
    text(draw, (MARGIN + 16, ty), ln, font(12), fill=(MUTED[0], MUTED[1], MUTED[2], a))
    ty += 22

# ---------- middle: deck (cards) ----------
mx = MID_X
my = panel(mx, MID_W, "DECK")
# tabs
tabs = [("Cards", True), ("Graph", False), ("Review", False)]
tx = mx + 14
for label, active in tabs:
    f = font(12, True)
    w = draw.textlength(label, font=f) + 22
    col = ACCENT if active else MUTED
    rr(draw, (tx, my, tx + w, my + 28), 8, fill=(ACCENT[0], ACCENT[1], ACCENT[2], 38) if active else PANEL2)
    text(draw, (tx + w / 2, my + 14), label, f, fill=col, anchor="mm")
    tx += w + 8
card_y = my + 40


def draw_card(x, y, w, ctype, title, summary, tags, hi=False):
    h = 92
    rr(draw, (x, y, x + w, y + h), 10, fill=PANEL2, outline=(ACCENT[0], ACCENT[1], ACCENT[2], 120) if hi else BORDER, width=2 if hi else 1)
    col = TYPE_COLORS[ctype]
    # type badge
    bw = draw.textlength(TYPE_LABEL[ctype], font=font(10, True)) + 16
    rr(draw, (x + 12, y + 12, x + 12 + bw, y + 30), 7, fill=(col[0], col[1], col[2], 230))
    text(draw, (x + 12 + bw / 2, y + 21), TYPE_LABEL[ctype], font(10, True), fill=(10, 14, 24), anchor="mm")
    text(draw, (x + 12 + bw + 10, y + 12), title, font(14, True), fill=TEXT)
    # summary (1 line, truncated visually)
    text(draw, (x + 12, y + 38), summary, font(11), fill=MUTED)
    # tags
    tgx = x + 12
    tgy = y + h - 24
    for t in tags:
        tw = draw.textlength(t, font=font(10)) + 14
        rr(draw, (tgx, tgy, tgx + tw, tgy + 18), 9, fill=PANEL, outline=BORDER)
        text(draw, (tgx + tw / 2, tgy + 9), t, font(10), fill=(180, 195, 220), anchor="mm")
        tgx += tw + 6
    return y + h + 12


card_y = draw_card(
    mx + 12, card_y, MID_W - 24, "definition",
    "アテンションとは何か",
    "モデルが各トークンに対して注目すべき他トークンを動的に決める仕組み。",
    ["attention", "query", "key"], hi=True,
)
card_y = draw_card(
    mx + 12, card_y, MID_W - 24, "fact",
    "自己アテンションの速さと弱点",
    "全位置を並列計算できるが、計算量は系列長の二乗に比例する。",
    ["parallel", "gpu", "quadratic"],
)
card_y = draw_card(
    mx + 12, card_y, MID_W - 24, "step",
    "学習は三段階",
    "事前学習 → 教師あり微調整 → 選好アライメント (RLHF/DPO)。",
    ["pretrain", "sft", "alignment"],
)

# ---------- right: concept graph ----------
gx = W - MARGIN - RIGHT_W
gy = panel(gx, RIGHT_W, "CONCEPT GRAPH")
# node positions (force-graph look)
nodes = [
    ("アテンション", "definition", (gx + 120, gy + 90)),
    ("自己アテンション", "fact", (gx + 250, gy + 60)),
    ("マルチヘッド", "concept", (gx + 200, gy + 190)),
    ("位置エンコーディング", "concept", (gx + 70, gy + 240)),
    ("学習三段階", "step", (gx + 300, gy + 220)),
    ("よくある誤解", "question", (gx + 150, gy + 330)),
]
edges = [(0, 1), (0, 2), (1, 2), (2, 3), (2, 4), (3, 5), (4, 5), (0, 3)]
# draw edges
for a, b in edges:
    na = nodes[a]
    nb = nodes[b]
    draw.line((na[2][0], na[2][1], nb[2][0], nb[2][1]), fill=(150, 170, 200, 46), width=2)
# draw nodes
for i, (label, ctype, pos) in enumerate(nodes):
    col = TYPE_COLORS[ctype]
    r = 9 + (0 if i else 2)
    # glow for first
    if i == 0:
        draw.ellipse((pos[0] - r - 6, pos[1] - r - 6, pos[0] + r + 6, pos[1] + r + 6), fill=(col[0], col[1], col[2], 40))
    draw.ellipse((pos[0] - r, pos[1] - r, pos[0] + r, pos[1] + r), fill=col, outline=(255, 255, 255, 180), width=2)
    text(draw, (pos[0], pos[1] + r + 8), label, font(11), fill=TEXT, anchor="ma")

# ---------- footer hint ----------
text(draw, (MARGIN, H - 10), "100% local · no sign-up · no API key", font(11), fill=MUTED, anchor="ls")

import os
out = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "docs", "preview.png"))
os.makedirs(os.path.dirname(out), exist_ok=True)
img.save(out)
print("wrote", out, img.size)
