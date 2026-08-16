// Themenwelten. Jede hat 5 Kategorien mit je 5 Werten.
// Kategorie 0 ist der geordnete Anker und bildet die Zeilen der Loesungstabelle.
//
// Pro Kategorie:
//   label  Spaltenueberschrift im Raster
//   values die fuenf Werte
//   pred   Praedikat, beginnt IMMER mit dem finiten Verb ("kauft den Mantel").
//          Die Verneinung entsteht daraus mechanisch: Verb + "nicht" + Rest.
//   ref    Nominativ-Nominalphrase, die als Satzsubjekt und nach "als" passt.
//
// Regel fuer die Werte: pro Kategorie einheitliches Genus, damit ein einziges
// Artikel-Template in pred und ref immer korrekt flektiert.
//
// order  Ordnungssaetze des Themas. Die zweite Seite steht immer im Nominativ
//        ("... als X", "X und Y ..."), deshalb gibt es keine Kasusfallen.

// Dativ Plural fuer die Balkon-Referenz ("die Partei mit Fahrraedern").
const BALKON_DATIV = {
  'Kräuter': 'Kräutern', 'Wäsche': 'Wäsche', 'Fahrräder': 'Fahrrädern',
  'Sonnenschirme': 'Sonnenschirmen', 'Blumenkästen': 'Blumenkästen',
};

