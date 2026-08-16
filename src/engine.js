// Logical-Generator: Kern. Erzeugt und loest 5x5-Logicals rein deterministisch.
//
// Datenmodell
//   Ein Raetsel hat 5 Kategorien mit je 5 Werten. Kategorie 0 ist der Anker
//   (geordnet, z.B. Uhrzeiten) und legt die 5 Slots fest.
//   Eine Loesung ist pro Kategorie eine Permutation: sol[c][slot] = Wertindex.
//   Fuer den Anker gilt sol[0][slot] = slot.
//
// Hinweistypen
//   eq    {a,x,b,y}     Wert x der Kategorie a gehoert zu Wert y der Kategorie b
//   neq   {a,x,b,y}     ... gehoert nicht dazu
//   before{a,x,b,y}     Slot von (a,x) liegt vor dem Slot von (b,y)
//   dist  {a,x,b,y,d}   Slot von (b,y) minus Slot von (a,x) ist genau d
//   gap   {a,x,b,y,d}   Abstand der Slots ist genau d, Richtung offen
//   or    {a,x1,x2,b,y} (b,y) gehoert zu x1 oder zu x2 der Kategorie a
//
// Der Solver arbeitet wie ein Mensch am Kreuzraster: Kreuze setzen und
// weiterschliessen, niemals raten. Was er nicht knackt, wird nicht ausgeliefert.

export const N = 5;
export const NCAT = 5;

// ---------------------------------------------------------------- Zufall ----

// Deterministischer PRNG (mulberry32), damit ein Seed dasselbe Raetsel liefert.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randInt(rng, n) { return Math.floor(rng() * n); }

// -------------------------------------------------------------- Loesung ----

export function randomSolution(rng) {
  const sol = [];
  const identity = [0, 1, 2, 3, 4];
  sol.push(identity.slice());
  for (let c = 1; c < NCAT; c++) sol.push(shuffled(identity, rng));
  return sol;
}

// slotOf[c][wertIndex] = slot
function slotIndex(sol) {
  return sol.map((perm) => {
    const inv = new Array(N);
    for (let s = 0; s < N; s++) inv[perm[s]] = s;
    return inv;
  });
}

// ---------------------------------------------------------------- Raster ----
// grid[a][b] ist eine NxN-Matrix mit 0 unbekannt, 1 gehoert zusammen, -1 nicht.
// Gefuehrt wird sie fuer alle geordneten Paare a != b, gespiegelt gehalten.

function emptyGrid() {
  const g = [];
  for (let a = 0; a < NCAT; a++) {
    g.push([]);
    for (let b = 0; b < NCAT; b++) {
      g[a].push(a === b ? null : Array.from({ length: N }, () => new Int8Array(N)));
    }
  }
  // Der Anker ist mit sich selbst identisch: Slot p traegt Ankerwert p.
  return g;
}

function setCell(g, a, x, b, y, v, state) {
  const cur = g[a][b][x][y];
  if (cur === v) return true;
  if (cur !== 0) { state.contradiction = true; return false; }
  g[a][b][x][y] = v;
  g[b][a][y][x] = v;
  state.changed = true;
  state.derived++;
  return true;
}

// Moegliche Slots eines Werts: ueber die Beziehung zum Anker (Kategorie 0).
function possibleSlots(g, c, v) {
  if (c === 0) return [v];
  const out = [];
  for (let p = 0; p < N; p++) if (g[0][c][p][v] !== -1) out.push(p);
  return out;
}

function forbidSlot(g, c, v, p, state) {
  if (c === 0) { if (p === v) state.contradiction = true; return; }
  setCell(g, 0, p, c, v, -1, state);
}

// ----------------------------------------------------------- Propagation ----

