#!/usr/bin/env python3
"""Baut aus den Quellen zwei Dateien.

    dist/index.html     vollstaendige Seite, laeuft per Doppelklick
    dist/artifact.html  Fragment ohne Geruest, fuer die Veroeffentlichung

Die Module werden inline gesetzt: import- und export-Schluesselwoerter fallen
weg, der Rest wird in der Reihenfolge aneinandergehaengt. Damit bleibt die
Engine in Node testbar und die ausgelieferte Seite trotzdem eine einzige Datei.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / 'src'
DIST = ROOT / 'dist'
MODULES = ['engine.js', 'themes.js', 'text.js', 'ui.js']


def inline(js: str) -> str:
    js = re.sub(r'^\s*import\s.*?;\s*$', '', js, flags=re.M | re.S)
    js = re.sub(r'^export\s+', '', js, flags=re.M)
    return js.strip()


def main() -> None:
    css = (SRC / 'style.css').read_text(encoding='utf-8')
    bundle = '\n\n'.join(inline((SRC / m).read_text(encoding='utf-8')) for m in MODULES)
    page = (SRC / 'template.html').read_text(encoding='utf-8')
    page = page.replace('/*__CSS__*/', css).replace('/*__JS__*/', bundle)

    DIST.mkdir(exist_ok=True)
    (DIST / 'artifact.html').write_text(page, encoding='utf-8')
    (DIST / 'index.html').write_text(
        '<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        f'{page}\n</body>\n</html>\n'.replace('<div class="wrap">', '</head>\n<body>\n<div class="wrap">', 1),
        encoding='utf-8')

    kb = (DIST / 'index.html').stat().st_size / 1024
    print(f'dist/index.html und dist/artifact.html gebaut, {kb:.0f} KB')


if __name__ == '__main__':
    main()
