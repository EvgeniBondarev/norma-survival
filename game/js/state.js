// Состояние мира и правила. Ничего не знает ни о DOM, ни о canvas: так игру можно прогнать ботом в Node.
import { RNG } from './rng.js?v=1792891673';

export const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
export const STATS = ['warmth', 'satiety', 'strength', 'health', 'sanity'];

export class Death extends Error {
  constructor(cause) { super(cause); this.cause = cause; }
}
export class Ending extends Error {
  constructor(kind, cause) { super(kind); this.kind = kind; this.cause = cause; }
}

export const SURNAMES = [
  'Крюков', 'Белоусов', 'Гордеев', 'Пивоваров', 'Савельев', 'Тихомиров', 'Лазарев', 'Орлов',
  'Фирсов', 'Журавлёв', 'Данилов', 'Мальцев', 'Рябов', 'Кузин', 'Нестеров', 'Ширяев',
  'Волков', 'Егоров', 'Архипов', 'Соколов', 'Бородин', 'Власов', 'Глушков', 'Титов',
];
const INITIALS = ['А', 'Б', 'В', 'Г', 'Д', 'И', 'К', 'Л', 'М', 'Н', 'П', 'С', 'Т', 'Ф'];
const LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'К', 'Л', 'М', 'Н', 'П', 'Р', 'С', 'Т', 'Ф', 'Х', 'Щ', 'Э', 'Ю', 'Я'];

export const CAUSES = {
  cold: 'Замёрз',
  hunger: 'Упал и не встал: истощение',
  beaten: 'Забит',
  dog: 'Задран собакой',
  frostbite: 'Гангрена после обморожения',
  typhus: 'Тиф',
  shot: 'Застрелен «при попытке к бегству»',
  sanity: 'Перестал сопротивляться',
  exhaust: 'Умер на работе',
  release: 'Актирован',
  extended: 'Срок продлён',
};

export function makeNumber(rng) {
  return `${rng.pick(LETTERS)}-${rng.int(100, 999)}`;
}

function makeNpc(g, hp) {
  const rng = g.rng;
  let name;
  do { name = `${rng.pick(SURNAMES)} ${rng.pick(INITIALS)}.`; } while (g.brigade.some((n) => n.name === name));
  return {
    id: g.nextId++,
    name,
    num: makeNumber(rng),
    hp: hp ?? rng.int(55, 85),
    alive: true,
    since: g.day,
  };
}

export function newGame(seed, ledger = []) {
  const g = {
    seed,
    rng: new RNG(seed),
    day: 1,
    nextId: 1,
    ledger,
    lives: 0,
    brigade: [],
    brigadier: null,
    guard: null,
    job: 'mine',
    trust: 0,   // отношение бригады к тебе, -5..5
    susp: 0,    // внимание конвоя, 0..8
    crim: 0,    // отношения с блатными
    inf: 0,     // отношения со стукачом
    cautions: [], // дни, когда ловили на туфте
    seenEv: {},
    ration: 500,
    fuel: 5,     // общий запас топлива у барака, расходуется каждую ночь
    // Следы не дают мгновенный бонус. Они лежат в лагере вместе с человеком
    // и возвращаются через несколько дней — иногда помощью, иногда счётом.
    traces: [],
    debts: [],
    // Отметка не объясняет последствия и не даёт задания. Это след в лагере:
    // чей-то взгляд, номер в тетради, вещь, которую заметили.
    marks: [],
    memories: [],
    route: { id: 'etap', title: 'ЭТАП' },
    seenChapters: {},
    singleMeasure: null,
    // Небольшие личные истории: это не случайные карточки, а люди, которые
    // помнят ответ и возвращаются через несколько дней.
    arcs: {
      lunev: { name: 'Лунёв', state: 'waiting' },
      sivyi: { name: 'Сивый', state: 'waiting' },
      kochetkov: { name: 'Кочетков', state: 'waiting' },
      morozov: { name: 'Морозов', state: 'waiting' },
    },
    lastNormPct: null,
    d: null,
    me: null,
    deadToday: [],
    arrivalsToday: [],
  };
  g.brigadier = { name: g.rng.pick(['Сивцов', 'Мартынов', 'Гнатюк', 'Прохоров']), trait: g.rng.pick(['harsh', 'indifferent', 'own']) };
  g.guard = { trait: g.rng.pick(['picky', 'lazy', 'brutal']) };
  // Новый старт не обязан начинаться тем же прииском и тем же раскладом у ворот.
  g.job = g.rng.pick(['mine', 'forest', 'road']);
  g.opening = g.rng.pick(['этап', 'недостача', 'ночной снег', 'перевод']);
  g.informer = 'Кочетков';
  g.criminal = 'Сивый';
  for (let i = 0; i < 7; i++) g.brigade.push(makeNpc(g));
  newLife(g);
  return g;
}

