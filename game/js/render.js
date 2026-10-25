// Отрисовка сцен на canvas 1920x1080: слои, спрайты, снег, зерно, виньетки состояний.
import { A, spr } from './assets.js?v=1792891673';

const W = 1920;
const H = 1080;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

const WORK_FRAMES = {
  mine: ['pick-0', 'pick-1', 'pick-2', 'pick-3'],
  road: ['shovel-0', 'shovel-1', 'shovel-2', 'shovel-3'],
  forest: ['shovel-4', 'shovel-5', 'shovel-6', 'shovel-7'],
};

const STATIC_BG = {
  title: '11-titulnyi-ekran.webp',
  barrack: '05-barak-iznutri.webp',
  night: '05-barak-iznutri.webp',
  dining: '06-razdacha-balandy.webp',
  medic: '09-lazaret.webp',
  cell: 'p2/locations/03-punishment-cell.webp',
  death: 'p3/01-death-ledger.webp',
  release: 'p3/02-ending-release.webp',
  extended: 'p3/03-ending-extended.webp',
  grave: '10-mogilnoe-pole.webp',
};
const OUTDOOR = new Set(['title', 'yard', 'march', 'work', 'release', 'extended', 'grave']);

export class Renderer {
  constructor(cv) {
    this.cv = cv;
    this.ctx = cv.getContext('2d');
    this.ctx.imageSmoothingQuality = 'high';
    this.scene = { name: 'title', opts: {}, start: 0 };
    this.t = 0;
    this.g = null;
    this.snap = document.createElement('canvas');
    this.snap.width = W; this.snap.height = H;
    this.xf = 0;
    this.shake = 0;
    this.filterT = 0;
    this.deathFade = 0;
    this.dim = 0;
    this.pace = 'even';
    this.lastTs = 0;
    this.grainOff = [0, 0];
  }

  setState(g) { this.g = g; }

  setScene(name, opts = {}) {
    if (this.scene.name === name && JSON.stringify(this.scene.opts) === JSON.stringify(opts)) return;
    this.snap.getContext('2d').drawImage(this.cv, 0, 0);
    this.xf = 1;
    this.scene = { name, opts, start: this.t };
  }

  hit() { this.shake = 1; }
  setDeath(v) { this.deathFade = v; }
  setDim(v) { this.dim = v; }

