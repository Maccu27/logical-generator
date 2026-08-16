// Gibt alle Satzbausteine aller Themen aus. Nutzt bewusst die echten
// Funktionen aus text.js, keine Nachbauten.
import { THEMES } from './src/themes.js';
import { negate } from './src/text.js';
const only = process.argv[2];
for (const t of THEMES) {
  if (only && t.id !== only) continue;
  console.log('\n### ' + t.name);
  t.cats.forEach((c) => {
    console.log(' ' + c.label);
    console.log('   ref : ' + c.values.map((v) => c.ref(v)).join(' | '));
    console.log('   pos : ' + c.values.map((v) => c.pred(v)).join(' | '));
    console.log('   neg : ' + c.values.map((v) => (c.neg ? c.neg(v) : negate(c.pred(v)))).join(' | '));
  });
}
