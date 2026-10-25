#!/usr/bin/env python3
"""Build a readable 36-card homemade deck from the paper-card source texture."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'sprites/p10/cards/blank.png'
SUIT_SHEET = ROOT / 'sprites/p10/03-suit-emblems-2x2.png'
OUT = ROOT / 'sprites/p10/deck'
OUT.mkdir(parents=True, exist_ok=True)

RANKS = [('6', 6), ('7', 7), ('8', 8), ('9', 9), ('10', 10), ('В', 2), ('Д', 3), ('К', 4), ('Т', 1)]
SUITS = [('spades', '♠', '#171411'), ('hearts', '♥', '#8d2922'), ('diamonds', '♦', '#8d2922'), ('clubs', '♣', '#171411')]
RANK_FONT = '/Users/evgen/MyGame1/game/fonts/PTSerif-Bold.ttf'
SUIT_FONT = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'
rank_font = ImageFont.truetype(RANK_FONT, 42)
pip_font = ImageFont.truetype(SUIT_FONT, 58)
small_font = ImageFont.truetype(SUIT_FONT, 32)

# Отдельно нарисованные, потёртые эмблемы мастей. Их кладём на бумагу,
# а не заменяем квадратиками из системного шрифта.
sheet = Image.open(SUIT_SHEET).convert('RGBA')
sw, sh = sheet.size
cells = {
    'spades': (0, 0, sw // 2, sh // 2),
    'hearts': (sw // 2, 0, sw, sh // 2),
    'diamonds': (0, sh // 2, sw // 2, sh),
    'clubs': (sw // 2, sh // 2, sw, sh),
}

def emblem(suit_id, size, alpha):
    """Return a centered suit emblem, keeping its generated scratches and alpha."""
    mark = sheet.crop(cells[suit_id])
    bbox = mark.getbbox()
    if bbox:
        mark = mark.crop(bbox)
    mark.thumbnail((size, size), Image.Resampling.LANCZOS)
    if alpha < 255:
        a = mark.getchannel('A').point(lambda v: v * alpha // 255)
        mark.putalpha(a)
    return mark

def paste_center(dst, mark, x, y):
    dst.alpha_composite(mark, (int(x - mark.width / 2), int(y - mark.height / 2)))

positions = {
    1: [(180, 240)], 2: [(180, 145), (180, 335)], 3: [(180, 135), (180, 240), (180, 345)],
    4: [(115, 145), (245, 145), (115, 335), (245, 335)],
    5: [(115, 135), (245, 135), (180, 240), (115, 345), (245, 345)],
    6: [(115, 130), (245, 130), (115, 240), (245, 240), (115, 350), (245, 350)],
    7: [(115, 125), (245, 125), (180, 185), (115, 240), (245, 240), (115, 355), (245, 355)],
    8: [(115, 120), (245, 120), (180, 175), (115, 235), (245, 235), (180, 305), (115, 360), (245, 360)],
    9: [(115, 115), (245, 115), (115, 205), (245, 205), (180, 240), (115, 285), (245, 285), (115, 365), (245, 365)],
    10: [(115, 110), (245, 110), (115, 185), (245, 185), (180, 235), (115, 270), (245, 270), (115, 345), (245, 345), (180, 385)],
}

for suit_id, suit, color in SUITS:
    for rank, count in RANKS:
        im = Image.open(SOURCE).convert('RGBA').copy()
        ink = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ink)
        color = '#39342d' if suit_id in ('spades', 'clubs') else '#75423b'
        d.text((24, 22), rank, font=rank_font, fill=color + 'dd')
        # Ранг остаётся шрифтом, а масть — живой потёртой эмблемой.
        paste_center(ink, emblem(suit_id, 30, 200), 45, 84)
        d.text((300, 414), rank, font=rank_font, fill=color + 'c8', anchor='mm')
        paste_center(ink, emblem(suit_id, 29, 186), 300, 382)
        if rank in ('В', 'Д', 'К'):
            paste_center(ink, emblem(suit_id, 132, 175), 180, 225)
            d.text((180, 312), rank, font=rank_font, fill=color + 'bc', anchor='mm')
        else:
            for x, y in positions[count]: paste_center(ink, emblem(suit_id, 49, 184), x, y)
        im = Image.alpha_composite(im, ink)
        im.save(OUT / f'{rank}-{suit_id}.png')
