import { loadAll } from './assets.js?v=1792891673';
import { Renderer } from './render.js?v=1792891673';
import { Sound } from './audio.js?v=1792891673';
import { UI } from './ui.js?v=1792891673';
import { newGame } from './state.js?v=1792891673';
import { runGame } from './game.js?v=1792891673';

const KEY = 'norma-ledger-v1';
const store = {
  load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } },
  save(l) { try { localStorage.setItem(KEY, JSON.stringify(l.slice(-300))); } catch { /* приватный режим */ } },
};

const stage = document.getElementById('stage');
function fit() {
  const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  stage.style.setProperty('--s', s);
}
window.addEventListener('resize', fit);
fit();

const params = new URLSearchParams(location.search);
const sound = new Sound();
const renderer = new Renderer(document.getElementById('cv'));
const ui = new UI({ renderer, sound, store });
window.__norma = { renderer, sound, ui, store };

// браузер разрешает звук только после действия пользователя: любой клик или клавиша будит звук
const wake = () => sound.start();
['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, wake, { capture: true }));
document.addEventListener('visibilitychange', () => { if (!document.hidden && sound.ctx && !sound.muted) sound.ctx.resume().catch(() => {}); });

// подсказка, если звук ещё не включился
const hint = document.createElement('div');
hint.id = 'snd-hint';
hint.textContent = 'Звук ждёт: нажми на экран или любую клавишу';
document.getElementById('stage').appendChild(hint);
setInterval(() => {
  const waiting = !sound.muted && (!sound.ctx || sound.ctx.state !== 'running') && document.getElementById('boot') === null;
  hint.classList.toggle('on', waiting);
}, 800);

function loop(ts) {
  renderer.frame(ts);
  requestAnimationFrame(loop);
}

async function boot() {
  const bar = document.getElementById('b-bar');
  await loadAll((p) => { bar.style.width = `${Math.round(p * 100)}%`; });
  requestAnimationFrame(loop);
  const b = document.getElementById('boot');
  b.classList.add('gone');
  setTimeout(() => b.remove(), 900);
  if (params.has('autostart')) startGame(); else title();
}

function title() {
  renderer.setScene('title');
  sound.setScene('title');
  ui.showHud(false);
  const o = document.createElement('div');
  o.className = 'title';
  o.innerHTML = `
    <img class="t-name" src="img/ui/norma-logo-v1.webp" alt="НОРМА">
    <div class="t-sub">ИГРА ПО МОТИВАМ «КОЛЫМСКИХ РАССКАЗОВ»</div>
    <div class="t-menu">
      <button class="btn" id="t-start"><span class="l">Встать в строй</span><span class="s">Начать</span></button>
      <button class="btn" id="t-led"><span class="l">Книга учёта</span><span class="s">Все, кто был до тебя</span></button>
      <button class="btn" id="t-snd"><span class="l">Звук</span><span class="s">Включить или выключить</span></button>
    </div>
    <div class="t-foot">Мышь или клавиши 1–4 · Пробел: далее · Tab: бригада · L: книга учёта · M: звук</div>`;
  ui.root.innerHTML = '';
  ui.root.appendChild(o);
  document.getElementById('t-start').onclick = () => { sound.start(); sound.sfx('click'); startGame(); };
  document.getElementById('t-led').onclick = () => { sound.start(); ui.ledger(); };
  document.getElementById('t-snd').onclick = () => { sound.start(); ui.toggleSound(); };
}

async function startGame() {
  sound.start();
  await ui.fade(500);
  ui.root.innerHTML = '';
  const seed = params.has('seed') ? Number(params.get('seed')) : (Math.random() * 2 ** 32) >>> 0;
  const g = newGame(seed, store.load());
  window.__norma.g = g;
  ui.setGame(g);
  try {
    if (!params.has('autostart')) await ui.intro();
    ui.showHud(true);
    await runGame(g, ui.io());
  } catch (e) {
    console.error(e);
    ui.root.innerHTML = `<div class="panel"><div class="kicker">СБОЙ</div><div class="text" style="font-size:20px">${String(e.stack || e).replace(/</g, '&lt;')}</div></div>`;
  }
}

boot().catch((e) => {
  document.getElementById('b-s').textContent = 'Ошибка загрузки: ' + e.message;
  console.error(e);
});
