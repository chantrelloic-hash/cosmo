#!/usr/bin/env python3
"""Génère les icônes de la PWA (app/icons/*.png) avec Pillow.

Usage : python3 tools/make_icons.py
Style de la maquette : fond uni nuit #0C0B22, mot COSMO espacé, le O en orange #FF7A2F.
Pour l'icône « maskable », le texte reste dans la zone de sécurité (80 % centraux).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BG, INK, FLAME = (12, 11, 34), (246, 244, 255), (255, 122, 47)
OUT = Path(__file__).resolve().parent.parent / "app" / "icons"
FONTS = [
    "/usr/share/fonts/opentype/inter/Inter-Black.otf",
    "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf",
    "/usr/share/fonts/opentype/inter/Inter-Bold.otf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def load_font(size):
    for p in FONTS:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def draw_icon(size, text_ratio, tagline=True):
    """text_ratio : largeur du mot COSMO / largeur de l'icône."""
    S = size * 4  # suréchantillonnage pour lisser
    img = Image.new("RGB", (S, S), BG)
    d = ImageDraw.Draw(img)

    letters = "COSMO"
    fs = int(S * text_ratio / 3.6)
    for _ in range(30):
        font = load_font(fs)
        track = fs * 0.12
        widths = [d.textlength(c, font=font) for c in letters]
        total = sum(widths) + track * (len(letters) - 1)
        if total <= S * text_ratio:
            break
        fs = int(fs * 0.95)
    asc, desc = font.getmetrics()
    x = (S - total) / 2
    y = (S - (asc + desc)) / 2 - (S * 0.03 if tagline else 0)
    for i, c in enumerate(letters):
        d.text((x, y), c, font=font, fill=FLAME if i == 1 else INK)
        x += widths[i] + track
    if tagline:
        small = load_font(int(fs * 0.2))
        t = "K O U R O U"
        w = d.textlength(t, font=small)
        d.text(((S - w) / 2, y + asc + desc * 0.55 + fs * 0.12), t, font=small, fill=(167, 162, 216))
    return img.resize((size, size), Image.LANCZOS)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    draw_icon(192, 0.80).save(OUT / "icon-192.png", optimize=True)
    draw_icon(512, 0.80).save(OUT / "icon-512.png", optimize=True)
    draw_icon(512, 0.58).save(OUT / "icon-maskable-512.png", optimize=True)
    draw_icon(180, 0.80).save(OUT / "apple-touch-icon.png", optimize=True)
    print("Icônes écrites dans", OUT)


if __name__ == "__main__":
    main()
