// Oberflaeche: Raetsel erzeugen, Raster bedienen, Archiv fuehren.

const STORE = 'logical-archiv-v1';
const $ = (sel, root = document) => root.querySelector(sel);

const state = {
  puzzle: null,
  theme: null,
  marks: new Map(),   // "a:x:b:y" -> 1 | -1
  answers: {},        // slot -> {catIndex: valueIndex}
  startedAt: 0,
  revealed: false,
  archived: false,
};

// ------------------------------------------------------------- Archiv -------

function loadArchive() {
  try { return JSON.parse(localStorage.getItem(STORE)) || []; }
  catch { return []; }
}

function saveArchive(list) {
  localStorage.setItem(STORE, JSON.stringify(list));
}

function signature(themeId, solution) {
  return themeId + ':' + solution.map((p) => p.join('')).join('-');
}

// ------------------------------------------------------- Raetsel bauen ------

function pickTheme(archive) {
  // Zuletzt gespielte Themen meiden, damit sich die Welten abwechseln.
  const recent = archive.slice(0, 4).map((e) => e.themeId);
  const fresh = THEMES.filter((t) => !recent.includes(t.id));
  const pot = fresh.length ? fresh : THEMES;
  return pot[Math.floor(Math.random() * pot.length)];
}

function newPuzzle() {
  const archive = loadArchive();
  const wanted = $('#level').value;
  const levels = wanted === 'egal' ? ['leicht', 'mittel', 'knifflig'] : [wanted];
  const themeSel = $('#theme').value;
  const theme = themeSel === 'egal'
    ? pickTheme(archive)
    : THEMES.find((t) => t.id === themeSel);

  const seen = new Set(archive.map((e) => e.sig));
  for (let tries = 0; tries < 40; tries++) {
    const seed = (Math.random() * 2 ** 31) >>> 0;
    const p = generatePuzzle(seed, { levels });
    if (!p) continue;
    if (seen.has(signature(theme.id, p.solution))) continue;
    return { theme, puzzle: p };
  }
  return null;
}