const TRACE_LIMIT = 7;
const MARK_LIMIT = 5;
const DEBT_LABELS = {
  suspicion: 'недобор в наряде',
  witness: 'ты видел слишком много',
  promise: 'обещанный хлеб',
  criminal: 'взгляд блатных',
};

export function addTrace(g, { text, due = 2, kind = 'memory' }) {
  const trace = { id: g.nextId++, text, kind, dueDay: g.day + due };
  g.traces.push(trace);
  g.memories.push({ id: trace.id, text, kind, day: g.day, state: 'waiting' });
  if (g.traces.length > TRACE_LIMIT) g.traces.shift();
  return trace;
}

export function addDebt(g, { type, due = 2, text }) {
  const debt = { id: g.nextId++, type, text: text || DEBT_LABELS[type] || 'долг', dueDay: g.day + due };
  g.debts.push(debt);
  return debt;
}

export function addMark(g, { kind = 'notice', text, due = 2 }) {
  const mark = { id: g.nextId++, kind, text: text || 'твой номер отметили', dueDay: g.day + due };
  g.marks.push(mark);
  g.memories.push({ id: mark.id, text: mark.text, kind, day: g.day, state: 'waiting' });
  if (g.marks.length > MARK_LIMIT) g.marks.shift();
  return mark;
}

// Первые два дня объясняют правила. На 3–5-й лагерь уже собирает счёт;
// после пятого тело не возвращается к безопасному равновесию.
export function survivalPressure(g) {
  if (g.day <= 2) return 0;
  if (g.day <= 5) return 1;
  return Math.min(4, 2 + Math.floor((g.day - 6) / 3));
}

function resolveMemory(g, entry, outcome) {
  const memory = g.memories.find((x) => x.id === entry.id);
  if (memory) { memory.state = 'returned'; memory.dayReturned = g.day; memory.outcome = outcome; }
}

export function routeFor(g) {
  if (g.pendingCell || g.d?.cell) return { id: 'cell', title: 'КАРЦЕР' };
  if (g.pendingLazaret > 0 || g.d?.lazaret) return { id: 'lazaret', title: 'ЛАЗАРЕТ' };
  if (g.day === 1) return { id: 'etap', title: 'ЭТАП' };
  if (g.day <= 3) return { id: 'brigade', title: 'ПРИПИСКА К БРИГАДЕ' };
  return { id: 'mine', title: 'ПРИИСК' };
}

