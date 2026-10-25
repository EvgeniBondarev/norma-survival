// Интерфейс: панель выбора, карточка события, HUD, экраны дня и смерти. io для game.js.
import { lazyImg, imgUrl, ARCHIVE_ASSETS } from './assets.js?v=1792891673';
import { alive, STATS } from './state.js?v=1792891673';
import { jobName } from './game.js?v=1792891673';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const ICON = {
  warmth: 'ui/icon-warmth.webp',
  satiety: 'ui/icon-hunger.webp',
  strength: 'ui/icon-strength.webp',
  health: 'ui/icon-health.webp',
  sanity: 'ui/icon-sanity.webp',
  frostbite: 'ui/icon-frostbite.webp',
  typhus: 'ui/icon-typhus.webp',
  scurvy: 'ui/icon-scurvy.webp',
  bread: 's/item-bread.webp',
  tobacco: 's/item-tobacco.webp',
  mark: 'ui/mark-tag.webp',
};
const STATE_WORDS = {
  warmth: [[70, 'тебе тепло'], [45, 'прохладно'], [25, 'ты мёрзнешь'], [0, 'ты замерзаешь']],
  satiety: [[70, 'ты сыт'], [45, 'терпимо'], [25, 'ты голоден'], [0, 'ты голодаешь']],
  strength: [[70, 'есть силы'], [45, 'ты устал'], [25, 'ты выдохся'], [0, 'ты падаешь с ног']],
  health: [[70, 'ты здоров'], [45, 'ты слаб'], [25, 'ты болен'], [0, 'ты при смерти']],
  sanity: [[70, 'ясная голова'], [45, 'ты держишься'], [25, 'ты на пределе'], [0, 'всё рассыпается']],
};
const stateWord = (k, v) => (STATE_WORDS[k].find(([t]) => v >= t) || STATE_WORDS[k][3])[1];

// подсказки в стиле книги: что значит иконка
const TIPS = {
  warmth: { icon: 'warmth', title: 'Тепло', text: 'Сколько тепла осталось в теле. На морозе оно утекает, у печи и во сне возвращается. Когда кончится, замёрзнешь насмерть.' },
  satiety: { icon: 'satiety', title: 'Сытость', text: 'Хлеб и баланда держат человека на ногах. Тяжёлая работа сжигает сытость быстрее, чем её удаётся вернуть.' },
  strength: { icon: 'strength', title: 'Силы', text: 'От них зависит, сколько ты вырабатываешь за час. Силы возвращает сон, но только когда сыт и согрет.' },
  health: { icon: 'health', title: 'Здоровье', text: 'Побои, болезни и обморожение съедают его, а лечить здесь нечем и некому. Нулевое здоровье означает смерть.' },
  sanity: { icon: 'sanity', title: 'Рассудок', text: 'Держится на людях и на малых милостях. Подлость, чужая смерть и голод его точат. Когда он кончится, ты перестаёшь сопротивляться.' },
  frostbite: { icon: 'frostbite', title: 'Обморожение', text: 'Пальцы белеют и не слушаются. Тряпка и рукавицы помогают, фельдшер срезает мёртвое, пока оно не пошло выше.' },
  scurvy: { icon: 'scurvy', title: 'Цинга', text: 'От долгого голода шатаются зубы и ноют дёсны. Каждую ночь она отнимает немного здоровья.' },
  typhus: { icon: 'typhus', title: 'Тиф', text: 'Жар и бред. Больной тянет здоровье вниз, и его боятся все. Изолятор спасает не всегда.' },
  bread: { icon: 'item-bread', title: 'Заначка хлеба', text: 'Припрятанный кусок. Его можно съесть ночью, выменять или отдать слабому. Пока спишь, он может исчезнуть.', file: 's/item-bread.webp' },
  tobacco: { icon: 'item-tobacco', title: 'Махорка', text: 'Лагерные деньги. За щепоть дают место у печи, горбушку или тихий голос врача.', file: 's/item-tobacco.webp' },
  fuel: { title: 'Топливо барака', text: 'Общий ящик у печи. Каждая ночь съедает одно деление. Когда он пуст, мёрзнет весь барак, не только ты.' },
  debts: { title: 'Долги', text: 'Обещания, подозрения и чужие взгляды. Три неразобранных долга вынуждают расплачиваться хлебом, махоркой или телом.' },
  marks: { icon: 'mark', file: 'ui/mark-tag.webp', title: 'Отметка', text: 'Твой номер или вещь заметили. Лагерь пока не объясняет, что из этого выйдет. Отметка исчезнет, когда придёт её последствие.' },
  day: { title: 'День, погода, работа', text: 'Чем дальше зима, тем злее мороз. Метель и ветер забирают тепло быстрее, а прииск, лес и дорога тянут силы по-разному.' },
  num: { title: 'Твой номер', text: 'Имени у тебя нет. Когда номер вычёркивают, завтра на твоё место встаёт другой, а бригада этого почти не замечает.' },
};

const LABEL = {
  warmth: 'Тепло', satiety: 'Сытость', strength: 'Силы', health: 'Здоровье', sanity: 'Рассудок',
  frostbite: 'Обморожение', typhus: 'Тиф', bread: 'Хлеб', tobacco: 'Махорка',
};

// важные слова: выделяем редко и тихо, как курсивом в книге (не больше двух-трёх на абзац)
const KW = [
  ['danger', ['смерт', 'умер', 'мёртв', 'мертв', 'убит', 'расстрел', 'выстрел', 'карцер', 'срок', 'донос', 'тиф', 'гангрен', 'обморож', 'голод', 'побег', 'бьют', 'избил', 'забил']],
  ['goods', ['хлеб', 'пайк', 'махорк', 'баланд', 'горбуш', 'валенк', 'сапог', 'рукавиц', 'портянк', 'норма', 'нормы', 'норму', 'нормой']],
];
function kwClass(word) {
  const w = word.toLowerCase().replace(/[^а-яёa-z0-9]/g, '');
  if (!w) return '';
  for (const [cls, stems] of KW) if (stems.some((s) => w.startsWith(s))) return cls;
  return '';
}

function words(text) {
  const parts = String(text).split(/(\s+)/);
  let i = 0;
  const per = Math.min(24, Math.max(9, 1400 / Math.max(1, parts.length / 2)));
  const cap = parts.length > 70 ? 3 : 2;
  const seen = new Set();
  let used = 0;
  return parts.map((p) => {
    if (/^\s+$/.test(p)) return p;
    let c = kwClass(p);
    const key = p.toLowerCase().replace(/[^а-яё]/g, '').slice(0, 5);
    if (c && (used >= cap || seen.has(key))) c = ''; // каждое слово и не больше cap за абзац
    if (c) { used++; seen.add(key); }
    return `<span${c ? ` class="k k-${c}"` : ''} style="animation-delay:${Math.round(i++ * per)}ms">${esc(p)}</span>`;
  }).join('');
}

