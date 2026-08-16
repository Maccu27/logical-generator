// Gegenprobe fuer die Engine: Eindeutigkeit, Loesbarkeit ohne Raten, Kennzahlen.
import { generatePuzzle, humanSolve, countSolutions, rateDifficulty } from './src/engine.js';

const t0 = Date.now();
const counts = [];
const levels = {};
let fails = 0;

for (let seed = 1; seed <= 30; seed++) {
  const p = generatePuzzle(seed);
  if (!p) { console.log('seed', seed, 'kein Raetsel'); fails++; continue; }

  // 1. Der Rasterloeser kommt ohne Raten durch.
  const hs = humanSolve(p.hints);
  if (!hs.solved) { console.log('seed', seed, 'NICHT ohne Raten loesbar'); fails++; }

  // 2. Unabhaengige Gegenprobe: genau eine Loesung.
  const n = countSolutions(p.hints, 3);
  if (n !== 1) { console.log('seed', seed, 'Loesungen:', n); fails++; }

  // 3. Der Rasterloeser findet dieselbe Loesung wie die erzeugte.
  for (let c = 1; c < 5; c++) {
    for (let s = 0; s < 5; s++) {
      const v = p.solution[c][s];
      if (hs.grid[0][c][s][v] !== 1) { console.log('seed', seed, 'Loesung weicht ab'); fails++; c = 9; break; }
    }
  }

  counts.push(p.hints.length);
  levels[p.rating.level] = (levels[p.rating.level] || 0) + 1;
}

counts.sort((a, b) => a - b);
console.log('\nHinweise pro Raetsel:', counts.join(', '));
console.log('min', counts[0], 'median', counts[Math.floor(counts.length / 2)], 'max', counts[counts.length - 1]);
console.log('Schwierigkeit:', levels);
console.log('Fehler:', fails);
console.log('Dauer:', ((Date.now() - t0) / 1000).toFixed(1), 's fuer', counts.length, 'Raetsel');

// --- Satzbau-Regel: die zweite Seite eines Ordnungssatzes wird mit "als" oder
// "und" angebunden. Jede andere Anbindung (z.B. "vor X") fordert einen Kasus,
// den die Referenzphrasen nicht mitbringen.
import { THEMES } from './src/themes.js';
let bad = 0;
for (const t of THEMES) {
  for (const [kind, fn] of Object.entries(t.order)) {
    const s = fn('AAA', 'BBB', 2);
    const vor = s.slice(0, s.indexOf('BBB')).trimEnd();
    const wort = vor.split(' ').pop();
    if (wort !== 'als' && wort !== 'und') {
      console.log(`SATZBAU ${t.id}/${kind}: "${wort} BBB" statt "als/und BBB" → ${s}`);
      bad++;
    }
  }
}
console.log(bad === 0 ? 'Satzbau-Regel: alle 30 Ordnungssätze binden korrekt an.' : `Satzbau-Regel: ${bad} Verstöße.`);
