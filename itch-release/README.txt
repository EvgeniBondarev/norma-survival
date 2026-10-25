NORMA - CAMP SPRITE PACK
========================

Monochrome, engraving-style art for bleak 1940s forced-labour-camp survival games:
animated character sprites, camp items, UI, scenes, parallax layers, weather and
particle effects, story illustrations and a 36-card homemade playing deck.
Made for the browser game NORMA, inspired by Varlam Shalamov's "Kolyma Tales".

AI DISCLOSURE
-------------
All images in this pack were produced with generative AI tools (Midjourney-style
image generation) and then cut, cleaned, sliced and packaged by hand and with scripts.
Prompts are not included.

FOLDERS
-------
01_Characters   sheets/      full animation sheets (RGBA PNG)
                atlases_256/ 256x256 cell atlases with JSON frame data
                frames/      individual transparent frames, ready to use
                portraits/   two 3x2 portrait sets
02_Items        sheets of 9 items + single/ items as separate PNGs
03_UI           status icons, buttons (3 states), frames, progress bar, panels,
                logo, number patch, stamps, ledger pages, cursor, single/ UI frames
04_Backgrounds  scenes/ (11, 1672x941), locations/ (7), parallax/ (3840x1080 panorama
                + mid layer), parallax_layers/ (yard, mine, forest, road: sky / far / mid /
                front layers, back to front, sky opaque, others with alpha)
05_Effects_and_Overlays
                particles/ (breath, chimney smoke, stove fire + frames, searchlight)
                overlays/ (blizzard, vignette, frost, death fade, snow)
                textures/ (seamless film grain, seamless old paper)
06_Illustrations
                events/ (7), camp_life/ (13), story/ (20) - 4:3 / 16:9 key art
07_Playing_Cards
                deck_36/ 36 worn cards (6 to ace, four suits) + extras/
08_Extras_and_Source
                Every remaining file of the original source set, kept under its
                original path: raw sheets, JSON data, SVG, the 256 px atlas cells
                (atlas_cells/) and early processing leftovers (processed/).
                Note: the guard dog atlas cells and processed/guard-dog-clean.* are
                black silhouette drafts, use the dog frames in 01_Characters/frames.

TECHNICAL NOTES
---------------
- Characters face right in walk sheets; mirror in code for left movement.
- Character sheets and items have an alpha channel. Scenes are opaque.
- Animation speed used in the NORMA prototype: about 8 fps.
- Frame sizes vary; frames/ files are tightly cropped. Align by the feet (bottom center).
- JSON atlas files list frame names and rectangles.

Please read LICENSE.txt before using the assets.
