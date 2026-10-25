// Проверка обещания `?seed=`: одинаковые решения должны давать одинаковую историю,
// включая вариант текста на экране смерти.
import { newGame } from '../js/state.js';
import { runGame } from '../js/game.js';

async function play(seed) {
  const entries = [];
  const io = {
    sfx() {}, scene() {}, hud() {}, ration() {}, setNorm() {},
    async dayCard() {}, async morning() {}, saveLedger() {}, async result() {}, async note() {},
    async choose(spec) { return spec.choices.findIndex((c) => !c.disabled); },
    async end({ entry }) { entries.push({ cause: entry.cause, text: entry.text, epitaph: entry.epitaph, aftermath: entry.aftermath }); },
  };
  await runGame(newGame(seed, []), io, { maxDays: 60 });
  return entries;
}

const seed = 123456789;
const [first, second] = await Promise.all([play(seed), play(seed)]);
if (JSON.stringify(first) !== JSON.stringify(second)) {
  throw new Error('Одинаковый seed дал разные игровые истории.');
}
console.log(`детерминизм: ok (${first.length} записей за 60 дней)`);
