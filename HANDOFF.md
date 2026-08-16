# Übergabestand

Stand 16.08.2026. Diese Datei beschreibt, wo das Projekt steht und welche
Entscheidungen bewusst so getroffen wurden. Wer hier neu einsteigt, liest sie
zuerst und danach die `README.md` für die Technik. Sie wird überschrieben, nicht
vermehrt.

## Wo es liegt

    Live      https://maccu27.github.io/logical-generator/
    Repo      https://github.com/Maccu27/logical-generator  (öffentlich)
    Lokal     ~/Projekte Claude/projekte/logical-generator/
    Memory    logical_generator.md

Ein Push auf `main` baut und veröffentlicht automatisch, ein Durchlauf dauert
etwa 20 Sekunden. Manuell deployen muss niemand.

## Stand

Fertig und in Benutzung. Der Generator erzeugt Rätsel mit fünf Kategorien zu je
fünf Werten in zehn Themenwelten, dazu Kreuzraster, Lösungstabelle, Prüfung und
ein Archiv im Browser. `node test.mjs` läuft ohne Fehler über 30 Rätsel und
prüft dabei drei Dinge: Eindeutigkeit per unabhängiger Tiefensuche, Lösbarkeit
ohne Raten, und dass alle 30 Ordnungssätze die zweite Seite mit "als" oder "und"
anbinden.

Offene Punkte gibt es keine. Was fehlt, ist Ausbau, kein Rest.

## Entscheidungen, die nicht neu verhandelt werden sollten

**Kein Railway, kein Backend.** Die Erzeugung ist reine Rechnerei ohne Daten von
außen. Ein Container, der eine statische Datei ausliefert, wäre laufende Kosten
und ein weiterer Dienst, dessen Ausfall niemandem auffällt.

**Das Repo ist öffentlich, als bewusste Ausnahme.** GitHub Pages gibt es bei
einem GitHub-Free-Konto nur für öffentliche Repos, die API antwortet sonst mit
422. Im Code steht nichts Schützenswertes. Für andere Projekte gilt weiter
privat; soll dort eine Seite öffentlich sein, ohne den Code zu zeigen, ist
Cloudflare Pages der Weg.

**Zwölf bis 16 Hinweise sind keine Nachlässigkeit.** Bei (5!)^4 möglichen
Lösungen sind rund 27,6 Bit zu tilgen, der stärkste Hinweistyp liefert etwa 2,6
Bit. Gemessen über 30 Rätsel: Median 14. Acht bis zehn Hinweise sind in diesem
Format nicht erreichbar, dafür müsste eine Kategorie entfallen, dann liegt der
Median bei zehn. Diese Rechnung nicht wiederholen, sie steht auch in der
`README.md`.

**Die Schwierigkeit wird gemessen, nicht geschätzt.** Zählgröße sind die
Schlussrunden des Rasterlösers.

## Zwei Regeln, an denen der Satzbau hängt

1. Jedes Prädikat beginnt mit dem finiten Verb, dann entsteht die Verneinung
   mechanisch.
2. Ordnungssätze binden die zweite Seite immer mit "als" oder "und" an, weil
   jede Präposition dort einen Kasus fordert, den die Referenzphrasen nicht
   mitbringen. `test.mjs` prüft das automatisch.

Daraus folgt für neue Themen: einheitliches Genus je Kategorie, sonst kippt das
Artikel-Template; wo das nicht geht, bekommt die Kategorie eine eigene
`neg`-Form. Und die Referenzphrase muss zu **allen** Prädikaten des Themas
passen, sonst entstehen Sätze wie "Pia ist ein Kater". Nach jeder Änderung an
`src/themes.js` einmal `node check-forms.mjs` laufen lassen und die Bausteine
ansehen, dazu `node sample.mjs` für fertige Rätsel im Zusammenhang.

## Was als Nächstes sinnvoll wäre

Neue Themen sind der billigste Ausbau: ein Eintrag in `src/themes.js` nach dem
Muster der vorhandenen, prüfen, pushen. Die Engine wird dafür nicht angefasst.

Denkbar, aber bewusst nicht gebaut: Druckansicht für Papier, Zeitmessung mit
Bestenliste, ein vierter Schwierigkeitsgrad. Nichts davon wurde vermisst.

## Historie

Am 16.08.2026 gab es zusätzlich eine private Artifact-Fassung auf claude.ai.
Sie wurde entfernt, nachdem GitHub Pages live war: zwei Adressen mit getrennten
Archiven, die bei jeder Änderung auseinanderlaufen. Mit ihr entfielen die
zweite Build-Ausgabe `dist/artifact.html` und der Download-Sonderweg über
`claude.use("downloads")` im Archiv-Export. Wird je wieder eine Artifact-Fassung
gebraucht, müssen beide zurück, sonst tut der Knopf "Als Datei sichern" dort
nichts.
