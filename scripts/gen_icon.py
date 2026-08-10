import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "..", "src-tauri", "icons", "source.png")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

W = 1024
img = Image.new("RGBA", (W, W), (20, 23, 43, 255))
d = ImageDraw.Draw(img)

cx, cy = W // 2, W // 2
r = 300
nodes = [
    (cx, cy - r),
    (cx + int(r * 0.87), cy - int(r * 0.5)),
    (cx + int(r * 0.87), cy + int(r * 0.5)),
    (cx, cy + r),
    (cx - int(r * 0.87), cy + int(r * 0.5)),
    (cx - int(r * 0.87), cy - int(r * 0.5)),
]
col = (76, 196, 255, 255)

# connecting lines (knowledge-graph metaphor)
for n in nodes:
    d.line([cx, cy, n[0], n[1]], fill=(76, 196, 255, 110), width=12)

# outer nodes
for n in nodes:
    d.ellipse([n[0] - 46, n[1] - 46, n[0] + 46, n[1] + 46], fill=col)
    d.ellipse([n[0] - 22, n[1] - 22, n[0] + 22, n[1] + 22], fill=(205, 240, 255, 255))

# central node
d.ellipse([cx - 78, cy - 78, cx + 78, cy + 78], fill=(120, 220, 255, 255))
d.ellipse([cx - 44, cy - 44, cx + 44, cy + 44], fill=(255, 255, 255, 255))

img.save(OUT)
print("wrote", os.path.abspath(OUT), img.size)
