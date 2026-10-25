"""Нарезка листов спрайтов assets-webp в отдельные кадры для игры.

Запуск: python3 -I game/tools/slice_assets.py
Выход: game/img/s/*.webp, game/img/ui/*.webp, game/img/sprites.json
"""
import json
import os
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "assets-webp")
OUT = os.path.join(ROOT, "game", "img")
os.makedirs(os.path.join(OUT, "s"), exist_ok=True)
os.makedirs(os.path.join(OUT, "ui"), exist_ok=True)

META = {}


def runs(values, thresh, min_gap):
    """Непрерывные отрезки, где values > thresh; близкие отрезки склеиваются."""
    segs = []
    start = None
    for i, v in enumerate(values):
        if v > thresh and start is None:
            start = i
        elif v <= thresh and start is not None:
            segs.append([start, i])
            start = None
    if start is not None:
        segs.append([start, len(values)])
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] <= min_gap:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return merged


def colprofile(alpha):
    w, h = alpha.size
    return list(alpha.resize((w, 1), Image.BOX).getdata())


def rowprofile(alpha):
    w, h = alpha.size
    return list(alpha.resize((1, h), Image.BOX).getdata())


def split_grid(im, cols, rows):
    """Режет лист на cols x rows спрайтов по пустым промежуткам, иначе по равной сетке."""
    im = im.convert("RGBA")
    a = im.getchannel("A").point(lambda v: 255 if v > 24 else 0)
    W, H = im.size
    cells = []
    rseg = runs(rowprofile(a), 1.5, 14)
    if len(rseg) != rows:
        rseg = [[round(r * H / rows), round((r + 1) * H / rows)] for r in range(rows)]
    for r0, r1 in rseg:
        band = a.crop((0, r0, W, r1))
        cseg = runs(colprofile(band), 1.5, 14)
        if len(cseg) != cols:
            cseg = [[round(c * W / cols), round((c + 1) * W / cols)] for c in range(cols)]
        for c0, c1 in cseg:
            cells.append((c0, r0, c1, r1))
    out = []
    for box in cells:
        crop = im.crop(box)
        bb = crop.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
        out.append(crop.crop(bb) if bb else crop)
    return out


def save_sheet(name_prefix, names, path, cols, rows, target_h=256, max_w=420):
    im = Image.open(os.path.join(SRC, path))
    frames = split_grid(im, cols, rows)
    maxh = max(f.height for f in frames)
    scale = min(target_h / maxh, max_w / max(f.width for f in frames))
    for nm, f in zip(names, frames):
        w, h = max(1, round(f.width * scale)), max(1, round(f.height * scale))
        f = f.resize((w, h), Image.LANCZOS)
        rel = f"s/{name_prefix}-{nm}.webp"
        f.save(os.path.join(OUT, rel), "WEBP", quality=88, method=6)
        META[f"{name_prefix}-{nm}"] = {"file": rel, "w": w, "h": h}


def save_icons(path, names, cols, rows, size, folder, prefix):
    im = Image.open(os.path.join(SRC, path))
    frames = split_grid(im, cols, rows)
    for nm, f in zip(names, frames):
        f.thumbnail((size, size), Image.LANCZOS)
        rel = f"{folder}/{prefix}{nm}.webp"
        f.save(os.path.join(OUT, rel), "WEBP", quality=90, method=6)
        META[prefix + nm] = {"file": rel, "w": f.width, "h": f.height}


# --- заключённые ---
save_sheet("idle", [f"v{i}" for i in range(5)], "p1/prisoners/01-variants-idle.webp", 5, 1)
save_sheet("pick", [f"{i}" for i in range(4)], "p1/prisoners/02-pickaxe-cycle.webp", 4, 1)
save_sheet("shovel", [f"{i}" for i in range(8)], "p1/prisoners/03-shovel-saw.webp", 4, 2)
save_sheet("roll", [f"v{i}" for i in range(5)], "p1/prisoners/04-rollcall.webp", 5, 1)
save_sheet("eat", [f"{i}" for i in range(4)], "p1/prisoners/05-eating.webp", 4, 1)
save_sheet("sleep", [f"v{i}" for i in range(4)], "p1/prisoners/06-sleeping-bunks.webp", 4, 1)
save_sheet("stove", [f"{i}" for i in range(3)], "p1/prisoners/07-stove.webp", 3, 1)
save_sheet("sick", [f"{i}" for i in range(6)], "p1/prisoners/08-sick.webp", 3, 2)
save_sheet("dead", [f"v{i}" for i in range(4)], "p1/prisoners/09-dead.webp", 4, 1, target_h=150, max_w=460)
# --- персонажи P2 ---
save_sheet("criminal", ["stand", "walk", "c", "d"], "p2/characters/01-criminal.webp", 2, 2)
save_sheet("informer", ["stand", "walk", "c", "d"], "p2/characters/02-informer.webp", 2, 2)
save_sheet("medic", ["stand", "walk", "c", "d"], "p2/characters/03-medic.webp", 2, 2)
save_sheet("cook", ["stand", "ladle", "c", "d"], "p2/characters/04-cook.webp", 2, 2)
save_sheet("boss", ["stand", "walk", "c", "d"], "p2/characters/05-administrator.webp", 2, 2)
save_sheet("stretcher", [f"{i}" for i in range(4)], "p2/characters/06-stretcher.webp", 4, 1, target_h=240, max_w=520)

