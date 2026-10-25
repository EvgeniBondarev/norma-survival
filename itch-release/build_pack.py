"""Stage the NORMA sprite pack for itch.io and zip it.

Usage: python3 -I itch-release/build_pack.py
Output: itch-release/stage/, itch-release/dist/*.zip
"""
import glob
import hashlib
import os
import shutil
import zipfile

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SPR = os.path.join(ROOT, "sprites")
GIMG = os.path.join(ROOT, "game", "img")
REL = os.path.join(ROOT, "itch-release")
STAGE = os.path.join(REL, "stage")
DIST = os.path.join(REL, "dist")
PACK = "NORMA_Camp_Sprite_Pack"

# (source glob relative to sprites/, destination dir relative to the pack root)
COPY = [
    # 01 characters
    ("p1/prisoners/01-variants-idle.png", "01_Characters/sheets/prisoner_idle_variants.png"),
    ("p1/prisoners/02-pickaxe-cycle.png", "01_Characters/sheets/prisoner_pickaxe_cycle.png"),
    ("p1/prisoners/03-shovel-saw.png", "01_Characters/sheets/prisoner_shovel_and_two_man_saw.png"),
    ("p1/prisoners/04-rollcall.png", "01_Characters/sheets/prisoner_roll_call.png"),
    ("p1/prisoners/05-eating.png", "01_Characters/sheets/prisoner_eating.png"),
    ("p1/prisoners/06-sleeping-bunks.png", "01_Characters/sheets/prisoner_sleeping_on_bunks.png"),
    ("p1/prisoners/07-stove.png", "01_Characters/sheets/prisoner_at_the_stove.png"),
    ("p1/prisoners/08-sick.png", "01_Characters/sheets/prisoner_sick_and_helped.png"),
    ("p1/prisoners/09-dead.png", "01_Characters/sheets/prisoner_collapsed_dead.png"),
    ("p1/prisoners/10-walk-cycle-right.png", "01_Characters/sheets/prisoner_walk_cycle_right.png"),
    ("characters/prisoner-poses.png", "01_Characters/sheets/prisoner_poses.png"),
    ("characters/guard-poses.png", "01_Characters/sheets/guard_poses.png"),
    ("characters/foreman-poses.png", "01_Characters/sheets/foreman_poses.png"),
    ("p2/characters/01-criminal.png", "01_Characters/sheets/criminal_walk.png"),
    ("p2/characters/02-informer.png", "01_Characters/sheets/informer_walk_and_ladle.png"),
    ("p2/characters/03-medic.png", "01_Characters/sheets/medic_walk_and_kit.png"),
    ("p2/characters/04-cook.png", "01_Characters/sheets/cook_walk_and_ladle.png"),
    ("p2/characters/05-administrator.png", "01_Characters/sheets/camp_chief_walk.png"),
    ("p2/characters/06-stretcher.png", "01_Characters/sheets/stretcher_carry.png"),
    ("atlas/foreman-256.png", "01_Characters/atlases_256/foreman_256.png"),
    ("atlas/foreman-256.json", "01_Characters/atlases_256/foreman_256.json"),
    ("atlas/guard-256.png", "01_Characters/atlases_256/guard_256.png"),
    ("atlas/guard-256.json", "01_Characters/atlases_256/guard_256.json"),
    ("atlas/prisoner-actions-256.png", "01_Characters/atlases_256/prisoner_actions_256.png"),
    ("atlas/prisoner-actions-256.json", "01_Characters/atlases_256/prisoner_actions_256.json"),
    ("atlas/prisoner-walk-right-256.png", "01_Characters/atlases_256/prisoner_walk_right_256.png"),
    ("atlas/prisoner-walk-right-256.json", "01_Characters/atlases_256/prisoner_walk_right_256.json"),
    ("p5/01-presentka-portraits-3x2.png", "01_Characters/portraits/portraits_set_1.png"),
    ("p6/01-camp-arcs-portraits-3x2.png", "01_Characters/portraits/portraits_set_2.png"),
    # 02 items
    ("items/camp-items-sheet.png", "02_Items/camp_items_9.png"),
    ("atlas/camp-items-256.json", "02_Items/camp_items_9_atlas.json"),
    ("p2/items/01-personal-items-3x3.png", "02_Items/personal_items_9.png"),
    ("p2/items/02-work-items-3x3.png", "02_Items/work_items_9.png"),
    # 03 ui
    ("p1/ui/status-icons-4x2.png", "03_UI/status_icons_8.png"),
    ("p1/ui/choice-buttons-3states.png", "03_UI/buttons_3_states.png"),
    ("p1/ui/event-card-frame.png", "03_UI/event_card_frame.png"),
    ("p1/ui/norm-bar.png", "03_UI/progress_bar.png"),
    ("p1/ui/panel-backgrounds-3x1.png", "03_UI/panel_backgrounds_3.png"),
    ("interface/norma-logo-v1.png", "03_UI/logo_norma.png"),
    ("interface/prisoner-number-patch-284.png", "03_UI/prisoner_number_patch.png"),
    ("interface/prisoner-number-patch-284-clean.png", "03_UI/prisoner_number_patch_blank_bg.png"),
    ("interface/rubber-stamps-sheet.png", "03_UI/rubber_stamps_6.png"),
    ("interface/mark-tag.png", "03_UI/mark_tag.png"),
    ("interface/ledger-page.png", "03_UI/ledger_page_filled.png"),
    ("interface/ledger-page-blank.png", "03_UI/ledger_page_blank.png"),
    ("p3/05-cursor.png", "03_UI/cursor.png"),
    ("p3/06-favicon.png", "03_UI/favicon_prisoner_stripes.png"),
    ("p3/04-logo-texture.png", "03_UI/logo_texture.png"),
    ("p3/07-work-tiles-3x1.png", "03_UI/work_tiles_3.png"),
    ("p3/01-death-ledger.png", "03_UI/death_ledger_book.png"),
    # 04 backgrounds
    ("01-proverka-na-rassvete.png", "04_Backgrounds/scenes/roll_call_at_dawn.png"),
    ("02-kolonna-na-marshe.png", "04_Backgrounds/scenes/column_on_the_march.png"),
    ("03-priisk-otkrytyi-razrez.png", "04_Backgrounds/scenes/open_pit_mine.png"),
    ("04-lesopoval.png", "04_Backgrounds/scenes/logging_site.png"),
    ("05-barak-iznutri.png", "04_Backgrounds/scenes/barracks_interior.png"),
    ("06-razdacha-balandy.png", "04_Backgrounds/scenes/soup_line.png"),
    ("07-noch-i-metel.png", "04_Backgrounds/scenes/night_and_blizzard.png"),
    ("08-taiga-za-kolyuchei-provolokoi.png", "04_Backgrounds/scenes/taiga_behind_barbed_wire.png"),
    ("09-lazaret.png", "04_Backgrounds/scenes/infirmary.png"),
    ("10-mogilnoe-pole.png", "04_Backgrounds/scenes/burial_field.png"),
    ("11-titulnyi-ekran.png", "04_Backgrounds/scenes/title_screen_snowfield.png"),
    ("p2/locations/01-arrival.png", "04_Backgrounds/locations/arrival.png"),
    ("p2/locations/02-checkpoint.png", "04_Backgrounds/locations/checkpoint.png"),
    ("p2/locations/03-punishment-cell.png", "04_Backgrounds/locations/punishment_cell.png"),
    ("p2/locations/04-bathhouse.png", "04_Backgrounds/locations/bathhouse.png"),
    ("p2/locations/05-kitchen-window.png", "04_Backgrounds/locations/kitchen_window.png"),
    ("p2/locations/06-commander-office.png", "04_Backgrounds/locations/commander_office.png"),
    ("p2/locations/07-morgue.png", "04_Backgrounds/locations/morgue.png"),
    ("parallax/march-panorama-3840x1080.png", "04_Backgrounds/parallax/march_panorama_3840x1080.png"),
    ("parallax/march-mid-wire.png", "04_Backgrounds/parallax/march_mid_wire_layer.png"),
    ("parallax/march-parallax.json", "04_Backgrounds/parallax/march_parallax.json"),
    # 05 effects
    ("p1/particles/breath-3x2.png", "05_Effects_and_Overlays/particles/breath_6.png"),
    ("p1/particles/chimney-smoke-3x2.png", "05_Effects_and_Overlays/particles/chimney_smoke_6.png"),
    ("p1/particles/stove-fire-3x2.png", "05_Effects_and_Overlays/particles/stove_fire_6.png"),
    ("p1/particles/searchlight.png", "05_Effects_and_Overlays/particles/searchlight_beam.png"),
    ("p1/overlays/blizzard-layers.png", "05_Effects_and_Overlays/overlays/blizzard_layers.png"),
    ("p1/overlays/death-fade.png", "05_Effects_and_Overlays/overlays/death_fade.png"),
    ("p1/overlays/frostbite.png", "05_Effects_and_Overlays/overlays/frostbite_edges.png"),
    ("p1/overlays/hunger-vignette.png", "05_Effects_and_Overlays/overlays/hunger_vignette.png"),
    ("overlays/falling-snow-transparent.png", "05_Effects_and_Overlays/overlays/falling_snow.png"),
    ("overlays/frosted-edges.png", "05_Effects_and_Overlays/overlays/frosted_edges.png"),
    ("overlays/film-grain-seamless.png", "05_Effects_and_Overlays/textures/film_grain_seamless.png"),
    ("overlays/old-paper-seamless.png", "05_Effects_and_Overlays/textures/old_paper_seamless.png"),
    # 06 illustrations
    ("events/01-nochnaya-rabota.png", "06_Illustrations/events/night_work.png"),
    ("events/02-izmerenie-u-skaly.png", "06_Illustrations/events/measuring_at_the_rock.png"),
    ("events/03-hleb-na-vetoshi.png", "06_Illustrations/events/bread_on_a_rag.png"),
    ("events/04-ruki-v-obmotkah.png", "06_Illustrations/events/hands_in_rags.png"),
    ("events/05-shepot-v-barake.png", "06_Illustrations/events/whisper_in_the_barracks.png"),
    ("events/06-na-doroge.png", "06_Illustrations/events/on_the_road.png"),
    ("events/07-valenki-v-temnote.png", "06_Illustrations/events/felt_boots_in_the_dark.png"),
    ("p2/events/01-informing.png", "06_Illustrations/camp_life/informing.png"),
    ("p2/events/02-bread-theft.png", "06_Illustrations/camp_life/bread_theft.png"),
    ("p2/events/03-escape-shot.png", "06_Illustrations/camp_life/escape_shot.png"),
    ("p2/events/04-release-to-die.png", "06_Illustrations/camp_life/release_to_die.png"),
    ("p2/events/05-extended-sentence.png", "06_Illustrations/camp_life/extended_sentence.png"),
    ("p2/events/06-punishment-cell.png", "06_Illustrations/camp_life/punishment_cell.png"),
    ("p2/events/07-typhus-quarantine.png", "06_Illustrations/camp_life/typhus_quarantine.png"),
    ("p2/events/08-neighbor-death.png", "06_Illustrations/camp_life/neighbor_death.png"),
    ("p2/events/09-search.png", "06_Illustrations/camp_life/search.png"),
    ("p2/events/10-ration-distribution.png", "06_Illustrations/camp_life/ration_distribution.png"),
    ("p2/events/11-campfire.png", "06_Illustrations/camp_life/campfire.png"),
    ("p2/events/12-dog-attack.png", "06_Illustrations/camp_life/dog_attack.png"),
    ("p2/events/13-frostbite-treatment.png", "06_Illustrations/camp_life/frostbite_treatment.png"),
    ("p3/02-ending-release.png", "06_Illustrations/story/ending_release.png"),
    ("p3/03-ending-extended.png", "06_Illustrations/story/ending_extended.png"),
    ("p4/01-found-note.png", "06_Illustrations/story/found_note.png"),
    ("p4/02-note-reading-page.png", "06_Illustrations/story/note_reading_page.png"),
    ("p4/03-paper-scraps-sheet.png", "06_Illustrations/story/paper_scraps_sheet.png"),
    ("p4/04-gloved-hand-note.png", "06_Illustrations/story/gloved_hand_note.png"),
    ("p5/02-presentka-aftermath.png", "06_Illustrations/story/barrack_aftermath.png"),
    ("p5/03-barrack-dialogue-table.png", "06_Illustrations/story/barrack_dialogue_table.png"),
    ("p6/02-lunev-bread.png", "06_Illustrations/story/bread_dispute.png"),
    ("p6/03-sivyi-trade.png", "06_Illustrations/story/barrel_trade.png"),
    ("p6/04-kochetkov-search.png", "06_Illustrations/story/search_in_the_snow.png"),
    ("p6/05-third-marker-trap.png", "06_Illustrations/story/marker_trap.png"),
    ("p7/01-single-measure-announcement.png", "06_Illustrations/story/single_measure_announcement.png"),
    ("p7/02-single-measure-work.png", "06_Illustrations/story/single_measure_work.png"),
    ("p7/03-single-measure-night-path.png", "06_Illustrations/story/single_measure_night_path.png"),
    ("p8/01-solidol-barrel.png", "06_Illustrations/story/grease_barrel.png"),
    ("p9/01-first-trail-order.png", "06_Illustrations/story/first_trail.png"),
    ("p9/02-dry-ration-visible.png", "06_Illustrations/story/dry_ration.png"),
    ("p9/03-parcel-after-inspection.png", "06_Illustrations/story/parcel_after_inspection.png"),
    ("p9/04-witness-at-the-door.png", "06_Illustrations/story/witness_at_the_door.png"),
    # 07 cards
    ("p10/cards/back.png", "07_Playing_Cards/extras/card_back.png"),
    ("p10/cards/blank.png", "07_Playing_Cards/extras/card_blank.png"),
    ("p10/cards/club.png", "07_Playing_Cards/extras/card_club_ace_style.png"),
    ("p10/cards/queen.png", "07_Playing_Cards/extras/card_queen_hearts_style.png"),
    ("p10/cards/spade.png", "07_Playing_Cards/extras/card_spade_ace_style.png"),
    ("p10/cards/ten.png", "07_Playing_Cards/extras/card_ten_spades_style.png"),
    ("p10/01-homemade-cards-3x2.png", "07_Playing_Cards/extras/homemade_cards_sheet.png"),
    ("p10/02-card-table.png", "07_Playing_Cards/extras/card_table_scene.png"),
    ("p10/03-suit-emblems-2x2.png", "07_Playing_Cards/extras/suit_emblems_4.png"),
]

