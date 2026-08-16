# Ursprungsvorlage

`Logical.xlsx` ist das von Hand gebaute Logical, mit dem dieses Projekt
angefangen hat: ein Numbers-Export vom 11.02.2026 mit fünf Kategorien
(Uhrzeit, Person, Hobby, Stadt, Getränk), dem Kreuzraster in Treppenform und
der Lösungstabelle darunter. Die Hinweise selbst stehen nicht darin, nur das
Format.

Sie liegt hier als Beleg, wie das Zielformat aussehen sollte. Zwei Dinge im
Code gehen direkt auf sie zurück: die Treppenform des Rasters, bei der jeder
Zeilenblock eine Kategoriengruppe kürzer ist als der darüber, und die
Entscheidung für fünf Kategorien statt vier, aus der die Hinweiszahl von zwölf
bis 16 folgt.

Die Datei wird von nichts eingelesen. Wer das Format ändern will, ändert
`src/ui.js` und `src/themes.js`, nicht diese Datei.
