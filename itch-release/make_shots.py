import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from art_lib import *  # noqa: E402,F403

STAGE = os.path.join(ROOT, "itch-release", "stage", "NORMA_Camp_Sprite_Pack")
W, H = 1280, 720


def stg(rel):
    return Image.open(os.path.join(STAGE, rel)).convert("RGBA")


def trim(im):
    return im.crop(im.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox())


def scene(name, focus=(0.5, 0.5), dark=0.62):
    bg = cover_fit(Image.open(os.path.join(SPR, name)).convert("RGB"), W, H, focus)
    return tint(bg, dark, (14, 22, 34), 0.22).convert("RGBA")


def place(c, im, cx, base, h, flip=False, shadow=True):
    s = scale_h(trim(im), h)
    if flip:
        s = s.transpose(Image.FLIP_LEFT_RIGHT)
    xy = (int(cx - s.width / 2), int(base - s.height))
    if shadow:
        shadow_paste(c, s, xy, blur=9, offset=(6, 5), opacity=0.55)
    else:
        c.alpha_composite(s, xy)


def overlay(c, rel, opacity=1.0, size=(W, H)):
    o = stg(rel).resize(size, Image.LANCZOS)
    if opacity < 1:
        o.putalpha(o.getchannel("A").point(lambda v: int(v * opacity)))
    c.alpha_composite(o)


def finish(c, name, seed=1):
    c = vignette(c.convert("RGB"), 0.65)
    c = grain(c, 12, seed)
    c.save(os.path.join(OUT, name), optimize=True)


def caption(c, text):
    d = ImageDraw.Draw(c)
    d.rectangle((0, H - 46, W, H), fill=(8, 9, 11, 200))
    d.text((24, H - 23), text, font=font(22, False, True), fill=PAPER, anchor="lm")


def shot_mine():
    c = scene("03-priisk-otkrytyi-razrez.png", (0.5, 0.55))
    for cx, base, n, h in ((300, 690, "pick-1", 470), (640, 700, "pick-3", 500), (1000, 690, "shovel-1", 480)):
        place(c, frame(n), cx, base, h)
    overlay(c, "05_Effects_and_Overlays/overlays/falling_snow.png", 0.9)
    c = snow(c, 260, seed=4).convert("RGBA")
    caption(c, "Open-pit mine – scene + pickaxe & shovel frames")
    finish(c, "shot_mine.png", 1)


def shot_barracks():
    c = scene("05-barak-iznutri.png", (0.5, 0.5), 0.7)
    place(c, frame("stove-0"), 330, 700, 560)
    place(c, frame("eat-1"), 800, 700, 430)
    place(c, frame("sick-3"), 1100, 700, 340)
    overlay(c, "05_Effects_and_Overlays/overlays/frosted_edges.png", 0.8)
    caption(c, "Barracks – stove, eating & sick frames, frost overlay")
    finish(c, "shot_barracks.png", 2)


def shot_night():
    c = scene("08-taiga-za-kolyuchei-provolokoi.png", (0.5, 0.5), 0.45)
    sl = stg("05_Effects_and_Overlays/particles/searchlight_beam.png").resize((W, H), Image.LANCZOS)
    c.alpha_composite(sl)
    guard = Image.open(os.path.join(SPR, "characters", "guard-poses.png")).convert("RGBA")
    cw, ch = guard.width // 2, guard.height // 2
    g = guard.crop((cw, ch, cw * 2, ch * 2))
    place(c, g, 330, 690, 560)
    place(c, frame("dog-walk-right"), 640, 690, 210)
    place(c, frame("criminal-stand"), 960, 690, 480)
    snow_c = snow(c, 340, seed=6)
    c = snow_c.convert("RGBA")
    caption(c, "Night watch – guard, dog, searchlight, barbed-wire scene")
    finish(c, "shot_night.png", 3)


def shot_march():
    pano = stg("04_Backgrounds/parallax/march_panorama_3840x1080.png").convert("RGB")
    bg = cover_fit(pano.crop((900, 0, 900 + 1920, 1080)), W, H, (0.5, 0.5))
    c = tint(bg, 0.7, (14, 22, 34), 0.2).convert("RGBA")
    cells = os.path.join(SPR, "atlas", ".cells", "prisoner-walk-right-256")
    for i in range(6):
        im = Image.open(os.path.join(cells, "%d.png" % i)).convert("RGBA")
        place(c, im, 150 + i * 200, 690 - (i % 2) * 8, 430)
    overlay(c, "05_Effects_and_Overlays/overlays/falling_snow.png", 0.9)
    c = snow(c, 240, seed=8).convert("RGBA")
    caption(c, "The march – 3840×1080 panorama + 8-frame walk cycle")
    finish(c, "shot_march.png", 4)


