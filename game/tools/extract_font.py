"""Достаёт отдельные TTF из системной коллекции PT Serif (.ttc), чтобы положить шрифт в игру.

PT Serif (ParaType, свободная лицензия PT Free Font License) разрешает распространение.
Запуск: python3 -I game/tools/extract_font.py
Результат: game/fonts/PTSerif-Regular.ttf, -Bold.ttf, -Italic.ttf, -BoldItalic.ttf
"""
import os
import struct

SRC = "/System/Library/Fonts/Supplemental/PTSerif.ttc"
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "game", "fonts")


def split_ttc(data):
    tag, ver, n = struct.unpack(">4sII", data[:12])
    assert tag == b"ttcf", "это не TTC"
    return list(struct.unpack(f">{n}I", data[12:12 + 4 * n]))


def extract(data, off):
    sfnt, num = struct.unpack(">4sH", data[off:off + 6])
    recs = []
    for i in range(num):
        t, cs, o, ln = struct.unpack(">4sIII", data[off + 12 + 16 * i: off + 28 + 16 * i])
        recs.append((t, cs, o, ln))
    head_off = next(o for t, _, o, _ in recs if t == b"head")
    mac_style = struct.unpack(">H", data[head_off + 44: head_off + 46])[0]
    # новый заголовок: таблицы идут подряд с выравниванием по 4 байта
    pos = 12 + 16 * num
    new_recs, blobs = [], []
    for t, cs, o, ln in sorted(recs, key=lambda r: r[0]):
        pad = (-pos) % 4
        if pad:
            blobs.append(b"\0" * pad)
            pos += pad
        new_recs.append((t, cs, pos, ln))
        blobs.append(data[o:o + ln])
        pos += ln
    search = 1
    while search * 2 <= num:
        search *= 2
    rng = search * 16
    hdr = struct.pack(">4sHHHH", sfnt, num, rng, search.bit_length() - 1, num * 16 - rng)
    table = b"".join(struct.pack(">4sIII", *r) for r in new_recs)
    return hdr + table + b"".join(blobs), mac_style


def main():
    data = open(SRC, "rb").read()
    os.makedirs(OUT, exist_ok=True)
    names = {0: "Regular", 1: "Bold", 2: "Italic", 3: "BoldItalic"}
    for off in split_ttc(data):
        blob, mac = extract(data, off)
        path = os.path.join(OUT, f"PTSerif-{names[mac & 3]}.ttf")
        open(path, "wb").write(blob)
        print(path, len(blob) // 1024, "КБ")


if __name__ == "__main__":
    main()