// Возвращает один отложенный счёт за раз: лагерь не объясняет всё сразу.
export function dueConsequences(g) {
  const mark = g.marks.find((x) => x.dueDay <= g.day);
  if (mark) {
    g.marks = g.marks.filter((x) => x !== mark);
    const outcomes = {
      measure: { text: 'У конторы тебя называют по номеру. Следователь задаёт четыре обычных вопроса и отпускает. Хуже всего, что он ничего не объясняет.', eff: { sanity: -5, susp: 1 } },
      parcel: { text: 'Ночью под нарами шуршат чужие руки. Утром от посылки остаются крошки бумаги и пустой мешочек.', eff: { bread: -999, tobacco: -999, blanket: false, sanity: -6 } },
      trail: { text: 'На следующей поверке тебя снова ставят первым. Конвойный помнит, кто замедлил колонну в целине.', eff: { warmth: -7, strength: -4, susp: 1 } },
      witness: { text: 'Дневальный задерживает на тебе взгляд. Потом молча пересаживает ближе к двери, где тянет от щели.', eff: { warmth: -6, sanity: -3 } },
      ration: { text: 'На раздаче нарядчик вытряхивает твою тряпку. Сухарь он не находит, но теперь знает, куда смотреть.', eff: { susp: 1, sanity: -2 } },
      notice: { text: 'Утром конвойный узнаёт тебя раньше, чем ты успеваешь отвернуться. Он ничего не делает — только задерживает взгляд.', eff: { susp: 1, sanity: -2 } },
    };
    const out = mark.kind === 'lagging' && (g.susp >= 4 || g.me.stats.strength < 20)
      && g.rng.chance(0.18 + Math.max(0, g.susp - 3) * 0.06 + Math.max(0, 20 - g.me.stats.strength) * 0.015)
      ? { text: 'У ворот ты снова отстаёшь на шаг. Конвойный кричит, что ты уходишь из строя, и стреляет раньше, чем кто-то успевает объяснить.', die: 'shot' }
      : mark.kind === 'lagging'
        ? { text: 'Конвойный ставит тебя на край колонны и велит не отставать. Винтовка идёт рядом до самого забоя.', eff: { warmth: -6, strength: -5, susp: 1 } }
        : outcomes[mark.kind] || outcomes.notice;
    resolveMemory(g, mark, out.text);
    return { kicker: 'ОТМЕТКА', notice: mark.text, ...out };
  }
  const dueTrace = g.traces.find((x) => x.dueDay <= g.day);
  if (dueTrace) {
    g.traces = g.traces.filter((x) => x !== dueTrace);
    const outcomes = {
      kindness: { text: 'У печи тебе молча отодвигают место. Тот, кому ты помог, не смотрит в твою сторону. Но рядом с трубой теплее.', eff: { warmth: 9, sanity: 2 } },
      brigadier: { text: `Бригадир ${g.brigadier.name} листает наряд, задерживает палец на твоей строке и ничего не исправляет.`, eff: { susp: -1, sanity: 1 } },
      criminal: { text: 'Сивый проходит мимо твоих нар. На этот раз не останавливается. Этого достаточно.', eff: { sanity: 1, crim: 1 } },
      memory: { text: 'Морозов проходит мимо и не поднимает глаз. У третьей вехи уже нельзя будет передумать.', eff: { sanity: -2 } },
      wetBoot: { text: 'К вечеру вода из голенища дошла до пальцев. Хлеба давно нет, а ботинок помнит снег.', eff: { warmth: -5, sanity: -2 } },
    };
    const out = outcomes[dueTrace.kind] || outcomes.kindness;
    resolveMemory(g, dueTrace, out.text);
    return { kicker: 'ПОМНЯТ', notice: dueTrace.text, ...out };
  }
  const debt = g.debts.find((x) => x.dueDay <= g.day);
  if (!debt) return null;
  g.debts = g.debts.filter((x) => x !== debt);
  const outcomes = {
    suspicion: { text: 'Десятник достаёт старый наряд. На твоей строке карандашом поставлен крест. Он велит работать ближе к нему.', eff: { susp: 1, sanity: -3 } },
    witness: { text: 'Утром Сашка проходит мимо и задерживает ладонь на твоём плече. Не сильно. Ты понимаешь, что тебя заметили.', eff: { sanity: -4, crim: -1 } },
    promise: { text: 'Тот, кому ты обещал хлеб, ждёт у печи. Карман у тебя пуст. Он не спорит — просто больше не пускает близко к теплу.', eff: { warmth: -5, trust: -1 } },
    criminal: { text: 'В темноте кто-то сдвигает твои вещи с нар. Ничего не взял. Это не подарок, а напоминание.', eff: { sanity: -3, crim: -1 } },
  };
  return { kicker: 'ДОЛГ', notice: `Счёт: ${debt.text}.`, ...(outcomes[debt.type] || outcomes.suspicion) };
}

export function newLife(g) {
  const first = g.lives === 0;
  const rng = g.rng;
  g.lives++;
  g.me = {
    num: makeNumber(rng),
    born: g.day,
    stats: {
      warmth: first ? 72 : rng.int(58, 74),
      satiety: first ? 58 : rng.int(40, 56),
      strength: first ? 72 : rng.int(55, 70),
      health: first ? 82 : rng.int(55, 72),
      sanity: first ? 72 : rng.int(50, 66),
    },
    flags: { frostbite: 0, scurvy: 0, typhus: 0, hunger: 0 },
    inv: { bread: 0, tobacco: first ? 1 : 0, wraps: 1, mittens: 1, boots: first ? 'good' : 'worn', rag: 1, blanket: first },
    tags: {},
    lastHit: null,
  };
}

