"""Убирает из слоя march-mid-wire.webp чёрный столб-«маяк» с оттяжками (мусор векторной заготовки).

Результат: game/img/march-wire.webp (оригинал в assets-webp не трогаем).
"""
import os
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
src = os.path.join(ROOT, "assets-webp", "parallax", "march-mid-wire.webp")
dst = os.path.join(ROOT, "game", "img", "march-wire.webp")
im = Image.open(src).convert("RGBA")
w, h = im.size
k = w / 1920  # координаты столба сняты с превью шириной 1920
box = (int(1545 * k), int(205 * k), int(1710 * k), int(372 * k))
clear = Image.new("RGBA", (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0))
im.paste(clear, box[:2])
im.save(dst, "WEBP", quality=90, method=6)
print("готово:", dst, box)
