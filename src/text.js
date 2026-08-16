// Aus Hinweis-Objekten werden deutsche Saetze.
//
// Zwei Regeln tragen den ganzen Satzbau:
//   1. Jedes Praedikat beginnt mit dem finiten Verb. Die Verneinung ist deshalb
//      mechanisch: Verb + "nicht" + Rest.
//   2. Enthaelt eine Referenz einen Relativsatz (erkennbar am Komma), wird er
//      vor dem Praedikat wieder geschlossen.

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

const KEIN = { ein: 'kein', eine: 'keine', einen: 'keinen', einem: 'keinem', einer: 'keiner' };

export function negate(pred) {
  const w = pred.split(' ');
  // "haelt einen Goldfisch" wird zu "haelt keinen Goldfisch", nicht zu "nicht einen".
  for (let i = 1; i < w.length; i++) {
    if (KEIN[w[i]]) { w[i] = KEIN[w[i]]; return w.join(' '); }
  }
  if (w.length < 2) return pred + ' nicht';
  // "beschaeftigt sich mit X": das Reflexivpronomen bleibt am Verb.
  const at = w[1] === 'sich' ? 2 : 1;
  return `${w.slice(0, at).join(' ')} nicht ${w.slice(at).join(' ')}`;
}

// "Die Kundin, die bar zahlt" + Praedikat braucht das schliessende Komma.
function subject(ref) {
  return ref.includes(', ') ? cap(ref) + ',' : cap(ref);
}

function clause(ref, pred) {
  return `${subject(ref)} ${pred}.`;
}

// Gemeinsamen Wortanfang und -schluss ausklammern:
// "kauft den Mantel" / "kauft den Schal" -> "kauft den Mantel oder Schal"
function eitherOr(p1, p2) {
  const a = p1.split(' '), b = p2.split(' ');
  let pre = 0;
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let suf = 0;
  while (suf < a.length - pre && suf < b.length - pre
         && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
  // Einen Artikel am Ende des Praefixes wieder freigeben, sonst entsteht
  // "kauft den Mantel oder Rock" statt "kauft den Mantel oder den Rock".
  const ARTICLES = new Set(['der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'einen', 'einem', 'einer']);
  while (pre > 0 && ARTICLES.has(a[pre - 1])) pre--;
  const prefix = a.slice(0, pre).join(' ');
  const midA = a.slice(pre, a.length - suf).join(' ');
  const midB = b.slice(pre, b.length - suf).join(' ');
  const suffix = a.slice(a.length - suf).join(' ');
  if (!midA || !midB) return `${p1} oder ${p2}`;
  return [prefix, `${midA} oder ${midB}`, suffix].filter(Boolean).join(' ');
}

/** Wandelt einen Hinweis in einen Satz. */
export function hintToText(theme, h) {
  const C = theme.cats;
  const ref = (c, i) => C[c].ref(C[c].values[i]);
  const pred = (c, i) => C[c].pred(C[c].values[i]);
  // Artikellose Objekte brauchen "kein" statt "nicht" ("verkauft keinen Kaese").
  // Wo eine Kategorie das nicht selbst regelt, greift die mechanische Regel.
  const negPred = (c, i) => (C[c].neg ? C[c].neg(C[c].values[i]) : negate(pred(c, i)));

  switch (h.type) {
    case 'eq':
    case 'neq': {
      // Als Subjekt die Seite ohne Relativsatz waehlen, das liest sich besser.
      let [a, x, b, y] = [h.a, h.x, h.b, h.y];
      const aClause = ref(a, x).includes(', ');
      const bClause = ref(b, y).includes(', ');
      if (aClause && !bClause) [a, x, b, y] = [b, y, a, x];
      const p = h.type === 'eq' ? pred(b, y) : negPred(b, y);
      return clause(ref(a, x), p);
    }
    // In Ordnungssaetzen steht die erste Seite nie am Satzende, ein Relativsatz
    // dort muss also geschlossen werden. Bei "gap" gilt das auch fuer die zweite.
    case 'before':
      return theme.order.before(subject(ref(h.a, h.x)), ref(h.b, h.y));
    case 'dist':
      return theme.order.dist(subject(ref(h.a, h.x)), ref(h.b, h.y), h.d);
    case 'gap': {
      const B = ref(h.b, h.y);
      return theme.order.gap(subject(ref(h.a, h.x)), B.includes(', ') ? B + ',' : B, h.d);
    }
    case 'or':
      return clause(ref(h.b, h.y), eitherOr(pred(h.a, h.x1), pred(h.a, h.x2)));
    default:
      throw new Error('unbekannter Hinweistyp ' + h.type);
  }
}

/**
 * Sortiert die Hinweise so, dass sie sich gut lesen: erst die eindeutigen
 * Zuordnungen, dann Ordnung und Auswahl, zuletzt die Ausschluesse.
 */
export function orderHints(theme, hints) {
  const rank = { eq: 0, dist: 1, gap: 2, before: 3, or: 4, neq: 5 };
  return hints
    .map((h, i) => ({ h, i, text: hintToText(theme, h) }))
    .sort((p, q) => (rank[p.h.type] - rank[q.h.type]) || (p.i - q.i));
}