// когда и какого размера слово появляется на экране: по ним звучит речь-бормотание
function wordTimes(text) {
  const ws = String(text).split(/\s+/).filter(Boolean);
  const per = Math.min(24, Math.max(9, 1400 / Math.max(1, ws.length)));
  return ws.map((w, i) => [Math.round(i * per), w.replace(/[^\p{L}]/gu, '').length]);
}

// голос рассказчика по заголовку карточки
const GRUFF = new Set(['ПОВЕРКА', 'КОНВОЙ', 'ОБЫСК', 'ЗАМЕР', 'ПАЙКА', 'ВЕЧЕРНЯЯ БАЛАНДА', 'АКТИРОВКА', 'ДОБАВКА', 'КАРЦЕР', 'РАБОТА', 'БРИГАДА', 'ПЕРЕСЧЁТ', 'ПОБЕГ']);
const WHISPER = new Set(['ДОНОС', 'ШЁПОТ', 'КРАЖА', 'ВАЛЕНКИ', 'НОЧЬЮ', 'СОСЕД', 'ТИФ']);
const voiceFor = (k) => (GRUFF.has(k) ? 'gruff' : WHISPER.has(k) ? 'whisper' : 'mumble');
const PORTRAIT_SHEETS = {
  p5: 'p5/01-presentka-portraits-3x2.webp',
  p6: 'p6/01-camp-arcs-portraits-3x2.webp',
};
const portraitPath = (speaker) => PORTRAIT_SHEETS[speaker?.sheet] || PORTRAIT_SHEETS.p5;
const portraitSheet = (speaker) => imgUrl(portraitPath(speaker));
const OCHKO_CARD_ART = ['back', 'spade', 'club', 'ten', 'queen', 'blank'];
const portraitHtml = (speaker) => !speaker ? '' : `<div class="dialogue-line">
  <div class="portrait ${esc(speaker.id)}" style="--portrait-sheet:url('${portraitSheet(speaker)}')" aria-hidden="true"></div>
  <div><div class="speaker-name">${esc(speaker.name)}</div><div class="speaker-quote">${esc(speaker.quote)}</div></div>
</div>`;

// звук-«вступление» карточки события
const CUES = {
  'ПОБЕГ': (s) => { s.sfx('shot'); setTimeout(() => s.sfx('shot'), 650); },
  'КОНВОЙ': (s) => s.sfx('barkClose'),
  'ОБЫСК': (s) => { s.sfx('rustle'); setTimeout(() => s.sfx('crowd'), 300); },
  'ШЁПОТ': (s) => s.sfx('whisper', 6),
  'ДОНОС': (s) => s.sfx('whisper', 5),
  'КРАЖА': (s) => s.sfx('rustle'),
  'ВАЛЕНКИ': (s) => s.sfx('rustle'),
  'НОЧЬЮ': (s) => s.sfx('whisper', 4),
  'ТИФ': (s) => s.sfx('cough'),
  'КАРЦЕР': (s) => s.sfx('slam'),
  'АКТИРОВКА': (s) => s.sfx('stamp'),
  'ДОБАВКА': (s) => s.sfx('stamp'),
  'СОСЕД': (s) => s.sfx('groan'),
  'ПАЙКА': (s) => s.sfx('rustle'),
  'ПЕРЕСЧЁТ': (s) => s.sfx('crowd'),
  'НА ПРЕДСТАВКУ · НАУМОВ': (s) => { s.sfx('rustle'); s.sfx('whisper', 3); },
  'НА ПРЕДСТАВКУ · ГАРКУНОВ': (s) => { s.sfx('rustle'); s.sfx('dread'); },
};
const revealMs = (text) => Math.min(1800, 300 + String(text).split(/\s+/).length * 18);

function chips(deltas) {
  if (!deltas || !deltas.length) return '';
  return `<div class="deltas">${deltas.map((d) => {
    const arrows = (d.sign > 0 ? '▲' : '▼').repeat(d.mag);
    return `<span class="chip ${d.sign > 0 ? 'up' : 'down'}" title="${LABEL[d.key] || ''}"><img src="img/${ICON[d.key]}" alt=""><i>${arrows}</i></span>`;
  }).join('')}</div>`;
}

