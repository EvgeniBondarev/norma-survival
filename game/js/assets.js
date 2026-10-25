// Загрузка картинок и нарезанных спрайтов.
// Пути вычисляются от этого модуля, а не от адреса открытой HTML-страницы.
// Так загрузчик одинаково работает при /game/index.html, зеркале и preview-сервере.
const BASE = new URL('../../assets-webp/', import.meta.url).href;
const GAME_IMG = new URL('../img/', import.meta.url).href;
const VERSION = new URL(import.meta.url).search;

// Ранние листы и исходные нарезки не участвуют в рендере сцены, но остаются
// частью лагерной памяти: их можно открыть из «Зарисовок», а не терять на диске.
const cellSheets = [
  ['camp-items-256', 9], ['foreman-256', 4], ['guard-256', 4], ['guard-dog-256', 4],
  ['prisoner-actions-256', 8], ['prisoner-walk-right-256', 8],
];
export const ARCHIVE_ASSETS = [
  '01-proverka-na-rassvete.webp', '02-kolonna-na-marshe.webp', '03-priisk-otkrytyi-razrez.webp', '04-lesopoval.webp', '08-taiga-za-kolyuchei-provolokoi.webp',
  'atlas/camp-items-256.webp', 'atlas/guard-dog-256.webp',
  ...cellSheets.flatMap(([sheet, count]) => Array.from({ length: count }, (_, i) => `atlas/.cells/${sheet}/${i}.webp`)),
  'interface/ledger-page-blank.webp', 'interface/ledger-page.webp', 'interface/mark-tag.webp', 'interface/prisoner-number-patch-284-clean.webp', 'interface/prisoner-number-patch-284.webp', 'interface/rubber-stamps-sheet.webp',
  'overlays/frosted-edges.webp',
  ...Array.from({ length: 10 }, (_, i) => `p1/prisoners/${String(i + 1).padStart(2, '0')}-${['variants-idle', 'pickaxe-cycle', 'shovel-saw', 'rollcall', 'eating', 'sleeping-bunks', 'stove', 'sick', 'dead', 'walk-cycle-right'][i]}.webp`),
  'p1/ui/choice-buttons-3states.webp', 'p1/ui/event-card-frame.webp', 'p1/ui/norm-bar.webp', 'p1/ui/panel-backgrounds-3x1.webp', 'p1/ui/status-icons-4x2.webp',
  'p2/characters/01-criminal.webp', 'p2/characters/02-informer.webp', 'p2/characters/03-medic.webp', 'p2/characters/04-cook.webp', 'p2/characters/05-administrator.webp',
  'p2/items/01-personal-items-3x3.webp', 'p2/items/02-work-items-3x3.webp',
  'p2/locations/01-arrival.webp', 'p2/locations/02-checkpoint.webp', 'p2/locations/04-bathhouse.webp', 'p2/locations/05-kitchen-window.webp', 'p2/locations/06-commander-office.webp', 'p2/locations/07-morgue.webp',
  'p3/04-logo-texture.webp', 'p3/05-cursor.webp', 'p3/07-work-tiles-3x1.webp', 'p4/03-paper-scraps-sheet.webp', 'p5/03-barrack-dialogue-table.webp',
  'parallax/march-mid-wire.webp', 'parallax/march-panorama-source.webp',
];

export const A = {
  imgs: {},
  sprites: {},
  atlasDefs: {},
};

function loadOnce(src) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('Не загрузилось: ' + src));
    im.src = src;
  });
}

// до трёх попыток: при сотне параллельных запросов локальный сервер иногда сбрасывает соединение
async function loadImg(src) {
  let last;
  for (let i = 0; i < 3; i++) {
    try { return await loadOnce(src); } catch (e) { last = e; await new Promise((r) => setTimeout(r, 120 * (i + 1))); }
  }
  throw last;
}

async function loadJson(src, name) {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`${name}: сервер вернул ${res.status} (${res.statusText})`);
  const type = res.headers.get('content-type') || '';
  if (!type.includes('json')) throw new Error(`${name}: ожидался JSON, получен ${type || 'неизвестный формат'} (${res.url})`);
  try { return await res.json(); } catch { throw new Error(`${name}: ответ сервера не является JSON (${res.url})`); }
}

// bbox непрозрачной части кадра атласа, чтобы ставить спрайт точно на землю
function trimmedFrames(img, frames) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  const out = {};
  for (const f of frames) {
    const d = x.getImageData(f.x, f.y, f.w, f.h).data;
    let x0 = f.w, y0 = f.h, x1 = -1, y1 = -1;
    for (let yy = 0; yy < f.h; yy++) {
      for (let xx = 0; xx < f.w; xx++) {
        if (d[(yy * f.w + xx) * 4 + 3] > 24) {
          if (xx < x0) x0 = xx; if (xx > x1) x1 = xx;
          if (yy < y0) y0 = yy; if (yy > y1) y1 = yy;
        }
      }
    }
    if (x1 < 0) { x0 = 0; y0 = 0; x1 = f.w - 1; y1 = f.h - 1; }
    // якорь по корпусу (верхние 45% силуэта), чтобы при ходьбе качались ноги, а не весь человек
    const yLim = y0 + (y1 - y0) * 0.45;
    let sum = 0, cnt = 0;
    for (let yy = y0; yy <= yLim; yy++) {
      for (let xx = x0; xx <= x1; xx++) {
        if (d[(yy * f.w + xx) * 4 + 3] > 24) { sum += xx; cnt++; }
      }
    }
    const cx = cnt ? sum / cnt : (x0 + x1) / 2;
    out[f.name] = { img, sx: f.x + x0, sy: f.y + y0, sw: x1 - x0 + 1, sh: y1 - y0 + 1, ox: (x0 + x1 + 1) / 2 - cx };
  }
  return out;
}