export function alive(g) { return g.brigade.filter((n) => n.alive); }
export function weakest(g) {
  const a = alive(g);
  return a.length ? a.reduce((m, n) => (n.hp < m.hp ? n : m)) : null;
}

export function beginDay(g) {
  const rng = g.rng;
  // Зима не стоит на месте: безопасного «обычного дня» в лагере нет.
  const base = -20 - Math.min(g.day, 45) * 0.62 - Math.max(0, g.day - 5) * 0.9;
  const temp = Math.round(base + rng.range(-6, 5));
  let weather = 'clear';
  const r = rng.next();
  if (r < 0.14 + (temp < -30 ? 0.12 : 0)) weather = 'blizzard';
  else if (r < 0.4) weather = 'wind';
  if (g.day % 9 === 1 && g.day > 1) g.job = rng.pick(['mine', 'forest', 'road'].filter((j) => j !== g.job));
  g.d = {
    temp,
    weather,
    tufta: false,
    mended: false,
    norm: null,
    slow: 0,
    helped: false,
    crisis: false,
    events: 0,
    tags: {},
    cell: !!(g.pendingCell),
  };
  g.route = routeFor(g);
  g.pendingCell = false;
  g.deadToday = [];
  g.arrivalsToday = [];
}

export function coldMod(g) {
  const t = -g.d.temp;
  let m = clamp(t / 34, 0.35, 1.8);
  if (g.d.weather === 'blizzard') m += 0.35;
  else if (g.d.weather === 'wind') m += 0.15;
  const inv = g.me.inv;
  let p = 0;
  if (inv.boots === 'good') p += 0.12;
  else if (inv.boots === 'none') p -= 0.18;
  if (inv.mittens > 0) p += 0.08;
  if (inv.wraps > 0) p += 0.06;
  if (g.d.mended) p += 0.1;
  p -= 0.05 * g.me.flags.frostbite;
  return m * (1 - p);
}

export function workFactor(g) {
  const s = g.me.stats;
  let f = (0.35 + 0.65 * (s.strength / 100)) * (0.6 + 0.4 * (s.health / 100));
  if (g.me.flags.frostbite) f *= 0.9;
  if (g.me.flags.typhus) f *= 0.7;
  return f;
}

export function apply(g, e = {}) {
  const s = g.me.stats;
  for (const k of STATS) if (e[k]) s[k] = clamp(s[k] + e[k]);
  const inv = g.me.inv;
  if (e.bread) inv.bread = clamp(inv.bread + e.bread, 0, 700);
  if (e.tobacco) inv.tobacco = Math.max(0, inv.tobacco + e.tobacco);
  if (e.wraps) inv.wraps = Math.max(0, inv.wraps + e.wraps);
  if (e.mittens) inv.mittens = Math.max(0, inv.mittens + e.mittens);
  if (e.rag) inv.rag = Math.max(0, inv.rag + e.rag);
  if (e.boots) inv.boots = e.boots;
  if (e.blanket !== undefined) inv.blanket = e.blanket;
  const f = g.me.flags;
  if (e.frostbite) f.frostbite = clamp(f.frostbite + e.frostbite, 0, 3);
  if (e.scurvy) f.scurvy = clamp(f.scurvy + e.scurvy, 0, 3);
  if (e.typhus) f.typhus = clamp(f.typhus + e.typhus, 0, 5);
  if (e.trust) g.trust = clamp(g.trust + e.trust, -5, 5);
  if (e.susp) g.susp = clamp(g.susp + e.susp, 0, 8);
  if (e.crim) g.crim = clamp(g.crim + e.crim, -5, 5);
  if (e.inf) g.inf = clamp(g.inf + e.inf, -5, 5);
  if (e.all) for (const n of alive(g)) n.hp = clamp(n.hp + e.all);
  if (e.weak) { const w = weakest(g); if (w) w.hp = clamp(w.hp + e.weak); }
  if (e.norm && g.d.norm) g.d.norm.done += e.norm;
  if (e.ration) g.ration = Math.max(0, g.ration + e.ration);
  if (e.fuel) g.fuel = clamp(g.fuel + e.fuel, 0, 8);
  if (e.hit) g.me.lastHit = e.hit;
  if (e.tag) g.me.tags[e.tag] = true;
  if (e.mended) g.d.mended = true;
  checkDeath(g);
}

