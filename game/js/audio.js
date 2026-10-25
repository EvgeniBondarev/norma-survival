// Звук целиком синтезируется в Web Audio, файлов нет.
// Слои: ветер и гул (фон), сцены (толпа, работа, барак, столовая), реакции (удары, шаги, речь-бормотание).
// Музыки нет: тишина часть давления.

// Что оживляет каждую сцену: вероятность события за один такт (0.7 с)
const AMB = {
  title: {},
  yard: { crowd: 0.4, cough: 0.07, bark: 0.06, snow: 0.35 },
  march: { step: 1, bark: 0.05, cough: 0.04, snow: 0.2 },
  work: { work: 1, crowd: 0.1, cough: 0.05, bark: 0.04 },
  barrack: { crackle: 0.55, crowd: 0.2, whisper: 0.08, cough: 0.08, snore: 0.06 },
  night: { crackle: 0.55, whisper: 0.12, snore: 0.2, cough: 0.08 },
  dining: { crowd: 0.8, ladle: 0.22, spoon: 0.6, pour: 0.12 },
  medic: { cough: 0.25, groan: 0.12, crowd: 0.06, steps: 0.22 },
  cell: { drip: 0.35, groan: 0.04, steps: 0.08 },
  death: {}, release: {}, extended: {}, grave: { snow: 0.3 },
};
const INDOORS = new Set(['barrack', 'night', 'dining', 'medic', 'cell']);
const SPACE = {
  title: { wind: 0.025, drone: 0.012, verb: 0.08, windCut: 2400 },
  yard: { wind: 0.06, drone: 0.018, verb: 0.08, windCut: 3200 },
  march: { wind: 0.075, drone: 0.016, verb: 0.07, windCut: 3600 },
  work: { wind: 0.064, drone: 0.022, verb: 0.09, windCut: 3300 },
  barrack: { wind: 0.014, drone: 0.034, verb: 0.22, windCut: 650 },
  night: { wind: 0.01, drone: 0.028, verb: 0.3, windCut: 500 },
  dining: { wind: 0.008, drone: 0.026, verb: 0.2, windCut: 520 },
  medic: { wind: 0.004, drone: 0.009, verb: 0.38, windCut: 380 },
  cell: { wind: 0.003, drone: 0.014, verb: 0.48, windCut: 300 },
  death: { wind: 0.028, drone: 0.006, verb: 0.12, windCut: 1600 },
  grave: { wind: 0.035, drone: 0.008, verb: 0.1, windCut: 2200 },
};