// якорь по корпусу для нарезанных кадров (лежащие и сидящие не трогаем)
function torsoOffset(img) {
  const w = img.naturalWidth, h = img.naturalHeight;
  if (h < w * 0.7) return 0;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, w, h).data;
  let sum = 0, cnt = 0;
  for (let yy = 0; yy < h * 0.45; yy++) for (let xx = 0; xx < w; xx++) if (d[(yy * w + xx) * 4 + 3] > 24) { sum += xx; cnt++; }
  return cnt ? w / 2 - sum / cnt : 0;
}

const ATLASES = [
  ['pw', 'atlas/prisoner-walk-right-256'],
  ['pa', 'atlas/prisoner-actions-256'],
  ['g', 'atlas/guard-256'],
  ['fm', 'atlas/foreman-256'],
];

export const STATIC = [
  '11-titulnyi-ekran.webp', '05-barak-iznutri.webp', '06-razdacha-balandy.webp', '09-lazaret.webp',
  '07-noch-i-metel.webp', '10-mogilnoe-pole.webp',
  'p2/locations/03-punishment-cell.webp', 'p3/01-death-ledger.webp', 'p3/02-ending-release.webp',
  'p3/03-ending-extended.webp', 'parallax/march-panorama-3840x1080.webp',
  'overlays/falling-snow-transparent.webp', 'overlays/film-grain-seamless.webp', 'overlays/old-paper-seamless.webp',
  'p1/overlays/hunger-vignette.webp', 'p1/overlays/frostbite.webp', 'p1/overlays/death-fade.webp',
  'p1/overlays/blizzard-layers.webp',
  'p1/particles/breath-3x2.webp', 'p1/particles/chimney-smoke-3x2.webp', 'p1/particles/stove-fire-3x2.webp',
  'p1/particles/searchlight.webp',
  ...['yard', 'mine', 'forest', 'road'].flatMap((j) => ['01-sky', '02-far', '03-mid', '04-front'].map((l) => `p1/backgrounds/${j}/${l}.webp`)),
];

export async function loadAll(onProgress) {
  const sprites = await loadJson(new URL('../img/sprites.json' + VERSION, import.meta.url), 'Список спрайтов');
  const jobs = [];
  let done = 0;
  const total = STATIC.length + ATLASES.length + Object.keys(sprites).length;
  const tick = () => { done++; onProgress && onProgress(done / total); };

  for (const p of STATIC) {
    jobs.push(loadImg(BASE + p).then((im) => { A.imgs[p] = im; tick(); }));
  }
  jobs.push(loadImg(GAME_IMG + 'march-wire.webp').then((im) => { A.imgs['img/march-wire.webp'] = im; }));
  for (const [key, path] of ATLASES) {
    jobs.push((async () => {
      const def = await loadJson(BASE + path + '.json' + VERSION, `Атлас ${key}`);
      const im = await loadImg(BASE + path + '.webp');
      const t = trimmedFrames(im, def.frames);
      // В файле конвойный нарисован зеркально относительно имён кадров.
      // И стойка, и шаг должны смотреть в одну сторону, иначе при анимации
      // человек разворачивается к колонне спиной.
      const fix = key === 'g' ? { 'stand-right': 'stand-left', 'walk-right': 'walk-left', 'stand-left': 'stand-right', 'walk-left': 'walk-right' } : null;
      for (const [name, spr] of Object.entries(t)) A.sprites[`${key}-${fix ? fix[name] : name}`] = spr;
      tick();
    })());
  }
  for (const [name, m] of Object.entries(sprites)) {
    jobs.push(loadImg(GAME_IMG + m.file).then((im) => {
      A.sprites[name] = { img: im, sx: 0, sy: 0, sw: im.naturalWidth, sh: im.naturalHeight, ox: torsoOffset(im) };
      A.imgs['img/' + m.file] = im;
      tick();
    }));
  }
  await Promise.all(jobs);
}

// событийные картинки грузим по требованию
const lazy = {};
export function lazyImg(path) {
  if (A.imgs[path]) return Promise.resolve(A.imgs[path]);
  if (!lazy[path]) lazy[path] = loadImg(BASE + path).then((im) => (A.imgs[path] = im));
  return lazy[path];
}

export const imgUrl = (path) => BASE + path;
export const spr = (name) => A.sprites[name];
