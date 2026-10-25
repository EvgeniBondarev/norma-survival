// Все ли выборы всех событий хоть раз сработали и ничего не ломают (случайный бот, много партий).
import { newGame } from '../js/state.js';
import { runGame } from '../js/game.js';
import { DECK, CRISES, SPECIAL } from '../js/events.js';

const chosen = new Set();
const errors = [];
const io = {
  sfx() {}, scene() {}, hud() {}, ration() {}, setNorm() {},
  async dayCard() {}, async morning() {}, saveLedger() {}, async result() {}, async note() {}, async end() {},
  async choose(spec) {
    const ok = spec.choices.map((c, i) => [c, i]).filter(([c]) => !c.disabled);
    const [c, i] = ok[Math.floor(Math.random() * ok.length)];
    chosen.add(`${spec.kicker}|${c.label}`);
    if (typeof spec.text !== 'string' || !spec.text.length) errors.push(`пустой текст: ${spec.kicker}`);
    return i;
  },
};
for (let seed = 1; seed <= 600; seed++) {
  const g = newGame(seed * 104729, []);
  try { await runGame(g, io, { maxDays: 60 }); } catch (e) { errors.push(`seed ${seed}: ${e.stack}`); break; }
}
const missing = [];
for (const e of [...DECK, ...CRISES, ...Object.values(SPECIAL)]) {
  for (const c of e.choices) if (!chosen.has(`${e.kicker}|${c.label}`)) missing.push(`${e.id}: ${c.label}`);
}
console.log('выборов сыграно:', chosen.size);
console.log('ни разу не сыграны:', missing.length ? missing : 'нет');
console.log('ошибки:', errors.length ? errors : 'нет');
