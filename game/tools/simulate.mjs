// Прогон игры ботом: проверка на падения и грубая оценка баланса.
import { newGame } from '../js/state.js';
import { runGame } from '../js/game.js';

function makeIo(strategy, stats, g) {
  const rnd = Math.random;
  return {
    sfx() {}, scene() {}, hud() {}, ration() {}, setNorm() {},
    async dayCard() {}, async morning() {}, saveLedger() {},
    async choose(spec) {
      stats.choices++;
      const ok = spec.choices.map((c, i) => [c, i]).filter(([c]) => !c.disabled);
      if (strategy === 'random') return ok[Math.floor(rnd() * ok.length)][1];
      // «разумный» бот: ровно работает, ест всё, платит за печь, не рискует
      const score = ([c]) => {
        const l = c.label;
        let s = rnd();
        if (/ровно/.test(l)) s += 3;
        if (/Съесть всё/.test(l)) s += 1.5;
        if (/печи, заплатив/.test(l)) s += 3;
        if (/Чинить/.test(l)) s += 2;
        if (/Съесть заначку/.test(l)) s += 2.5;
        if (/Помочь|Вести|Подпереть|Поддержать|Отломить|Отлить/.test(l)) s += 0.5;
        if (/силой|туфта|Побежать|Согласиться|Снять рукавицы|Пойти с ними|Подписать акт/.test(l)) s -= 5;
        if (/Пойти к фельдшеру|Заплатить/.test(l)) s += 2;
        if (/Спрятать поленья/.test(l) && g.fuel < 3) s += 5;
        if (/Сдать всё на склад/.test(l) && g.fuel < 2) s -= 4;
        if (/Взять лишнее на себя/.test(l) && g.me.stats.health > 55) s += 1;
        return s;
      };
      ok.sort((a, b) => score(b) - score(a));
      return ok[0][1];
    },
    async result() {}, async note() {},
    async event() {},
    async end({ kind, entry, g }) { stats.lives.push({ kind, cause: entry.cause, days: entry.day - entry.born + 1, day: entry.day }); },
  };
}

for (const strategy of ['random', 'sensible']) {
  const all = [];
  const first = [];
  const byCause = {};
  for (let seed = 1; seed <= 150; seed++) {
    const stats = { choices: 0, lives: [] };
    const g = newGame(seed * 7919, []);
    await runGame(g, makeIo(strategy, stats, g), { maxDays: 80 });
    if (stats.lives.length) first.push(stats.lives[0].days);
    for (const l of stats.lives) { all.push(l.days); byCause[l.cause] = (byCause[l.cause] || 0) + 1; }
  }
  all.sort((a, b) => a - b);
  const mean = all.reduce((a, b) => a + b, 0) / all.length;
  console.log(strategy, 'lives', all.length, 'mean days', mean.toFixed(1), 'median', all[all.length >> 1], 'p90', all[Math.floor(all.length * 0.9)], 'max', all[all.length - 1]);
  first.sort((a, b) => a - b);
  console.log(' first life: median', first[first.length >> 1], 'p25', first[Math.floor(first.length * 0.25)], 'p75', first[Math.floor(first.length * 0.75)], 'max', first[first.length - 1]);
  console.log(' causes', JSON.stringify(byCause));
}