const rnd = (a, b) => a + Math.random() * (b - a);

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.scene = 'title';
    this.job = 'mine';
    this.danger = 0;
    this.timers = [];
    this.indoors = false;
    this.hb = 0;
    this.inAmbient = false;
  }

  start() {
    if (this.ctx) { if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {}); return; }
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    const ctx = (this.ctx = new C());
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.85;
    this.lp = ctx.createBiquadFilter();
    this.lp.type = 'lowpass';
    this.lp.frequency.value = 18000;
    // лимитер: звуки громкие, но не должны хрипеть на пиках
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -9; lim.knee.value = 6; lim.ratio.value = 10; lim.attack.value = 0.002; lim.release.value = 0.18;
    this.lim = lim;
    this.master.connect(this.lp).connect(lim).connect(ctx.destination);

    // шина эффектов: сухой звук + немного «комнаты»
    this.bus = ctx.createGain();
    this.bus.gain.value = 1.9; // звуки действий громче фона
    this.bus.connect(this.master);
    // Случайные звуки мира отдельно от звука интерфейса: их можно убрать
    // после смерти, оставив ветер и лампу.
    this.ambBus = ctx.createGain();
    this.ambBus.gain.value = 0.72;
    this.ambBus.connect(this.master);
    this.verb = ctx.createConvolver();
    this.verb.buffer = this.impulse(1.7, 2.6);
    this.verbSend = ctx.createGain();
    this.verbSend.gain.value = 0.1;
    this.verbOut = ctx.createGain();
    this.verbOut.gain.value = 0.9;
    this.bus.connect(this.verbSend).connect(this.verb).connect(this.verbOut).connect(this.master);

    // шумовой буфер
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    }
    this.noise = buf;

    // ветер
    this.windSrc = ctx.createBufferSource();
    this.windSrc.buffer = buf; this.windSrc.loop = true;
    this.windBp = ctx.createBiquadFilter(); this.windBp.type = 'bandpass'; this.windBp.frequency.value = 420; this.windBp.Q.value = 0.7;
    this.windLp = ctx.createBiquadFilter(); this.windLp.type = 'lowpass'; this.windLp.frequency.value = 3000;
    this.windGain = ctx.createGain(); this.windGain.gain.value = 0.0;
    this.windSrc.connect(this.windBp).connect(this.windLp).connect(this.windGain).connect(this.master);
    this.windSrc.start();

    // низкий гул
    this.droneGain = ctx.createGain(); this.droneGain.gain.value = 0.0;
    const mk = (type, f, g) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
      const gg = ctx.createGain(); gg.gain.value = g;
      o.connect(gg).connect(this.droneGain); o.start(); return o;
    };
    mk('sine', 49, 0.5); mk('sine', 49.7, 0.5); mk('triangle', 73.4, 0.12); mk('sine', 24.5, 0.6);
    this.droneGain.connect(this.master);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lg = ctx.createGain(); lg.gain.value = 0.02;
    lfo.connect(lg).connect(this.droneGain.gain); lfo.start();

    ctx.onstatechange = () => { if (ctx.state !== 'running' && !this.muted) setTimeout(() => ctx.resume().catch(() => {}), 200); };
    this.timers.push(setInterval(() => this.gust(), 4200));
    this.timers.push(setInterval(() => this.ambientTick(), 700));
    this.gust();
    this.applyScene();
  }

  impulse(sec, decay) {
    const ctx = this.ctx;
    const n = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return b;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.85, this.ctx.currentTime, 0.1);
  }

  setScene(name, opts = {}) {
    this.scene = name;
    this.job = opts.job || this.job;
    this.indoors = INDOORS.has(name);
    this.applyScene();
  }

  applyScene() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const p = SPACE[this.scene] || SPACE.title;
    this.space = p;
    this.windLp.frequency.setTargetAtTime(p.windCut, t, 0.4);
    this.windGain.gain.setTargetAtTime(p.wind, t, 0.8);
    this.droneGain.gain.setTargetAtTime(p.drone, t, 1.2);
    this.verbSend.gain.setTargetAtTime(p.verb, t, 0.5);
  }

  gust() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const base = this.space?.wind ?? (this.indoors ? 0.022 : 0.05);
    const peak = base + Math.random() * (this.indoors ? 0.012 : 0.045);
    this.windGain.gain.cancelScheduledValues(t);
    this.windGain.gain.setTargetAtTime(peak, t, 1.2);
    this.windGain.gain.setTargetAtTime(base, t + 1.8 + Math.random() * 1.5, 1.4);
    this.windBp.frequency.setTargetAtTime(280 + Math.random() * 700, t, 1.5);
  }

  // состояние героя влияет на слух
  update(stats) {
    if (!this.ctx) return;
    const s = stats;
    this.danger = Math.max(0, 1 - Math.min(s.health, s.warmth + 10, s.satiety + 25, s.sanity + 20) / 60);
    const dull = Math.pow(1 - s.satiety / 100, 2) * 0.6 + Math.pow(1 - s.sanity / 100, 2) * 0.35 + this.danger * 0.35;
    const f = 18000 * Math.pow(0.07, Math.min(1, dull)); // 18k -> ~1.2k
    this.lp.frequency.setTargetAtTime(Math.max(2400, f), this.ctx.currentTime, 0.6);
  }

  ambientTick() {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return;
    if (this.danger > 0.4) {
      const bpm = 60 + this.danger * 60;
      this.hb += 0.7;
      if (this.hb >= 60 / bpm) { this.hb = 0; this.heart(0.25 + this.danger * 0.35); }
    }
    const amb = AMB[this.scene] || {};
    const go = (k) => amb[k] && Math.random() < amb[k];
    this.inAmbient = true;
    if (amb.step && Math.random() < 0.9) this.step(0.2);
    if (amb.work) this.workTick();
    if (go('crowd')) this.crowd(this.scene === 'dining' ? 1.0 : 0.6);
    if (go('cough')) this.cough();
    if (go('bark') ) this.bark();
    if (go('crackle')) this.crackle();
    if (go('whisper')) this.whisper(2 + Math.floor(Math.random() * 4), 0.5);
    if (go('snore')) this.snore();
    if (go('ladle')) this.ladle();
    if (go('spoon')) this.spoon();
    if (go('pour')) this.pour();
    if (go('groan')) this.groan();
    if (go('drip')) this.drip();
    if (go('steps')) this.step(this.scene === 'cell' ? 0.07 : 0.11);
    if (go('snow')) this.burst({ dur: 0.35, f: 6000, q: 0.5, g: 0.015, type: 'highpass' });
    this.inAmbient = false;
  }

  // ---------- примитивы ----------
  out() { return (this.inAmbient ? this.ambBus : this.bus) || this.master; }

  burst({ dur = 0.1, f = 800, q = 1, g = 0.3, type = 'bandpass', delay = 0, attack = 0.005, endF, pan }) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const s = ctx.createBufferSource(); s.buffer = this.noise;
    const flt = ctx.createBiquadFilter(); flt.type = type; flt.frequency.setValueAtTime(f, t); flt.Q.value = q;
    if (endF) flt.frequency.exponentialRampToValueAtTime(endF, t + dur);
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(g, t + attack);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = s.connect(flt).connect(gn);
    if (pan !== undefined && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; node = node.connect(p); }
    node.connect(this.out());
    s.start(t, Math.random() * 1.5, dur + 0.05);
  }

  tone({ f = 100, f2, dur = 0.3, g = 0.3, type = 'sine', delay = 0, attack = 0.005, pan }) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(g, t + attack);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o.connect(gn);
    if (pan !== undefined && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; node = node.connect(p); }
    node.connect(this.out());
    o.start(t); o.stop(t + dur + 0.05);
  }

  // голосовой «слог»: пила через два форманта. Так звучит приглушённая речь без слов
  voice({ f0 = 120, f0b, dur = 0.09, g = 0.05, f1 = 500, f2 = 1400, delay = 0, type = 'sawtooth', pan, q = 5 }) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t);
    o.frequency.linearRampToValueAtTime(f0b || f0 * rnd(0.88, 1.1), t + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(g, t + Math.min(0.02, dur * 0.3));
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const mix = ctx.createGain();
    for (const [fc, gg] of [[f1, 1], [f2, 0.55]]) {
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fc; bp.Q.value = q;
      const vg = ctx.createGain(); vg.gain.value = gg;
      o.connect(bp).connect(vg).connect(mix);
    }
    mix.connect(env);
    let node = env;
    if (pan !== undefined && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; node = node.connect(p); }
    node.connect(this.out());
    o.start(t); o.stop(t + dur + 0.05);
  }

  // ---------- речь под текстом ("бебнеж") ----------
  // kind: mumble (рассказчик), gruff (конвой, повар, десятник), whisper (донос, шёпот)
  babble(kind = 'mumble', len = 5) {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return;
    const lenK = Math.min(1.4, 0.7 + len * 0.08);
    if (kind === 'whisper') {
      this.burst({ dur: 0.07 * lenK + 0.04, f: rnd(2200, 3600), q: 1.4, g: 0.3, attack: 0.012 });
      this.burst({ dur: 0.09 * lenK, f: rnd(900, 1500), q: 2.4, g: 0.18, attack: 0.015 });
      return;
    }
    const gruff = kind === 'gruff';
    this.voice({
      f0: gruff ? rnd(78, 104) : rnd(112, 142),
      dur: (gruff ? 0.11 : 0.085) * lenK,
      g: gruff ? 0.75 : 0.95,
      f1: rnd(gruff ? 420 : 380, gruff ? 720 : 760),
      f2: rnd(900, gruff ? 1500 : 2100),
      type: gruff ? 'sawtooth' : 'triangle',
      q: gruff ? 6 : 5,
    });
  }

  // гул толпы: несколько приглушённых слогов с разных сторон
  crowd(level = 0.6) {
    if (!this.ctx) return;
    const n = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      this.voice({
        f0: rnd(85, 190), dur: rnd(0.12, 0.3), g: 0.15 * level,
        f1: rnd(350, 800), f2: rnd(900, 2000), delay: rnd(0, 0.9),
        pan: rnd(-0.85, 0.85), q: 3.5,
      });
    }
  }

  whisper(words = 3, level = 1) {
    for (let i = 0; i < words; i++) {
      this.burst({ dur: rnd(0.12, 0.28), f: rnd(2000, 3600), q: 1.3, g: 0.2 * level, attack: 0.03, delay: i * rnd(0.2, 0.34), pan: rnd(-0.5, 0.5) });
      this.burst({ dur: rnd(0.1, 0.2), f: rnd(800, 1400), q: 2.2, g: 0.11 * level, attack: 0.03, delay: i * 0.27 + 0.02, pan: rnd(-0.5, 0.5) });
    }
  }

  // ---------- действия ----------
  click() {
    // металлическая пластина: глухой удар и короткий звон
    this.tone({ f: 150, f2: 85, dur: 0.1, g: 0.2 });
    this.burst({ dur: 0.035, f: 2600, q: 2.5, g: 0.1 });
    this.tone({ f: 1750, dur: 0.14, g: 0.022, type: 'triangle' });
    this.tone({ f: 2630, dur: 0.1, g: 0.012, type: 'triangle' });
  }
  next() {
    // шорох бумаги: «Далее»
    this.burst({ dur: 0.16, f: 2400, endF: 900, q: 0.8, g: 0.24, type: 'bandpass' });
    this.burst({ dur: 0.07, f: 5200, q: 0.7, g: 0.1, type: 'highpass', delay: 0.04 });
  }
  hover() { this.burst({ dur: 0.02, f: 3200, q: 4, g: 0.03 }); }

  beat(heavy = false) {
    // удар: глухой удар в тело, хлопок ткани, короткий выдох
    this.tone({ f: 120, f2: 42, dur: 0.24, g: 0.5 });
    this.burst({ dur: 0.1, f: 750, q: 0.9, g: 0.34 });
    this.burst({ dur: 0.14, f: 450, q: 0.6, g: 0.16, type: 'lowpass', delay: 0.02 });
    this.voice({ f0: 135, f0b: 80, dur: 0.22, g: 0.12, f1: 620, f2: 1100, delay: 0.07, q: 4 });
    if (heavy) {
      this.tone({ f: 105, f2: 38, dur: 0.26, g: 0.5, delay: 0.3 });
      this.burst({ dur: 0.1, f: 680, q: 0.9, g: 0.3, delay: 0.3 });
      this.voice({ f0: 120, f0b: 70, dur: 0.3, g: 0.12, f1: 560, f2: 1000, delay: 0.37, q: 4 });
    }
  }
  shot() {
    this.burst({ dur: 0.5, f: 6500, endF: 260, q: 0.4, g: 0.7, type: 'lowpass', attack: 0.002 });
    this.tone({ f: 95, f2: 38, dur: 0.36, g: 0.5, attack: 0.002 });
    this.burst({ dur: 0.08, f: 4200, q: 0.5, g: 0.3, type: 'highpass', attack: 0.001 });
  }
  slam() {
    this.tone({ f: 210, f2: 60, dur: 0.22, g: 0.45 });
    this.burst({ dur: 0.1, f: 1200, q: 1, g: 0.4 });
    this.tone({ f: 740, dur: 0.5, g: 0.04, type: 'triangle', delay: 0.02 });
    this.burst({ dur: 0.05, f: 3000, q: 4, g: 0.12, delay: 0.12 });
  }
  stamp() {
    this.tone({ f: 85, f2: 50, dur: 0.18, g: 0.5 });
    this.burst({ dur: 0.07, f: 1800, q: 1, g: 0.15 });
    this.burst({ dur: 0.12, f: 3500, q: 0.7, g: 0.05, type: 'highpass', delay: 0.03 });
  }

  step(g = 0.2) {
    const pan = rnd(-0.3, 0.3);
    this.burst({ dur: 0.11, f: rnd(450, 800), q: 0.8, g, type: 'lowpass', pan });
    this.burst({ dur: 0.06, f: rnd(3000, 4500), q: 1, g: g * 0.35, type: 'highpass', pan, delay: 0.015 });
    this.tone({ f: 68, f2: 44, dur: 0.12, g: g * 0.7, pan });
  }

  // работа зависит от места
  workTick() {
    const j = this.job;
    const n = 1 + (Math.random() < 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const d = rnd(0, 0.65);
      if (j === 'mine') this.pickHit(d, 0.3);
      else if (j === 'forest') (Math.random() < 0.5 ? this.saw(d) : this.chop(d));
      else (Math.random() < 0.7 ? this.shovel(d) : this.pickHit(d, 0.2));
    }
  }
  pickHit(delay = 0, g = 0.4) {
    const pan = rnd(-0.7, 0.7);
    this.tone({ f: 110, f2: 52, dur: 0.18, g: g * 0.8, delay, pan });
    this.burst({ dur: 0.05, f: rnd(1100, 1600), q: 2, g: g * 0.8, delay, pan });
    const f = rnd(1700, 2500);
    this.tone({ f, dur: 0.16, g: g * 0.07, type: 'triangle', delay, pan });
    this.tone({ f: f * 1.52, dur: 0.1, g: g * 0.04, type: 'triangle', delay, pan });
    this.burst({ dur: 0.12, f: rnd(700, 1100), q: 1, g: g * 0.35, delay: delay + 0.04, pan }); // осыпь щебня
  }
  chop(delay = 0) {
    const pan = rnd(-0.7, 0.7);
    this.tone({ f: 190, f2: 80, dur: 0.16, g: 0.3, delay, pan });
    this.burst({ dur: 0.06, f: 1400, q: 1.2, g: 0.28, delay, pan });
    this.burst({ dur: 0.09, f: 500, q: 1, g: 0.15, type: 'lowpass', delay: delay + 0.03, pan });
  }
  saw(delay = 0) {
    const pan = rnd(-0.7, 0.7);
    for (let i = 0; i < 2; i++) {
      this.burst({ dur: 0.34, f: 2300 - i * 700, endF: 1700 + i * 600, q: 1.1, g: 0.06, attack: 0.04, delay: delay + i * 0.38, pan });
      this.burst({ dur: 0.34, f: 800, q: 1.6, g: 0.025, attack: 0.04, delay: delay + i * 0.38, pan });
    }
  }
  shovel(delay = 0) {
    const pan = rnd(-0.7, 0.7);
    this.burst({ dur: 0.28, f: 1000, endF: 380, q: 1, g: 0.14, attack: 0.03, delay, pan });
    this.tone({ f: 85, f2: 55, dur: 0.1, g: 0.18, delay: delay + 0.25, pan });
    this.burst({ dur: 0.14, f: 2600, q: 0.8, g: 0.05, type: 'highpass', delay: delay + 0.27, pan });
  }

  // сцена-кирки при выборе темпа: чаще и громче, без случайности
  workBurst(pace = 'even') {
    const n = pace === 'fast' ? 7 : pace === 'slow' ? 3 : 5;
    const gap = pace === 'fast' ? 0.34 : pace === 'slow' ? 0.8 : 0.52;
    for (let i = 0; i < n; i++) {
      const d = i * gap + rnd(-0.04, 0.04);
      if (this.job === 'mine') this.pickHit(d, 0.45);
      else if (this.job === 'forest') (i % 2 ? this.chop(d) : this.saw(d));
      else this.shovel(d);
    }
  }

  // столовая
  ladle() {
    const pan = rnd(-0.6, 0.2);
    this.tone({ f: 1240, dur: 0.38, g: 0.05, type: 'triangle', pan });
    this.tone({ f: 1880, dur: 0.26, g: 0.03, type: 'triangle', pan });
    this.burst({ dur: 0.03, f: 3200, q: 3, g: 0.1, pan });
    this.pour(0.1);
  }
  pour(delay = 0) {
    this.burst({ dur: 0.55, f: 900, endF: 380, q: 1.1, g: 0.07, attack: 0.08, delay, pan: rnd(-0.5, 0.2) });
    for (let i = 0; i < 4; i++) this.burst({ dur: 0.05, f: rnd(1400, 2400), q: 3, g: 0.025, delay: delay + 0.1 + i * rnd(0.07, 0.12) });
  }
  spoon() {
    const pan = rnd(-0.8, 0.8);
    this.burst({ dur: 0.03, f: rnd(3400, 4600), q: 4, g: 0.09, pan });
    this.tone({ f: rnd(2200, 3200), dur: 0.09, g: 0.014, type: 'triangle', pan });
    if (Math.random() < 0.5) this.burst({ dur: 0.025, f: rnd(3400, 4600), q: 4, g: 0.035, pan, delay: 0.11 });
  }
  chew() {
    for (let i = 0; i < 4; i++) {
      this.burst({ dur: 0.06, f: rnd(900, 1500), q: 1.5, g: 0.11, delay: i * rnd(0.13, 0.18) });
      this.burst({ dur: 0.03, f: 3000, q: 2, g: 0.04, delay: i * 0.15 + 0.02 });
    }
  }
  rustle() {
    for (let i = 0; i < 3; i++) this.burst({ dur: rnd(0.05, 0.1), f: rnd(2200, 4200), q: 0.8, g: 0.05, type: 'bandpass', delay: i * rnd(0.05, 0.1) });
  }
  // Сухая бумага по одеялу: отдельный короткий отклик именно для карты.
  card(place = false) {
    const pan = place ? 0.06 : rnd(-0.32, 0.32);
    this.burst({ dur: 0.055, f: place ? 1850 : 2600, endF: 920, q: 1.2, g: place ? 0.1 : 0.07, type: 'bandpass', pan });
    this.burst({ dur: 0.028, f: 3600, q: 2.3, g: 0.028, type: 'highpass', delay: 0.04, pan });
    if (place) this.tone({ f: 128, f2: 86, dur: 0.07, g: 0.035, type: 'triangle', delay: 0.025, pan });
  }
  shiver() { for (let i = 0; i < 7; i++) this.burst({ dur: 0.02, f: rnd(2600, 3800), q: 4, g: 0.06, delay: i * 0.055 }); }

  // тело
  cough() {
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      this.voice({ f0: rnd(150, 200), f0b: 90, dur: 0.1, g: 0.2, f1: 700, f2: 1500, delay: i * 0.17, q: 2, type: 'sawtooth' });
      this.burst({ dur: 0.09, f: rnd(650, 900), q: 1.4, g: 0.1, delay: i * 0.17, pan: -0.3 });
    }
  }
  groan() {
    this.voice({ f0: rnd(100, 130), f0b: rnd(70, 90), dur: rnd(0.7, 1.2), g: 0.06, f1: 450, f2: 900, q: 3, type: 'sawtooth', pan: rnd(-0.6, 0.6) });
  }
  snore() {
    const pan = rnd(-0.8, 0.8);
    this.burst({ dur: 0.8, f: 260, q: 0.9, g: 0.07, attack: 0.5, type: 'lowpass', pan });
    this.voice({ f0: rnd(52, 66), dur: 0.9, g: 0.05, f1: 160, f2: 420, q: 2, pan, delay: 0.1 });
    this.burst({ dur: 0.5, f: 900, q: 0.8, g: 0.03, attack: 0.3, delay: 1.0, pan });
  }
  heart(g = 0.3) { this.tone({ f: 58, f2: 38, dur: 0.18, g }); this.tone({ f: 54, f2: 36, dur: 0.16, g: g * 0.7, delay: 0.2 }); }
  crackle() { for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) this.burst({ dur: 0.03, f: 2200 + Math.random() * 3000, q: 3, g: 0.07, delay: Math.random() * 0.5, pan: 0.3 }); }
  bark() { const p = rnd(-0.7, 0.7); this.burst({ dur: 0.16, f: 950, endF: 480, q: 3, g: 0.08, pan: p }); this.burst({ dur: 0.16, f: 900, endF: 470, q: 3, g: 0.065, delay: 0.28, pan: p }); }
  barkClose() {
    for (let i = 0; i < 3; i++) {
      this.voice({ f0: 330, f0b: 180, dur: 0.16, g: 0.26, f1: 780, f2: 1700, delay: i * 0.3, q: 3 });
      this.burst({ dur: 0.12, f: 1500, endF: 600, q: 1.5, g: 0.18, delay: i * 0.3 });
    }
  }
  drip() { this.tone({ f: 1300, f2: 900, dur: 0.1, g: 0.05, pan: rnd(-0.4, 0.4) }); this.tone({ f: 620, dur: 0.2, g: 0.012, delay: 0.03 }); }
  rail() {
    for (let i = 0; i < 3; i++) {
      const d = i * 0.85;
      this.burst({ dur: 0.18, f: 3000, q: 1, g: 0.35, delay: d });
      for (const [f, g] of [[520, 0.18], [1260, 0.12], [2110, 0.07], [3300, 0.04]]) {
        this.tone({ f, dur: 2.6, g, delay: d, attack: 0.003 });
        this.tone({ f: f * 1.012, dur: 2.2, g: g * 0.6, delay: d, attack: 0.003 });
      }
    }
  }
  event() { this.tone({ f: 110, f2: 90, dur: 1.2, g: 0.15, attack: 0.2 }); this.tone({ f: 330, dur: 0.9, g: 0.025, attack: 0.3 }); }
  // У выбора нет «фанфар». Хорошее слышится как ткань и короткий кивок,
  // плохое — как сапог после неприятной паузы.
  good() {
    this.rustle();
    this.tone({ f: 118, f2: 92, dur: 0.1, g: 0.06, type: 'triangle', delay: 0.06 });
  }
  bad() {
    this.tone({ f: 66, f2: 42, dur: 0.15, g: 0.14, delay: 0.22 });
    this.burst({ dur: 0.09, f: 720, q: 0.8, g: 0.1, type: 'lowpass', delay: 0.22 });
    this.burst({ dur: 0.04, f: 2900, q: 2, g: 0.035, type: 'highpass', delay: 0.25 });
  }
  dread() { this.tone({ f: 46, f2: 34, dur: 1.6, g: 0.22, attack: 0.3 }); this.tone({ f: 233, f2: 220, dur: 1.2, g: 0.02, attack: 0.4, type: 'triangle' }); }
  silence(sec = 3.4) {
    if (!this.ctx || !this.ambBus) return;
    const t = this.ctx.currentTime;
    const restore = this.scene;
    this.ambBus.gain.cancelScheduledValues(t);
    this.ambBus.gain.setTargetAtTime(0.015, t, 0.12);
    // Остаток ветра и один сухой треск лампы не исчезают.
    this.windGain.gain.setTargetAtTime(Math.max(0.012, (this.space?.wind || 0.02) * 0.65), t, 0.15);
    this.tone({ f: 92, f2: 64, dur: 0.07, g: 0.025, type: 'triangle', delay: 1.05 });
    this.burst({ dur: 0.025, f: 2400, q: 3, g: 0.025, delay: 1.05 });
    this.ambBus.gain.setTargetAtTime(0.72, t + sec, 0.7);
    setTimeout(() => { if (this.scene === restore) this.applyScene(); }, (sec + 1.1) * 1000);
  }
  death() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0.0, t, 0.5);
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.85, t + 5, 1.2);
    this.tone({ f: 44, f2: 30, dur: 3.2, g: 0.35, attack: 0.4 });
  }
  relief() { this.tone({ f: 220, dur: 2.5, g: 0.08, attack: 0.5 }); this.tone({ f: 277, dur: 2.5, g: 0.05, attack: 0.8 }); }

  sfx(name, arg) {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return;
    if (typeof this[name] !== 'function' || ['start', 'update', 'setScene', 'out', 'impulse'].includes(name)) return;
    if (Array.isArray(arg)) this[name](...arg); else this[name](arg);
  }
}
