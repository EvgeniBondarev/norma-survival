"""Подключает новый лист с конвойной собакой.

Ожидается картинка 2x2: верхний ряд идёт (влево, вправо), нижний сидит (влево, вправо),
на ровном однотонном фоне. Фон вырезается заливкой от краёв.

Запуск:  python3 -I game/tools/slice_dog.py путь/к/листу.png
Результат: game/img/s/dog-*.webp и записи в game/img/sprites.json. Игра подхватит собаку сама.
"""
import json
import os
import sys
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "game", "img")
NAMES = ["walk-left", "walk-right", "sit-left", "sit-right"]
TARGET_H = 150  # собака ниже человека (человек ~250)


def runs(values, thresh, min_gap):
    """Непрерывные отрезки, где values > thresh; близкие склеиваются."""
    segs, start = [], None
    for i, v in enumerate(values):
        if v > thresh and start is None:
            start = i
        elif v <= thresh and start is not None:
            segs.append([start, i]); start = None
    if start is not None:
        segs.append([start, len(values)])
    out = []
    for sgm in segs:
        if out and sgm[0] - out[-1][1] <= min_gap:
            out[-1][1] = sgm[1]
        else:
            out.append(sgm)
    return out


def cut_background(im):
    rgb = im.convert("RGB")
    w, h = rgb.size
    mark = (255, 0, 255)
    for pt in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1)]:
        ImageDraw.floodfill(rgb, pt, mark, thresh=48)
    out = im.convert("RGBA")
    px, src = out.load(), rgb.load()
    for y in range(h):
        for x in range(w):
            if src[x, y] == mark:
                px[x, y] = (0, 0, 0, 0)
    return out


def main(path):
    im = Image.open(path)
    if im.mode == "RGBA" and im.getchannel("A").getextrema()[0] < 20:
        im = im.convert("RGBA")
    else:
        im = cut_background(im)
    W, H = im.size
    mask = im.getchannel("A").point(lambda v: 255 if v > 24 else 0)
    # ряды и столбцы ищем по пустым промежуткам, иначе уши и поводок соседей попадают в кадр
    rows = runs(list(mask.resize((1, H), Image.BOX).getdata()), 1.5, 10)
    if len(rows) != 2:
        rows = [[0, H // 2], [H // 2, H]]
    frames = []
    for r0, r1 in rows:
        band = mask.crop((0, r0, W, r1))
        cols = runs(list(band.resize((W, 1), Image.BOX).getdata()), 1.5, 10)
        if len(cols) != 2:
            cols = [[0, W // 2], [W // 2, W]]
        for c0, c1 in cols:
            c = im.crop((c0, r0, c1, r1))
            bb = c.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
            frames.append(c.crop(bb) if bb else c)
    scale = TARGET_H / max(f.height for f in frames)
    meta_path = os.path.join(OUT, "sprites.json")
    meta = json.load(open(meta_path, encoding="utf-8"))
    os.makedirs(os.path.join(OUT, "s"), exist_ok=True)
    for name, f in zip(NAMES, frames):
        f = f.resize((max(1, round(f.width * scale)), max(1, round(f.height * scale))), Image.LANCZOS)
        rel = f"s/dog-{name}.webp"
        f.save(os.path.join(OUT, rel), "WEBP", quality=88, method=6)
        meta[f"dog-{name}"] = {"file": rel, "w": f.width, "h": f.height}
    json.dump(meta, open(meta_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("собака подключена:", ", ".join(NAMES))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