function generate() {
  const btn = $('#generate');
  btn.disabled = true;
  btn.textContent = 'Wird gebaut …';
  // Einen Frame warten, damit der Ladezustand sichtbar wird.
  setTimeout(() => {
    const made = newPuzzle();
    btn.disabled = false;
    btn.textContent = 'Neues Logical';
    if (!made) { setStatus('Kein neues Rätsel gefunden. Bitte noch einmal.', 'warn'); return; }
    state.puzzle = made.puzzle;
    state.theme = made.theme;
    state.marks = new Map();
    state.answers = {};
    state.startedAt = Date.now();
    state.revealed = false;
    state.archived = false;
    render();
    setStatus('');
    $('#puzzle').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 30);
}

// ------------------------------------------------------------ Rendern -------

function setStatus(text, kind) {
  const el = $('#status');
  el.textContent = text;
  el.className = 'status' + (kind ? ' ' + kind : '');
  el.hidden = !text;
}

function render() {
  const { theme, puzzle } = state;
  $('#puzzle').hidden = false;
  $('#empty').hidden = true;
  $('#theme-name').textContent = theme.name;
  $('#intro').textContent = theme.intro;
  $('#meta').textContent =
    `${puzzle.hints.length} Hinweise · ${puzzle.rating.level} · Nr. ${puzzle.seed.toString(36).toUpperCase()}`;
  renderHints();
  renderGrid();
  renderSolution();
  renderArchive();
}

function renderHints() {
  const list = $('#hints');
  list.innerHTML = '';
  orderHints(state.theme, state.puzzle.hints).forEach((o, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hint';
    btn.innerHTML = `<span class="hint-no">${i + 1}</span><span class="hint-text"></span>`;
    btn.querySelector('.hint-text').textContent = o.text;
    btn.setAttribute('aria-pressed', 'false');
    btn.title = 'Als abgearbeitet markieren';
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!on));
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
}

const key = (a, x, b, y) => (a < b ? `${a}:${x}:${b}:${y}` : `${b}:${y}:${a}:${x}`);

function getMark(a, x, b, y) { return state.marks.get(key(a, x, b, y)) || 0; }

function setMark(a, x, b, y, v) {
  const k = key(a, x, b, y);
  if (v === 0) state.marks.delete(k); else state.marks.set(k, v);
}

// Ein Treffer schliesst die uebrige Zeile und Spalte aus. Das nimmt dem
// Spieler genau die Handarbeit ab, die keine Denkarbeit ist.
function autoExclude(a, x, b, y) {
  if (!$('#autocross').checked) return;
  for (let i = 0; i < 5; i++) {
    if (i !== y && getMark(a, x, b, i) === 0) setMark(a, x, b, i, -1);
    if (i !== x && getMark(a, i, b, y) === 0) setMark(a, i, b, y, -1);
  }
}

function cycle(a, x, b, y) {
  const cur = getMark(a, x, b, y);
  const next = cur === 0 ? 1 : cur === 1 ? -1 : 0;
  setMark(a, x, b, y, next);
  if (next === 1) {
    autoExclude(a, x, b, y);
    // Ein Treffer gegen die Ankerspalte fuellt die Loesungstabelle mit.
    if (a === 0) setAnswer(x, b, y);
    if (b === 0) setAnswer(y, a, x);
  }
  renderGrid();
  renderSolution();
}

function renderGrid() {
  const cats = state.theme.cats;
  const colCats = [1, 2, 3, 4];
  const rowCats = [0, 4, 3, 2];
  const table = document.createElement('table');
  table.className = 'grid';

  // Kopf: Kategorienamen, darunter die Werte senkrecht.
  const head = document.createElement('thead');
  const r1 = document.createElement('tr');
  r1.innerHTML = '<td class="corner" colspan="2"></td>';
  colCats.forEach((c) => {
    const th = document.createElement('th');
    th.colSpan = 5;
    th.className = 'cat-head';
    th.textContent = cats[c].label;
    r1.appendChild(th);
  });
  head.appendChild(r1);

  const r2 = document.createElement('tr');
  r2.innerHTML = '<td class="corner" colspan="2"></td>';
  colCats.forEach((c) => {
    cats[c].values.forEach((v, i) => {
      const th = document.createElement('th');
      th.className = 'val-head' + (i === 0 ? ' block-start' : '');
      th.innerHTML = `<span>${v}</span>`;
      th.dataset.col = `${c}:${i}`;
      r2.appendChild(th);
    });
  });
  head.appendChild(r2);
  table.appendChild(head);

  const body = document.createElement('tbody');
  rowCats.forEach((rc, ri) => {
    const span = colCats.length - ri; // Treppenform: jede Reihe eine Gruppe kuerzer
    cats[rc].values.forEach((rv, rvi) => {
      const tr = document.createElement('tr');
      if (rvi === 0) {
        const th = document.createElement('th');
        th.className = 'cat-side';
        th.rowSpan = 5;
        th.innerHTML = `<span>${cats[rc].label}</span>`;
        tr.appendChild(th);
        tr.classList.add('block-start');
      }
      const rh = document.createElement('th');
      rh.className = 'val-side';
      rh.textContent = rv;
      rh.dataset.row = `${rc}:${rvi}`;
      tr.appendChild(rh);

      for (let ci = 0; ci < span; ci++) {
        const cc = colCats[ci];
        cats[cc].values.forEach((_, cvi) => {
          const td = document.createElement('td');
          td.className = 'cell' + (cvi === 0 ? ' block-start' : '');
          const m = getMark(rc, rvi, cc, cvi);
          td.dataset.row = `${rc}:${rvi}`;
          td.dataset.col = `${cc}:${cvi}`;
          if (m === 1) { td.classList.add('yes'); td.textContent = '✓'; }
          else if (m === -1) { td.classList.add('no'); td.textContent = '✗'; }
          td.tabIndex = 0;
          const act = () => cycle(rc, rvi, cc, cvi);
          td.addEventListener('click', act);
          td.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); }
          });
          tr.appendChild(td);
        });
      }
      body.appendChild(tr);
    });
  });
  table.appendChild(body);

  const wrap = $('#grid');
  wrap.innerHTML = '';
  wrap.appendChild(table);
  hookHighlight(table);
}

