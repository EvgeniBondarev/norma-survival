import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from art_lib import *  # noqa: E402,F403

STAGE = os.path.join(ROOT, "itch-release", "stage", "NORMA_Camp_Sprite_Pack")


def stg(rel):
    return Image.open(os.path.join(STAGE, rel)).convert("RGBA")


def trim(im):
    return im.crop(im.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox())


def cell_bg(w, h, scene, focus):
    bg = cover_fit(Image.open(os.path.join(SPR, scene)).convert("RGB"), w, h, focus)
    return tint(bg, 0.5, (14, 22, 34), 0.3)


def normalise(frames, max_h, max_w):
    frames = [trim(f) for f in frames]
    s = min(max_h / max(f.height for f in frames), max_w / max(f.width for f in frames))
    return [f.resize((max(1, round(f.width * s)), max(1, round(f.height * s))), Image.LANCZOS) for f in frames]


def render_cell(bg, frames, i, label, base):
    c = bg.convert("RGBA")
    f = frames[i % len(frames)]
    shadow_paste(c, f, ((c.width - f.width) // 2, base - f.height), blur=7, offset=(4, 4), opacity=0.5)
    d = ImageDraw.Draw(c)
    d.rectangle((0, c.height - 40, c.width, c.height), fill=(10, 11, 13, 190))
    d.text((c.width // 2, c.height - 20), label, font=font(22, False, True), fill=PAPER, anchor="mm")
    d.rectangle((0, 0, c.width - 1, c.height - 1), outline=(70, 74, 82), width=1)
    return c


def make_gif(name, cells, n_frames, fps=8):
    """cells: list of (label, frames, scene, focus). Output 4 cells side by side."""
    cw, ch = 320, 380
    bgs = []
    prepared = []
    for label, frames, scene, focus in cells:
        bgs.append(snow(cell_bg(cw, ch, scene, focus), 40, seed=len(label)).convert("RGB"))
        prepared.append((label, normalise(frames, 270, 290)))
    out = []
    for t in range(n_frames):
        strip = Image.new("RGB", (cw * len(cells), ch))
        for k, (label, fr) in enumerate(prepared):
            strip.paste(render_cell(bgs[k], fr, t, label, ch - 50).convert("RGB"), (k * cw, 0))
        out.append(strip)
    # shared palette, no dithering: keeps the GIF small and stable between frames
    sheet = Image.new("RGB", (out[0].width, out[0].height * len(out)))
    for i, f in enumerate(out):
        sheet.paste(f, (0, i * f.height))
    pal = sheet.quantize(colors=160, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    frames = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in out]
    path = os.path.join(OUT, name)
    frames[0].save(path, save_all=True, append_images=frames[1:], duration=int(1000 / fps), loop=0, optimize=True, disposal=1)
    print(name, os.path.getsize(path) // 1024, "KB", len(frames), "frames")


def anims():
    cells_dir = os.path.join(SPR, "atlas", ".cells", "prisoner-walk-right-256")
    walk = [Image.open(os.path.join(cells_dir, "%d.png" % i)).convert("RGBA") for i in range(8)]
    pick = [frame("pick-%d" % i) for i in range(4)]
    shovel = [frame("shovel-%d" % i) for i in range(4)]
    saw = [frame("shovel-%d" % i) for i in range(4, 8)]
    stretch = [frame("stretcher-%d" % i) for i in range(4)]
    eat = [frame("eat-%d" % i) for i in range(4)]
    stove = [frame("stove-%d" % i) for i in range(3)]
    fire = [Image.open(os.path.join(STAGE, "05_Effects_and_Overlays", "particles", "stove_fire_frames", "fire_%d.png" % i)).convert("RGBA") for i in range(6)]
    make_gif("anim_work.gif", [
        ("walk cycle  8 frames", walk, "02-kolonna-na-marshe.png", (0.5, 0.7)),
        ("pickaxe  4", pick, "03-priisk-otkrytyi-razrez.png", (0.45, 0.6)),
        ("shovel  4", shovel, "04-lesopoval.png", (0.5, 0.6)),
        ("stretcher  4", stretch, "09-lazaret.png", (0.5, 0.6)),
    ], 8)
    make_gif("anim_camp.gif", [
        ("two-man saw  4", saw, "04-lesopoval.png", (0.8, 0.6)),
        ("eating  4", eat, "06-razdacha-balandy.png", (0.5, 0.5)),
        ("stove  3", stove, "05-barak-iznutri.png", (0.5, 0.5)),
        ("fire loop  6", fire, "07-noch-i-metel.png", (0.3, 0.7)),
    ], 12)


if __name__ == "__main__":
    anims()