# --- предметы ---
save_icons("p2/items/01-personal-items-3x3.webp",
           ["herring", "soup", "wraps", "mittens", "photo", "ring", "needle", "letter", "matches"],
           3, 3, 128, "s", "item-")
save_icons("p2/items/02-work-items-3x3.webp",
           ["pickaxe", "shovel", "saw", "axe", "firewood", "sugar", "undershirt", "opener", "rations"],
           3, 3, 128, "s", "item-")
# базовые 9 предметов из атласа
atl = json.load(open(os.path.join(SRC, "atlas", "camp-items-256.json")))
sheet = Image.open(os.path.join(SRC, "atlas", "camp-items-256.webp")).convert("RGBA")
for fr in atl["frames"]:
    f = sheet.crop((fr["x"], fr["y"], fr["x"] + fr["w"], fr["y"] + fr["h"]))
    bb = f.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    f = f.crop(bb) if bb else f
    f.thumbnail((128, 128), Image.LANCZOS)
    rel = f"s/item-{fr['name']}.webp"
    f.save(os.path.join(OUT, rel), "WEBP", quality=90, method=6)
    META[f"item-{fr['name']}"] = {"file": rel, "w": f.width, "h": f.height}

# --- иконки статусов 4x2 ---
save_icons("p1/ui/status-icons-4x2.webp",
           ["warmth", "hunger", "strength", "health", "sanity", "frostbite", "scurvy", "typhus"],
           4, 2, 96, "ui", "icon-")

# --- кнопки: три пластины друг под другом ---
btn = Image.open(os.path.join(SRC, "p1/ui/choice-buttons-3states.webp")).convert("RGBA")
plates = split_grid(btn, 1, 3)
for nm, p in zip(["normal", "hover", "pressed"], plates):
    p.thumbnail((900, 900), Image.LANCZOS)
    rel = f"ui/btn-{nm}.webp"
    p.save(os.path.join(OUT, rel), "WEBP", quality=90, method=6)
    META["btn-" + nm] = {"file": rel, "w": p.width, "h": p.height}

# --- норма: рамка и заполнение ---
nb = Image.open(os.path.join(SRC, "p1/ui/norm-bar.webp")).convert("RGBA")
parts = split_grid(nb, 1, 2)
for nm, p in zip(["frame", "fill"], parts):
    p.thumbnail((1000, 400), Image.LANCZOS)
    rel = f"ui/norm-{nm}.webp"
    p.save(os.path.join(OUT, rel), "WEBP", quality=90, method=6)
    META["norm-" + nm] = {"file": rel, "w": p.width, "h": p.height}

# --- рамка карточки: внутренний прямоугольник для border-image ---
fr = Image.open(os.path.join(SRC, "p1/ui/event-card-frame.webp")).convert("RGBA")
a = fr.getchannel("A")
bb = a.point(lambda v: 255 if v > 24 else 0).getbbox()
fr = fr.crop(bb)
fr.thumbnail((1200, 900), Image.LANCZOS)
fr.save(os.path.join(OUT, "ui/event-frame.webp"), "WEBP", quality=90, method=6)
A = fr.getchannel("A")
cx, cy = fr.width // 2, fr.height // 2
# внутреннее отверстие: идём от центра к краям до первого плотного пикселя рамки
l = next(x for x in range(cx, -1, -1) if A.getpixel((x, cy)) > 200)
r = next(x for x in range(cx, fr.width) if A.getpixel((x, cy)) > 200)
t = next(y for y in range(cy, -1, -1) if A.getpixel((cx, y)) > 200)
b = next(y for y in range(cy, fr.height) if A.getpixel((cx, y)) > 200)
META["event-frame"] = {"file": "ui/event-frame.webp", "w": fr.width, "h": fr.height,
                       "slice": [t, fr.width - r, fr.height - b, l]}

json.dump(META, open(os.path.join(OUT, "sprites.json"), "w"), ensure_ascii=False, indent=1)
print(len(META), "assets written")