RANK = {"В": "jack", "Д": "queen", "К": "king", "Т": "ace"}


def put(src, rel):
    dst = os.path.join(STAGE, PACK, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)


def webp_to_png(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    Image.open(src).convert("RGBA").save(dst, optimize=True)


def main():
    if os.path.isdir(STAGE):
        shutil.rmtree(STAGE)
    os.makedirs(DIST, exist_ok=True)
    missing = []
    for src, rel in COPY:
        p = os.path.join(SPR, src)
        if os.path.exists(p):
            put(p, rel)
        else:
            missing.append(src)
    layers = {"01-sky": "1_sky", "02-far": "2_far", "03-mid": "3_mid", "04-front": "4_front"}
    for loc in ("yard", "mine", "forest", "road"):
        for key, label in layers.items():
            put(os.path.join(SPR, "p1", "backgrounds", loc, key + ".png"),
                "04_Backgrounds/parallax_layers/%s/%s.png" % (loc, label))
    for p in sorted(glob.glob(os.path.join(SPR, "p10", "deck", "*.png"))):
        name = os.path.basename(p)[:-4]
        rank, suit = name.split("-")
        rank = RANK.get(rank, rank)
        put(p, "07_Playing_Cards/deck_36/%s_of_%s.png" % (rank, suit))

    # individual transparent frames used by the browser game, converted to PNG
    frames_dir = os.path.join(STAGE, PACK, "01_Characters", "frames")
    items_dir = os.path.join(STAGE, PACK, "02_Items", "single")
    ui_dir = os.path.join(STAGE, PACK, "03_UI", "single")
    for p in sorted(glob.glob(os.path.join(GIMG, "s", "*.webp"))):
        base = os.path.basename(p)[:-5].replace("-", "_")
        if base.startswith("item_"):
            webp_to_png(p, os.path.join(items_dir, base[5:] + ".png"))
        else:
            webp_to_png(p, os.path.join(frames_dir, base + ".png"))
    for p in sorted(glob.glob(os.path.join(GIMG, "ui", "*.webp"))):
        base = os.path.basename(p)[:-5].replace("-", "_")
        webp_to_png(p, os.path.join(ui_dir, base + ".png"))
    # stove fire frames come from the 3x2 sheet
    fire = Image.open(os.path.join(SPR, "p1/particles/stove-fire-3x2.png")).convert("RGBA")
    cw, ch = fire.width // 3, fire.height // 2
    fdir = os.path.join(STAGE, PACK, "05_Effects_and_Overlays", "particles", "stove_fire_frames")
    os.makedirs(fdir, exist_ok=True)
    for i in range(6):
        c = fire.crop(((i % 3) * cw, (i // 3) * ch, (i % 3 + 1) * cw, (i // 3 + 1) * ch))
        c.crop(c.getchannel("A").getbbox()).save(os.path.join(fdir, "fire_%d.png" % i), optimize=True)

    for f in ("README.txt", "LICENSE.txt"):
        shutil.copy2(os.path.join(REL, f), os.path.join(STAGE, PACK, f))

    extras()
    print("missing:", missing)
    return len(COPY)


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def source_files():
    """Every asset file under sprites/ (junk and prompt drafts excluded)."""
    for dp, dns, fns in os.walk(SPR):
        for fn in sorted(fns):
            if fn in (".DS_Store", "PROMPTS.md"):
                continue
            yield os.path.join(dp, fn)


def extras():
    """Copy every sprites/ file whose content is not already in the pack, keeping its original path."""
    have = {}
    for dp, _, fns in os.walk(os.path.join(STAGE, PACK)):
        for fn in fns:
            have.setdefault(sha(os.path.join(dp, fn)), os.path.join(dp, fn))
    added = 0
    for src in source_files():
        if sha(src) in have:
            continue
        rel = os.path.relpath(src, SPR).replace(".cells", "atlas_cells")
        put(src, os.path.join("08_Extras_and_Source", rel))
        added += 1
    print("extras copied:", added)


def verify():
    """Fail loudly if any sprites/ file content is missing from the staged pack."""
    have = set()
    for dp, _, fns in os.walk(os.path.join(STAGE, PACK)):
        for fn in fns:
            have.add(sha(os.path.join(dp, fn)))
    lost = [os.path.relpath(s, SPR) for s in source_files() if sha(s) not in have]
    total = sum(1 for _ in source_files())
    print("source files:", total, "| missing from pack:", len(lost))
    for l in lost:
        print("  LOST", l)
    return not lost


if __name__ == "__main__":
    print("copied entries:", main())
    import sys
    sys.exit(0 if verify() else 1)
