#!/usr/bin/env python3
"""The home-screen icon: the OM in the book's own palette.

Drawn rather than photographed. At the size iOS actually shows it -- about
60 points on the home screen -- a portrait turns to mud, while the OM reads
instantly and belongs to the book without needing to be recognised.

The glyph is kept inside the maskable safe zone (the middle 80%), so the one
image survives Android's circle/squircle crop as well as Apple's rounded
square, and no separate maskable set is needed.
"""
import sys
from PIL import Image, ImageDraw, ImageFont

M = 1024                       # master size; every output is a downscale of this
FONTS = [("/System/Library/Fonts/Supplemental/Devanagari Sangam MN.ttc", 0),
         ("/System/Library/Fonts/Supplemental/DevanagariMT.ttc", 0),
         ("/System/Library/Fonts/Supplemental/ITFDevanagari.ttc", 0)]
OM = "ॐ"                  # DEVANAGARI OM

INK = (30, 26, 20)             # --paper, dark theme: the field
GLOW = (58, 47, 32)            # --accent-soft, dark theme: warmth behind it
GOLD = (217, 164, 65)          # --seen
RULE = (154, 107, 63)          # --accent


def radial(size, inner, outer):
    """A soft warm centre, so the field isn't a flat rectangle of brown."""
    img = Image.new("RGB", (size, size), outer)
    d = ImageDraw.Draw(img)
    steps = 90
    for i in range(steps, 0, -1):
        t = i / steps
        r = t * size * 0.72
        c = tuple(round(outer[k] + (inner[k] - outer[k]) * (1 - t) ** 1.6) for k in range(3))
        d.ellipse([size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r], fill=c)
    return img


def fit(draw, text, box, font_path, index):
    """Largest point size whose inked bounds fit `box` (a side length)."""
    lo, hi, best = 10, M * 2, None
    while lo <= hi:
        mid = (lo + hi) // 2
        f = ImageFont.truetype(font_path, mid, index=index)
        l, t, r, b = draw.textbbox((0, 0), text, font=f)
        if max(r - l, b - t) <= box:
            best, lo = (f, (l, t, r, b)), mid + 1
        else:
            hi = mid - 1
    return best


def build():
    img = radial(M, GLOW, INK)
    d = ImageDraw.Draw(img)

    # A hairline ring, inset far enough to survive a circular mask.
    pad = M * 0.085
    d.ellipse([pad, pad, M - pad, M - pad], outline=RULE, width=max(2, int(M * 0.006)))

    for path, idx in FONTS:
        try:
            got = fit(d, OM, M * 0.52, path, idx)
        except OSError:
            continue
        if got:
            font, (l, t, r, b) = got
            # Centre by inked bounds, not by the font's metrics: the OM's
            # bindu and candrabindu sit high, and metric-centring leaves the
            # whole glyph visibly low in the frame.
            d.text(((M - (r - l)) / 2 - l, (M - (b - t)) / 2 - t), OM, font=font, fill=GOLD)
            return img, path
    sys.exit("no Devanagari font could draw the OM")


if __name__ == "__main__":
    master, used = build()
    out = sys.argv[1].rstrip("/")
    for n in (180, 192, 512):
        master.resize((n, n), Image.LANCZOS).save(f"{out}/icon-{n}.png", optimize=True)
    master.resize((512, 512), Image.LANCZOS).save(f"{out}/icon-master.png", optimize=True)
    print("drawn with", used)