function propagateHint(g, h, state) {
  switch (h.type) {
    case 'eq':
      setCell(g, h.a, h.x, h.b, h.y, 1, state);
      break;
    case 'neq':
      setCell(g, h.a, h.x, h.b, h.y, -1, state);
      break;
    case 'before': {
      const pa = possibleSlots(g, h.a, h.x);
      const pb = possibleSlots(g, h.b, h.y);
      if (!pa.length || !pb.length) { state.contradiction = true; return; }
      const maxB = pb[pb.length - 1], minA = pa[0];
      for (const p of pa) if (p >= maxB) forbidSlot(g, h.a, h.x, p, state);
      for (const q of pb) if (q <= minA) forbidSlot(g, h.b, h.y, q, state);
      break;
    }
    case 'dist': {
      const pa = possibleSlots(g, h.a, h.x);
      const pb = possibleSlots(g, h.b, h.y);
      const okA = new Set(pb.map((q) => q - h.d));
      const okB = new Set(pa.map((p) => p + h.d));
      for (const p of pa) if (!okA.has(p)) forbidSlot(g, h.a, h.x, p, state);
      for (const q of pb) if (!okB.has(q)) forbidSlot(g, h.b, h.y, q, state);
      break;
    }
    case 'gap': {
      const pa = possibleSlots(g, h.a, h.x);
      const pb = possibleSlots(g, h.b, h.y);
      const okA = new Set(); const okB = new Set();
      for (const q of pb) { okA.add(q - h.d); okA.add(q + h.d); }
      for (const p of pa) { okB.add(p - h.d); okB.add(p + h.d); }
      for (const p of pa) if (!okA.has(p)) forbidSlot(g, h.a, h.x, p, state);
      for (const q of pb) if (!okB.has(q)) forbidSlot(g, h.b, h.y, q, state);
      break;
    }
    case 'or': {
      const c1 = g[h.b][h.a][h.y][h.x1];
      const c2 = g[h.b][h.a][h.y][h.x2];
      if (c1 === -1 && c2 === -1) { state.contradiction = true; return; }
      if (c1 === -1) setCell(g, h.b, h.y, h.a, h.x2, 1, state);
      if (c2 === -1) setCell(g, h.b, h.y, h.a, h.x1, 1, state);
      if (c1 === 1) setCell(g, h.b, h.y, h.a, h.x2, -1, state);
      if (c2 === 1) setCell(g, h.b, h.y, h.a, h.x1, -1, state);
      break;
    }
    default:
      throw new Error('unbekannter Hinweistyp ' + h.type);
  }
}

// Regel: ein Treffer schliesst Zeile und Spalte aus; vier Ausschluesse ergeben einen Treffer.
function propagateBlocks(g, state) {
  for (let a = 0; a < NCAT; a++) {
    for (let b = 0; b < NCAT; b++) {
      if (a === b) continue;
      const m = g[a][b];
      for (let x = 0; x < N; x++) {
        let yes = -1, noCount = 0, freeY = -1;
        for (let y = 0; y < N; y++) {
          if (m[x][y] === 1) yes = y;
          else if (m[x][y] === -1) noCount++;
          else freeY = y;
        }
        if (yes >= 0) {
          for (let y = 0; y < N; y++) if (y !== yes && m[x][y] !== -1) setCell(g, a, x, b, y, -1, state);
        } else if (noCount === N - 1 && freeY >= 0) {
          setCell(g, a, x, b, freeY, 1, state);
        } else if (noCount === N) { state.contradiction = true; return; }
      }
    }
  }
}

// Regel: Transitivitaet ueber eine Zwischenkategorie.
function propagateTransitive(g, state) {
  for (let a = 0; a < NCAT; a++) {
    for (let c = 0; c < NCAT; c++) {
      if (a === c) continue;
      for (let b = 0; b < NCAT; b++) {
        if (b === a || b === c) continue;
        for (let x = 0; x < N; x++) {
          for (let z = 0; z < N; z++) {
            if (g[a][c][x][z] !== 0) continue;
            let anyBridge = false, forcedYes = false;
            for (let y = 0; y < N; y++) {
              const ab = g[a][b][x][y], bc = g[b][c][y][z];
              if (ab === -1 || bc === -1) continue;
              anyBridge = true;
              if (ab === 1 && bc === 1) { forcedYes = true; break; }
            }
            if (forcedYes) setCell(g, a, x, c, z, 1, state);
            else if (!anyBridge) setCell(g, a, x, c, z, -1, state);
            if (state.contradiction) return;
          }
        }
      }
    }
  }
}

function isSolved(g) {
  for (let c = 1; c < NCAT; c++) {
    for (let v = 0; v < N; v++) {
      let yes = 0;
      for (let p = 0; p < N; p++) if (g[0][c][p][v] === 1) yes++;
      if (yes !== 1) return false;
    }
  }
  return true;
}

/**
 * Loest wie ein Mensch am Raster: nur Schlussfolgerungen, kein Raten.
 * Liefert {solved, contradiction, rounds, derived, grid}.
 */
export function humanSolve(hints) {
  const g = emptyGrid();
  const state = { changed: true, contradiction: false, derived: 0 };
  let rounds = 0;
  while (state.changed && !state.contradiction && rounds < 200) {
    state.changed = false;
    rounds++;
    for (const h of hints) { propagateHint(g, h, state); if (state.contradiction) break; }
    if (!state.contradiction) propagateBlocks(g, state);
    if (!state.contradiction) propagateTransitive(g, state);
    if (isSolved(g)) break;
  }
  return { solved: !state.contradiction && isSolved(g), contradiction: state.contradiction, rounds, derived: state.derived, grid: g };
}

