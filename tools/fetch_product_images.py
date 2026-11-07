#!/usr/bin/env python3
"""Photos des produits : télécharge, détoure et enregistre app/images/<id>.webp (rejouable).

Deux sources :
  - Open Food Facts (CC-BY-SA 3.0) : on télécharge la photo de face du code-barres indiqué, puis on retire
    le fond uni (remplissage depuis les bords avec tolérance -> transparence), on rogne au produit et on
    redimensionne à ~320 px de haut.
  - Photos du Cosmo (prises par Loïc au bar) : recadrage d'une bouteille dans la photo, coins arrondis
    (le fond sombre du bar reste : la photo est affichée comme une « pastille »).

Usage :  python3 tools/fetch_product_images.py [--cache DOSSIER] [--photos DOSSIER_PHOTOS_COSMO] [id ...]
Respecte l'API d'Open Food Facts : User-Agent explicite, ~2 s entre deux requêtes, aucune requête si le
fichier est déjà dans le cache. Les photos du Cosmo (4096x3072) ne sont pas dans le dépôt : si le dossier
--photos est absent, ces images sont sautées (les .webp déjà dans app/images/ restent valables).
Après un changement : mettre à jour app/images/CREDITS.md et le champ "image" de app/menu.json.
"""
import argparse, json, sys, time, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageOps

UA = 'CosmoCommande/1.0 (https://github.com/chantrelloic-hash/cosmo)'
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'app' / 'images'
HEIGHT = 320          # hauteur finale des images
MAX_BYTES = 38 * 1024  # chaque fichier doit rester sous 40 Ko

# id du produit (nom du fichier) -> source.
OFF = {  # code-barres Open Food Facts
    'heineken': '8712000900663',
    'desperados': '3119780250110',
    'desperados-rouge': '3119783007513',
    'guinness': '50213245',
    'corona': '75037062',
    'coca': '54491472',
    'redbull': '9002490100070',
    'jack': '5099873045367',
    'jager': '4067700015082',
}
CROP_X = {'guinness': (0.0, 0.76)}  # part de la largeur à garder (ombre portée de la canette à droite)
TOL = {}  # tolérance de détourage par image si besoin (38 par défaut)
# photo du Cosmo (fichier, boîte de recadrage en pixels d'une version 1400x1050 de la photo)
COSMO = {
    'rhum': ('665d79e8-image.jpg', (205, 275, 425, 955)),      # Saint James Royal Blanc
    'vodka': ('665d79e8-image.jpg', (915, 250, 1110, 1005)),   # Eristoff
    'gin': ('5fea7658-image.jpg', (680, 330, 858, 805)),       # Bombay London Dry Gin
    'tequila': ('554c6062-image.jpg', (340, 340, 550, 1050)),  # Camino Real
    'cognac': ('905c8df1-image.jpg', (1135, 322, 1375, 930)),  # Hennessy VS
    'get27': ('5fea7658-image.jpg', (322, 85, 570, 990)),
    'get31': ('5fea7658-image.jpg', (30, 225, 290, 895)),
    'baileys': ('db6283af-image.jpg', (685, 440, 875, 1045)),
}


def get(url, dest, as_json=False):
    """GET avec User-Agent, 3 essais (l'API répond parfois 503), pause de 2 s après chaque requête."""
    for attempt in range(4):
        try:
            data = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=40).read()
            time.sleep(2)
            if as_json:
                return json.loads(data)
            dest.write_bytes(data)
            return dest
        except Exception as e:  # noqa: BLE001
            print('  essai', attempt + 1, 'échoué :', e, file=sys.stderr)
            time.sleep(6)
    raise SystemExit(f'échec : {url}')


def off_photo(code, cache):
    f = cache / f'{code}.jpg'
    if not f.exists():
        meta = get(f'https://world.openfoodfacts.org/api/v2/product/{code}.json?fields=image_front_url', None, True)
        get(meta['product']['image_front_url'], f)
    return Image.open(f).convert('RGB')


def remove_background(im, tol=38):
    """Fond uni (couleur médiane des bords) -> transparent, par remplissage depuis le pourtour."""
    w, h = im.size
    # couleur du fond : médiane de petits carrés dans les 4 coins (le produit peut toucher les bords)
    corners = [im.getpixel((x, y)) for x0, y0 in ((0, 0), (w - 6, 0), (0, h - 6), (w - 6, h - 6))
               for x in range(x0, x0 + 6) for y in range(y0, y0 + 6)]
    bg = tuple(sorted(c[i] for c in corners)[len(corners) // 2] for i in range(3))
    mark = (255, 0, 255) if sum(abs(a - b) for a, b in zip(bg, (255, 0, 255))) > 120 else (0, 255, 0)
    work = im.copy()
    seeds = [(x, 0) for x in range(0, w, 3)] + [(x, h - 1) for x in range(0, w, 3)] \
        + [(0, y) for y in range(0, h, 3)] + [(w - 1, y) for y in range(0, h, 3)]
    for s in seeds:
        px = work.getpixel(s)
        if px != mark and sum(abs(a - b) for a, b in zip(px, bg)) < tol * 3:
            ImageDraw.floodfill(work, s, mark, thresh=tol)
    mask = Image.new('L', im.size, 255)
    mp = work.load(); mk = mask.load()
    for y in range(h):
        for x in range(w):
            if mp[x, y] == mark:
                mk[x, y] = 0
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))  # lisse le bord
    out = im.convert('RGBA'); out.putalpha(mask)
    return out


def rounded(im, r):
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, fill=255)
    out = im.convert('RGBA'); out.putalpha(mask)
    return out


def finish(im, name):
    """Rogne au contenu, redimensionne à HEIGHT px de haut et enregistre en WebP (< 40 Ko)."""
    box = im.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
    if box:
        im = im.crop(box)
    scale = HEIGHT / im.height
    im = im.resize((max(1, round(im.width * scale)), HEIGHT), Image.LANCZOS)
    for q in (84, 78, 72, 66, 60, 54, 48):
        path = OUT / f'{name}.webp'
        im.save(path, 'WEBP', quality=q, method=6)
        if path.stat().st_size <= MAX_BYTES:
            break
    print(f'{name}.webp {im.width}x{im.height} {path.stat().st_size // 1024} Ko (q={q})')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cache', default='/tmp/cosmo-images')
    ap.add_argument('--photos', default='/root/.claude/uploads/0300da0b-a8ce-5d39-b829-7d58d6d018b8')
    ap.add_argument('ids', nargs='*')
    a = ap.parse_args()
    cache = Path(a.cache); cache.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    for name, code in OFF.items():
        if a.ids and name not in a.ids:
            continue
        im = off_photo(code, cache)
        if name in CROP_X:
            x0, x1 = CROP_X[name]
            im = im.crop((round(im.width * x0), 0, round(im.width * x1), im.height))
        finish(remove_background(im, TOL.get(name, 38)), name)
    for name, (file, box) in COSMO.items():
        if a.ids and name not in a.ids:
            continue
        src = Path(a.photos) / file
        if not src.exists():
            print(f'{name} : photo du Cosmo absente ({src}), sautée')
            continue
        im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
        k = im.width / 1400
        crop = im.crop(tuple(round(v * k) for v in box))
        crop.thumbnail((HEIGHT * 2, HEIGHT * 2))
        crop = crop.resize((round(crop.width * HEIGHT / crop.height), HEIGHT), Image.LANCZOS)
        finish(rounded(crop, 20), name)


if __name__ == '__main__':
    main()