def shot_layers():
    base = os.path.join(STAGE, "04_Backgrounds", "parallax_layers", "forest")
    sky = cover_fit(Image.open(os.path.join(base, "1_sky.png")).convert("RGB"), W, H)
    c = tint(sky, 0.8, (14, 22, 34), 0.2).convert("RGBA")
    for key, hh, y in (("2_far", 420, 190), ("3_mid", 520, 250), ("4_front", 470, 330)):
        im = Image.open(os.path.join(base, key + ".png")).convert("RGBA")
        k = max(W / im.width, hh / im.height)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        im = im.crop((0, 0, W, im.height))
        c.alpha_composite(im, (0, H - im.height - (0 if key == "4_front" else 40 if key == "3_mid" else 110)))
    for cx, base_y, n, h in ((260, 700, "criminal-walk", 330), (440, 704, "idle-v1", 340), (900, 700, "boss-walk", 350)):
        place(c, frame(n), cx, base_y, h)
    c = snow(c, 300, seed=9).convert("RGBA")
    caption(c, "Four parallax layers per location – sky, far, mid, front")
    finish(c, "shot_parallax.png", 5)


def shot_ui():
    c = scene("11-titulnyi-ekran.png", (0.5, 0.5), 0.35)
    # event card: illustration under the frame
    ill = cover_fit(stg("06_Illustrations/events/bread_on_a_rag.png").convert("RGB"), 700, 400).convert("RGBA")
    frm = stg("03_UI/event_card_frame.png")
    frm = frm.crop(frm.getchannel("A").getbbox())
    frm = frm.resize((720, round(frm.height * 720 / frm.width)), Image.LANCZOS)
    fx, fy = 70, 40
    ill = cover_fit(stg("06_Illustrations/events/bread_on_a_rag.png").convert("RGB"), 660, 380).convert("RGBA")
    c.alpha_composite(ill, (fx + 30, fy + 30))
    c.alpha_composite(frm, (fx, fy))
    d = ImageDraw.Draw(c)
    d.text((fx + 360, fy + frm.height + 28), "A heel of bread on a rag. Three men are watching it.", font=font(22, False, True), fill=SNOW, anchor="mm")
    sheet = stg("03_UI/buttons_3_states.png")
    h3 = sheet.height // 3
    labels = ["Split it", "Hide it", "Eat it now"]
    by = fy + frm.height + 70
    for i, lab in enumerate(labels):
        b = trim(sheet.crop((0, i * h3, sheet.width, (i + 1) * h3)))
        b = b.resize((224, round(b.height * 224 / b.width)), Image.LANCZOS)
        bx = fx + 20 + i * 244
        c.alpha_composite(b, (bx, by))
        ImageDraw.Draw(c).text((bx + b.width // 2, by + b.height // 2), lab, font=font(24), fill=(18, 20, 24), anchor="mm")
    # HUD column
    icons = stg("03_UI/status_icons_8.png")
    iw, ih = icons.width // 4, icons.height // 2
    px, py = 900, 70
    panel_w, panel_h = 330, 560
    d = ImageDraw.Draw(c)
    d.rounded_rectangle((px, py, px + panel_w, py + panel_h), 10, fill=(14, 16, 19, 215), outline=(80, 84, 92), width=2)
    d.text((px + panel_w // 2, py + 34), "BRIGADE  № 284", font=font(26), fill=SNOW, anchor="mm")
    names = ["warmth", "hunger", "strength", "health", "sanity", "frostbite", "scurvy", "typhus"]
    vals = [0.55, 0.3, 0.45, 0.7, 0.6, 0.15, 0.1, 0.05]
    for i, (n, v) in enumerate(zip(names, vals)):
        ic = trim(icons.crop(((i % 4) * iw, (i // 4) * ih, (i % 4 + 1) * iw, (i // 4 + 1) * ih)))
        ic = scale_h(ic, 46)
        y = py + 80 + i * 56
        c.alpha_composite(ic, (px + 22, y))
        d.text((px + 90, y + 8), n.capitalize(), font=font(19, False, True), fill=PAPER)
        d.rectangle((px + 90, y + 32, px + 90 + 200, y + 40), fill=(40, 43, 49))
        d.rectangle((px + 90, y + 32, px + 90 + int(200 * v), y + 40), fill=RUST if v < 0.35 else ICE)
    caption(c, "UI kit demo – event card frame, 3-state buttons, status icons, number patch")
    finish(c, "shot_ui.png", 6)


if __name__ == "__main__":
    shot_mine(); shot_barracks(); shot_night(); shot_march(); shot_layers(); shot_ui()
    print("ok")
