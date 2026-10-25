import { newGame, STATS } from '../js/state.js';
import { runGame } from '../js/game.js';
const g = newGame(12345, []);
let last = '';
const io = {
  sfx() {}, scene(n) { last = n; }, ration() {}, setNorm() {}, async dayCard() {}, saveLedger() {},
  hud() {},
  async morning(g) { console.log(`  утро: пайка ${g.ration}, мёртвые ${g.deadToday.map((n) => n.name)}, hp бригады ${g.brigade.filter(n=>n.alive).map((n) => Math.round(n.hp)).join(',')}`); },
  async choose(spec) {
    const ok = spec.choices.map((c, i) => [c, i]).filter(([c]) => !c.disabled);
    const score = ([c]) => { const l = c.label; let s = Math.random(); if (/ровно/.test(l)) s += 3; if (/Съесть всё/.test(l)) s += 1.5; if (/печи, заплатив/.test(l)) s += 3; if (/Чинить/.test(l)) s += 2; if (/Спрятать поленья/.test(l) && g.fuel < 3) s += 5; if (/Сдать всё на склад/.test(l) && g.fuel < 2) s -= 4; if (/силой|туфта|Побежать|Согласиться|Снять рукавицы|Пойти с ними|Подписать акт/.test(l)) s -= 5; return s; };
    ok.sort((a, b) => score(b) - score(a));
    console.log(`${String(g.day).padStart(2)} ${(spec.kicker||'').padEnd(18)} ${Object.values(g.me.stats).map((v) => String(Math.round(v)).padStart(3)).join(' ')} | ${ok[0][0].label}`);
    return ok[0][1];
  },
  async result({ text }) {}, async note() {},
  async end({ entry }) { console.log('СМЕРТЬ', entry.text, 'день', entry.day); },
};
console.log('      kicker             тепл сыт сил здор рас');
await runGame(g, io, { maxDays: 9 });
