# Logical-Werkstatt

**Live: https://maccu27.github.io/logical-generator/**

Erzeugt Logikrätsel im 5x5-Format: fünf Kategorien mit je fünf Werten, dazu ein
Kreuzraster zum Ausfüllen und eine Lösungstabelle. Die Seite läuft komplett im
Browser, ohne Server und ohne Netzzugriff. Wer sie öffnet, klickt auf einen Knopf
und bekommt ein fertiges Rätsel.

Die Erzeugung ist vollständig deterministisch. Es steckt kein Sprachmodell darin,
sondern ein Constraint-Solver: Erst wird eine Lösung gewürfelt, dann werden wahre
Aussagen darüber gesammelt, und schließlich fällt alles weg, was sich auch ohne
diesen Hinweis erschließen lässt.

Wer neu in dieses Projekt einsteigt, liest zuerst `HANDOFF.md`: dort steht der
Stand und warum die Dinge so entschieden wurden.

## Aufbau

    src/engine.js     Generator und die beiden Löser
    src/themes.js     zehn Themenwelten mit ihren Satzschablonen
    src/text.js       aus Hinweis-Objekten werden deutsche Sätze
    src/ui.js         Oberfläche, Raster, Archiv
    src/style.css     Gestaltung
    src/template.html Gerüst
    HANDOFF.md        Stand und Entscheidungen, zuerst lesen
    build.py          baut dist/index.html
    test.mjs          Gegenproben: Eindeutigkeit, Lösbarkeit, Satzbau-Regel
    check-forms.mjs   gibt alle Satzbausteine zur Sichtprüfung aus
    sample.mjs        gibt je Thema ein fertiges Rätsel mit allen Hinweisen aus
    vorlage/          das handgebaute Ursprungs-Logical

Bauen mit `python3 build.py`, prüfen mit `node test.mjs`.

Jeder Push auf `main` baut die Seite neu und veröffentlicht sie über GitHub
Pages. Der Workflow bricht ab, wenn das eingecheckte `dist/` nicht zum Build aus
`src/` passt, damit die Live-Seite nie stillschweigend einen alten Stand zeigt.

## Wie ein Rätsel entsteht

Eine zufällige Lösung legt fest, was zusammengehört. Daraus entsteht ein Vorrat
wahrer Aussagen in sechs Typen: direkte Zuordnung, Ausschluss, Reihenfolge,
genauer Abstand, Abstand ohne Richtung und Oder-Aussage.

Aus diesem Vorrat werden so lange Hinweise gezogen, bis der Rasterlöser das
Rätsel knackt. Dieser Löser arbeitet wie ein Mensch am Papier: Er setzt Haken und
Kreuze, schließt Zeilen und Spalten ab und zieht Schlüsse über Zwischenkategorien.
Er rät nie. Was er nicht schafft, wird gar nicht erst ausgeliefert. Anschließend
wird die Hinweismenge rückwärts ausgedünnt, und eine unabhängige Tiefensuche
bestätigt, dass genau eine Lösung existiert.

## Warum es zwölf bis 16 Hinweise sind

Bei fünf Kategorien mit je fünf Werten gibt es (5!)⁴, also rund 207 Millionen
mögliche Lösungen. Das sind etwa 27,6 Bit, die die Hinweise wegnehmen müssen. Der
stärkste Hinweistyp liefert rund 2,6 Bit, womit elf Hinweise die theoretische
Untergrenze wären, und die nur ohne jede Überschneidung.

Gemessen über 30 erzeugte Rätsel: mindestens zwölf, im Mittel 14, höchstens 16.
Acht bis zehn Hinweise sind in diesem Format nicht erreichbar. Wer so weit
herunter will, braucht eine Kategorie weniger; dieselbe Maschine liefert dann
einen Median von zehn.

## Schwierigkeit

Die Stufe wird gemessen, nicht geschätzt. Zählgröße ist, wie viele
Schlussrunden der Rasterlöser braucht, dazu die Anzahl der Hinweise und der
Anteil reiner Ausschlüsse.

    leicht     3 bis 6 Runden
    mittel     5 bis 9 Runden
    knifflig   9 bis 15 Runden

Die Hinweiszahl unterscheidet die Stufen kaum, die Verschachtelung schon.

## Zwei Regeln, die den Satzbau tragen

Jedes Prädikat beginnt mit dem finiten Verb, deshalb entsteht die Verneinung
mechanisch. Und in Ordnungssätzen wird die zweite Seite immer mit "als" oder
"und" angebunden, denn jede Präposition dort würde einen Kasus fordern, den die
Referenzphrasen nicht mitbringen. `test.mjs` prüft die zweite Regel für alle
Themen mit.

Neue Themen brauchen deshalb pro Kategorie ein einheitliches Genus der Werte.
Wo das nicht geht, bekommt die Kategorie eine eigene `neg`-Form. Nach jeder
Änderung `node check-forms.mjs` laufen lassen und die Bausteine ansehen.

## Archiv

Gelöste und aufgelöste Rätsel landen im `localStorage` des Browsers, samt
Hinweistexten. Beim Erzeugen werden bereits gespielte Lösungen übersprungen und
die zuletzt gespielten Themen gemieden.

Ehrlich betrachtet wirkt davon nur die Themenrotation. Dass zweimal dieselbe
Lösung gewürfelt wird, ist bei 207 Millionen Möglichkeiten praktisch
ausgeschlossen, die Prüfung ist also eher Beruhigung als Schutz.

Über "Als Datei sichern" und "Archiv einlesen" wandert das Archiv zwischen
Browsern und Geräten. Zusammengeführt wird über die Lösungssignatur, doppelte
Einträge entstehen dabei nicht.
