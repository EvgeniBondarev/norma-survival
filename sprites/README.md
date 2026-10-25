# Sprite assets

Character and item sheets have transparency (alpha channel). Backgrounds and
`interface/ledger-page.png` are opaque by design.

## Character sheets

| File | Grid | Poses |
| --- | --- | --- |
| `characters/prisoner-poses.png` | 4 × 2 | idle; walk left/right; dig; carry log; push wheelbarrow; sit; collapse |
| `characters/guard-poses.png` | 2 × 2 | idle left/right; walk left/right |
| `characters/guard-dog-poses.png` | 2 × 2 | walk left/right; sit left/right |
| `characters/foreman-poses.png` | 2 × 2 | idle left/right; walk left/right |

## Item sheet

`items/camp-items-sheet.png` is a 3 × 3 grid: black bread, tin bowl, wooden spoon, felt boots, mitten, tobacco, rag, tin mug, blanket.

## Interface assets

| File | Transparency | Use |
| --- | --- | --- |
| `interface/ledger-page.png` | no | ledger/document background |
| `interface/prisoner-number-patch-284.png` | yes | prisoner number badge |
| `interface/rubber-stamps-sheet.png` | yes | six faded overlay stamps |
| `interface/mark-tag.png` | yes | HUD icon for an unexplained delayed camp mark |

## Event illustrations

`events/` contains seven 4:3 opaque PNG illustrations, each 1448 × 1086:

1. `01-nochnaya-rabota.png` — night digging
2. `02-izmerenie-u-skaly.png` — measuring at the rock face
3. `03-hleb-na-vetoshi.png` — bread divided on a rag
4. `04-ruki-v-obmotkah.png` — hands wrapped in rags
5. `05-shepot-v-barake.png` — whispering in the barracks
6. `06-na-doroge.png` — figure by the road
7. `07-valenki-v-temnote.png` — boots in the dark

## Overlays and textures

| File | Transparency | Use |
| --- | --- | --- |
| `overlays/film-grain-seamless.png` | no | repeatable dark film grain |
| `overlays/frosted-edges.png` | yes | 16:9 frost around screen edges |
| `overlays/old-paper-seamless.png` | no | repeatable UI paper background |
| `overlays/falling-snow-transparent.png` | yes | sparse 16:9 snow layer for scrolling animation |

The background images remain in this directory's top level.

## P1 expansion

`p1/` contains the first production batch from `PROMPTS.md`:

- `prisoners/` — ten sheets: five idle silhouette variants, work and survival
  states, plus the eight-frame right-facing walk cycle. Mirror the latter in
  code for left movement.
- `ui/` — 4 × 2 status icons, event-card frame, three button states, norm bar
  and three panel textures. All text areas are intentionally blank.
- `backgrounds/{yard,mine,forest,road}/` — four layers per location in back to
  front order: `01-sky`, `02-far`, `03-mid`, `04-front`. The sky is opaque;
  the other layers use alpha so they can move at separate speeds.
- `particles/` — breath, chimney smoke, stove fire and searchlight assets.
- `overlays/` — blizzard sheet, hunger vignette, frostbite and death fades.

## Browser package

`../assets-webp/` mirrors runtime-ready files in WebP, including P1. It weighs
about 27 MB, keeps the original top-level backgrounds at 1920 × 1080, and
contains a 3840 × 1080 march panorama in `parallax/`. JSON metadata is copied
alongside its associated atlases.