// Zeile und Spalte mitziehen: beim Lesen einer langen Reihe verrutscht sonst der Blick.
function hookHighlight(table) {
  table.addEventListener('mouseover', (e) => {
    const t = e.target.closest('[data-row],[data-col]');
    table.querySelectorAll('.hl').forEach((n) => n.classList.remove('hl'));
    if (!t) return;
    const { row, col } = t.dataset;
    if (row) table.querySelectorAll(`[data-row="${row}"]`).forEach((n) => n.classList.add('hl'));
    if (col) table.querySelectorAll(`[data-col="${col}"]`).forEach((n) => n.classList.add('hl'));
  });
  table.addEventListener('mouseleave', () => {
    table.querySelectorAll('.hl').forEach((n) => n.classList.remove('hl'));
  });
}

function setAnswer(slot, cat, val) {
  if (!state.answers[slot]) state.answers[slot] = {};
  state.answers[slot][cat] = val;
}

function renderSolution() {
  const cats = state.theme.cats;
  const table = document.createElement('table');
  table.className = 'solution';
  const head = document.createElement('thead');
  const tr = document.createElement('tr');
  [0, 1, 2, 3, 4].forEach((c) => {
    const th = document.createElement('th');
    th.textContent = cats[c].label;
    tr.appendChild(th);
  });
  head.appendChild(tr);
  table.appendChild(head);

  const body = document.createElement('tbody');
  cats[0].values.forEach((anchor, slot) => {
    const row = document.createElement('tr');
    const th = document.createElement('th');
    th.textContent = anchor;
    row.appendChild(th);
    for (let c = 1; c < 5; c++) {
      const td = document.createElement('td');
      const sel = document.createElement('select');
      sel.innerHTML = '<option value="">–</option>' +
        cats[c].values.map((v, i) => `<option value="${i}">${v}</option>`).join('');
      const cur = state.answers[slot]?.[c];
      if (cur !== undefined) sel.value = String(cur);
      sel.addEventListener('change', () => {
        if (sel.value === '') { delete state.answers[slot]?.[c]; }
        else setAnswer(slot, c, Number(sel.value));
        td.className = '';
      });
      if (state.revealed) {
        sel.disabled = true;
        sel.value = String(state.puzzle.solution[c][slot]);
      }
      td.appendChild(sel);
      row.appendChild(td);
    }
    body.appendChild(row);
  });
  table.appendChild(body);
  const wrap = $('#solution');
  wrap.innerHTML = '';
  wrap.appendChild(table);
}

// -------------------------------------------------------------- Pruefen -----

function check() {
  const sol = state.puzzle.solution;
  let filled = 0, wrong = 0;
  const cells = $('#solution').querySelectorAll('tbody tr');
  cells.forEach((tr, slot) => {
    for (let c = 1; c < 5; c++) {
      const td = tr.children[c];
      const sel = td.querySelector('select');
      td.className = '';
      if (sel.value === '') continue;
      filled++;
      if (Number(sel.value) !== sol[c][slot]) { td.className = 'wrong'; wrong++; }
      else td.className = 'right';
    }
  });
  if (filled === 0) { setStatus('Die Lösungstabelle ist noch leer.', 'warn'); return; }
  if (wrong === 0 && filled === 20) {
    const mins = Math.round((Date.now() - state.startedAt) / 60000);
    setStatus(`Alles richtig. Gelöst in ${mins < 1 ? 'unter einer Minute' : mins + ' Minuten'}.`, 'ok');
    archiveCurrent('gelöst');
  } else if (wrong === 0) {
    setStatus(`${filled} von 20 Feldern stimmen. Weiter geht es.`, 'ok');
  } else {
    setStatus(`${wrong} ${wrong === 1 ? 'Feld ist' : 'Felder sind'} falsch, rot markiert.`, 'warn');
  }
}

function reveal() {
  state.revealed = true;
  renderSolution();
  setStatus('Lösung eingeblendet.', '');
  archiveCurrent('aufgelöst');
}

// -------------------------------------------------------------- Archiv ------