export function checkDeath(g) {
  const s = g.me.stats;
  const f = g.me.flags;
  if (s.health <= 0) {
    if (f.typhus > 0) throw new Death('typhus');
    if (g.me.lastHit === 'dog') throw new Death('dog');
    if (g.me.lastHit === 'beaten') throw new Death('beaten');
    if (f.frostbite >= 2) throw new Death('frostbite');
    if (s.satiety < 25) throw new Death('hunger');
    throw new Death('cold');
  }
  if (s.warmth <= 0) throw new Death('cold');
  if (s.sanity <= 0) throw new Death('sanity');
  if (s.satiety <= 0 && s.strength <= 10) throw new Death('hunger');
  if (s.strength <= 0) throw new Death('exhaust');
}

// Для показа изменений после действия: без чисел, только знак и вес.
export function snapshot(g) {
  const s = g.me.stats;
  return {
    ...s,
    bread: g.me.inv.bread,
    tobacco: g.me.inv.tobacco,
    frostbite: g.me.flags.frostbite,
    typhus: g.me.flags.typhus,
  };
}

export function diff(before, g) {
  const now = snapshot(g);
  const out = [];
  const mag = (d, big) => (Math.abs(d) >= big * 2 ? 3 : Math.abs(d) >= big ? 2 : 1);
  for (const k of STATS) {
    const d = now[k] - before[k];
    if (Math.abs(d) >= 1) out.push({ key: k, sign: Math.sign(d), mag: mag(d, 6) });
  }
  if (now.bread !== before.bread) out.push({ key: 'bread', sign: Math.sign(now.bread - before.bread), mag: mag(now.bread - before.bread, 120) });
  if (now.tobacco !== before.tobacco) out.push({ key: 'tobacco', sign: Math.sign(now.tobacco - before.tobacco), mag: 1 });
  if (now.frostbite > before.frostbite) out.push({ key: 'frostbite', sign: -1, mag: 1 });
  if (now.typhus > before.typhus) out.push({ key: 'typhus', sign: -1, mag: 1 });
  return out;
}

// Ежедневная смена бригады: нормы нет, значит слабые начинают умирать.
export function closeDay(g, pct) {
  const rng = g.rng;
  const p = pct ?? g.lastNormPct ?? 85;
  const cold = clamp((-g.d.temp - 24) / 12, 0, 2);
  for (const n of alive(g)) {
    // Назначенного на одиночный замер не «случайно» убивает обычная смена:
    // его отдельная судьба разыгрывается на следующий день.
    if (g.singleMeasure?.npcId === n.id && g.singleMeasure.stage === 'announced') {
      n.hp = Math.max(8, n.hp);
      continue;
    }
    let d = p >= 100 ? 1 : p >= 80 ? -2 : p >= 60 ? -4 : -7;
    d -= cold * 1.5;
    if (g.brigadier.trait === 'harsh' && p < 100) d -= 1;
    d += rng.range(-2.5, 1.5);
    n.hp = clamp(n.hp + d);
    // Недобор не только уменьшает завтрашнюю пайку: для уже ослабевшего
    // человека он может стать последней сменой.
    const rationDeath = p < 60 && n.hp < 34 && rng.chance(0.22 + (60 - p) / 100);
    if (n.hp <= 0 || rationDeath) {
      n.alive = false;
      n.diedDay = g.day;
      n.deathCause = rationDeath || p < 60 ? 'недобор нормы и срезанная пайка'
        : p < 80 ? 'неполная норма и истощение' : 'смена и мороз';
      g.deadToday.push(n);
    }
  }
  if (alive(g).length < 8 && rng.chance(0.55)) {
    const n = makeNpc(g, rng.int(70, 90));
    g.brigade.push(n);
    g.arrivalsToday.push(n);
  }
  g.ration = p < 60 ? 300 : p < 90 ? 400 : p < 100 ? 500 : 650;
  g.lastNormPct = p;
  g.day++;
}

export function causeText(c) { return CAUSES[c] || c; }
