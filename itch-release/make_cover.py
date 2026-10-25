import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from art_lib import *  # noqa: E402,F403


def quad(rel, i, cols=2, rows=2):
    im = sprite(rel)
    cw, ch = im.width // cols, im.height // rows
    c = im.crop(((i % cols) * cw, (i // cols) * ch, (i % cols + 1) * cw, (i // cols + 1) * ch))
    return c.crop(c.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox())


def backdrop(w, h, scene, focus=(0.5, 0.5), dark=0.5):
    bg = cover_fit(Image.open(os.path.join(SPR, scene)).convert("RGB"), w, h, focus)
    bg = tint(bg, dark, (14, 22, 34), 0.28)
    bg = snow(bg, n=int(w * h / 3500), seed=7)
    return bg.convert("RGBA")


def lineup(canvas, h, baseline, xs, names):
    """names: list of PIL images (already RGBA), heights scaled to h each."""
    for x, im in zip(xs, names):
        s = scale_h(im, int(h))
        shadow_paste(canvas, s, (int(x - s.width / 2), int(baseline - s.height)), blur=10, offset=(8, 6), opacity=0.55)


def title_block(canvas, cx, y, big, small, sub):
    d = ImageDraw.Draw(canvas)
    w = spaced(d, (cx, y), "NORMA", font(big), SNOW, gap=int(big * 0.12), anchor="m", shadow=(0, 0, 0))
    y2 = y + int(big * 1.12)
    rule(d, cx - w / 2, cx + w / 2, y2, RUST, max(3, big // 28))
    spaced(d, (cx, y2 + int(small * 0.5)), sub, font(small), ICE, gap=int(small * 0.22), anchor="m", shadow=(0, 0, 0))


def cover():
    W, H = 1260, 1000
    c = backdrop(W, H, "07-noch-i-metel.png", (0.5, 0.35), 0.55)
    prisoner = frame("criminal-walk")
    boss = frame("boss-walk")
    guard = quad("characters/guard-poses.png", 2)
    pick = frame("pick-1")
    dog = frame("dog-walk-right")
    cook = frame("cook-ladle")
    base = 940
    lineup(c, 560, base, [190, 410, 640, 900, 1110],
           [guard, prisoner, pick, boss, cook])
    s = scale_h(dog, 200)
    shadow_paste(c, s, (780, base - s.height + 4), blur=8, offset=(6, 4))
    d = ImageDraw.Draw(c)
    # bottom fade for text legibility and vignette
    c = vignette(c, 0.8).convert("RGBA")
    title_block(c, W // 2, 70, 150, 34, "CAMP SPRITE PACK")
    d = ImageDraw.Draw(c)
    d.text((W // 2, 305), "ENGRAVED  ·  MONOCHROME  ·  1940s", font=font(24, bold=False, italic=True), fill=PAPER, anchor="mm")
    rgb = grain(c, 12).convert("RGB")
    rgb.save(os.path.join(OUT, "cover.png"), optimize=True)
    rgb.resize((630, 500), Image.LANCZOS).save(os.path.join(OUT, "cover_630x500.png"), optimize=True)


def banner():
    W, H = 1600, 640
    c = backdrop(W, H, "02-kolonna-na-marshe.png", (0.5, 0.45), 0.6)
    guard = quad("characters/guard-poses.png", 3)
    foreman = quad("characters/foreman-poses.png", 3)
    base = 612
    items = [frame("criminal-walk"), frame("idle-v1"), frame("medic-walk"), frame("informer-walk"),
             frame("cook-walk" if os.path.exists(os.path.join(GIMG, "s", "cook-walk.webp")) else "cook-stand"),
             foreman, guard]
    lineup(c, 300, base, [160, 330, 500, 680, 850, 1010, 1180], items)
    dog = scale_h(frame("dog-walk-right"), 120)
    shadow_paste(c, dog, (1280, base - dog.height), blur=7, offset=(5, 3))
    c = vignette(c, 0.85).convert("RGBA")
    d = ImageDraw.Draw(c)
    spaced(d, (60, 70), "NORMA", font(118), SNOW, gap=14, shadow=(0, 0, 0))
    rule(d, 62, 560, 214, RUST, 5)
    spaced(d, (62, 232), "CAMP SPRITE PACK", font(34), ICE, gap=8, shadow=(0, 0, 0))
    d.text((62, 288), "300+ game-ready assets for bleak 1940s survival stories", font=font(26, False, True), fill=PAPER)
    rgb = grain(c, 12).convert("RGB")
    rgb.save(os.path.join(OUT, "banner_1600x640.png"), optimize=True)


if __name__ == "__main__":
    cover()
    banner()
    print("ok")
