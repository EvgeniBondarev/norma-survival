// Детерминированный генератор: один сид, одна и та же вселенная.
export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class RNG {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.f = mulberry32(this.seed);
  }
  next() { return this.f(); }
  int(a, b) { return a + Math.floor(this.f() * (b - a + 1)); }
  chance(p) { return this.f() < p; }
  pick(arr) { return arr[Math.floor(this.f() * arr.length)]; }
  range(a, b) { return a + this.f() * (b - a); }
  weighted(items, weightOf) {
    const total = items.reduce((s, it) => s + weightOf(it), 0);
    let r = this.f() * total;
    for (const it of items) {
      r -= weightOf(it);
      if (r <= 0) return it;
    }
    return items[items.length - 1];
  }
}
