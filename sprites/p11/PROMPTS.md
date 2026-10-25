# P11 — Диалоговые портреты: эмоции и новые персонажи

Игра уже умеет показывать портрет говорящего (`game/js/ui.js`, листы `p5` и `p6`). Сейчас у каждого героя одно лицо. Этот набор даёт каждому по 6 эмоций и добавляет персонажей лагерного штата, чтобы диалоги не повторялись.

Общие правила для всех листов:
- Midjourney `--ar 3:2 --style raw --s 150`, референсы стиля: `p5/01-presentka-portraits-3x2.png` и `p5/02-presentka-aftermath.png` (`--sref` на оба).
- Лист 3×2, шесть равных ячеек, между ячейками пустой промежуток, портрет по грудь, лицо в тени, без текста.
- Фон однородный чисто белый (потом вырезается в PNG с прозрачностью, как p5/p6). Лица почти целиком чёрная тень, свет только на волосах и складках одежды, как в референсе.
- Палитра: чёрный уголь, кремовая бумага, приглушённый серо-синий и табачно-коричневый, редкие красно-бурые пятна (свитер, одеяло).

STYLE (вставлен в каждый блок ниже):

```
rough charcoal and dry-brush book illustration with lithograph and engraving hatching on coarse cream paper, flat dark silhouettes, simplified faces lost in deep black shadow with only hair and clothing folds catching light, muted grey-blue and tobacco-brown palette with rare dull red-brown accents, no photorealism, no cinematic lighting, no text, bleak and quiet, Soviet Gulag 1940s Kolyma atmosphere
```

Негативный промпт для всех: `cartoon, anime, colorful, bright, saturated, cute, fantasy, 3d render, clean digital, photorealistic, cinematic lighting, text, watermark, logo, hero pose, gore, blood splatter, modern clothing, smiling broadly`.
В Midjourney вместо него: `--no cartoon, anime, photo, text, watermark, gore, 3d, smile`.

## `01-foreman-emotions-3x2.png` — бригадир, шесть эмоций

```
character expression sheet, 6 portraits in a 3x2 grid of the same middle-aged camp foreman in a padded jacket and fur cap, bust shot, 3/4 view, same face in every cell, expressions: neutral and watchful, angry shouting, exhausted, suspicious squint, grudging approval nod, looking away in shame, evenly spaced grid, plain flat uniform pure white background, no cropping, faces half in shadow, rough charcoal and dry-brush book illustration with lithograph and engraving hatching on coarse cream paper, flat dark silhouettes, simplified faces lost in deep black shadow with only hair and clothing folds catching light, muted grey-blue and tobacco-brown palette with rare dull red-brown accents, no photorealism, no cinematic lighting, no text, bleak and quiet, Soviet Gulag 1940s Kolyma atmosphere
```

## `02-player-states-3x2.png` — заключённый игрока по состояниям

Для рамки в HUD: лицо меняется вместе с показателями (голод, холод, рассудок).

```
character state sheet, 6 portraits in a 3x2 grid of the same thin prisoner in an ushanka and padded jacket, bust shot, facing slightly left, same face in every cell, states: calm and focused, starving hollow cheeks, frostbitten nose and cheeks with white frost on the cap, feverish glassy eyes, broken empty stare, grim resolve, evenly spaced grid, plain flat uniform pure white background, no cropping, faces half in shadow, rough charcoal and dry-brush book illustration with lithograph and engraving hatching on coarse cream paper, flat dark silhouettes, simplified faces lost in deep black shadow with only hair and clothing folds catching light, muted grey-blue and tobacco-brown palette with rare dull red-brown accents, no photorealism, no cinematic lighting, no text, bleak and quiet, Soviet Gulag 1940s Kolyma atmosphere
```

## `03-camp-staff-3x2.png` — лагерный штат

```
character portrait sheet, 6 different men in a 3x2 grid, bust shot, 3/4 view: a heavy cook in a stained apron and cap, a tired medic with a white armband and round glasses, a nervous informer with a hunched posture and sly eyes, a camp work assigner with a ledger and pencil behind the ear, a stern camp commandant in a peaked cap and greatcoat, a young convoy guard in a ushanka with a rifle strap on the shoulder, evenly spaced grid, plain flat uniform pure white background, no cropping, faces half in shadow, rough charcoal and dry-brush book illustration with lithograph and engraving hatching on coarse cream paper, flat dark silhouettes, simplified faces lost in deep black shadow with only hair and clothing folds catching light, muted grey-blue and tobacco-brown palette with rare dull red-brown accents, no photorealism, no cinematic lighting, no text, bleak and quiet, Soviet Gulag 1940s Kolyma atmosphere
```

## `04-prisoner-types-3x2.png` — типы заключённых

```
character portrait sheet, 6 different prisoners in a 3x2 grid, bust shot, 3/4 view: an old bearded man with a wool scarf, a young thin boy in an oversized jacket, an intellectual with broken round glasses and a torn collar, a blatnoy criminal with a cap pushed back and a gold tooth, a broad blacksmith with soot on his face, a storyteller with a calm distant gaze, evenly spaced grid, plain flat uniform pure white background, no cropping, faces half in shadow, rough charcoal and dry-brush book illustration with lithograph and engraving hatching on coarse cream paper, flat dark silhouettes, simplified faces lost in deep black shadow with only hair and clothing folds catching light, muted grey-blue and tobacco-brown palette with rare dull red-brown accents, no photorealism, no cinematic lighting, no text, bleak and quiet, Soviet Gulag 1940s Kolyma atmosphere
```

## `05-medic-and-cook-emotions-3x2.png` — две ключевые роли, по три эмоции

```
character expression sheet, 6 portraits in a 3x2 grid: top row the same camp medic with a white armband and round glasses showing compassion, hurried impatience, bitter refusal; bottom row the same heavy cook in a stained apron showing a bribed wink, suspicious frown, quiet pity, bust shot, 3/4 view, evenly spaced grid, plain flat uniform pure white background, no cropping, faces half in shadow, rough charcoal and dry-brush book illustration with lithograph and engraving hatching on coarse cream paper, flat dark silhouettes, simplified faces lost in deep black shadow with only hair and clothing folds catching light, muted grey-blue and tobacco-brown palette with rare dull red-brown accents, no photorealism, no cinematic lighting, no text, bleak and quiet, Soviet Gulag 1940s Kolyma atmosphere
```

## `06-dialogue-ui-kit.png` — рамка диалога (UI)

Без людей, только детали интерфейса, прозрачный фон.

```
UI kit sheet for a dialogue box in a dark survival game, isolated pieces on a plain flat uniform background: a wide worn paper panel with torn edges and rusty rivets, a small riveted metal name plate, a portrait frame made of rough wood and tin, a speech tail pointer, three choice-marker icons (a bread crust, a hand, a cross), an ink-stained corner decoration, evenly spaced, no text, no letters, stark monochrome engraving style, documentary photo grain, desaturated palette of ash grey, snow white, graphite black, faint ice blue and rust brown, heavy film grain, no cartoon, Soviet Gulag 1940s atmosphere
```

## Подключение после добавления

1. Сохранить PNG строго по этим именам в `sprites/p11/` (вырезать фон так же, как делали для p5/p6).
2. Сделать WebP-копии в `assets-webp/p11/` с теми же именами.
3. Сказать мне. Я нарежу ячейки в отдельные портреты, добавлю их в `itch-release/build_pack.py` (папка `01_Characters/portraits_expressions`), пересоберу три архива и обновлю страницу на itch.io.