  // --- helpers ---
  cover(img, zoom = 0.03, pan = 14) {
    const ctx = this.ctx;
    const z = 1 + zoom * (0.5 + 0.5 * Math.sin(this.t * 0.07));
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight) * z;
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (W - w) / 2 + Math.sin(this.t * 0.11) * pan, (H - h) / 2, w, h);
  }

  strip(img, sway = 0, extra = 1.06, down = 0) {
    const w = W * extra;
    const h = img.naturalHeight * (w / img.naturalWidth);
    this.ctx.drawImage(img, (W - w) / 2 + sway, H - h + down, w, h);
  }

  // копия спрайта, у которой низ постепенно растворяется: ноги уходят в снег
  buried(name) {
    this._bur = this._bur || {};
    if (this._bur[name]) return this._bur[name];
    const s = spr(name);
    if (!s) return null;
    const c = document.createElement('canvas');
    c.width = s.sw; c.height = s.sh;
    const x = c.getContext('2d');
    x.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, 0, 0, s.sw, s.sh);
    const lie = s.sh < s.sw * 0.7; // лежащие и сидящие не размываем
    if (!lie) {
      x.globalCompositeOperation = 'destination-out';
      const g = x.createLinearGradient(0, s.sh * 0.88, 0, s.sh);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.78)');
      x.fillStyle = g;
      x.fillRect(0, s.sh * 0.88, s.sw, s.sh * 0.12);
    }
    return (this._bur[name] = { img: c, sx: 0, sy: 0, sw: s.sw, sh: s.sh, ox: s.ox || 0 });
  }

  // тёмное пятно под ногами
  contact(x, y, w, a = 0.6) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y - 2);
    ctx.scale(1, 0.17);
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, w * 0.55);
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(0.6, `rgba(0,0,0,${a * 0.45})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, w * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // наметённый снег у сапог: мягкие пересекающиеся пятна без жёстких краёв
  mound(x, y, w, a = 0.8) {
    const ctx = this.ctx;
    const blobs = [[-0.28, 0.0, 0.34], [0.0, 0.015, 0.46], [0.27, -0.005, 0.32]];
    ctx.save();
    for (const [dx, dy, rx] of blobs) {
      ctx.save();
      ctx.translate(x + dx * w, y + dy * w + 2);
      ctx.scale(1, 0.24);
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, rx * w);
      g.addColorStop(0, `rgba(214,219,222,${a})`);
      g.addColorStop(0.55, `rgba(182,190,196,${a * 0.6})`);
      g.addColorStop(1, 'rgba(160,168,174,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, rx * w, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  spr(name, x, y, scale = 1, { flip = false, alpha = 1, rot = 0, ground = true, drift = true } = {}) {
    const s = ground ? this.buried(name) : spr(name);
    if (!s) return;
    const ctx = this.ctx;
    const w = s.sw * scale, h = s.sh * scale;
    const gw = Math.min(w, h * 0.7) * 1.15;
    if (ground) this.contact(x, y, gw);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, -w / 2 + (s.ox || 0) * scale, -h, w, h);
    ctx.restore();
    if (ground && drift) this.mound(x, y, gw * 0.95, 0.8 * alpha);
  }

  snow(speed = 1, alpha = 0.5) {
    const im = A.imgs['overlays/falling-snow-transparent.webp'];
    if (!im) return;
    const ctx = this.ctx;
    const h = H * 1.0;
    const off = (this.t * 90 * speed) % h;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let k = -1; k <= 0; k++) ctx.drawImage(im, -20 + Math.sin(this.t * 0.4) * 10 * speed, off + k * h, W + 40, h);
    ctx.restore();
  }

  frameAnim(sheet, cols, rows, fps, x, y, size, alpha = 1, comp = 'source-over') {
    const im = A.imgs[sheet];
    if (!im) return;
    const fw = im.naturalWidth / cols, fh = im.naturalHeight / rows;
    const i = Math.floor(this.t * fps) % (cols * rows);
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = comp;
    ctx.drawImage(im, (i % cols) * fw, Math.floor(i / cols) * fh, fw, fh, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  }

  breath(x, y, scale = 1) {
    if (!this.g || this.g.d?.temp > -12) return;
    this.frameAnim('p1/particles/breath-3x2.webp', 3, 2, 3, x, y, 70 * scale, 0.28, 'screen');
  }

  // --- сцены ---
  drawStatic(name) {
    const im = A.imgs[STATIC_BG[name]];
    if (im) this.cover(im);
  }

  figures() {
    const g = this.g;
    if (!g) return [];
    const f = g.brigade.filter((n) => n.alive).map((n) => ({ id: n.id, hp: n.hp }));
    f.push({ id: 'me', hp: g.me.stats.health });
    return f;
  }

  // У каждого человека свой сдвиг цикла. Это не случайность на каждом кадре:
  // походка стабильна, но колонна не бьёт ногой как один механизм.
  motionPhase(id, salt = 0) {
    const text = `${id}:${salt}`;
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return ((h >>> 0) % 1000) / 1000;
  }

  sceneYard() {
    const ctx = this.ctx;
    const L = (n) => A.imgs[`p1/backgrounds/yard/${n}.webp`];
    if (L('01-sky')) ctx.drawImage(L('01-sky'), 0, 0, W, H);
    const sw = Math.sin(this.t * 0.12);
    if (L('02-far')) this.strip(L('02-far'), sw * 6);
    if (L('03-mid')) this.strip(L('03-mid'), sw * 14);
    // дым над бараками
    this.frameAnim('p1/particles/chimney-smoke-3x2.webp', 3, 2, 2, 560, 420, 260, 0.35, 'screen');
    const fig = this.figures();
    // На поверке — два чётких ряда, а не случайно рассыпанные фигуры.
    const perRow = Math.ceil(fig.length / 2);
    const rows = [{ y: 946, s: 0.78, a: 0.82 }, { y: 1052, s: 0.98, a: 1 }];
    fig.forEach((f, i) => {
      const r = Math.floor(i / perRow);
      const c = i % perRow;
      const row = rows[r];
      const x = 160 + c * 168 + r * 42;
      const hpw = 1 - clamp(f.hp / 100);
      const sway = Math.sin(this.t * 0.72 + this.motionPhase(f.id) * 6.28) * 0.009 * (0.3 + hpw * 2.2);
      const variant = `roll-v${(typeof f.id === 'number' ? f.id : 3) % 5}`;
      this.spr(variant, x, row.y, row.s, { rot: sway, alpha: row.a });
      this.breath(x + 12, row.y - 300 * row.s * 0.62, row.s);
    });
    // конвой вдоль строя
    if (L('04-front')) this.strip(L('04-front'), sw * 26, 1.1);
    // Конвойный держит фланг и смотрит на строй; в самой поверке не ходит
    // сквозь заключённых туда-сюда.
    this.guardStep('left', 1005, 1044, 1.22, 1.7, 0);
    this.snow(this.g?.d?.weather === 'blizzard' ? 2.4 : 1, 0.45);
    if (this.g?.d?.weather === 'blizzard') this.blizzard();
  }

  blizzard() {
    const im = A.imgs['p1/overlays/blizzard-layers.webp'];
    if (!im) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.55;
    const o = (this.t * 420) % W;
    ctx.drawImage(im, -o, 0, W, H);
    ctx.drawImage(im, W - o, 0, W, H);
    ctx.restore();
  }

  sceneMarch() {
    const ctx = this.ctx;
    const pan = A.imgs['parallax/march-panorama-3840x1080.webp'];
    const wire = A.imgs['img/march-wire.webp'];
    const speed = this.g?.d?.weather === 'blizzard' ? 80 : 120;
    // каждая вторая плитка зеркальная: края совпадают, шва нет
    const rep = (img, k, alpha = 1) => {
      if (!img) return;
      const w = img.naturalWidth, shift = this.t * speed * k;
      const first = Math.floor(shift / w);
      ctx.save(); ctx.globalAlpha = alpha;
      for (let i = first; i * w - shift < W; i++) {
        const x = i * w - shift;
        if (i % 2 === 0) ctx.drawImage(img, x, 0, w, H);
        else { ctx.save(); ctx.translate(x + w, 0); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, H); ctx.restore(); }
      }
      ctx.restore();
    };
    rep(pan, 0.35);
    // земля под колонной
    rep(wire, 0.9);
    const fig = this.figures();
    const n = Math.min(fig.length, 9);
    for (let i = 0; i < n; i++) {
      const f = fig[i];
      const phase = this.motionPhase(f.id, 17);
      const x = 60 + i * 104;
      const y = 980 - i * 5;
      const frame = Math.floor((this.t * (3.65 + (i % 3) * 0.13) + phase * 8)) % 8;
      const scale = 0.9 - i * 0.018;
      this.spr(`pw-walk-0${frame}`, x, y, scale);
      this.breath(x + 30, y - 238 * scale, scale * 0.82);
    }
    // конвойный идёт у головы колонны, собака на поводке впереди него
    const gx = 1015;
    this.guardStep('right', gx, 978, 1.08, 1.55, 1);
    rep(A.imgs['overlays/falling-snow-transparent.webp'], 1.4, 0.5);
    this.snow(this.g?.d?.weather === 'blizzard' ? 2.6 : 1.1, 0.45);
    if (this.g?.d?.weather === 'blizzard') this.blizzard();
  }

  // кадр циклической анимации по таймингам: seq = [[кадр, секунд], ...]
  seqFrame(seq, t) {
    const total = seq.reduce((s, x) => s + x[1], 0);
    let u = ((t % total) + total) % total;
    for (const [f, d] of seq) { if (u < d) return f; u -= d; }
    return seq[0][0];
  }

  // шаг без рывков: стойка и поза шага плавно перетекают друг в друга, корпус закреплён на месте.
  // k (0..1) — «сила» ходьбы: на разгоне и торможении шаг плавно появляется и гаснет
  guardStep(side, x, y, scale, freq = 1.7, k = 1) {
    const a = ((1 - Math.cos(this.t * Math.PI * 2 * freq)) / 2) * k;
    this.spr(`g-stand-${side}`, x, y + 3 * a, scale, { drift: false });
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = a;
    this.spr(`g-walk-${side}`, x, y + 3 * a, scale, { drift: false, ground: false });
    ctx.restore();
  }

  // патруль туда-обратно с плавным разгоном и торможением (без скольжения в стойке)
  patrol(x0, len, pause = 1.8, run = 7) {
    const total = (pause + run) * 2;
    const u = this.t % total;
    const ease = (p) => p * p * (3 - 2 * p);
    const ramp = (p) => Math.min(1, Math.min(p, 1 - p) * 6); // сила ходьбы на концах участка
    if (u < pause) return { x: x0, dir: 1, k: 0 };
    if (u < pause + run) { const p = (u - pause) / run; return { x: x0 + len * ease(p), dir: 1, k: ramp(p) }; }
    if (u < pause * 2 + run) return { x: x0 + len, dir: -1, k: 0 };
    const p = (u - pause * 2 - run) / run;
    return { x: x0 + len - len * ease(p), dir: -1, k: ramp(p) };
  }

  guardPatrol(x0, len, y, gs, ds) {
    const p = this.patrol(x0, len);
    const side = p.dir > 0 ? 'right' : 'left';
    // собака идёт впереди на поводке: поводок на картинке тянется назад к руке конвойного
    const dogX = p.x + p.dir * (207 * ds * 0.55 + 20);
    const dogK = Math.min(1, p.k * 1.4);
    // сидит и идёт перетекают друг в друга по прозрачности
    this.spr(`dog-sit-${side}`, dogX, y + 10, ds, { drift: dogK < 0.2 });
    if (dogK > 0.01) {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = dogK;
      this.spr(`dog-walk-${side}`, dogX, y + 10 - Math.abs(Math.sin(this.t * 3.4)) * 3 * dogK, ds, { drift: false, ground: false });
      ctx.restore();
    }
    this.guardStep(side, p.x, y, gs, 1.7, p.k);
  }

  sceneWork() {
    const ctx = this.ctx;
    const job = this.scene.opts.job || 'mine';
    const L = (n) => A.imgs[`p1/backgrounds/${job}/${n}.webp`];
    if (L('01-sky')) ctx.drawImage(L('01-sky'), 0, 0, W, H);
    const sw = Math.sin(this.t * 0.1);
    if (L('02-far')) this.strip(L('02-far'), sw * 6);
    if (L('03-mid')) this.strip(L('03-mid'), sw * 14);
    if (L('04-front')) this.strip(L('04-front'), sw * 26, 1.1, 120);

    // темп влияет на скорость движений
    const speed = this.pace === 'fast' ? 1.35 : this.pace === 'slow' ? 0.65 : 1;
    const n = Math.min(this.figures().length, 8);
    const draw = [];
    const T = this.t * speed;

    if (job === 'forest') {
      // пилят парами у козел, остальные таскают брёвна
      const groups = Math.min(2, Math.floor(n / 2));
      const xs = [250, 680];
      for (let i = 0; i < groups; i++) {
        const phase = this.motionPhase(this.figures()[i]?.id || i, 31);
        const f = ['shovel-4', 'shovel-5', 'shovel-6', 'shovel-7', 'shovel-6', 'shovel-5'][Math.floor(T * 3.2 + phase * 6) % 6];
        draw.push({ y: 1015, fn: () => this.spr(f, xs[i], 1015, 0.86) });
      }
      const carriers = Math.max(0, n - groups * 2);
      for (let i = 0; i < Math.min(carriers, 3); i++) this.lane(draw, 'pa-carry-log', 1048 + i * 8, 90 + i * 300, 0.95, 26, i);
    } else {
      // копают в ряд лицом к забою, тачка ходит по нижней полосе
      const seq = job === 'mine'
        ? [['pick-3', 0.55], ['pick-0', 0.45], ['pick-1', 0.2], ['pick-2', 0.4]]
        : [['shovel-0', 0.5], ['shovel-1', 0.4], ['shovel-2', 0.3], ['shovel-3', 0.4]];
      const diggers = Math.min(5, Math.max(1, n - 1));
      const xs = [110, 300, 490, 680, 870];
      const ys = [1008, 1020, 1006, 1018, 1004];
      for (let i = 0; i < diggers; i++) {
        const f = this.seqFrame(seq, T + this.motionPhase(this.figures()[i]?.id || i, 47) * 1.6);
        draw.push({ y: ys[i], fn: () => this.spr(f, xs[i], ys[i], 0.78) });
      }
      if (n > diggers) this.lane(draw, 'pa-wheelbarrow', 1062, 120, 0.8, 40, 0);
    }
    draw.sort((p, q) => p.y - q.y);
    for (const d of draw) d.fn();

    // бригадир и конвой на возвышении
    this.spr('fm-order', 960, 930, 1.0);
    this.guardPatrol(965, 65, 922, 0.9, 0.82);
    if (this.g?.d?.temp < -12) {
      this.breath(990, 930 - 250 * 1.0, 0.8);
    }
    this.snow(this.g?.d?.weather === 'blizzard' ? 2.4 : 0.9, 0.4);
    if (this.g?.d?.weather === 'blizzard') this.blizzard();
  }

  // ходит по полосе туда-обратно, на концах стоит и разворачивается
  lane(draw, name, y, x0, scale, v, k) {
    const span = 640;
    const hold = 1.4;
    const run = span / v;
    const cyc = (run + hold) * 2;
    const u = (this.t + k * 5.3) % cyc;
    let x, flip;
    if (u < run) { x = x0 + v * u; flip = false; }
    else if (u < run + hold) { x = x0 + span; flip = false; }
    else if (u < run * 2 + hold) { x = x0 + span - v * (u - run - hold); flip = true; }
    else { x = x0; flip = true; }
    draw.push({ y, fn: () => this.spr(name, x, y, scale, { flip }) });
  }

  sceneBarrack(dark = 0) {
    const ctx = this.ctx;
    const im = A.imgs[STATIC_BG.barrack];
    // зеркалим: печь уходит влево от панели выбора
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    if (im) this.cover(im);
    ctx.restore();
    // огонь уже нарисован на картинке: оживляем только свет в решётке, без чужих спрайтов
    const sx = W - 1073, sy = 603;
    const flick = 0.6 + 0.25 * Math.sin(this.t * 6.1) + 0.15 * Math.sin(this.t * 11.7 + 1.3) * Math.sin(this.t * 2.3);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const near = ctx.createRadialGradient(sx, sy, 2, sx, sy, 70);
    near.addColorStop(0, `rgba(255,165,70,${0.22 * flick})`);
    near.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = near;
    ctx.fillRect(sx - 80, sy - 80, 160, 160);
    const far = ctx.createRadialGradient(sx, sy, 20, sx, sy, 520);
    far.addColorStop(0, `rgba(255,150,60,${0.10 * flick + 0.04})`);
    far.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = far;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    if (dark) { ctx.fillStyle = `rgba(4,6,10,${dark})`; ctx.fillRect(0, 0, W, H); }
  }

  sceneTitle() {
    this.drawStatic('title');
    this.snow(0.8, 0.5);
  }

  frame(ts) {
    const t = ts / 1000;
    const dt = Math.min(0.1, t - this.t);
    this.t = t;
    const ctx = this.ctx;
    ctx.save();
    if (this.shake > 0.01) {
      ctx.translate((Math.random() - 0.5) * 22 * this.shake, (Math.random() - 0.5) * 16 * this.shake);
      this.shake *= 0.9;
    }
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, W, H);
    switch (this.scene.name) {
      case 'yard': this.sceneYard(); break;
      case 'march': this.sceneMarch(); break;
      case 'work': this.sceneWork(); break;
      case 'barrack': this.sceneBarrack(0); break;
      case 'night': this.sceneBarrack(0.38); break;
      case 'title': this.sceneTitle(); break;
      default:
        this.drawStatic(this.scene.name);
        if (OUTDOOR.has(this.scene.name)) this.snow(1, 0.4);
    }
    ctx.restore();
    this.fx(dt);
    if (this.xf > 0) {
      ctx.save();
      ctx.globalAlpha = this.xf;
      ctx.drawImage(this.snap, 0, 0);
      ctx.restore();
      this.xf = Math.max(0, this.xf - dt * 1.4);
    }
  }

  fx(dt) {
    const ctx = this.ctx;
    const g = this.g;
    const s = g?.me?.stats;
    // базовая виньетка
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.0);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    if (s && this.scene.name !== 'title') {
      const hunger = clamp((55 - s.satiety) / 55);
      const cold = clamp((48 - s.warmth) / 48);
      const hv = A.imgs['p1/overlays/hunger-vignette.webp'];
      const fv = A.imgs['p1/overlays/frostbite.webp'];
      if (hv && hunger > 0.02) {
        ctx.save(); ctx.globalAlpha = Math.min(1, hunger * 1.2) * (0.85 + 0.15 * Math.sin(this.t * 1.7));
        ctx.drawImage(hv, 0, 0, W, H); ctx.restore();
      }
      if (fv && cold > 0.02) {
        ctx.save(); ctx.globalAlpha = Math.min(0.9, cold * 1.1);
        ctx.drawImage(fv, 0, 0, W, H); ctx.restore();
      }
    }
    // зерно
    const gr = A.imgs['overlays/film-grain-seamless.webp'];
    if (gr) {
      if (Math.floor(this.t * 12) !== this._gf) {
        this._gf = Math.floor(this.t * 12);
        this.grainOff = [Math.random() * 1254, Math.random() * 1254];
      }
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.42;
      for (let x = -this.grainOff[0]; x < W; x += 1254) for (let y = -this.grainOff[1]; y < H; y += 1254) ctx.drawImage(gr, x, y);
      ctx.restore();
    }
    if (this.dim > 0) { ctx.fillStyle = `rgba(3,5,8,${this.dim})`; ctx.fillRect(0, 0, W, H); }
    if (this.deathFade > 0) {
      const df = A.imgs['p1/overlays/death-fade.webp'];
      ctx.save(); ctx.globalAlpha = this.deathFade;
      if (df) ctx.drawImage(df, 0, 0, W, H);
      ctx.fillStyle = `rgba(0,0,0,${this.deathFade * 0.9})`; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    // фильтр на весь холст раз в 0.3 с
    this.filterT -= dt;
    if (this.filterT <= 0 && s) {
      this.filterT = 0.3;
      const blur = s.satiety < 28 ? ((28 - s.satiety) / 28) * 1.6 * (0.6 + 0.4 * Math.sin(this.t * 2)) : 0;
      const contrast = 1 + clamp((40 - s.sanity) / 40) * 0.25;
      const bright = 1 - clamp((30 - s.health) / 30) * 0.18;
      this.cv.style.filter = `brightness(${bright.toFixed(2)}) contrast(${contrast.toFixed(2)})${blur > 0.05 ? ` blur(${blur.toFixed(2)}px)` : ''}`;
    }
  }
}
