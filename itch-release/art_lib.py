"""Shared helpers for building itch.io page art in the NORMA look."""
import os
import random

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SPR = os.path.join(ROOT, "sprites")
GIMG = os.path.join(ROOT, "game", "img")
FONTS = os.path.join(ROOT, "game", "fonts")
OUT = os.path.join(ROOT, "itch-release", "page")
os.makedirs(OUT, exist_ok=True)

GRAPHITE = (20, 22, 26)
ASH = (42, 45, 51)
SNOW = (232, 236, 239)
ICE = (143, 180, 201)
RUST = (181, 83, 47)
PAPER = (203, 185, 143)


def font(size, bold=True, italic=False):
    name = "PTSerif-" + ("BoldItalic" if bold and italic else "Bold" if bold else "Italic" if italic else "Regular")
    return ImageFont.truetype(os.path.join(FONTS, name + ".ttf"), size)


def frame(name):
    """Single transparent game frame by file stem, e.g. 'boss-walk'."""
    return Image.open(os.path.join(GIMG, "s", name + ".webp")).convert("RGBA")


def sprite(rel):
    return Image.open(os.path.join(SPR, rel)).convert("RGBA")


def cover_fit(im, w, h, focus=(0.5, 0.5)):
    """Scale + crop to exactly w x h."""
    s = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x = round((im.width - w) * focus[0])
    y = round((im.height - h) * focus[1])
    return im.crop((x, y, x + w, y + h))


def tint(im, dark=0.55, cold=(16, 24, 34), amount=0.25):
    im = ImageEnhance.Brightness(im.convert("RGB")).enhance(dark)
    over = Image.new("RGB", im.size, cold)
    return Image.blend(im, over, amount)


def vignette(im, strength=0.75):
    w, h = im.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((-w * 0.25, -h * 0.35, w * 1.25, h * 1.35), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(min(w, h) * 0.18))
    dark = Image.new("RGB", (w, h), (4, 5, 7))
    return Image.composite(im.convert("RGB"), Image.blend(im.convert("RGB"), dark, strength), mask)


def snow(im, n=260, seed=1, size=(1, 3), alpha=(110, 230)):
    random.seed(seed)
    base = im.convert("RGBA")
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(n):
        x, y = random.randrange(base.width), random.randrange(base.height)
        r = random.choice(range(size[0], size[1] + 1))
        a = random.randint(*alpha)
        d.ellipse((x, y, x + r, y + r), fill=(240, 245, 250, a))
    layer = layer.filter(ImageFilter.GaussianBlur(0.6))
    return Image.alpha_composite(base, layer).convert("RGB")


def grain(im, amount=14, seed=3):
    random.seed(seed)
    noise = Image.effect_noise(im.size, amount).convert("L")
    noise = ImageEnhance.Contrast(noise).enhance(1.0)
    n = Image.merge("RGB", (noise, noise, noise))
    return Image.blend(im.convert("RGB"), Image.blend(im.convert("RGB"), n, 0.5), 0.12)


def shadow_paste(canvas, spr, xy, blur=14, offset=(0, 0), opacity=0.6):
    """Paste RGBA sprite with a soft drop shadow. canvas is RGBA."""
    a = spr.getchannel("A")
    sh = Image.new("RGBA", spr.size, (0, 0, 0, 255))
    sh.putalpha(a.point(lambda v: int(v * opacity)))
    pad = blur * 3
    big = Image.new("RGBA", (spr.width + pad * 2, spr.height + pad * 2), (0, 0, 0, 0))
    big.paste(sh, (pad, pad))
    big = big.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(big, (xy[0] - pad + offset[0], xy[1] - pad + offset[1]))
    canvas.alpha_composite(spr, xy)


def scale_h(im, h):
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)


def text_shadow(d, xy, text, f, fill=SNOW, shadow=(0, 0, 0), off=3, anchor="la", spacing=0):
    x, y = xy
    for dx, dy in ((off, off), (off, 0), (0, off), (-1, off)):
        d.text((x + dx, y + dy), text, font=f, fill=shadow, anchor=anchor, spacing=spacing)
    d.text(xy, text, font=f, fill=fill, anchor=anchor, spacing=spacing)


def spaced(d, xy, text, f, fill, gap=8, anchor="l", shadow=None):
    """Letter-spaced text. anchor l = left, m = centered."""
    widths = [d.textlength(c, font=f) for c in text]
    total = sum(widths) + gap * (len(text) - 1)
    x, y = xy
    if anchor == "m":
        x -= total / 2
    for c, w in zip(text, widths):
        if shadow:
            d.text((x + 2, y + 2), c, font=f, fill=shadow)
        d.text((x, y), c, font=f, fill=fill)
        x += w + gap
    return total


def rule(d, x0, x1, y, color=RUST, w=3):
    d.line((x0, y, x1, y), fill=color, width=w)