export const THEMES = [
  {
    id: 'boutique',
    name: 'In der Boutique',
    intro: 'Fünf Kundinnen kommen nacheinander in eine kleine Boutique. Jede kauft ein anderes Stück, in einer anderen Farbe, und zahlt anders.',
    order: {
      before: (A, B) => `${A} ist früher da als ${B}.`,
      dist: (A, B, d) => `${A} ist genau ${d === 1 ? 'eine Stunde' : 'zwei Stunden'} früher da als ${B}.`,
      gap: (A, B, d) => `${A} und ${B} liegen genau ${d === 1 ? 'eine Stunde' : 'zwei Stunden'} auseinander.`,
    },
    cats: [
      { label: 'Uhrzeit', values: ['10 Uhr', '11 Uhr', '12 Uhr', '13 Uhr', '14 Uhr'],
        pred: (v) => `kommt um ${v}`, ref: (v) => `die Kundin um ${v}` },
      { label: 'Kundin', values: ['Anja', 'Beate', 'Carla', 'Dilek', 'Eva'],
        pred: (v) => `heißt ${v}`, ref: (v) => v },
      { label: 'Kauf', values: ['Mantel', 'Schal', 'Rock', 'Gürtel', 'Hut'],
        pred: (v) => `kauft den ${v}`, ref: (v) => `die Kundin mit dem ${v}` },
      { label: 'Farbe', values: ['Rot', 'Blau', 'Grün', 'Beige', 'Schwarz'],
        pred: (v) => `wählt ${v}`, ref: (v) => `die Kundin in ${v}` },
      { label: 'Zahlung', values: ['bar', 'mit Karte', 'per App', 'mit Gutschein', 'auf Rechnung'],
        pred: (v) => `zahlt ${v}`, ref: (v) => `die Kundin, die ${v} zahlt` },
    ],
  },
  {
    id: 'fernreise',
    name: 'Am Flughafen',
    intro: 'Fünf Reisende starten am selben Tag in den Urlaub. Jeder fliegt woanders hin, nimmt anderes Gepäck mit und bleibt unterschiedlich lang.',
    order: {
      before: (A, B) => `${A} startet früher als ${B}.`,
      dist: (A, B, d) => `${A} startet genau ${d === 1 ? 'drei Stunden' : 'sechs Stunden'} früher als ${B}.`,
      gap: (A, B, d) => `${A} und ${B} liegen genau ${d === 1 ? 'drei Stunden' : 'sechs Stunden'} auseinander.`,
    },
    cats: [
      { label: 'Abflug', values: ['6 Uhr', '9 Uhr', '12 Uhr', '15 Uhr', '18 Uhr'],
        pred: (v) => `fliegt um ${v}`, ref: (v) => `der Reisende um ${v}` },
      { label: 'Name', values: ['Frank', 'Greta', 'Hakan', 'Ines', 'Jonas'],
        pred: (v) => `heißt ${v}`, ref: (v) => v },
      { label: 'Ziel', values: ['Kanada', 'Japan', 'Chile', 'Kenia', 'Island'],
        pred: (v) => `fliegt nach ${v}`, ref: (v) => `der Reisende nach ${v}` },
      { label: 'Gepäck', values: ['Rucksack', 'Koffer', 'Seesack', 'Trolley', 'Kleidersack'],
        pred: (v) => `nimmt den ${v}`, ref: (v) => `der Reisende mit dem ${v}` },
      { label: 'Dauer', values: ['eine Woche', 'zehn Tage', 'zwei Wochen', 'drei Wochen', 'einen Monat'],
        pred: (v) => `bleibt ${v} lang`, neg: (v) => `bleibt nicht ${v} lang`,
        ref: (v) => `der Reisende, der ${v} lang bleibt` },
    ],
  },
  {
    id: 'wochenmarkt',
    name: 'Auf dem Wochenmarkt',
    intro: 'Fünf Stände stehen nebeneinander in einer Reihe, von links nach rechts. Jeder Händler verkauft etwas anderes, kommt aus einer anderen Gegend und hat eine andere Markise.',
    order: {
      before: (A, B) => `${A} steht weiter links als ${B}.`,
      dist: (A, B, d) => `${A} steht genau ${d === 1 ? 'einen Stand' : 'zwei Stände'} weiter links als ${B}.`,
      gap: (A, B, d) => `${A} und ${B} stehen genau ${d === 1 ? 'einen Stand' : 'zwei Stände'} auseinander.`,
    },
    cats: [
      { label: 'Stand', values: ['Stand 1', 'Stand 2', 'Stand 3', 'Stand 4', 'Stand 5'],
        pred: (v) => `steht an ${v}`, ref: (v) => `der Händler an ${v}` },
      { label: 'Händler', values: ['Kaya', 'Lena', 'Mirko', 'Nadja', 'Olaf'],
        pred: (v) => `heißt ${v}`, ref: (v) => v },
      { label: 'Ware', values: ['Käse', 'Honig', 'Fisch', 'Spargel', 'Kuchen'],
        pred: (v) => `verkauft ${v}`, neg: (v) => `verkauft keinen ${v}`,
        ref: (v) => `der Händler mit ${v}` },
      { label: 'Herkunft', values: ['Eifel', 'Altmark', 'Bergstraße', 'Uckermark', 'Pfalz'],
        pred: (v) => `kommt aus der ${v}`, ref: (v) => `der Händler aus der ${v}` },
      { label: 'Markise', values: ['gestreift', 'kariert', 'einfarbig', 'geblümt', 'ausgeblichen'],
        pred: (v) => `hat eine ${v}e Markise`, neg: (v) => `hat keine ${v}e Markise`,
        ref: (v) => `der Händler mit der ${v}en Markise` },
    ],
  },
  {
    id: 'tierarzt',
    name: 'In der Tierarztpraxis',
    intro: 'Fünf Termine an einem Vormittag. Jedes Tier gehört jemand anderem, heißt anders und ist aus einem anderen Grund da.',
    order: {
      before: (A, B) => `${A} ist früher dran als ${B}.`,
      dist: (A, B, d) => `${A} ist genau ${d === 1 ? 'eine halbe Stunde' : 'eine Stunde'} früher dran als ${B}.`,
      gap: (A, B, d) => `${A} und ${B} liegen genau ${d === 1 ? 'eine halbe Stunde' : 'eine Stunde'} auseinander.`,
    },
    cats: [
      { label: 'Termin', values: ['8:00', '8:30', '9:00', '9:30', '10:00'],
        pred: (v) => `hat den Termin um ${v}`, neg: (v) => `hat keinen Termin um ${v}`,
        ref: (v) => `der Patient um ${v}` },
      { label: 'Besitzer', values: ['Pia', 'Quentin', 'Rosa', 'Sven', 'Tanja'],
        pred: (v) => `gehört ${v}`, ref: (v) => `das Tier von ${v}` },
      { label: 'Tier', values: ['Kater', 'Wellensittich', 'Dackel', 'Hamster', 'Terrier'],
        pred: (v) => `ist ein ${v}`, ref: (v) => `der ${v}` },
      { label: 'Tiername', values: ['Wumme', 'Xaver', 'Yuki', 'Zorro', 'Struppi'],
        pred: (v) => `heißt ${v}`, ref: (v) => `das Tier namens ${v}` },
      { label: 'Anlass', values: ['der Impfung', 'der Kontrolle', 'des Zahnsteins', 'der Pfote', 'der Ohren'],
        pred: (v) => `kommt wegen ${v}`, ref: (v) => `der Patient wegen ${v}` },
    ],
  },
  {
    id: 'mietshaus',
    name: 'Im Mietshaus',
    intro: 'Fünf Parteien wohnen übereinander. Jede arbeitet woanders, hat ein anderes Haustier und einen anderen Balkon.',
    order: {
      before: (A, B) => `${A} wohnt weiter unten als ${B}.`,
      dist: (A, B, d) => `${A} wohnt genau ${d === 1 ? 'ein Stockwerk' : 'zwei Stockwerke'} tiefer als ${B}.`,
      gap: (A, B, d) => `${A} und ${B} liegen genau ${d === 1 ? 'ein Stockwerk' : 'zwei Stockwerke'} auseinander.`,
    },
    cats: [
      { label: 'Etage', values: ['Erdgeschoss', '1. Stock', '2. Stock', '3. Stock', '4. Stock'],
        pred: (v) => `wohnt im ${v}`, ref: (v) => `die Partei im ${v}` },
      { label: 'Bewohner', values: ['Udo', 'Vera', 'Walid', 'Xenia', 'Yasin'],
        pred: (v) => `heißt ${v}`, ref: (v) => v },
      { label: 'Beruf', values: ['Bäcker', 'Fahrlehrer', 'Tischler', 'Apotheker', 'Kameramann'],
        pred: (v) => `arbeitet als ${v}`, ref: (v) => `der ${v}` },
      { label: 'Haustier', values: ['Kater', 'Papagei', 'Goldfisch', 'Terrier', 'Hamster'],
        pred: (v) => `hält einen ${v}`, ref: (v) => `die Partei mit dem ${v}` },
      { label: 'Balkon', values: ['Kräuter', 'Wäsche', 'Fahrräder', 'Sonnenschirme', 'Blumenkästen'],
        pred: (v) => `hat ${v} auf dem Balkon`, neg: (v) => `hat keine ${v} auf dem Balkon`,
        ref: (v) => `die Partei mit ${BALKON_DATIV[v]} auf dem Balkon` },
    ],
  },
  {
    id: 'festival',
    name: 'Auf dem Festival',
    intro: 'Fünf Bands spielen nacheinander auf derselben Bühne. Jede kommt woanders her, spielt ein anderes Genre und steht unterschiedlich lang oben.',
    order: {
      before: (A, B) => `${A} spielt früher als ${B}.`,
      dist: (A, B, d) => `${A} spielt genau ${d === 1 ? 'zwei Stunden' : 'vier Stunden'} früher als ${B}.`,
      gap: (A, B, d) => `${A} und ${B} liegen genau ${d === 1 ? 'zwei Stunden' : 'vier Stunden'} auseinander.`,
    },
    cats: [
      { label: 'Beginn', values: ['14 Uhr', '16 Uhr', '18 Uhr', '20 Uhr', '22 Uhr'],
        pred: (v) => `spielt um ${v}`, ref: (v) => `die Band um ${v}` },
      { label: 'Band', values: ['Nordwand', 'Kupfer', 'Halbmast', 'Fliehkraft', 'Tonspur'],
        pred: (v) => `heißt ${v}`, ref: (v) => v },
      { label: 'Genre', values: ['Punk', 'Soul', 'Techno', 'Folk', 'Jazz'],
        pred: (v) => `spielt ${v}`, ref: (v) => `die ${v}band` },
      { label: 'Herkunft', values: ['Bremen', 'Graz', 'Basel', 'Rostock', 'Trier'],
        pred: (v) => `kommt aus ${v}`, ref: (v) => `die Band aus ${v}` },
      { label: 'Spieldauer', values: ['30 Minuten', '40 Minuten', '50 Minuten', '60 Minuten', '75 Minuten'],
        pred: (v) => `spielt ${v} lang`, ref: (v) => `die Band mit ${v} Spielzeit` },
    ],
  },
  {
    id: 'bibliothek',
    name: 'Im Bücherregal',
    intro: 'Fünf Bücher stehen nebeneinander im Regal, von links nach rechts. Jedes hat einen anderen Umschlag, ein anderes Thema und einen anderen Umfang.',
    order: {
      before: (A, B) => `${A} steht weiter links als ${B}.`,
      dist: (A, B, d) => `${A} steht genau ${d === 1 ? 'einen Platz' : 'zwei Plätze'} weiter links als ${B}.`,
      gap: (A, B, d) => `${A} und ${B} stehen genau ${d === 1 ? 'einen Platz' : 'zwei Plätze'} auseinander.`,
    },
    cats: [
      { label: 'Platz', values: ['Platz 1', 'Platz 2', 'Platz 3', 'Platz 4', 'Platz 5'],
        pred: (v) => `steht auf ${v}`, ref: (v) => `das Buch auf ${v}` },
      { label: 'Thema', values: ['Seefahrt', 'Vulkanismus', 'Imkerei', 'Kartografie', 'Backen'],
        pred: (v) => `handelt von ${v}`, ref: (v) => `das Buch über ${v}` },
      { label: 'Umschlag', values: ['Leinen', 'Pappe', 'Leder', 'Folie', 'Papier'],
        pred: (v) => `hat einen Umschlag aus ${v}`, ref: (v) => `das Buch aus ${v}` },
      { label: 'Leser', values: ['Zoe', 'Arno', 'Bernd', 'Cilly', 'Dorit'],
        pred: (v) => `wurde von ${v} gelesen`, ref: (v) => `das Buch von ${v}` },
      { label: 'Seiten', values: ['80', '140', '220', '310', '460'],
        pred: (v) => `hat ${v} Seiten`, ref: (v) => `das Buch mit ${v} Seiten` },
    ],
  },
  {
    id: 'kochkurs',
    name: 'Im Kochkurs',
    intro: 'Fünf Teilnehmer stehen an fünf Herden nebeneinander. Jeder kocht etwas anderes, benutzt eine andere Hauptzutat und trägt eine andere Schürze.',
    order: {
      before: (A, B) => `${A} steht weiter links als ${B}.`,
      dist: (A, B, d) => `${A} steht genau ${d === 1 ? 'einen Herd' : 'zwei Herde'} weiter links als ${B}.`,
      gap: (A, B, d) => `${A} und ${B} stehen genau ${d === 1 ? 'einen Herd' : 'zwei Herde'} auseinander.`,
    },
    cats: [
      { label: 'Herd', values: ['Herd 1', 'Herd 2', 'Herd 3', 'Herd 4', 'Herd 5'],
        pred: (v) => `steht an ${v}`, ref: (v) => `der Teilnehmer an ${v}` },
      { label: 'Teilnehmer', values: ['Emre', 'Fiona', 'Georg', 'Hanna', 'Ilja'],
        pred: (v) => `heißt ${v}`, ref: (v) => v },
      { label: 'Gericht', values: ['Auflauf', 'Eintopf', 'Braten', 'Salat', 'Kuchen'],
        pred: (v) => `kocht den ${v}`, ref: (v) => `der Teilnehmer mit dem ${v}` },
      { label: 'Zutat', values: ['Fenchel', 'Ingwer', 'Kürbis', 'Lauch', 'Rhabarber'],
        pred: (v) => `nimmt ${v}`, neg: (v) => `nimmt keinen ${v}`,
        ref: (v) => `der Teilnehmer, der ${v} nimmt` },
      { label: 'Schürze', values: ['weiß', 'blau', 'grün', 'gelb', 'gestreift'],
        pred: (v) => `trägt eine ${v}e Schürze`, neg: (v) => `trägt keine ${v}e Schürze`,
        ref: (v) => `der Teilnehmer in der ${v}en Schürze` },
    ],
  },
  {
    id: 'zugfahrt',
    name: 'Im Zug',
    intro: 'Fünf Fahrgäste sitzen im selben Wagen. Der Zug hält nacheinander an fünf Bahnhöfen, und jeder steigt an einem anderen aus.',
    order: {
      before: (A, B) => `${A} steigt früher aus als ${B}.`,
      dist: (A, B, d) => `${A} steigt genau ${d === 1 ? 'einen Halt' : 'zwei Halte'} früher aus als ${B}.`,
      gap: (A, B, d) => `${A} und ${B} liegen genau ${d === 1 ? 'einen Halt' : 'zwei Halte'} auseinander.`,
    },
    cats: [
      { label: 'Halt', values: ['Kassel', 'Fulda', 'Würzburg', 'Nürnberg', 'München'],
        pred: (v) => `steigt in ${v} aus`, ref: (v) => `der Fahrgast bis ${v}` },
      { label: 'Fahrgast', values: ['Jörg', 'Kira', 'Lars', 'Mila', 'Nils'],
        pred: (v) => `heißt ${v}`, ref: (v) => v },
      { label: 'Platz', values: ['Fensterplatz', 'Gangplatz', 'Klapptisch', 'Vierertisch', 'Notausgang'],
        pred: (v) => `sitzt am ${v}`, ref: (v) => `der Fahrgast am ${v}` },
      { label: 'Getränk', values: ['Kaffee', 'Tee', 'Apfelsaft', 'Sprudel', 'Kakao'],
        pred: (v) => `trinkt ${v}`, neg: (v) => `trinkt keinen ${v}`,
        ref: (v) => `der Fahrgast, der ${v} trinkt` },
      { label: 'Zeitvertreib', values: ['einem Krimi', 'dem Laptop', 'Kreuzworträtseln', 'Schlaf', 'der Aussicht'],
        pred: (v) => `beschäftigt sich mit ${v}`, ref: (v) => `der Fahrgast mit ${v}` },
    ],
  },
  {
    id: 'schrebergarten',
    name: 'In der Kleingartenanlage',
    intro: 'Fünf Parzellen liegen nebeneinander am Weg. Jede gehört jemand anderem, hat einen anderen Anbau und eine andere Laube.',
    order: {
      before: (A, B) => `${A} liegt weiter vorn am Weg als ${B}.`,
      dist: (A, B, d) => `${A} liegt genau ${d === 1 ? 'eine Parzelle' : 'zwei Parzellen'} weiter vorn am Weg als ${B}.`,
      gap: (A, B, d) => `${A} und ${B} liegen genau ${d === 1 ? 'eine Parzelle' : 'zwei Parzellen'} auseinander.`,
    },
    cats: [
      { label: 'Parzelle', values: ['Parzelle 1', 'Parzelle 2', 'Parzelle 3', 'Parzelle 4', 'Parzelle 5'],
        pred: (v) => `liegt auf ${v}`, ref: (v) => `der Garten auf ${v}` },
      { label: 'Pächter', values: ['Otto', 'Petra', 'Ruben', 'Sara', 'Timo'],
        pred: (v) => `gehört ${v}`, ref: (v) => `der Garten von ${v}` },
      { label: 'Anbau', values: ['Tomaten', 'Bohnen', 'Erdbeeren', 'Zucchini', 'Radieschen'],
        pred: (v) => `zieht ${v}`, neg: (v) => `zieht keine ${v}`,
        ref: (v) => `der Garten mit ${v}` },
      { label: 'Laube', values: ['Holzlaube', 'Steinlaube', 'Blechhütte', 'Glasveranda', 'Zeltplane'],
        pred: (v) => `hat eine ${v}`, ref: (v) => `der Garten mit der ${v}` },
      { label: 'Wasser', values: ['einer Regentonne', 'einem Brunnen', 'dem Schlauch', 'der Gießkanne', 'einem Tropfschlauch'],
        pred: (v) => `gießt mit ${v}`, neg: (v) => `gießt nicht mit ${v}`,
        ref: (v) => `der Garten, der mit ${v} gießt` },
    ],
  },
];