export class UI {
  constructor({ renderer, sound, store }) {
    this.r = renderer;
    this.snd = sound;
    this.store = store;
    this.g = null;
    this.root = $('#ui');
    this.hudEl = $('#hud');
    this.fader = $('#fader');
    this.waiting = null; // { n, pick(i) } | { next() }
    this.paused = false;
    this.debug = new URLSearchParams(location.search).has('debug');
    window.addEventListener('keydown', (e) => this.onKey(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    this.buildHud();
    this.buildTip();
  }

  setGame(g) { this.g = g; this.r.setState(g); this.hud(); }

  // ---------- HUD ----------
  buildHud() {
    this.hudEl.innerHTML = `
      <div class="hud-l">
        <div class="day" data-tip="day"><b id="h-day">ДЕНЬ 1</b><span id="h-temp"></span></div>
        <div class="stats">
          ${STATS.map((k) => `<div class="st" data-k="${k}" data-tip="${k}"><img src="img/${ICON[k]}" alt=""><div class="bar"><i></i></div><em></em></div>`).join('')}
          <div class="flags" id="h-flags"></div>
        </div>
        <div class="inv" id="h-inv"></div>
      </div>
      <div class="hud-r">
        <span class="num" id="h-num" data-tip="num"></span>
        <button class="mini" id="b-brig" title="Бригада (Tab)">Бригада</button>
        <button class="mini" id="b-led" title="Книга учёта (L)">Книга</button>
        <button class="mini" id="b-art" title="Зарисовки лагеря">Зарисовки</button>
        <button class="mini" id="b-snd" title="Звук (M)">Звук</button>
        <button class="mini" id="b-menu" title="Меню (Esc)">Меню</button>
      </div>
      <div id="normbar" class="normbar hidden"><div class="grv"><i></i></div><u></u><span></span></div>`;
    $('#b-brig').onclick = () => this.brigade();
    $('#b-led').onclick = () => this.ledger();
    $('#b-art').onclick = () => this.archive();
    $('#b-snd').onclick = () => this.toggleSound();
    $('#b-menu').onclick = () => this.pause();
    this.hudEl.classList.add('hidden');
  }

  showHud(v) { this.hudEl.classList.toggle('hidden', !v); }

  toggleSound() {
    this.snd.setMuted(!this.snd.muted);
    $('#b-snd').classList.toggle('off', this.snd.muted);
  }

  hud() {
    const g = this.g;
    if (!g || !g.me) return;
    const s = g.me.stats;
    $('#h-day').textContent = `ДЕНЬ ${g.day}`;
    $('#h-temp').textContent = g.d ? `${g.d.temp}° · ${{ clear: 'ясно', wind: 'ветер', blizzard: 'метель' }[g.d.weather]} · ${jobName(g.job)}` : '';
    $('#h-num').textContent = g.me.num;
    for (const k of STATS) {
      const el = $(`.st[data-k="${k}"]`, this.hudEl);
      const v = s[k];
      $('i', el).style.width = `${Math.max(2, v)}%`;
      el.classList.toggle('low', v < 28);
      $('em', el).textContent = this.debug ? Math.round(v) : '';
    }
    const f = g.me.flags;
    const inv = g.me.inv;
    $('#h-flags').innerHTML = ['frostbite', 'scurvy', 'typhus'].filter((k) => f[k] > 0)
      .map((k) => `<img class="flag" src="img/${ICON[k]}" data-tip="${k}" alt="">`).join('');
    const bits = [];
    if (inv.bread > 0) bits.push(`<span data-tip="bread"><img src="img/${ICON.bread}" alt="">${Math.round(inv.bread)} г</span>`);
    if (inv.tobacco > 0) bits.push(`<span data-tip="tobacco"><img src="img/${ICON.tobacco}" alt="">${inv.tobacco}</span>`);
    bits.push(`<span class="fuel" data-tip="fuel">ПЕЧЬ ${'■'.repeat(g.fuel)}${'□'.repeat(8 - g.fuel)}</span>`);
    if (g.debts.length) bits.push(`<span class="debt ${g.debts.length >= 3 ? 'full' : ''}" data-tip="debts">ДОЛГИ ${'■'.repeat(g.debts.length)}${'□'.repeat(Math.max(0, 3 - g.debts.length))}</span>`);
    if (g.marks.length) bits.push(`<span class="mark ${g.marks.length >= 2 ? 'full' : ''}" data-tip="marks"><img src="img/${ICON.mark}" alt="">ОТМЕТКА ${g.marks.length}</span>`);
    $('#h-inv').innerHTML = bits.join('');
    this.snd.update(s);
  }

  setNorm(n) {
    const el = $('#normbar');
    if (!n) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    const fr = Math.min(1.25, n.done / (n.target * 1.3));
    $('.grv i', el).style.width = `${Math.min(100, fr * 100)}%`;
    $('u', el).style.left = `${(1 / 1.3) * 100}%`;
    $('span', el).textContent = n.round ? `Час ${n.round}/${n.total}` : '';
  }

  // ---------- подсказки ----------
  buildTip() {
    const t = document.createElement('div');
    t.id = 'tip';
    t.className = 'hidden';
    document.getElementById('stage').appendChild(t);
    this.tip = t;
    this.hudEl.addEventListener('mouseover', (e) => {
      const el = e.target.closest('[data-tip]');
      if (el) this.showTip(el); else this.hideTip();
    });
    this.hudEl.addEventListener('mouseleave', () => this.hideTip());
  }

  showTip(el) {
    const key = el.dataset.tip;
    const d = TIPS[key];
    if (!d || !this.g?.me) return;
    const s = this.g.me.stats;
    let now = '';
    if (STATE_WORDS[key]) now = `Сейчас: ${stateWord(key, s[key])}.${this.debug ? ` (${Math.round(s[key])})` : ''}`;
    else if (key === 'bread') now = `У тебя ${Math.round(this.g.me.inv.bread)} г.`;
    else if (key === 'tobacco') now = `У тебя щепоток: ${this.g.me.inv.tobacco}.`;
    else if (key === 'day' && this.g.d) now = `Сегодня ${-this.g.d.temp} градусов мороза, работа: ${jobName(this.g.job)}.`;
    else if (key === 'num') now = `Номер ${this.g.me.num}, день ${this.g.day}.`;
    else if (key === 'marks') now = `Отметок: ${this.g.marks.length}.`;
    else if (['frostbite', 'scurvy', 'typhus'].includes(key)) now = `Тяжесть: ${'I'.repeat(Math.max(1, this.g.me.flags[key]))}.`;
    const icon = d.icon ? `<img src="img/${d.file || `ui/icon-${d.icon}.webp`}" alt="">` : '<span class="mark"></span>';
    this.tip.innerHTML = `<h4>${icon}<span>${d.title}</span></h4><p>${d.text}</p>${now ? `<div class="now">${now}</div>` : ''}`;
    const st = document.getElementById('stage').getBoundingClientRect();
    const sc = st.width / 1920;
    const r = el.getBoundingClientRect();
    const left = Math.max(20, Math.min(1920 - 480, (r.left - st.left) / sc));
    const top = (r.bottom - st.top) / sc + 14;
    this.tip.style.left = `${left}px`;
    this.tip.style.top = `${top}px`;
    if (this.tip.classList.contains('hidden')) this.snd.sfx('rustle');
    this.tip.classList.remove('hidden');
  }

  hideTip() { this.tip && this.tip.classList.add('hidden'); }

  // ---------- вспомогательное ----------
  clearPanel() { this.root.innerHTML = ''; this.waiting = null; }

  onKey(e) {
    const action = this.waiting?.action;
    if (action) { action.down(e); return; }
    if (e.repeat) return;
    if (this.modal) {
      if (e.key === 'Escape') this.closeModal();
      return;
    }
    if (e.key === 'Escape') { this.pause(); return; }
    if (e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') { this.toggleSound(); return; }
    if (e.key === 'Tab') { e.preventDefault(); this.brigade(); return; }
    if (e.key === 'l' || e.key === 'L' || e.key === 'д' || e.key === 'Д') { this.ledger(); return; }
    const w = this.waiting;
    if (!w) return;
    if (w.pick && /^[1-9]$/.test(e.key)) { w.pick(Number(e.key) - 1); }
    else if (w.next && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); w.next(); }
  }

  onKeyUp(e) { this.waiting?.action?.up(e); }

  // ---------- io ----------
  io() {
    return {
      scene: (name, opts) => this.scene(name, opts),
      sfx: (n, a) => this.sfx(n, a),
      hud: () => this.hud(),
      ration: () => {},
      setNorm: (n) => this.setNorm(n),
      dayCard: (g) => this.dayCard(g),
      morning: (g) => this.morning(g),
      choose: (spec) => this.choose(spec),
      action: (spec) => this.action(spec),
      ochko: (spec) => this.ochko(spec),
      durak: (spec) => this.durak(spec),
      result: (spec) => this.result(spec),
      note: (spec) => this.note(spec),
      end: (info) => this.end(info),
      saveLedger: (l) => this.store.save(l),
    };
  }

  // Короткая телесная реакция внутри приказа: клавиша и время, а не меню решений.
  action(spec) {
    const key = spec.key || ' ';
    const keyName = key === ' ' ? 'ПРОБЕЛ' : key.toUpperCase();
    const el = document.createElement('div');
    el.className = `action ${spec.kind || ''}`;
    const options = spec.kind === 'hide'
      ? `<div class="action-keys"><b>1</b> В ОБМОТКИ <b>2</b> ПОД РУБАХУ</div>`
      : `<div class="action-key">${spec.kind === 'still' ? 'НЕ ШЕВЕЛИТЬСЯ' : `ДЕРЖАТЬ ${keyName}`}</div>`;
    el.innerHTML = `<div class="action-kicker">${esc(spec.kicker || 'ПРИКАЗ')}</div><div class="action-text">${esc(spec.text)}</div>${options}<div class="action-bar"><i></i></div>`;
    this.root.innerHTML = '';
    this.root.appendChild(el);
    const bar = $('i', el);
    return new Promise((resolve) => {
      let done = false; let start = 0; let timer = null;
      const finish = (value) => {
        if (done) return;
        done = true; clearInterval(timer); clearTimeout(timer);
        this.waiting = null; resolve(value);
      };
      if (spec.kind === 'still') {
        const started = performance.now();
        timer = setInterval(() => {
          const p = Math.min(1, (performance.now() - started) / spec.duration);
          bar.style.width = `${p * 100}%`;
          if (p >= 1) finish('still');
        }, 30);
        this.waiting = { action: { down: () => finish('moved'), up: () => {} } };
        return;
      }
      if (spec.kind === 'hide') {
        timer = setTimeout(() => finish('late'), spec.duration);
        this.waiting = { action: { down: (e) => {
          if (e.key === '1' || e.key === '2') { e.preventDefault(); finish(e.key === '1' ? 'wraps' : 'shirt'); }
        }, up: () => {} } };
        return;
      }
      const update = () => {
        const p = Math.min(1, (performance.now() - start) / spec.duration);
        bar.style.width = `${p * 100}%`;
        if (p >= 1) finish('held');
      };
      const down = (e) => {
        if (e.key !== key || start) return;
        e.preventDefault(); start = performance.now(); timer = setInterval(update, 20);
      };
      const up = (e) => {
        if (e.key === key && start) finish('dropped');
      };
      el.onpointerdown = () => { if (!start) { start = performance.now(); timer = setInterval(update, 20); } };
      el.onpointerup = () => { if (start) finish('dropped'); };
      this.waiting = { action: { down, up } };
    });
  }

  // Короткая игра в очко: карты самодельные, а не отдельное безопасное меню.
  ochko(spec) {
    const deck = [...spec.deck]; let next = 0; let cheated = false;
    let stake = null;
    const take = () => deck[next++] ?? { rank: '10', suit: '♠', value: 10 };
    const player = [take(), take()];
    const bank = [take(), take()];
    const sum = (a) => a.reduce((n, v) => n + v.value, 0);
    const el = document.createElement('div');
    el.className = 'ochko';
    this.root.innerHTML = ''; this.root.appendChild(el);
    const render = () => {
      const cards = (list, hidden = false) => `<span class="ochko-hand">${list.map((v, i) => {
        if (hidden && i === 1) return '<i class="ochko-card back" aria-label="закрытая карта"></i>';
        const suit = ({ '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' })[v.suit];
        return `<img class="ochko-card" src="${imgUrl(`p10/deck/${v.rank}-${suit}.webp`)}" alt="${v.rank}${v.suit}" title="${v.rank}${v.suit}">`;
      }).join('')}</span>`;
      if (!stake) {
        el.innerHTML = `<div class="kicker">ОЧКО · НАУМОВ</div><div class="ochko-note">Наумов уже сдал карты. Выбери, чем ответишь за проигрыш.</div>
          <div class="ochko-stakes"><button class="btn" id="o-bread" ${spec.canBread ? '' : 'disabled'}><span class="l">100 г хлеба</span></button><button class="btn" id="o-tobacco" ${spec.canTobacco ? '' : 'disabled'}><span class="l">Махорка</span></button><button class="btn" id="o-debt"><span class="l">Долг · 100 г</span><span class="s">Нечем платить сейчас.</span></button></div>`;
        const select = (v) => { stake = v; render(); };
        $('#o-bread', el).onclick = () => select('bread');
        $('#o-tobacco', el).onclick = () => select('tobacco');
        $('#o-debt', el).onclick = () => select('debt');
        return;
      }
      const stakeLabel = { bread: 'хлеб · 100 г', tobacco: 'махорка', debt: 'долг · 100 г хлеба' }[stake];
      el.innerHTML = `<div class="kicker">ОЧКО · НАУМОВ</div><div class="ochko-note">${stakeLabel}. Карты режут из старой книги. За столом тихо.</div>
        <div class="ochko-row"><b>ТЫ · ${sum(player)}</b><span>${cards(player)}</span></div>
        <div class="ochko-row"><b>НАУМОВ · ${bank[0].value}${bank.length > 1 ? ' + ?' : ''}</b><span>${cards(bank, true)}</span></div>
        <div class="ochko-actions"><button class="btn" id="o-hit"><span class="l">Взять карту</span></button><button class="btn" id="o-stop"><span class="l">Хватит</span></button>${!cheated ? '<button class="btn" id="o-cheat"><span class="l">Подменить карту</span><span class="s">Могут заметить.</span></button>' : ''}</div>`;
      $('#o-hit', el).onclick = () => { player.push(take()); if (sum(player) > 21) finish('lose'); else render(); };
      $('#o-stop', el).onclick = () => {
        while (sum(bank) < 17) bank.push(take());
        finish(sum(bank) > 21 || sum(player) > sum(bank) ? 'win' : 'lose');
      };
      const cheat = $('#o-cheat', el);
      if (cheat) cheat.onclick = () => { cheated = true; if (spec.cheatCaught) finish('caught'); else { player.push({ rank: 'Т', suit: '♣', value: 1 }); if (sum(player) > 21) finish('lose'); else render(); } };
    };
    const finish = (result) => {
      this.waiting = null;
      this.snd.sfx(result === 'win' ? 'good' : result === 'caught' ? 'dread' : 'bad');
      resolve({ result, stake });
    };
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    render();
    return promise;
  }

  durak(spec) {
    const deck = [...spec.deck];
    const take = () => deck.pop();
    const me = deck.splice(0, 6); const bot = deck.splice(0, 6);
    const trump = deck[0];
    const rank = (c) => c.value;
    const canBeat = (card, attack) => (card.suit === attack.suit && rank(card) > rank(attack)) || (card.suit === trump.suit && attack.suit !== trump.suit);
    const suitId = (suit) => ({ '♠':'spades', '♥':'hearts', '♦':'diamonds', '♣':'clubs' })[suit];
    const trumpId = ({ '♠':'spade', '♥':'heart', '♦':'diamond', '♣':'club' })[trump.suit];
    const strength = (card) => rank(card) + (card.suit === trump.suit ? 20 : 0);
    const weakest = (hand) => hand.reduce((best, card) => !best || strength(card) < strength(best) ? card : best, null);
    const remove = (hand, card) => hand.splice(hand.indexOf(card), 1)[0];
    const el = document.createElement('div'); el.className = 'ochko durak'; this.root.innerHTML = ''; this.root.appendChild(el);
    let attack = null; let defense = null; let mode = 'defend'; let status = ''; let over = false;

    return new Promise((resolve) => {
      const face = (c, cls = '', i = null, enabled = false) => {
        if (!c) return '';
        const attrs = i === null ? '' : ` data-card-index="${i}" draggable="false"`;
        return `<button class="ochko-card ${cls}"${attrs} aria-label="${c.rank}${c.suit}"><img src="${imgUrl(`p10/deck/${c.rank}-${suitId(c.suit)}.webp`)}" alt="${c.rank}${c.suit}"></button>`;
      };
      const terminal = () => {
        if (deck.length || (me.length && bot.length)) return false;
        finish(!me.length ? 'win' : 'lose'); return true;
      };
      const draw = (first) => {
        const hands = first === 'me' ? [me, bot] : [bot, me];
        for (const hand of hands) while (hand.length < 6 && deck.length) hand.push(take());
      };
      const finish = (result) => {
        if (over) return;
        over = true;
        this.snd.sfx(result === 'win' ? 'good' : 'bad');
        resolve(result);
      };
      const beginBotAttack = () => {
        if (terminal()) return;
        const card = weakest(bot);
        if (!card) return finish('win');
        attack = remove(bot, card); defense = null; mode = 'defend';
        status = 'Наумов кладёт карту. Отбей её перетаскиванием.';
        this.snd.sfx('card', true); render();
      };
      const endDefense = () => {
        attack = null; defense = null; draw('bot');
        if (terminal()) return;
        mode = 'attack'; status = 'Твой ход. Перетащи карту на середину стола.';
        this.snd.sfx('card', true); render();
      };
      const botRespond = () => {
        if (over || mode !== 'bot-response') return;
        const possible = bot.filter((card) => canBeat(card, attack));
        const card = weakest(possible);
        if (card) {
          defense = remove(bot, card); status = 'Наумов отбился. Теперь он атакует.';
          this.snd.sfx('card', true); render();
          setTimeout(() => { if (!over) { attack = null; defense = null; draw('me'); beginBotAttack(); } }, 520);
        } else {
          bot.push(attack); attack = null; defense = null; draw('me');
          if (terminal()) return;
          mode = 'attack'; status = 'Наумов взял. Можешь подкинуть ещё карту.';
          this.snd.sfx('card', true); render();
        }
      };
      const play = (index) => {
        if (over) return;
        const card = me[index];
        if (!card) return;
        if (mode === 'defend') {
          if (!canBeat(card, attack)) { status = 'Этой картой не отбиться: нужна старше той же масти или козырь.'; this.snd.sfx('bad'); render(); return; }
          defense = me.splice(index, 1)[0]; mode = 'defended'; status = 'Карта легла. Подтверди: «Отбиться».';
          this.snd.sfx('card', true); render(); return;
        }
        if (mode === 'attack') {
          attack = me.splice(index, 1)[0]; defense = null; mode = 'bot-response'; status = 'Наумов смотрит на карту…';
          this.snd.sfx('card', true); render(); setTimeout(botRespond, 420); return;
        }
      };
      const bindCards = () => {
        const zone = $('.durak-zone', el);
        const valid = (index) => mode === 'attack' || (mode === 'defend' && canBeat(me[index], attack));
        el.querySelectorAll('[data-card-index]').forEach((cardEl) => {
          const index = Number(cardEl.dataset.cardIndex);
          if (!valid(index)) cardEl.classList.add('invalid');
          let moved = false;
          cardEl.onclick = () => { if (!moved) play(index); moved = false; }; // клик — запасной путь
          cardEl.onpointerdown = (e) => {
            if (!valid(index) || e.button !== 0) return;
            const origin = { x: e.clientX, y: e.clientY };
            let dragging = false; let ghost = null;
            const placeGhost = (ev) => { if (ghost) { ghost.style.left = `${ev.clientX}px`; ghost.style.top = `${ev.clientY}px`; } };
            const move = (ev) => {
              if (!dragging && Math.hypot(ev.clientX - origin.x, ev.clientY - origin.y) < 7) return;
              if (!dragging) {
                dragging = true; cardEl.classList.add('dragging'); this.snd.sfx('card');
                ghost = cardEl.cloneNode(true); ghost.removeAttribute('data-card-index'); ghost.className = 'durak-card-ghost';
                document.body.appendChild(ghost);
              }
              placeGhost(ev);
              const box = zone.getBoundingClientRect();
              zone.classList.toggle('drag-over', ev.clientX >= box.left && ev.clientX <= box.right && ev.clientY >= box.top && ev.clientY <= box.bottom);
            };
            const up = (ev) => {
              document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
              if (!dragging) return;
              moved = true; cardEl.classList.remove('dragging'); ghost?.remove();
              const box = zone.getBoundingClientRect();
              const dropped = ev.clientX >= box.left && ev.clientX <= box.right && ev.clientY >= box.top && ev.clientY <= box.bottom;
              zone.classList.remove('drag-over');
              if (dropped) play(index); else this.snd.sfx('card');
            };
            document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
          };
        });
        zone.ondragover = (e) => { const i = Number(e.dataTransfer.getData('text/plain')); if (valid(i)) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; zone.classList.add('drag-over'); } };
        zone.ondragleave = () => zone.classList.remove('drag-over');
        zone.ondrop = (e) => { e.preventDefault(); zone.classList.remove('drag-over'); play(Number(e.dataTransfer.getData('text/plain'))); };
      };
      const render = () => {
        const allowCards = mode === 'defend' || mode === 'attack';
        const zoneHint = mode === 'attack' ? 'Перетащи свою карту сюда' : mode === 'defend' ? 'Перетащи карту поверх атаки' : '';
        el.innerHTML = `<div class="kicker">ДУРАК · НАУМОВ</div><div class="ochko-note">Козырь: ${trump.rank}<i class="trump-suit ${trumpId}"></i>. Колода: ${deck.length}.</div>
          <div class="durak-table"><b class="durak-opponent">НАУМОВ · ${bot.length}</b><span class="durak-stock"><i></i>${deck.length} карт</span><div class="durak-zone"><span class="durak-hint">${zoneHint}</span>${attack ? `<span class="durak-pair">${face(attack, 'attack')}${defense ? face(defense, 'defense') : ''}</span>` : ''}</div></div>
          <div class="durak-hand-title"><b>ТЫ · ${me.length}</b><small>Карты тащат на середину стола</small></div><span class="ochko-hand">${me.map((card, i) => face(card, `dealt ${allowCards ? '' : 'invalid'}`, i, allowCards)).join('')}</span>
          <div class="durak-status">${status}</div><div class="ochko-actions"><button class="btn" id="d-take" ${mode !== 'defend' ? 'disabled' : ''}><span class="l">Взять</span></button><button class="btn" id="d-pass" ${mode !== 'defended' ? 'disabled' : ''}><span class="l">Отбиться</span></button></div>`;
        bindCards();
        $('#d-take', el).onclick = () => {
          if (mode !== 'defend') return;
          me.push(attack); attack = null; defense = null; draw('bot'); this.snd.sfx('card', true); beginBotAttack();
        };
        $('#d-pass', el).onclick = () => { if (mode === 'defended') endDefense(); };
      };
      beginBotAttack();
    });
  }

  scene(name, opts) {
    this.r.setScene(name, opts);
    this.snd.setScene(name, opts);
    if (name !== 'work') this.setNorm(null);
  }

  sfx(name, arg) {
    if (name === 'pick') {
      this.r.pace = arg || 'even';
      this.snd.sfx('workBurst', arg || 'even');
      return;
    }
    if (name === 'hit') { this.r.hit(); return; }
    this.snd.sfx(name, arg);
  }

  // речь без слов: по слогу на слово в момент его появления
  say(text, kind) {
    this.stopSay();
    this.sayTimers = wordTimes(text).map(([ms, len]) => setTimeout(() => this.snd.sfx('babble', [kind, len]), 120 + ms));
  }
  stopSay() { (this.sayTimers || []).forEach(clearTimeout); this.sayTimers = []; }

  // звук последствий: удары, холод, еда, вещи
  consequenceSounds(deltas) {
    if (!deltas || !deltas.length) return;
    const find = (k) => deltas.find((d) => d.key === k);
    const hp = find('health');
    if (hp && hp.sign < 0) { this.sfx('hit'); this.snd.sfx('beat', hp.mag >= 2); return; }
    const san = find('sanity');
    if (san && san.sign < 0 && san.mag >= 2) { this.snd.sfx('dread'); return; }
    const wm = find('warmth');
    if (wm && wm.sign < 0 && wm.mag >= 2) { this.snd.sfx('shiver'); return; }
    const sat = find('satiety');
    if (sat && sat.sign > 0) { this.snd.sfx('chew'); return; }
    if (find('bread') || find('tobacco')) { this.snd.sfx('rustle'); return; }
    if (deltas.some((d) => d.sign > 0)) this.snd.sfx('good');
    else if (deltas.some((d) => d.sign < 0 && d.mag >= 2)) this.snd.sfx('bad');
  }

  async choose(spec) {
    this.hud();
    if (spec.norm) this.setNorm(spec.norm);
    if (spec.img) await lazyImg(spec.img);
    if (spec.speaker) await lazyImg(portraitPath(spec.speaker));
    const hasImg = !!spec.img;
    const el = document.createElement('div');
    el.className = hasImg ? 'card' : (spec.reigns ? 'panel decree' : (spec.choices.length > 4 ? 'panel many' : 'panel'));
    const delay = revealMs(spec.text);
    const item = spec.item ? `<div class="item"><img src="img/${spec.item.icon}" alt=""><b>${esc(spec.item.label)}</b></div>` : '';
    el.innerHTML = `
      ${hasImg ? `<div class="pic"><img src="${imgUrl(spec.img)}" alt=""></div>` : ''}
      <div class="body">
        <div class="kicker">${esc(spec.kicker || '')}</div>
        ${item}
        ${portraitHtml(spec.speaker)}
        <div class="text" id="txt">${words(spec.text)}</div>
        <div class="choices${spec.reigns ? ' duel' : ''}" style="--d:${delay}ms">${spec.choices.map((c, i) => `
          <button class="btn" data-i="${i}" ${c.disabled ? 'disabled' : ''}>
            <span class="num">${i + 1}</span><span class="l">${esc(c.label)}</span>${c.sub ? `<span class="s">${esc(c.sub)}</span>` : ''}
          </button>`).join('')}</div>
      </div>`;
    this.root.innerHTML = '';
    this.root.appendChild(el);
    if (hasImg) { this.r.setDim(0.62); } else { this.r.setDim(0); }
    $('#txt', el).onclick = () => { $('#txt', el).classList.add('skip'); this.stopSay(); };
    if (CUES[spec.kicker]) CUES[spec.kicker](this);
    this.say(spec.text, voiceFor(spec.kicker));
    return new Promise((resolve) => {
      const pick = (i) => {
        const b = el.querySelector(`.btn[data-i="${i}"]`);
        if (!b || b.disabled) return;
        this.snd.sfx('click');
        this.stopSay();
        this.waiting = null;
        resolve(i);
      };
      el.querySelectorAll('.btn').forEach((b) => {
        b.onclick = () => pick(Number(b.dataset.i));
        b.onmouseenter = () => this.snd.sfx('hover');
      });
      this.waiting = { pick };
    });
  }

  async result(spec) {
    this.hud();
    if (spec.img) await lazyImg(spec.img);
    if (spec.speaker) await lazyImg(portraitPath(spec.speaker));
    const prev = this.root.firstElementChild;
    const hasImg = prev && prev.classList.contains('card');
    const el = document.createElement('div');
    el.className = hasImg ? 'card' : 'panel';
    const delay = revealMs(spec.text);
    const picHtml = spec.img
      ? `<div class="pic"><img src="${imgUrl(spec.img)}" alt=""></div>`
      : (hasImg ? prev.querySelector('.pic').outerHTML : '');
    el.innerHTML = `
      ${picHtml}
      <div class="body">
        <div class="kicker">${esc(spec.kicker || '')}</div>
        ${portraitHtml(spec.speaker)}
        <div class="text" id="txt">${words(spec.text || '')}</div>
        ${spec.trace ? `<div class="trace">${esc(spec.trace)}</div>` : ''}
        <div class="reply" style="--d:${delay}ms">${chips(spec.deltas)}
          <button class="btn go" id="go"><span class="l">Далее</span></button></div>
      </div>`;
    this.root.innerHTML = '';
    this.root.appendChild(el);
    $('#txt', el).onclick = () => { $('#txt', el).classList.add('skip'); this.stopSay(); };
    this.consequenceSounds(spec.deltas);
    this.say(spec.text || '', voiceFor(spec.kicker));
    return new Promise((resolve) => {
      const next = () => { this.snd.sfx('next'); this.stopSay(); this.waiting = null; this.root.innerHTML = ''; this.r.setDim(0); resolve(); };
      $('#go', el).onclick = next;
      this.waiting = { next };
    });
  }

  // Редкая находка: отдельный лист без игрового бонуса, кроме последствий выбора.
  async note(spec) {
    await lazyImg('p4/02-note-reading-page.webp');
    this.stopSay();
    const el = document.createElement('div');
    el.className = 'note-read';
    el.innerHTML = `<div class="note-sheet">
      <img src="${imgUrl('p4/02-note-reading-page.webp')}" alt="Старый лист бумаги">
      <div class="note-copy"><div class="kicker">${esc(spec.title)}</div><p>${esc(spec.text)}</p><div class="note-sign">без подписи</div></div>
      <button class="btn go" id="note-go"><span class="l">Сложить листок</span></button>
    </div>`;
    this.root.innerHTML = '';
    this.root.appendChild(el);
    this.r.setDim(0.7);
    return new Promise((resolve) => {
      const next = () => { this.snd.sfx('next'); this.waiting = null; this.root.innerHTML = ''; this.r.setDim(0); resolve(); };
      $('#note-go', el).onclick = next;
      this.waiting = { next };
    });
  }

  fade(ms = 600) {
    this.fader.classList.add('on');
    return new Promise((r) => setTimeout(r, ms));
  }
  unfade() { this.fader.classList.remove('on'); }

  async dayCard(g) {
    this.clearPanel();
    this.r.setDim(0);
    const o = document.createElement('div');
    o.className = 'daycard';
    const t = -g.d.temp;
    o.innerHTML = `<div class="dc-in">
      <div class="dc-n">ДЕНЬ ${g.day}</div>
      <div class="dc-t">Минус ${t}. ${{ clear: 'Ясно.', wind: 'Ветер.', blizzard: 'Метель.' }[g.d.weather]} Работа: ${jobName(g.job)}.</div>
      <div class="dc-b">${esc(g.route?.title || '')} · в бригаде ${alive(g).length + 1} из 8. Номер: <b>${esc(g.me.num)}</b></div>
    </div>`;
    this.root.appendChild(o);
    this.fader.classList.remove('on');
    this.r.setDim(0.75);
    await new Promise((resolve) => {
      let done = false;
      const fin = () => { if (done) return; done = true; this.waiting = null; resolve(); };
      setTimeout(fin, 3000);
      o.onclick = fin;
      this.waiting = { next: fin };
    });
    o.classList.add('out');
    await new Promise((r) => setTimeout(r, 450));
    this.root.innerHTML = '';
    this.r.setDim(0);
  }

  async intro() {
    this.clearPanel();
    this.r.setDim(0.82);
    const lines = [
      'КОЛЫМА. ЗИМА.',
      'Тебя здесь нет. Есть номер на спине и бригада из восьми человек.',
      'Бригаде дают норму. От нормы зависит хлеб. От хлеба зависит всё остальное.',
      'Тепло, сытость, силы, здоровье, рассудок. Любая шкала на нуле, и номер вычёркивают. Завтра на твоё место встанет другой.',
      'Никто не придёт. Можно только дожить до следующего дня.',
    ];
    const o = document.createElement('div');
    o.className = 'intro';
    o.innerHTML = `<div class="in-l">${lines.map((l, i) => `<p class="${i === 0 ? 'hd' : ''}" style="animation-delay:${i * 1500}ms">${esc(l)}</p>`).join('')}
      <div class="in-k" style="animation-delay:${lines.length * 1500}ms">Клавиши 1–4 выбирают, пробел листает дальше.</div>
      <button class="btn go" id="go" style="animation-delay:${lines.length * 1500 + 300}ms"><span class="l">Встать в строй</span></button></div>`;
    this.root.appendChild(o);
    this.fader.classList.remove('on');
    await new Promise((resolve) => {
      const next = () => { this.snd.sfx('click'); this.waiting = null; resolve(); };
      $('#go', o).onclick = next;
      this.waiting = { next };
    });
    o.classList.add('out');
    await new Promise((r) => setTimeout(r, 400));
    this.root.innerHTML = '';
    this.r.setDim(0);
  }

  async morning(g) {
    this.clearPanel();
    const lines = [];
    for (const n of g.deadToday) lines.push(`Не встал: ${n.name} (${n.num}).`);
    for (const n of g.arrivalsToday) lines.push(`Пришёл этап: ${n.name} (${n.num}).`);
    const pct = g.lastNormPct;
    lines.push(`Норма за день: ${pct}%. Завтра пайка ${g.ration} г.`);
    this.scene('barrack');
    await this.result({ kicker: `КОНЕЦ ДНЯ ${g.day - 1}`, text: lines.join(' '), deltas: [] });
  }

  async end({ kind, entry, g }) {
    this.clearPanel();
    this.showHud(false);
    const scene = kind === 'death' ? 'death' : kind === 'release' ? 'release' : 'extended';
    if (kind === 'death') {
      if (entry.cause === 'shot') { this.snd.sfx('shot'); }
      this.snd.sfx('death');
      for (let v = 0; v <= 1; v += 0.05) { this.r.setDeath(v); await new Promise((r) => setTimeout(r, 40)); }
      this.scene(scene);
      this.r.setDim(0.0);
      for (let v = 1; v >= 0; v -= 0.04) { this.r.setDeath(v); await new Promise((r) => setTimeout(r, 40)); }
    } else {
      this.snd.sfx('relief');
      this.scene(scene);
    }
    const title = { death: 'НЕТ БОЛЬШЕ', release: 'АКТИРОВАН', extended: 'СРОК ПРОДЛЁН' }[kind];
    const line = {
      death: `${entry.num}. ${entry.epitaph || `${entry.text}. На ${entry.day - entry.born + 1}-й день.`}`,
      release: `${entry.num}. Выпущен по акту. До станции сто пятьдесят километров, а на нём один бушлат.`,
      extended: `${entry.num}. Приговор прибавили. Ворота те же. Колонна та же.`,
    }[kind];
    const prev = g.ledger.slice(-6, -1).reverse();
    const o = document.createElement('div');
    o.className = `endcard ${kind}`;
    o.innerHTML = `<div class="ec-in">
      <div class="kicker">${title}</div>
      <div class="ec-l">${esc(line)}</div>
      <div class="ec-sub">${esc(entry.aftermath || 'Бригада работает дальше. Завтра на твоё место встанет следующий номер.')}</div>
      ${prev.length ? `<div class="ec-prev">${prev.map((p) => `<div><s>${esc(p.num)}</s> день ${p.day} · ${esc(p.text)}</div>`).join('')}</div>` : ''}
      <button class="btn go" id="go"><span class="l">Следующий</span></button></div>`;
    this.root.appendChild(o);
    await new Promise((resolve) => {
      const next = () => { this.snd.sfx('click'); this.waiting = null; resolve(); };
      $('#go', o).onclick = next;
      this.waiting = { next };
    });
    await this.fade(500);
    this.root.innerHTML = '';
    this.showHud(true);
    this.r.setDeath(0);
    this.unfade();
  }

  // ---------- модальные окна ----------
  modalOpen(html, cls = '') {
    this.closeModal();
    const m = document.createElement('div');
    m.className = `modal ${cls}`;
    m.innerHTML = `<div class="mdl">${html}<button class="btn go" id="m-close"><span class="l">Закрыть</span></button></div>`;
    document.getElementById('stage').appendChild(m);
    $('#m-close', m).onclick = () => this.closeModal();
    m.onclick = (e) => { if (e.target === m) this.closeModal(); };
    this.modal = m;
  }
  closeModal() { if (this.modal) { this.modal.remove(); this.modal = null; } }

  ledger() {
    const l = (this.g?.ledger || this.store.load()).slice().reverse();
    const g = this.g;
    const traces = g?.traces || [];
    const debts = g?.debts || [];
    const marks = g?.marks || [];
    const memories = (g?.memories || []).slice(-10).reverse();
    this.modalOpen(`<div class="kicker">ПАМЯТЬ ЛАГЕРЯ</div>
      ${(traces.length || debts.length || marks.length) ? `<div class="ledger-now">${marks.map((x) => `<div class="debt-line">Отметка: ${esc(x.text)}.</div>`).join('')}${traces.map((x) => `<div>След: ${esc(x.text)}.</div>`).join('')}${debts.map((x) => `<div class="debt-line">Долг: ${esc(x.text)}.</div>`).join('')}</div>` : ''}
      ${memories.length ? `<div class="ledger-now">${memories.map((x) => `<div class="${x.state === 'returned' ? 'debt-line' : ''}">${x.state === 'returned' ? 'Вернулось' : 'Помнят'}: ${esc(x.text)}.${x.outcome ? ` ${esc(x.outcome)}` : ''}</div>`).join('')}</div>` : ''}
      <div class="lg">${l.length ? l.map((e) => `<div class="row"><s>${esc(e.num)}</s><span>день ${e.day}</span><span>${esc(e.text)}</span></div>`).join('') : '<div class="row"><span>Пока пусто. Это ненадолго.</span></div>'}</div>`);
  }

  async archive() {
    // Загружаем тяжёлые старые листы только по явному открытию игроком.
    await Promise.all(ARCHIVE_ASSETS.map((path) => lazyImg(path)));
    this.modalOpen(`<div class="kicker">ЗАРИСОВКИ ЛАГЕРЯ</div>
      <p class="pm">То, что осталось в памяти: лица, вещи, дорога и снег. Они не дают преимущества.</p>
      <div class="art-archive">${ARCHIVE_ASSETS.map((path) => `<figure><img src="${imgUrl(path)}" alt=""><figcaption>${esc(path.split('/').at(-1).replace('.webp', ''))}</figcaption></figure>`).join('')}</div>` , 'archive');
  }

  brigade() {
    const g = this.g;
    if (!g) return;
    const word = (hp) => (hp > 75 ? 'держится' : hp > 55 ? 'устал' : hp > 35 ? 'плох' : 'доходит');
    const rows = g.brigade.slice(-14).map((n) => `<div class="row ${n.alive ? '' : 'dead'}"><b>${esc(n.name)}</b><span>${esc(n.num)}</span><span>${n.alive ? word(n.hp) : `умер, день ${n.diedDay}`}</span></div>`).join('');
    this.modalOpen(`<div class="kicker">БРИГАДА</div><div class="lg">
      <div class="row me"><b>${esc(g.me.num)}</b><span>ты</span><span>день ${g.day}</span></div>${rows}
      <div class="row"><span>бригадир ${esc(g.brigadier.name)}</span></div></div>`);
  }

  pause() {
    this.modalOpen(`<div class="kicker">ПЕРЕРЫВ</div>
      <p class="pm">Игра остановлена. Колонна стоит и ждёт. Ей всё равно.</p>
      <button class="btn" id="p-brig"><span class="l">Бригада</span></button>
      <button class="btn" id="p-led"><span class="l">Книга учёта</span></button>
      <button class="btn" id="p-snd"><span class="l">Звук: вкл/выкл</span></button>
      <button class="btn" id="p-restart"><span class="l">Начать заново</span></button>`);
    $('#p-brig').onclick = () => this.brigade();
    $('#p-led').onclick = () => this.ledger();
    $('#p-snd').onclick = () => this.toggleSound();
    $('#p-restart').onclick = () => { location.reload(); };
  }
}
