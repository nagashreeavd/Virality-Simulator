// Deterministic, seedable pseudo-random generator (mulberry32).
// A fixed seed => identical simulation. This is what makes runs reproducible,
// so a "Replay" shows the exact same spread and results can be compared fairly.

export function makeRng(seed = 1) {
  let a = seed >>> 0;
  const rng = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Small helpers built on the uniform generator.
  rng.int = (min, max) => min + Math.floor(rng() * (max - min + 1));
  rng.pick = (arr) => arr[Math.floor(rng() * arr.length)];
  // Box–Muller for gaussian-distributed traits (clamped to [0,1] by callers).
  rng.gauss = (mean = 0.5, sd = 0.15) => {
    const u = Math.max(rng(), 1e-9);
    const v = rng();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return rng;
}

export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

// Turn a string into a stable 32-bit seed, so a given content title/description
// reproduces the same audience unless the user changes the seed.
export function hashSeed(str = "") {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