function archiveCurrent(status) {
  if (state.archived) return;
  state.archived = true;
  const { theme, puzzle } = state;
  const list = loadArchive();
  list.unshift({
    id: Date.now(),
    ts: new Date().toISOString(),
    themeId: theme.id,
    themeName: theme.name,
    level: puzzle.rating.level,
    hintCount: puzzle.hints.length,
    seed: puzzle.seed,
    sig: signature(theme.id, puzzle.solution),
    status,
    minutes: Math.max(1, Math.round((Date.now() - state.startedAt) / 60000)),
    solution: puzzle.solution,
    hintTexts: orderHints(theme, puzzle.hints).map((o) => o.text),
  });
  saveArchive(list.slice(0, 500));
  renderArchive();
}

function renderArchive() {
  const list = loadArchive();
  $('#archive-count').textContent = list.length === 0 ? 'noch leer'
    : `${list.length} ${list.length === 1 ? 'Eintrag' : 'Einträge'}`;
  const tbody = $('#archive-body');
  tbody.innerHTML = '';
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="muted">Gelöste Rätsel landen hier und werden beim Erzeugen gemieden.</td></tr>';
    return;
  }
  list.slice(0, 40).forEach((e) => {
    const tr = document.createElement('tr');
    const d = new Date(e.ts);
    const dd = String(d.getDate()).padStart(2, '0') + '.' +
      String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
    tr.innerHTML = `<td>${dd}</td><td>${e.themeName}</td><td>${e.level}</td>
      <td class="num">${e.hintCount}</td><td>${e.status}</td><td class="num">${e.minutes} min</td>`;
    tbody.appendChild(tr);
  });
}

async function exportArchive() {
  const json = JSON.stringify(loadArchive(), null, 2);
  // Im Artifact-Viewer darf die Seite nicht selbst herunterladen, dort geht
  // die Datei ueber die Download-Faehigkeit an den Betrachter.
  const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
  if (dl) {
    try {
      await dl.save({ filename: 'logical-archiv.json', data: json });
      setStatus('Archiv gesichert.', 'ok');
    } catch (err) {
      if (err && err.code === 'declined') setStatus('Sichern abgebrochen.', '');
      else setStatus('Sichern nicht möglich: ' + ((err && err.message) || 'unbekannter Grund'), 'warn');
    }
    return;
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'logical-archiv.json';
  a.click();
  URL.revokeObjectURL(url);
  setStatus('Archiv gesichert.', 'ok');
}

function importArchive(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const incoming = JSON.parse(fr.result);
      if (!Array.isArray(incoming)) throw new Error('Format');
      const have = loadArchive();
      const seen = new Set(have.map((e) => e.sig));
      const merged = have.concat(incoming.filter((e) => e && e.sig && !seen.has(e.sig)));
      merged.sort((a, b) => (a.ts < b.ts ? 1 : -1));
      saveArchive(merged.slice(0, 500));
      renderArchive();
      setStatus(`Archiv zusammengeführt, jetzt ${merged.length} Einträge.`, 'ok');
    } catch {
      setStatus('Die Datei ließ sich nicht lesen. Erwartet wird ein Export dieser Seite.', 'warn');
    }
  };
  fr.readAsText(file);
}

// ---------------------------------------------------------------- Start -----

function init() {
  const sel = $('#theme');
  THEMES.forEach((t) => {
    const o = document.createElement('option');
    o.value = t.id; o.textContent = t.name;
    sel.appendChild(o);
  });
  $('#generate').addEventListener('click', generate);
  $('#check').addEventListener('click', check);
  $('#reveal').addEventListener('click', reveal);
  $('#clear').addEventListener('click', () => {
    state.marks = new Map(); state.answers = {}; state.revealed = false;
    renderGrid(); renderSolution(); setStatus('');
  });
  $('#export').addEventListener('click', exportArchive);
  $('#import').addEventListener('change', (e) => {
    if (e.target.files[0]) importArchive(e.target.files[0]);
    e.target.value = '';
  });
  $('#wipe').addEventListener('click', () => {
    if (confirm('Das gesamte Archiv löschen? Das lässt sich nicht rückgängig machen.')) {
      saveArchive([]); renderArchive();
    }
  });
  renderArchive();
}

document.addEventListener('DOMContentLoaded', init);
