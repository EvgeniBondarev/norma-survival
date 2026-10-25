import glob
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from art_lib import *  # noqa: E402,F403

STAGE = os.path.join(ROOT, "itch-release", "stage", "NORMA_Camp_Sprite_Pack")


def stg(rel):
    return Image.open(os.path.join(STAGE, rel)).convert("RGBA")


def panel(w, h, top=(46, 49, 56), bot=(24, 26, 30), seed=2):
    """Graphite gradient panel with grain and a thin frame."""
    g = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        g.putpixel((0, y), tuple(round(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    im = g.resize((w, h))
    im = grain(im, 16, seed)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w - 1, h - 1), outline=(70, 74, 82), width=2)
    return im.convert("RGBA")


def caption(c, text, xy, size=22, fill=PAPER, anchor="mm"):
    d = ImageDraw.Draw(c)
    d.text(xy, text, font=font(size, False, True), fill=fill, anchor=anchor)


def header(title, sub, name):
    W, H = 1280, 150
    c = Image.new("RGB", (W, H), GRAPHITE)
    bg = cover_fit(Image.open(os.path.join(SPR, "08-taiga-za-kolyuchei-provolokoi.png")).convert("RGB"), W, H, (0.5, 0.55))
    bg = tint(bg, 0.42, (14, 22, 34), 0.3)
    c = snow(bg, 140, seed=hash(name) % 99).convert("RGBA")
    c = vignette(c, 0.85).convert("RGBA")
    d = ImageDraw.Draw(c)
    spaced(d, (W // 2, 34), title, font(54), SNOW, gap=10, anchor="m", shadow=(0, 0, 0))
    rule(d, W // 2 - 180, W // 2 + 180, 108, RUST, 3)
    d.text((W // 2, 126), sub, font=font(20, False, True), fill=PAPER, anchor="mm")
    grain(c, 12).convert("RGB").save(os.path.join(OUT, "hdr_%s.png" % name), optimize=True)


def fit_row(canvas, imgs, x0, x1, base, h):
    """Place sprites left to right evenly, equal height, bottom aligned at base."""
    sp = [scale_h(i, h) for i in imgs]
    total = sum(s.width for s in sp)
    while total + 30 * (len(sp) - 1) > x1 - x0:
        h = int(h * 0.95)
        sp = [scale_h(i, h) for i in imgs]
        total = sum(s.width for s in sp)
    gap = (x1 - x0 - total) / max(1, len(sp) - 1) if len(sp) > 1 else 0
    x = x0
    for s in sp:
        shadow_paste(canvas, s, (int(x), int(base - s.height)), blur=8, offset=(5, 4), opacity=0.5)
        x += s.width + gap


def characters():
    W, H = 1280, 880
    c = panel(W, H)
    d = ImageDraw.Draw(c)
    row1 = [frame(n) for n in ("idle-v0", "idle-v1", "idle-v2", "idle-v3", "idle-v4", "criminal-stand", "informer-stand")]
    row2 = [frame(n) for n in ("boss-walk", "medic-walk", "cook-c", "informer-walk", "criminal-walk", "dog-walk-right")]
    row3 = [frame(n) for n in ("pick-1", "shovel-1", "eat-0", "stove-1", "sick-2", "dead-v3", "sick-5")]
    fit_row(c, row1, 50, W - 50, 290, 230)
    fit_row(c, row2, 50, W - 50, 570, 230)
    fit_row(c, row3, 50, W - 50, 850, 230)
    # row 3 is wide (stove, bench): the loop above shrinks it to fit
    for y in (292, 572):
        d.line((40, y, W - 40, y), fill=(70, 74, 82), width=1)
    c.convert("RGB").save(os.path.join(OUT, "sec_characters.png"), optimize=True)


def items():
    W, cell, cols = 1280, 160, 8
    files = sorted(glob.glob(os.path.join(STAGE, "02_Items", "single", "*.png")))
    rows = (len(files) + cols - 1) // cols
    H = rows * (cell + 34) + 20
    c = panel(W, H, (44, 40, 36), (24, 22, 20))
    d = ImageDraw.Draw(c)
    for i, f in enumerate(files):
        im = Image.open(f).convert("RGBA")
        s = min((cell - 40) / im.width, (cell - 50) / im.height)
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        x, y = (i % cols) * cell, 14 + (i // cols) * (cell + 34)
        shadow_paste(c, im, (x + (cell - im.width) // 2, y + (cell - 30 - im.height) // 2 + 8), blur=6, offset=(3, 4))
        name = os.path.basename(f)[:-4].replace("_", " ")
        d.text((x + cell // 2, y + cell - 12), name, font=font(17, False, True), fill=PAPER, anchor="mm")
    c.convert("RGB").save(os.path.join(OUT, "sec_items.png"), optimize=True)


def ui():
    W, H = 1280, 980
    c = panel(W, H, (40, 42, 48), (22, 24, 28))
    d = ImageDraw.Draw(c)
    icons = stg("03_UI/status_icons_8.png")
    icons = icons.crop(icons.getchannel("A").getbbox())
    icons = icons.resize((760, round(icons.height * 760 / icons.width)), Image.LANCZOS)
    c.alpha_composite(icons, ((W - icons.width) // 2, 34))
    y = 34 + icons.height + 30
    btn = stg("03_UI/buttons_3_states.png")
    btn = btn.crop(btn.getchannel("A").getbbox())
    btn = scale_h(btn, 240)
    c.alpha_composite(btn, (70, y))
    frm = stg("03_UI/event_card_frame.png")
    frm = frm.crop(frm.getchannel("A").getbbox())
    frm = frm.resize((380, round(frm.height * 380 / frm.width)), Image.LANCZOS)
    c.alpha_composite(frm, (400, y))
    bar = stg("03_UI/progress_bar.png")
    bar = bar.crop(bar.getchannel("A").getbbox())
    bar = bar.resize((380, round(bar.height * 380 / bar.width)), Image.LANCZOS)
    c.alpha_composite(bar, (400, y + frm.height + 20))
    patch = stg("03_UI/prisoner_number_patch.png")
    patch = patch.crop(patch.getchannel("A").getbbox())
    patch = patch.resize((300, round(patch.height * 300 / patch.width)), Image.LANCZOS)
    c.alpha_composite(patch, (830, y))
    stamps = stg("03_UI/rubber_stamps_6.png")
    stamps = stamps.crop(stamps.getchannel("A").getbbox())
    stamps = stamps.resize((330, round(stamps.height * 330 / stamps.width)), Image.LANCZOS)
    c.alpha_composite(stamps, (815, y + patch.height + 14))
    tag = stg("03_UI/mark_tag.png")
    tag = scale_h(tag.crop(tag.getchannel("A").getbbox()), 170)
    c.alpha_composite(tag, (1150, y - 6))
    c.convert("RGB").save(os.path.join(OUT, "sec_ui.png"), optimize=True)


def backgrounds():
    W = 1280
    scenes = sorted(glob.glob(os.path.join(STAGE, "04_Backgrounds", "scenes", "*.png")))
    pick = [scenes[i] for i in (0, 2, 3, 4, 6, 10)]
    sw, sh = 632, 356
    H = 3 * (sh + 8) + 8
    c = Image.new("RGB", (W, H), GRAPHITE)
    for i, f in enumerate(pick):
        im = Image.open(f).convert("RGB").resize((sw, sh), Image.LANCZOS)
        c.paste(im, (8 + (i % 2) * (sw + 8), 8 + (i // 2) * (sh + 8)))
    c.save(os.path.join(OUT, "sec_backgrounds.png"), optimize=True)


def layers():
    """Parallax layer breakdown: four layers stacked as a 'cutaway'."""
    W, H = 1280, 230
    c = panel(W, H, (30, 33, 38), (18, 20, 23))
    base = os.path.join(STAGE, "04_Backgrounds", "parallax_layers")
    d = ImageDraw.Draw(c)
    for k, loc in enumerate(("yard", "mine", "forest", "road")):
        pass
    loc = "mine"
    for i, key in enumerate(("1_sky", "2_far", "3_mid", "4_front")):
        im = Image.open(os.path.join(base, loc, key + ".png")).convert("RGBA")
        im = im.resize((300, round(im.height * 300 / im.width)), Image.LANCZOS)
        x = 20 + i * 310
        bg = Image.new("RGBA", im.size, (70, 74, 82, 255))
        bg.alpha_composite(im)
        c.alpha_composite(bg, (x, 60))
        d.text((x + 150, 30), ["sky", "far", "mid", "front"][i].upper(), font=font(22), fill=ICE, anchor="mm")
    c.convert("RGB").save(os.path.join(OUT, "sec_layers.png"), optimize=True)


def effects():
    W, H = 1280, 520
    bg = Image.open(os.path.join(SPR, "08-taiga-za-kolyuchei-provolokoi.png")).convert("RGB")
    bg = tint(cover_fit(bg, W, H), 0.4, (14, 22, 34), 0.3)
    c = vignette(bg, 0.7).convert("RGBA")
    br = stg("05_Effects_and_Overlays/particles/breath_6.png")
    sm = stg("05_Effects_and_Overlays/particles/chimney_smoke_6.png")
    fr = [stg("05_Effects_and_Overlays/particles/stove_fire_frames/fire_%d.png" % i) for i in (1, 3, 4)]
    sl = stg("05_Effects_and_Overlays/particles/searchlight_beam.png")
    br = br.resize((360, round(br.height * 360 / br.width)), Image.LANCZOS)
    sm = sm.resize((330, round(sm.height * 330 / sm.width)), Image.LANCZOS)
    sl = sl.resize((420, round(sl.height * 420 / sl.width)), Image.LANCZOS)
    c.alpha_composite(sl, (-10, 0))
    c.alpha_composite(br, (430, 20))
    c.alpha_composite(sm, (820, 20))
    x = 380
    for f in fr:
        f = scale_h(f, 170)
        shadow_paste(c, f, (x, 320), blur=8)
        x += f.width + 20
    blz = stg("05_Effects_and_Overlays/overlays/falling_snow.png").resize((W, H), Image.LANCZOS)
    c.alpha_composite(blz)
    ed = stg("05_Effects_and_Overlays/overlays/frosted_edges.png").resize((W, H), Image.LANCZOS)
    c.alpha_composite(ed)
    d = ImageDraw.Draw(c)
    for x, t in ((130, "searchlight"), (610, "breath"), (990, "chimney smoke"), (700, "stove fire frames")):
        pass
    d.text((200, 300), "searchlight beam", font=font(22, False, True), fill=PAPER, anchor="mm")
    d.text((610, 290), "breath puffs", font=font(22, False, True), fill=PAPER, anchor="mm")
    d.text((990, 290), "chimney smoke", font=font(22, False, True), fill=PAPER, anchor="mm")
    d.text((660, 308), "stove fire loop", font=font(22, False, True), fill=PAPER, anchor="mm")
    grain(c, 12).convert("RGB").save(os.path.join(OUT, "sec_effects.png"), optimize=True)


def illustrations():
    W = 1280
    files = [
        "06_Illustrations/events/night_work.png", "06_Illustrations/events/bread_on_a_rag.png",
        "06_Illustrations/camp_life/campfire.png", "06_Illustrations/camp_life/dog_attack.png",
        "06_Illustrations/story/found_note.png", "06_Illustrations/events/whisper_in_the_barracks.png",
    ]
    tw, th = 420, 315
    c = Image.new("RGB", (W, 2 * th + 24 + 16), GRAPHITE)
    for i, rel in enumerate(files):
        im = stg(rel).convert("RGB")
        im = cover_fit(im, tw, th)
        c.paste(im, (8 + (i % 3) * (tw + 8) + 2, 8 + (i // 3) * (th + 8)))
    c.save(os.path.join(OUT, "sec_illustrations.png"), optimize=True)


def cards():
    W, H = 1280, 520
    bg = Image.open(os.path.join(STAGE, "07_Playing_Cards", "extras", "card_table_scene.png")).convert("RGB")
    c = tint(cover_fit(bg, W, H, (0.5, 0.6)), 0.5, (18, 14, 10), 0.3).convert("RGBA")
    deck = ["ace_of_spades", "king_of_hearts", "queen_of_clubs", "jack_of_diamonds", "10_of_spades", "9_of_hearts", "7_of_clubs", "6_of_diamonds"]
    n = len(deck)
    import math
    for i, name in enumerate(deck):
        im = stg("07_Playing_Cards/deck_36/%s.png" % name)
        im = scale_h(im, 400)
        ang = (i - (n - 1) / 2) * 7
        r = im.rotate(-ang, expand=True, resample=Image.BICUBIC)
        x = int(W / 2 + (i - (n - 1) / 2) * 118 - r.width / 2)
        y = int(60 + abs(i - (n - 1) / 2) * 9)
        shadow_paste(c, r, (x, y), blur=10, offset=(6, 8))
    c = vignette(c, 0.7).convert("RGBA")
    grain(c, 12).convert("RGB").save(os.path.join(OUT, "sec_cards.png"), optimize=True)


if __name__ == "__main__":
    header("CHARACTERS", "prisoners, guards, foremen, medic, cook, informer, guard dog", "characters")
    header("CAMP ITEMS", "bread, boots, tools, letters, tobacco, a wedding ring", "items")
    header("INTERFACE", "status icons, buttons, frames, stamps, ledger", "ui")
    header("BACKGROUNDS", "11 scenes, 7 locations, parallax layers", "backgrounds")
    header("WEATHER & EFFECTS", "snow, breath, smoke, fire, searchlight, frost", "effects")
    header("ILLUSTRATIONS", "event and story key art", "illustrations")
    header("PLAYING CARDS", "36 worn homemade cards", "cards")
    characters(); items(); ui(); backgrounds(); layers(); effects(); illustrations(); cards()
    print(sorted(os.listdir(OUT)))