// ------------------------------------------------- Zaehlen aller Loesungen ----
// Unabhaengige Gegenprobe per Tiefensuche. Nur zur Verifikation gedacht.

const ALL_PERMS = (() => {
  const out = [];
  const perm = (arr, cur) => {
    if (!arr.length) { out.push(cur.slice()); return; }
    for (let i = 0; i < arr.length; i++) {
      cur.push(arr[i]);
      perm(arr.filter((_, j) => j !== i), cur);
      cur.pop();
    }
  };
  perm([0, 1, 2, 3, 4], []);
  return out;
})();

function hintHolds(h, slotOf) {
  const pa = h.a === 0 ? h.x : slotOf[h.a][h.x];
  switch (h.type) {
    case 'eq': return pa === slotOf[h.b][h.y];
    case 'neq': return pa !== slotOf[h.b][h.y];
    case 'before': return pa < slotOf[h.b][h.y];
    case 'dist': return slotOf[h.b][h.y] - pa === h.d;
    case 'gap': return Math.abs(slotOf[h.b][h.y] - pa) === h.d;
    case 'or': {
      const p = slotOf[h.b][h.y];
      return slotOf[h.a][h.x1] === p || slotOf[h.a][h.x2] === p;
    }
    default: return false;
  }
}

/** Zaehlt Loesungen bis maximal `limit`. */
export function countSolutions(hints, limit = 2) {
  const byLevel = [];
  const seen = new Set([0]);
  for (let c = 1; c < NCAT; c++) {
    seen.add(c);
    byLevel.push(hints.filter((h) => {
      const cats = h.type === 'or' ? [h.a, h.b] : [h.a, h.b];
      return cats.every((k) => seen.has(k)) && cats.includes(c);
    }));
  }
  let count = 0;
  const slotOf = [[0, 1, 2, 3, 4]];
  const dfs = (level) => {
    if (count >= limit) return;
    if (level === NCAT - 1) { count++; return; }
    const c = level + 1;
    for (const perm of ALL_PERMS) {
      const inv = new Array(N);
      for (let s = 0; s < N; s++) inv[perm[s]] = s;
      slotOf[c] = inv;
      let ok = true;
      for (const h of byLevel[level]) if (!hintHolds(h, slotOf)) { ok = false; break; }
      if (ok) { dfs(level + 1); if (count >= limit) { slotOf.length = c; return; } }
    }
    slotOf.length = c;
  };
  dfs(0);
  return count;
}

// ------------------------------------------------------- Hinweis-Erzeugung ----

function buildPool(sol, rng, opts) {
  const slotOf = slotIndex(sol);
  const pool = [];
  const push = (h, weight) => { h.weight = weight; pool.push(h); };

  for (let a = 0; a < NCAT; a++) {
    for (let b = a + 1; b < NCAT; b++) {
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          const same = slotOf[a][x] === slotOf[b][y];
          if (same) push({ type: 'eq', a, x, b, y }, opts.wEq);
          else push({ type: 'neq', a, x, b, y }, opts.wNeq);
        }
      }
    }
  }
  // Ordnungsaussagen: nur sinnvoll, weil Kategorie 0 geordnet ist.
  for (let a = 0; a < NCAT; a++) {
    for (let b = 0; b < NCAT; b++) {
      if (a === b) continue;
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          const pa = slotOf[a][x], pb = slotOf[b][y];
          if (pa < pb) push({ type: 'before', a, x, b, y }, opts.wBefore);
          const d = pb - pa;
          if (d === 1 || d === 2) push({ type: 'dist', a, x, b, y, d }, opts.wDist);
          if (a < b && Math.abs(d) >= 1 && Math.abs(d) <= 2) {
            push({ type: 'gap', a, x, b, y, d: Math.abs(d) }, opts.wGap);
          }
        }
      }
    }
  }
  // Oder-Aussagen
  for (let a = 0; a < NCAT; a++) {
    for (let b = 0; b < NCAT; b++) {
      if (a === b) continue;
      for (let y = 0; y < N; y++) {
        const trueX = sol[a][slotOf[b][y]];
        for (let alt = 0; alt < N; alt++) {
          if (alt === trueX) continue;
          const [x1, x2] = trueX < alt ? [trueX, alt] : [alt, trueX];
          push({ type: 'or', a, x1, x2, b, y }, opts.wOr);
        }
      }
    }
  }
  return shuffled(pool, rng);
}

