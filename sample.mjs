import { generatePuzzle } from './src/engine.js';
import { THEMES } from './src/themes.js';
import { orderHints } from './src/text.js';
const only = process.argv[2];
THEMES.filter(t=>!only||t.id===only).forEach((theme, i) => {
  const p = generatePuzzle(4711 + i * 97, { levels: ['mittel'] });
  console.log('\n=== ' + theme.name + '  (' + p.hints.length + ' Hinweise, ' + p.rating.level + ') ===');
  orderHints(theme, p.hints).forEach((o, k) => console.log(`${String(k+1).padStart(2)}. [${o.h.type}] ${o.text}`));
});