// Ein Hinweis ist nur brauchbar, wenn er dem aktuellen Wissensstand etwas hinzufuegt.
function addsInformation(hints, candidate) {
  const before = humanSolve(hints);
  if (before.contradiction) return false;
  const after = humanSolve(hints.concat([candidate]));
  return after.derived > before.derived;
}

// Gewichte der Hinweistypen im Pool. Gemessen ueber je 30 Raetsel: diese
// Mischung ergibt rund 28 % direkte Zuordnungen, 24 % Abstands- und 15 %
// Reihenfolgeaussagen. Mehr Ordnungshinweise lesen sich schnell monoton.
const DEFAULT_OPTS = {
  wEq: 8, wNeq: 3, wBefore: 2, wDist: 2.5, wGap: 1.5, wOr: 2.5,
  maxHints: 22,
  // Drei direkte Zuordnungen zwischen denselben zwei Kategorien schenken die
  // restlichen zwei her. Zwei sind die Grenze, ab der noch Arbeit bleibt.
  maxEqPerPair: 2,
};

function tooManyDirect(chosen, cand, limit) {
  if (cand.type !== 'eq') return false;
  let n = 0;
  for (const h of chosen) {
    if (h.type === 'eq' && h.a === cand.a && h.b === cand.b) n++;
  }
  return n >= limit;
}

function weightedPick(pool, rng) {
  let total = 0;
  for (const h of pool) total += h.weight;
  let r = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= pool[i].weight;
    if (r <= 0) return i;
  }
  return pool.length - 1;
}

/**
 * Baut aus einer Loesung eine minimale, ohne Raten loesbare Hinweismenge.
 * Gibt null zurueck, wenn der Versuch nicht konvergiert.
 */
export function buildHints(sol, rng, options = {}) {
  const opts = { ...DEFAULT_OPTS, ...options };
  const pool = buildPool(sol, rng, opts);
  const chosen = [];
  let guard = 0;

  while (guard++ < 400) {
    const res = humanSolve(chosen);
    if (res.solved) break;
    if (chosen.length >= opts.maxHints) return null;
    let picked = null;
    for (let tries = 0; tries < 60 && picked === null; tries++) {
      const idx = weightedPick(pool, rng);
      const cand = pool[idx];
      if (tooManyDirect(chosen, cand, opts.maxEqPerPair)) continue;
      if (addsInformation(chosen, cand)) { picked = cand; pool.splice(idx, 1); }
    }
    if (!picked) return null;
    chosen.push(picked);
  }
  if (!humanSolve(chosen).solved) return null;

  // Rueckwaerts ausduennen: was der Solver auch ohne schafft, fliegt raus.
  for (let i = chosen.length - 1; i >= 0; i--) {
    const trial = chosen.slice(0, i).concat(chosen.slice(i + 1));
    if (humanSolve(trial).solved) chosen.splice(i, 1);
  }
  return chosen;
}

/** Kennzahlen, aus denen sich die Schwierigkeit ableitet. */
export function rateDifficulty(hints) {
  const res = humanSolve(hints);
  const kinds = {};
  for (const h of hints) kinds[h.type] = (kinds[h.type] || 0) + 1;
  const negShare = (kinds.neq || 0) / hints.length;
  // Wenige Hinweise heisst: jeder einzelne traegt mehr, es muss mehr kombiniert werden.
  const score = res.rounds * 2 + hints.length * 1.5 + negShare * 10;
  let level = 'mittel';
  if (score < 30) level = 'leicht';
  else if (score > 42) level = 'knifflig';
  return { level, score: Math.round(score), rounds: res.rounds, count: hints.length, kinds, negShare };
}

/**
 * Erzeugt ein vollstaendiges Raetsel. Probiert so lange, bis eines im
 * gewuenschten Schwierigkeitsband liegt und die Gegenprobe eindeutig ist.
 */
export function generatePuzzle(seed, { levels = ['leicht', 'mittel', 'knifflig'], attempts = 60, options = {} } = {}) {
  const rng = makeRng(seed);
  let fallback = null;
  for (let i = 0; i < attempts; i++) {
    const sol = randomSolution(rng);
    const hints = buildHints(sol, rng, options);
    if (!hints) continue;
    if (countSolutions(hints, 2) !== 1) continue;
    const rating = rateDifficulty(hints);
    const puzzle = { seed, solution: sol, hints, rating };
    if (levels.includes(rating.level)) return puzzle;
    if (!fallback) fallback = puzzle;
  }
  return fallback;
}
