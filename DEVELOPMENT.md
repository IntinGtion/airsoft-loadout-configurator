# Airsoft Loadout Configurator — Entwicklerdokumentation

Dieses Dokument erklärt den aktuellen Stand des Projekts, die getroffenen Architekturentscheidungen und wie das Projekt auf einem neuen Rechner aufgesetzt wird.

**Hinweis: Multi-PC-Entwicklung.** Dieses Projekt wird aktiv auf mehreren verschiedenen Rechnern entwickelt (aktuell drei), ohne dass die Rechner sich die lokale Entwicklungsumgebung teilen — synchronisiert wird ausschließlich über `git push`/`git pull`. Das bedeutet insbesondere: Die lokale SQLite-Datei (`loadout.db`) ist **pro Rechner separat**, nicht versioniert (`.gitignore`) und wird nie zwischen Rechnern übertragen. Wenn auf einem anderen PC neue EF-Core-Migrationen committet wurden, kann die lokale `loadout.db` auf diesem Rechner nach einem `git pull` veraltet/inkompatibel sein (z. B. `FOREIGN KEY constraint failed` beim Migrations-Apply) — siehe "Häufige Probleme" in Abschnitt 6. Lösung ist immer: `loadout.db*`-Dateien löschen, neu starten, Seed-Daten werden automatisch neu angelegt (keine echten Daten gehen verloren, da rein aus Code/Seed reproduzierbar).

Gleiches Muster gilt für `frontend/node_modules`: Wenn auf einem anderen PC neue npm-Abhängigkeiten zu `package.json` hinzugefügt wurden (z. B. `react-konva`), zeigt sich das nach `git pull` auf diesem Rechner als Vite-Fehler `Failed to resolve import "..."`. Lösung: `npm install` im `frontend`-Ordner erneut ausführen; falls Vite den Fehler danach noch aus dem Cache anzeigt, zusätzlich `frontend/node_modules/.vite` löschen und den Dev-Server neu starten.

---

## Inhaltsverzeichnis

1. [Projektidee](#1-projektidee)
2. [Technologie-Stack und Warum](#2-technologie-stack-und-warum)
3. [Architektur und Datenmodell](#3-architektur-und-datenmodell)
4. [Was bisher gebaut wurde](#4-was-bisher-gebaut-wurde)
5. [Setup auf einem neuen Rechner](#5-setup-auf-einem-neuen-rechner)
6. [Projekt starten (täglich)](#6-projekt-starten-täglich)
7. [Nächste Schritte](#7-nächste-schritte)

---

## 1. Projektidee

**Kernidee — das ist wichtig, damit niemand (auch kein zukünftiges KI-Assistenz-Ich) das Projekt versehentlich in die falsche Richtung weiterbaut:**

Dieser Konfigurator ist **kein Warenkorb-/Wishlist-Tool**. Sowas kann man auf jeder Airsoft-Shopseite bauen. Der eigentliche Zweck ist eine **visuelle Kompatibilitäts- und Optik-Prüfung**: Spieler sollen ihre Ausrüstung virtuell zusammenklicken und *sehen*, ob es passt —

- Hat dieser Plattenträger überhaupt genug Platz für diese Kombination aus Taschen?
- Wie sieht diese Optik montiert auf dieser bestimmten M4 aus?
- Wie wirkt dieser Griff an diesem Gewehr?
- Passt der Tan-Ton dieser Weste farblich zu dem der restlichen Ausrüstung?

Das ist eine Frage, die kein Shop beantwortet, weil dort jedes Produkt isoliert für sich steht. Hier soll man das **zusammengesetzte Ergebnis sehen**, bevor man wirklich kauft.

Praktisch heißt das: Komponenten (Westen, Waffen, Optiken, Pouches) aus einem Katalog wählen und per Drag & Drop auf einer 2D-Silhouetten-Canvas an echten Anbaupunkten (Slots) zusammensetzen — nicht nur in eine Liste packen. Die Item-Liste mit Gesamtgewicht/-preis (seit der IA-Überarbeitung 2026-07-30 eine schmale, dauerhaft sichtbare Randspalte im Canvas selbst, `LoadoutSidebar`, siehe Abschnitt 4) ist bewusst nur eine **Nebenfunktion** — nett zu haben, aber nicht der Grund, warum dieses Projekt existiert. Der Canvas-Konfigurator (Abschnitt 3 "Layered-Rendering-Konzept" und Abschnitt 7 "Mittelfristig") ist das eigentliche Produkt und seit derselben Überarbeitung auch die einzige Seite pro Loadout (`/loadout/:id`), nicht mehr hinter einer separaten Warenkorb-Zwischenseite versteckt.

**Warum 2D statt 3D?** 3D-Assets für Airsoft-Produkte gibt es nicht frei verfügbar. 2D-SVG-Silhouetten lassen sich in Inkscape/Figma selbst erstellen, sind leichtgewichtig, und passen besser zu react-konva (Canvas-Library).

**Warum echte Produkte im Seed?** Manuell kuratierte Daten (16 Produkte) sind schneller als Scraping, rechtlich sauber, und für die Entwicklung ausreichend präzise.

---

## 2. Technologie-Stack und Warum

### Backend: ASP.NET Core (.NET 10) + EF Core + SQLite

| Entscheidung | Begründung |
|---|---|
| .NET 10 | Aktuellste LTS-fähige Version, C# 13 Features |
| EF Core + SQLite | Zero-Config für Entwicklung; SQLite-DB liegt als einzelne Datei im Projektordner |
| SQLite → später PostgreSQL | SQLite reicht für Solo-Dev; EF Core macht DB-Wechsel auf Wunsch trivial |
| Record-Types für DTOs | Immutable, kein Boilerplate, perfekt für Request/Response-Objekte |
| Primary Constructors in Controllern | Modern C#, spart `private readonly`-Deklarationen |
| Direkte Package-Pins für `Microsoft.OpenApi` (2.11.0) und `SQLitePCLRaw.bundle_e_sqlite3` (2.1.12) im `.csproj` | Beheben transitive Sicherheitswarnungen (NU1903 / GHSA-v5pm-xwqc-g5wc, GHSA-2m69-gcr7-jv3q), die über `Microsoft.AspNetCore.OpenApi` bzw. `Microsoft.EntityFrameworkCore.Sqlite` reinkamen. Bewusst nur Patch-Versionen innerhalb der bestehenden Major-Version gewählt (kein Sprung auf `Microsoft.OpenApi` 3.x oder `SQLitePCLRaw` 3.x), um Breaking Changes zu vermeiden |

### Frontend: React 19 + TypeScript + Vite

| Entscheidung | Begründung |
|---|---|
| React 19 | Aktuell, großes Ökosystem |
| Vite 8 | Deutlich schneller als CRA, HMR out-of-the-box |
| TypeScript ~6 | Type-Safety, IDE-Support |
| CSS Modules | Scoped Styles ohne Framework-Overhead; kein Tailwind-Overhead |
| react-router-dom v7 | Verdrahtet für Multi-Page-Navigation (`/`, `/loadout/:id`) |
| react-konva | Geplant für Canvas/Drag&Drop — noch nicht installiert |

### Keine UI-Component-Library (kein MUI, kein shadcn)
Bewusste Entscheidung: Das militärische Darktheme mit den custom CSS-Variablen (`--bg`, `--accent`, `--surface` etc.) wäre mit einer vorgegebenen Library schwerer umzusetzen. Alles handgebaut.

---

## 3. Architektur und Datenmodell

```
frontend/ (React + Vite, Port 5173)
    └── /api/*  →  Vite-Proxy  →  backend (Port 5154)

backend/ (ASP.NET Core)
    └── LoadoutConfigurator.Api/
        ├── Models/          Datenbankentitäten
        ├── DTOs/            Request/Response-Records
        ├── Controllers/     REST-Endpunkte
        ├── Data/
        │   ├── LoadoutContext.cs    EF Core DbContext
        │   └── SeedData.cs         Auto-Seed beim Start
        └── Program.cs
```

### Datenmodell (vereinfacht)

```
Category         (plate-carrier, rifle, optic, pistol, pouch)
    └── Component    (reales, kaufbares Produkt — z.B. "Crye JPC 2.0", "TM MWS GBBR";
          │           Name, Manufacturer, WeightGrams, PriceEur)
          └── ComponentTemplate  (die visuelle/physische Form — SVG + Anbaupunkte;
                ├── Slot[]               Befestigungspunkte, die DIESES Template ANBIETET (X/Y-Position in %)
                │     └── AttachmentType  (molle, picatinny, gbb-mag-well, ...)
                ├── MountPoint[]         eigene Andockpunkte, mit denen DIESES Template SICH SELBST an einem
                │     └── AttachmentType  Slot eines anderen Templates befestigt (X/Y-Position in %, relativ
                │                         zur eigenen Silhouette) — z.B. die MOLLE-Straps auf der Rückseite
                │                         einer Tasche
                └── AcceptedAttachmentTypes[]  (n:m — welche Slot-Typen akzeptiert dieses Template; schnelle
                                                Typ-Prüfung ohne Positionsdaten, siehe 422-Check unten)

Loadout
    └── LoadoutItem[]
          ├── Component
          └── ParentSlot?   (optional: an welchem Slot befestigt)
```

**`ComponentTemplate` ✅ erledigt (2026-07-28):** trennt die visuelle/physische Form (SVG, `Slot`s, `MountPoint`s, `AcceptedAttachmentTypes`, `RealWidthMm`) von den Produktdaten des realen, kaufbaren Artikels (`Component`: Name, Manufacturer, WeightGrams, PriceEur, `ComponentTemplateId`). Grund: mehrere Hersteller können optisch/geometrisch identische Klone verkaufen (z.B. baugleiche Plattenträger unter verschiedenem Namen) — die sollen sich künftig ein einziges Template (ein SVG, ein Satz Slots) teilen können, statt Formdaten pro Produkt zu duplizieren. Aktuell ist es noch 1:1 (16 Components, 16 Templates), die n:1-Wiederverwendung ist vorbereitet, aber noch ungenutzt. Die öffentliche API-Form (`ComponentResponse`) bleibt bewusst flach (`slots`, `mountPoints`, `svgAssetPath`, `realWidthMm` weiterhin direkt am Component-JSON) — der Controller joint intern über das Template, das Frontend brauchte dadurch **keine** Änderungen.

**Wichtige Designentscheidungen:**
- `Slot` gehört einem `ComponentTemplate` und hat einen `AttachmentType` (z.B. Picatinny) — das ist die Anbieter-Seite ("was kann an mir befestigt werden")
- `MountPoint` gehört ebenfalls einem `ComponentTemplate`, ist aber die Empfänger-Seite ("wie/wo befestige ich mich an meinem Parent") — z.B. hat eine MOLLE-Tasche mehrere eigene MountPoints für ihre Straps, unabhängig von etwaigen eigenen `Slot`s, die sie selbst wieder anbietet (z.B. für ein Patch)
- `ComponentTemplate.AcceptedAttachmentTypes` sagt, an welchen Slot-Typen das Template grundsätzlich befestigt werden kann (Typ-Ebene)
- Beim Hinzufügen zu einem Loadout prüft der Server zweistufig: (1) passt `ComponentTemplate.AcceptedAttachmentTypes` zu `Slot.AttachmentTypeId`? (2) **Footprint-Match** ✅ erledigt (2026-07-27): passen alle `MountPoint`s des Templates auf zusammenhängende freie `Slot`s des Parents? Beides → 422 Unprocessable Entity bei Fehlschlag, siehe "Footprint-Matching" unten
- `Slot.PositionXPercent/YPercent` und `MountPoint.PositionXPercent/YPercent` sind für die ersten beiden Assets (Condor MOPC, BFG Ten-Speed) bereits echte, aus Figma exportierte Koordinaten (siehe Abschnitt 4 "Assets"); bei allen anderen Seed-Komponenten weiterhin Platzhalter. Werden nur fürs **Rendering** verwendet
- `Slot.GridColumn/GridRow` und `MountPoint.GridColumn/GridRow` (nullable) sind diskrete Rasterkoordinaten (z.B. MOLLE-Spalte/Reihe), unabhängig vom Prozent-Rendering. Werden fürs **Footprint-Matching** verwendet — siehe Begründung unten
- `ComponentTemplate.RealWidthMm` (nullable) ist ein reales Referenzmaß in mm — seit 2026-07-28 aus dem MOLLE-Gitterabstand jedes Assets berechnet statt aus Datenblättern geschätzt (siehe "Gemeinsamer Maßstab" weiter unten in diesem Abschnitt). Wird fürs **relative Größenverhältnis im Canvas** verwendet

### Footprint-Matching (Server-seitige Platzierungsprüfung)

Eine Komponente mit mehreren `MountPoint`s (z.B. die BFG Ten-Speed Pouch mit ihrem 2×4-MOLLE-Raster) braucht beim Andocken nicht nur einen passenden Slot-Typ, sondern ein ganzes zusammenhängendes Muster freier Slots am Parent, in derselben relativen Anordnung. Das würde man naiv über die Prozent-Positionen (`PositionXPercent/Y`) zu lösen versuchen — das geht aber nicht robust, weil diese Prozentwerte relativ zur jeweils eigenen SVG-Leinwand der Komponente sind und zwischen unterschiedlichen Assets nicht direkt vergleichbar sind (siehe den offenen "gemeinsamer Maßstab"-Punkt in Abschnitt 7); außerdem würden reale Pixel-Positionen selbst bei gleichem Maßstab nie exakt übereinstimmen und bräuchten eine Toleranzschwelle.

Stattdessen läuft das Matching über die neuen **diskreten Rasterkoordinaten** `GridColumn`/`GridRow`, die direkt aus der ohnehin schon vergebenen Figma-Namenskonvention (`Slot{Spalte}_MOLLE_Row{Reihe}`) stammen:

1. Anker-`MountPoint` der anzudockenden Komponente bestimmen (kleinste Row, dann kleinste Column)
2. Für jeden weiteren `MountPoint`: relatives Delta (ΔSpalte, ΔReihe) zum Anker berechnen, auf den angeklickten Parent-Slot draufaddieren, prüfen ob dort ein `Slot` mit passendem `AttachmentType` existiert
3. Existiert einer der berechneten Slots nicht → 422 ("passt hier nicht hin")
4. Alle berechneten Slots gegen bereits belegte Slots der Geschwister-Items prüfen (rekursiv über deren eigene Footprints berechnet, keine eigene Belegungs-Tabelle nötig) → 422 bei Überlappung ("schon belegt")
5. Komponenten ohne `MountPoint`s (die meisten Seed-Komponenten) fallen auf das bisherige Einzel-Slot-Verhalten zurück — als Nebeneffekt jetzt ebenfalls gegen Doppelbelegung eines einzelnen Slots abgesichert, was vorher nicht geprüft wurde
6. Implementiert in `LoadoutsController.ComputeFootprint` / `ComputeOccupiedSlotIds` / `ValidateFootprint`, für `AddItem` und `MoveItem`
7. Getestet über die API (Überlappung, Raster-Rand in beide Richtungen, nicht-überlappende Zweitplatzierung, Einzel-Slot-Komponenten)

**Frontend-Spiegelung ✅ erledigt (2026-07-27):** Dieselbe Footprint-Berechnung läuft auch im Canvas (`frontend/src/components/canvas/footprint.ts`, `computeFootprintSlotIds` — bewusst dieselbe Grid-Logik wie serverseitig, keine eigene Wahrheit). `CanvasNode` markiert damit alle von einer platzierten Komponente belegten Slots (nicht nur den Anker) als ausgegraut und nicht klickbar (`SlotMarker`-Prop `occupied`), statt sie fälschlich als frei anzuzeigen. Mit Playwright verifiziert: Klick auf einen belegten Nicht-Anker-Slot öffnet den Picker nicht mehr.

### Layered-Rendering-Konzept für den Canvas-Konfigurator (geplant, siehe Abschnitt 7)

So soll die eigentliche Kernfunktion (siehe Abschnitt 1) technisch funktionieren, sobald echte SVG-/Slot-Daten vorliegen:

1. Eine Basis-Komponente (z.B. Plattenträger, Gewehr) wird als SVG auf die Canvas gelegt.
2. Ihre `Slot`-Punkte (`PositionXPercent/Y`) markieren Anbaustellen auf dieser Silhouette.
3. Zieht man eine kompatible Komponente auf einen Slot, wird deren SVG passgenau an dieser Position eingeblendet — nicht als Icon in einer Liste, sondern als echtes zusammengesetztes Bild.
4. Das ist **rekursiv**: `LoadoutItem.ParentSlotId` verweist auf einen Slot, egal wie tief verschachtelt — eine Tasche kann selbst wieder eigene Slots haben (z.B. für einen Patch), eine Rail selbst wieder für eine Optik.
5. Die 422-Kompatibilitätsprüfung (Typ-Ebene) UND die **Footprint-Prüfung** (Geometrie-Ebene, `ComponentTemplate.MountPoints` gegen zusammenhängende freie `Slot`s des Parents) sind beide ✅ erledigt (2026-07-27), siehe Abschnitt 3 "Footprint-Matching" und Abschnitt 4 "Frontend".

**Colorway-Umschalter ✅ erledigt (2026-07-27):** Jede Komponente ist als einfarbige Silhouette angelegt (ein einziger `fill`-Hex-Wert für den Körper, siehe `frontend/public/components/*.svg`). Da Konva SVGs als rasterisierte Bitmaps zeichnet (`use-image`), lässt sich die Farbe nicht nachträglich per CSS/Filter auf dem fertigen Bild ändern — stattdessen holt `frontend/src/components/canvas/recolorSvg.ts` den SVG-Quelltext, ersetzt den `fill`-Wert per Text-Replace und lädt das Ergebnis als neuen Blob. `ComponentSprite` bekommt dafür einen `colorway`-Prop, der rekursiv durch `CanvasNode` durchgereicht wird, sodass ein einziger globaler Umschalter (`CanvasView`, Palette in `colorways.ts`: Ranger Green, Coyote Tan, Black, Original) das komplette zusammengebaute Loadout auf einmal umfärbt — beantwortet direkt die "passt der Tan-Ton"-Frage aus Abschnitt 1. Eine echte Multicam-Option (Muster statt Vollfarbe) geht mit diesem Text-Replace-Ansatz nicht, nur solide Farben. Mit Playwright verifiziert (alle 3 Farben + zurück zu Original, beide platzierten Komponenten färben synchron um).

### Gemeinsamer Maßstab — Teil 1 (relative Größe) ✅ erledigt (2026-07-27), Teil 2 (MOLLE-Pitch-Methode) ✅ erledigt für Raster-Assets (2026-07-28)

Das "Maßstab"-Thema hat zwei unabhängige Teile:

1. **Relative Größe zwischen Komponenten** (ein Gewehr soll größer wirken als eine Pistole) — löst rein die Anzeigegröße im Canvas, keine Positions-/Geometrieprüfung betroffen.
2. **Exakte geometrische Übereinstimmung** (passt das MOLLE-Raster der Pouch pixelgenau auf das Raster des Plattenträgers) — geht nicht direkt im Code, weil jede Figma-Datei einen beliebigen eigenen internen Maßstab hat, und die Assets ohnehin nur nachgezeichnet (nicht real vermessen) sind.

Für Teil 1 wurde `ComponentTemplate.RealWidthMm` eingeführt (reales Referenzmaß in mm). `frontend/src/components/canvas/scale.ts` rechnet das über eine feste `PX_PER_MM`-Konstante (`1.4`, historisch auf den inzwischen gelöschten Condor MOPC kalibriert — der eigentliche Zahlenwert ist beliebig, nur die *Relation* zwischen Komponenten zählt) in eine Anzeigebreite um — sowohl für Root-Komponenten (`CanvasView`) als auch für rekursiv angehängte Kind-Komponenten (`CanvasNode`, ersetzt die bisher fixe `CHILD_DISPLAY_WIDTH`). Komponenten ohne `RealWidthMm` fallen auf feste Pixelwerte zurück.

**Teil 2 — Lösung über MOLLE-Gitterabstand statt Konvention:** Ursprünglich war hierfür eine Maßstabs-Konvention des Projektinhabers geplant (z.B. "1 Figma-Einheit = 1 mm" in jeder neuen Datei). Stattdessen (Idee des Projektinhabers, 2026-07-28): reales PALS/MOLLE-Webbing hat eine MIL-SPEC-genormte Rastergröße, unabhängig vom Hersteller — Reihenabstand ≈ 25,4mm (1"), Spaltenabstand (Bartack-Abstand innerhalb einer Reihe) ≈ 38,1mm (1,5"). Da für jedes Asset mit MOLLE-Raster ohnehin `GridColumn`/`GridRow` + `PositionXPercent/Y` für jeden Slot/MountPoint vorliegen, lässt sich der tatsächliche Pixel-Abstand zwischen benachbarten Rasterpunkten messen und gegen diese physikalische Konstante rechnen → `RealWidthMm` ergibt sich direkt aus der Grafik selbst, ohne Konvention, ohne Datenblatt-Schätzung:

- **JPC Plate Carrier**: Spalten-Pitch ≈108px → `RealWidthMm` via Spalten-Pitch ≈381mm; Reihen-Pitch ≈68px (Übergang Brust→Torso-Zone bewusst ausgeschlossen, das ist eine Design-Lücke, kein MOLLE-Reihenabstand) → via Reihen-Pitch ≈403mm. Gemittelt: **392mm**.
- **Open Fast Mag Pouch**: Spalten-Pitch ≈176px → ≈84mm; Reihen-Pitch ≈119px → ≈83mm. Gemittelt: **84mm**.

Die ~5%ige Abweichung zwischen Spalten- und Reihen-Schätzung pro Asset ist erwartbar, da die Assets nachgezeichnet und nicht real vermessen sind — für eine visuelle Fit-Check-Anwendung (keine CAD-Präzision nötig) ist das ausreichend genau. Sichtbarer Effekt: der Plattenträger (vorher ohne `RealWidthMm`, Fallback 380px) rendert jetzt satt größer (392mm × 1.4 ≈ 549px), die Pouch bleibt nahezu gleich groß (84mm vs. vorher geschätzte 80mm) — behebt genau das vom Projektinhaber beobachtete Problem ("Plattenträger zu klein, Pouch zu groß"). Mit Playwright verifiziert.

**Einschränkung:** Funktioniert nur für Komponenten mit MOLLE-Raster (`GridColumn`/`GridRow` gesetzt). Gitterlose Komponenten (Gewehre, Optiken, o.ä.) bräuchten weiterhin eine Schätzung aus Datenblättern, sobald sie zurück in den Katalog kommen — aktuell kein Problem, da beide verbliebenen Produkte ein MOLLE-Raster haben. Das Footprint-Matching selbst war von "Teil 2" nie betroffen (läuft immer schon über Rasterkoordinaten, nicht über Pixel/Prozent, siehe "Footprint-Matching" oben) — hier ging es ausschließlich um die visuelle Anzeigegröße.

Neuer Standard-Schritt im Asset-Import-Workflow (siehe Abschnitt 4 "Assets"): `RealWidthMm` aus dem MOLLE-Gitterabstand der Grafik berechnen, statt aus einem Hersteller-Datenblatt zu schätzen.

### Seed-Daten (2 echte Produkte) ✅ aufgeräumt (2026-07-28)

Die bisherigen 16 Seed-Komponenten waren größtenteils geratene Platzhalter ohne echtes Asset (falsche/erfundene Gewichte, Preise, Hersteller). Auf Wunsch des Projektinhabers komplett geleert und durch nur die Einträge ersetzt, die ein echtes, aus Figma stammendes Asset haben:

| Kategorie | Produkt | Status |
|---|---|---|
| Plate Carrier | JPC Plate Carrier | generisches Template für leichte Plattenträger, SVG + 52 MOLLE-Slots vorhanden, Name/Manufacturer/Gewicht/Preis bewusst generisch (kein reales Produkt dahinter) |
| Pouch | Open Fast Mag Pouch | generisches Template für offene Fast-Mag-artige Pouches (vormals "BFG Ten-Speed M4 Pouch" — Asset, MountPoints und Grid-Daten unverändert, nur Name/Datei/Produktdaten generalisiert) |

`Category`- und `AttachmentType`-Stammdaten (Plate Carrier/Rifle/Pistol/Optic/Pouch bzw. MOLLE/Picatinny/M-LOK/QD-Sling) bleiben bewusst vollständig erhalten, auch ohne Produkte in jeder Kategorie — das ist Taxonomie, kein Platzhalter, und wird für künftige echte Assets wieder gebraucht.

`Component.Manufacturer` ist dabei von `required string` auf `string?` umgestellt worden (Migration `MakeManufacturerOptional`), da generische Templates keinen Hersteller haben. `WeightGrams`/`PriceEur` waren schon vorher nullable.

---

## 4. Was bisher gebaut wurde

### Backend (vollständig)

- [x] EF Core Datenbankschema mit Auto-Migration beim Start
- [x] Auto-Seed mit echten Produkten (idempotent — läuft nicht doppelt); seit 2026-07-28 bewusst auf 2 Einträge reduziert, siehe Abschnitt 3 "Seed-Daten"
- [x] CRUD-Endpunkte für: `Categories`, `Components`, `AttachmentTypes`, `Slots`, `Loadouts`
- [x] Loadout-Items: hinzufügen, entfernen, mit Kompatibilitätsprüfung (422 bei Mismatch)
- [x] Share-Token: `GET /api/loadouts/share/{guid}` — öffentlicher Lesezugriff
- [x] CORS konfiguriert für `http://localhost:5173`
- [x] Bekannte NuGet-Sicherheitswarnungen (NU1903) behoben, siehe Tabelle in Abschnitt 2
- [x] `ComponentTemplate` eingeführt (2026-07-28): Visuals/Slots/MountPoints/AcceptedAttachmentTypes von den Produktdaten (`Component`) entkoppelt, siehe Abschnitt 3. Migration `IntroduceComponentTemplates`, lokale `loadout.db` dafür neu geseedet (Dev-Only-Datenverlust, kein produktiver Bestand betroffen)

**Alle API-Routen:**
```
GET/POST        /api/categories
GET/PUT/DELETE  /api/categories/{id}

GET/POST        /api/components          (?categoryId=X zum Filtern)
GET/PUT/DELETE  /api/components/{id}

GET/POST        /api/attachmenttypes
GET/PUT/DELETE  /api/attachmenttypes/{id}

GET/POST        /api/slots               (?componentTemplateId=X zum Filtern)
GET/PUT/DELETE  /api/slots/{id}

GET/POST        /api/loadouts
GET/PUT/DELETE  /api/loadouts/{id}
GET             /api/loadouts/share/{token}
POST            /api/loadouts/{id}/items
PUT             /api/loadouts/{id}/items/{itemId}
DELETE          /api/loadouts/{id}/items/{itemId}
```

### Assets (erster echter Plattenträger)

- [x] Erstes Figma-Asset: Plattenträger "Condor MOPC" mit 36 benannten MOLLE-Attachment-Points (`Slot{Spalte}_MOLLE_Row{Zeile}`, 6×6-Raster)
- [x] Figma-API-Anbindung getestet (Token + File-Key in `.env`, nicht eingecheckt) — Datei ausgelesen, Artwork-Layer separat als SVG exportiert (Slot-Marker-Ellipsen bewusst ausgeschlossen, nur zur Koordinaten-Extraktion genutzt)
- [x] Kombiniertes SVG unter `frontend/public/components/condor-mopc.svg` (Hauptsilhouette + MOLLE-Webbing-Layer, passgenau positioniert)
- [x] `SeedData.cs`: Condor MOPC hat jetzt `SvgAssetPath` gesetzt und alle 36 echten Slot-Koordinaten (in % relativ zur Figma-Frame-BoundingBox) statt der bisherigen Platzhalter-Werte
- [x] Visuell verifiziert (Silhouette + Slot-Punkte deckungsgleich)
- [x] Zweites Asset: "BFG Ten-Speed M4 Pouch" aus eigener Figma-Datei "M4 Pouch MVP" (eigener File-Key) — hat KEINE eigenen `Slot`s, sondern 8 `MountPoint`s (2×4 MOLLE-Straps, mit denen sie sich selbst am Plattenträger befestigt); dafür wurde die neue `MountPoint`-Entität eingeführt (Model, Migration `AddMountPoints`, DTO, Controller, Frontend-Types), siehe Abschnitt 3 für die Modellierung
- [x] SVG war unter `frontend/public/components/bfg-tenspeed.svg`, visuell verifiziert — am 2026-07-28 zu `open-fast-mag-pouch.svg` umbenannt (siehe unten, Produkt generalisiert)
- [x] Drittes Asset ✅ (2026-07-28): "JPC Plate Carrier" aus Figma-Datei `Oj2mnCJzmOD1h7D7LnkNZo` — generisches Template für leichte Plattenträger, 52 MOLLE-Slots (4 Spalten × Reihen 1-4 im Brustbereich, 6 Spalten × Reihen 5-10 im Torso). Marker-Namenskonvention auf diesem Asset ist `MOLLE_Slot{Spalte}_Row{Reihe}` (Reihenfolge vertauscht ggü. Condor MOPCs `Slot{Spalte}_MOLLE_Row{Reihe}`) — Namenskonvention ist also **nicht** projektweit fix, beim nächsten Asset immer den tatsächlichen Namen im Figma-Baum prüfen statt das alte Muster anzunehmen. SVG unter `frontend/public/components/jpc-plate-carrier.svg`, visuell verifiziert (alle 52 Punkte sitzen sauber auf den MOLLE-Reihen)

**Wichtige Lektion 2026-07-28 — Figma-API-Kontingent:** Der Figma-Account läuft auf dem **Starter-Plan** (`x-figma-plan-tier: starter`, `x-figma-rate-limit-type: low`). Nach den Abrufen für die ersten Assets war das Kontingent wiederholt erschöpft — zuletzt am 2026-08-01 mit `Retry-After: 352202` (**~4,1 Tage**!) bereits nach dem ersten `/v1/files`-Aufruf einer neuen Session. Entscheidung des Projektinhabers (2026-08-01): **die Figma-REST-API wird gar nicht mehr verwendet** — auch nicht für Koordinaten. Alle Attachment-Point-Positionen werden ab jetzt direkt aus dem exportierten SVG gelesen (siehe Workflow unten).

**Gotcha beim manuellen Export:** Das aus der Figma-App exportierte SVG enthält die Marker-Ellipsen mit, gefüllt in derselben Farbe wie die Silhouette (`fill="#D9D9D9"` o.ä.). Vor dem Einsatz als `SvgAssetPath` müssen alle `<ellipse ...>`-Tags aus der Datei entfernt werden (sonst zeichnet die App eigene interaktive `SlotMarker`-Punkte UND die eingebrannten Ellipsen übereinander). Die Koordinaten kommen jetzt ebenfalls aus dem SVG selbst — `cx`/`cy`-Attribute der Ellipsen, relativ zur `viewBox`.

**Zweiter Gotcha, gefunden 2026-07-28:** Der erste manuelle Export von `jpc-plate-carrier.svg` enthielt nur 50 statt 52 MOLLE-Webbing-Steg-Pfade. Direkt im SVG gepatcht (fehlende Pfade aus geometrisch identischen Nachbar-Stegen abgeleitet). Für zukünftige Re-Exports **muss dieser Patch erneut angewendet werden**.

**Dritter Gotcha, gefunden 2026-07-30:** `jpc-plate-carrier.svg` enthielt nach Re-Export noch alle 52 `<ellipse>`-Tags — optisch unsichtbar weil gleiche Füllfarbe, aber Verstoß gegen das Rezept. Entfernt mit `sed -i '/<ellipse /d'`. **Lektion:** nach jedem Export aktiv auf `<ellipse>`-Tags grep(p)en.

**Workflow für weitere Assets (aktualisiertes Rezept, Stand 2026-08-01 — kein Figma-API-Aufruf mehr):**
1. Attachment-Points in Figma als Ellipsen auf der Silhouette platzieren (werden beim SVG-Export mitgenommen)
2. Vorab klären: bietet die Komponente diese Punkte an (→ `Slot`) oder befestigt sie sich selbst damit (→ `MountPoint`)? Beides gleichzeitig ist möglich
3. SVG manuell aus der Figma-App exportieren (Artwork-Layer + Ellipsen-Layer markieren → Export-Panel) und unter `frontend/public/components/<kebab-name>.svg` ablegen
4. Ellipsen-`cx`/`cy` aus dem SVG lesen, relativ zur `viewBox`-Breite/-Höhe in Prozent umrechnen → `PositionXPercent/Y`
5. `<ellipse ...>`-Tags aus der SVG-Datei entfernen (grep prüfen, dann manuell oder per sed)
6. `RealWidthMm` aus dem MOLLE-Zeilenabstand berechnen: Pixel-Abstand zwischen benachbarten Reihen messen, gegen 25,4mm (MOLLE-Standard) aufrechnen → Gesamtbreite in mm (siehe Abschnitt 3 "Gemeinsamer Maßstab")
7. `SvgAssetPath` + Slots/MountPoints + `RealWidthMm` im `SeedData.cs` eintragen, DB-Dateien löschen und neu seeden lassen

Wenn keine Ellipsen im SVG vorhanden sind (z.B. weil der Export nur die Artwork-Layer enthält), können die Positionen alternativ aus den visuellen Geometrie-Elementen im SVG abgeleitet werden — z.B. Mittelpunkte der MOLLE-Connector-Bar-Clips (so gemacht für `m4-fast-mag-pouch.svg`, 2026-08-01).

### Frontend (Canvas-Konfigurator im Zentrum, Warenkorb nur Nebenfunktion — siehe IA-Überarbeitung 2026-07-30 weiter unten)

- [x] Vite-Proxy: `/api/*` → `http://localhost:5154` (kein CORS-Problem im Dev)
- [x] TypeScript API-Client (`src/api/index.ts` + `src/api/types.ts`)
- [x] Dunkles Militärtheme (CSS-Variablen in `index.css`)
- [x] `CategoryNav` — Kategoriefilter, heute nur noch im Katalog-Panel von `CanvasView` verwendet
- [x] App-Shell (Topbar + Body-Layout)
- [x] React-Router-DOM aktiviert, aktuell nur zwei Routen: `/` → `LoadoutsPage`, `/loadout/:id` → `CanvasView` (siehe IA-Überarbeitung unten — `ComponentBrowser`, `LoadoutBuilder` und `LoadoutSwitcher` samt ihren Routen existieren nicht mehr)
- [x] **Canvas-Grundgerüst** (`react-konva` + `konva` + `use-image` installiert) — `CanvasView`, seit der IA-Überarbeitung die alleinige Seite pro Loadout unter `/loadout/:id` (vorher unter einer eigenen `/loadout/:id/canvas`-Route neben einer separaten Listenansicht), siehe Abschnitt 1 + 3 für die Kernvision:
  - Basis-Komponente (`parentSlotId === null`) wird als SVG-Sprite gerendert (`ComponentSprite`), ihre `Slot`s als Marker (`SlotMarker`) an den echten Prozent-Positionen
  - Rekursion: bereits angehängte Kind-Items werden automatisch an der Pixel-Position ihres Parent-Slots gerendert und zeigen wiederum ihre eigenen Slots (`CanvasNode`, rekursiv) — funktioniert beliebig tief, ungetestet über 2 Ebenen hinaus
  - Footprint-Belegung (Abschnitt 3) ist visuell gespiegelt: von einer mehrpunktigen Komponente belegte Slots sind ausgegraut, nicht nur der Anker-Slot
  - Kind-Komponenten werden aktuell in fester Pixelgröße gerendert (`CHILD_DISPLAY_WIDTH` in `CanvasNode.tsx`), da verschiedene Figma-Assets noch nicht auf einen gemeinsamen realen Maßstab bezogen sind
- [x] **Drag & Drop** ✅ erledigt (2026-07-27) — Klick-zu-Platzieren komplett ersetzt: `CanvasView` hat ein persistentes Katalog-Panel (`CategoryNav` + ziehbare Komponenten-Karten), das per Drop auf die Konva-Stage die nächstgelegene freie Slot-Position trifft. **Wichtig:** läuft über reine Maus-Events (`mousedown`/`mousemove`/`mouseup`), nicht natives HTML5-DnD — Letzteres war über einem `<canvas>`-Element browserübergreifend unzuverlässig, siehe Nachtrag weiter unten
  - `CanvasNode` meldet die absoluten Pixel-Positionen aller (auch verschachtelten) Slots per `onSlotsComputed`-Callback nach oben an `CanvasView`, das darüber die nächstgelegene freie Slot-ID zum Drop-Punkt sucht (kein Konva-Hit-Testing nötig, robuster gegenüber der kleinen Klickfläche der Slot-Punkte)
  - Fehlerfälle geben verständliches Feedback: kein Slot in Reichweite ("No attachment slot near where you dropped that") bzw. die 422-Fehlermeldung vom Server bei Typ-/Footprint-Mismatch
  - End-to-end mit Playwright verifiziert: erfolgreiche Platzierung, Drop ohne nahen Slot, Drop einer inkompatiblen Komponente — alle drei Fälle verhalten sich korrekt, keine Konsolenfehler
- [x] **Item-Liste + Verschieben/Löschen direkt im Canvas** ✅ erledigt (2026-07-27):
  - `LoadoutSidebar` (dieselbe Komponente wie in der Listenansicht) wird jetzt auch in `CanvasView` angezeigt — Items samt Gesamtgewicht/-preis sichtbar, ohne zur Listenansicht wechseln zu müssen
  - Platzierte Sprites sind klickbar (Auswahl: grüner Rahmen + roter ×-Button) und per Konva-eigenem `draggable`/`onDragEnd` verschiebbar — Andocken an einen anderen Slot oder Ablegen im Leerraum zum Lösen als eigenständiges Item, über denselben Nächster-Slot-Algorithmus wie beim Hinzufügen (aber: eigene aktuell belegte Slots zählen dabei nicht als "besetzt")
  - Dabei einen bisher nie ausgelösten Backend-Bug gefunden: `MoveItem` (PUT-Endpoint) lud `Component.Category` nicht mit, obwohl `ToItemResponse` darauf zugreift — jeder Move-Aufruf wäre mit NullReferenceException abgestürzt. Behoben (fehlendes `.Include` ergänzt)
  - Sprite-Drag nutzt Konvas eigenes `draggable` (rein Canvas-intern, keine Cross-DOM-Problematik wie beim Katalog-Drag) und springt beim `onDragEnd` sofort auf die durch Props kontrollierte Position zurück, damit die Anzeige nie von der Server-Wahrheit abweicht, während die Anfrage läuft
  - Mit Playwright verifiziert: Liste zeigt/entfernt Items korrekt, Auswahl zeigt Rahmen+Button, Verschieben funktioniert, Löschen über den Canvas-Button funktioniert
- [x] **Render-Reihenfolge in `CanvasNode` zweimal nachgebessert** (2026-07-27):
  - Erster Fix: Ein Slot, der durch das Footprint einer *anderen* Komponente belegt ist, darf sein graues "belegt"-Overlay nicht über deren Sprite zeichnen — sonst scheinen graue Punkte durch platzierte Objekte durch (auffällig bei mehreren Pouches nebeneinander)
  - Das brachte eine Regression: die eigenen Marker EINER Komponente rutschten dabei versehentlich komplett vor ihr eigenes Sprite, wodurch ein frisch platzierter Plattenträger gar keine sichtbaren Slot-Punkte mehr hatte (vom Projektinhaber sofort bemerkt)
  - Richtige Reihenfolge jetzt: eigenes Sprite → eigene Marker (auf dem Sprite sichtbar) → Auswahl-UI → Kind-Komponenten (decken die Marker ab, die zu ihrem eigenen Footprint gehören). Mit Playwright für beide Fälle gegengetestet (leerer Plattenträger zeigt alle 36 Punkte, angehängte Pouch verdeckt weiterhin sauber ihre 8)
- [x] **Kein Flackern/Verschwinden mehr bei Hinzufügen/Verschieben/Löschen** ✅ erledigt (2026-07-27) — `reload()` setzte bisher bei jedem Aufruf `loading=true`, was Stage UND Item-Liste kurz komplett durch einen Ladetext ersetzte (sichtbar als ca. 1 Sekunde langes "alles weg"). Ein `hasLoadedOnce`-Ref sorgt jetzt dafür, dass nur der allererste Seitenaufruf den Ladezustand zeigt — spätere Reloads aktualisieren die bestehenden Komponenten live, ohne dass Stage oder Liste unmounten. Mit künstlich verzögerter API-Antwort (2s) verifiziert: Canvas bleibt während des Nachladens durchgehend sichtbar
- [x] **Live-Highlight des Ziel-Slots beim Katalog-Drag** ✅ erledigt (2026-07-28) — vorher erfuhr man erst nach dem Loslassen (Fehlermeldung), ob man nah genug an einem Slot war; jetzt wird während des Drags kontinuierlich der nächstgelegene freie Slot innerhalb `DROP_SNAP_DISTANCE` ermittelt und farblich markiert (cyan = kompatibel, rot = falscher Attachment-Type), analog zur bestehenden `placeComponent`-Logik in `CanvasView`
  - Der eigentliche Konva-`SlotMarker`-Ring (`hover`-Prop) wird beim Testen mit Playwright-Screenshots aber vom Katalog-Drag-Ghost (einem separaten, undurchsichtigen HTML-Overlay mit `z-index: 100`, das der Maus folgt) komplett verdeckt, sobald man nah genug am Slot ist — die eigentliche Zielposition liegt ja direkt unter dem gezogenen Bild
  - Lösung: zusätzlich einen Glow (`box-shadow`) direkt auf `dragGhostImageWrap` selbst legen, abhängig vom selben Kompatibilitäts-Flag — das Feedback sitzt damit auf dem Element, das man beim Ziehen tatsächlich ansieht, statt auf einem verdeckten darunterliegenden Punkt
  - Mit Playwright verifiziert (Screenshot mit `clip` um den Anker-Punkt während des laufenden Drags): Glow erscheint korrekt bei Annäherung an einen kompatiblen Slot, verschwindet vollständig sobald die Maus die Stage verlässt, End-to-End-Drop funktioniert weiterhin fehlerfrei, keine Konsolenfehler
- **Vollständige Footprint-Vorschau beim Katalog-Drag** ✅ erledigt (2026-07-30) — die bisherige Live-Hervorhebung (siehe oben) markierte nur den einen Anker-Slot unter dem Cursor; bei mehrpunktigen Komponenten (z.B. die Pouch mit ihren 8 MOLLE-MountPoints) blieb unsichtbar, welche der ÜBRIGEN 7 Ziel-Slots am Plattenträger dadurch belegt würden. Auf Wunsch des Projektinhabers erweitert: `footprint.ts` bekam `computeFootprintPreview` (exportiert jetzt auch `getAnchorMountPoint`) — dieselbe Grid-Delta-Logik wie `computeFootprintSlotIds`, aber pro Mount-Point statt alles-oder-nichts, damit auch ein *teilweiser* Konflikt sichtbar wird (manche Slots frei/cyan, andere belegt/rot), statt nur ja/nein für das Ganze
  - `CanvasNode.DropCandidate` führt jetzt `gridColumn`/`gridRow` sowie eine Referenz auf `parentSlots` (das komplette `component.slots`-Array des Elternteils) mit, damit `CanvasView` beim Hover die volle Slot-Liste hat, gegen die sich der Footprint der gezogenen Komponente matchen lässt
  - `hoveredSlotId`/`hoveredSlotCompatible` (Einzel-Slot) wurden durch `hoveredSlots: Map<number, boolean>` (Slot-ID → kompatibel) ersetzt, durchgereicht durch `CanvasNode` wie zuvor
  - **Wichtiger Fund während der Umsetzung:** dieselbe Okklusion wie beim ursprünglichen Einzel-Slot-Highlight trat wieder auf — die Ziel-Slots liegen per Definition genau dort, wo der gezogene Drag-Ghost sowieso schon sichtbar ist, und wurden vom opaken Ghost-Bild komplett verdeckt. Lösung diesmal: statt (wie beim Einzel-Slot) den Ghost selbst leuchten zu lassen, wird ein *zweites*, unsichtbares HTML-Overlay (`.footprintOverlay`, `z-index: 150`, höher als der Ghost mit `z-index: 100`) über die Stage gelegt, das für jeden betroffenen Slot einen eigenen farbigen Punkt an dessen tatsächlicher Bildschirmposition zeichnet (aus `slotPositions` + `stageWrapRef`-BoundingRect) — dadurch bleiben alle Punkte einzeln sichtbar und farblich unterscheidbar, statt nur ein einziger Gesamt-Glow
  - Der Ghost-Glow selbst (cyan/rot) bleibt zusätzlich erhalten, zeigt aber jetzt den Gesamtstatus: rot sobald auch nur einer der Footprint-Slots nicht passt oder belegt ist, sonst cyan
  - Mit Playwright verifiziert: (1) volle 8-Slot-Vorschau beim Andocken der Pouch an eine freie Stelle, alle 8 cyan; (2) ein absichtlich in eine Konfliktzone (teilweise mit einer schon platzierten Pouch überlappend) gezogener zweiter Drop zeigt korrekt eine Mischung aus 4 cyan (frei) und 4 roten (belegt) Punkten, Ghost-Glow wechselt auf rot; (3) Verlassen der Stage räumt alle Punkte zuverlässig weg
- **Eigene MountPoints wieder sichtbar beim Verschieben eines bereits platzierten Items** ✅ erledigt (2026-07-30) — der Katalog-Drag-Ghost zeigt seit dem "Zweiter Nachtrag" (siehe Abschnitt 7) schon immer alle eigenen MountPoints der gezogenen Komponente (die kleinen weißen Punkte, z.B. die 8 MOLLE-Straps der Pouch). Nimmt man aber eine BEREITS platzierte Pouch wieder vom Plattenträger auf, um sie woanders hinzusetzen, läuft das über eine ganz andere Code-Schiene (`ComponentSprite`s natives Konva-`draggable`, nicht das HTML-Ghost-System für Katalog-Drags) — dort fehlten diese Punkte bislang komplett, auf Wunsch des Projektinhabers nachgezogen
  - `ComponentSprite` bekam `onDragStart`/`onDragMove`-Durchreichungen (vorher nur `onDragEnd`); `CanvasNode` hält jetzt einen `dragPos`-State, der genau während eines aktiven Sprite-Drags die Live-Position mitführt (sonst `null`)
  - Neuer Render-Block direkt nach dem eigenen Sprite: `component.mountPoints` als kleine Konva-`Circle`s (gleiche Optik wie die `.dragGhostMountDot` im HTML-Ghost: helles Grau, dunkler Rand) an `dragPos + mountPoint-Prozentposition`, nur solange `dragPos` gesetzt ist — verschwinden also wieder, sobald der Drag endet oder abgebrochen wird. Komponenten ohne eigene MountPoints (z.B. der Plattenträger selbst, der ja nirgends andockt) zeigen dabei konsequent nichts
  - Mit Playwright verifiziert: Pouch platzieren, erneut aufnehmen und an eine neue Stelle ziehen — alle 8 Punkte erscheinen sofort beim Aufnehmen und folgen dem Sprite live mit, keine Konsolenfehler
- **Verschieben eines platzierten Items jetzt konsistent mit der Erstplatzierung** ✅ erledigt (2026-07-30, direkt im Anschluss an obigen Punkt) — der Projektinhaber bemerkte zwei verbleibende Lücken zur Katalog-Drag-Erfahrung: (1) die Footprint-Vorschau (cyan/rot auf dem Plattenträger) fehlte beim Verschieben komplett, obwohl sie beim Ziehen aus dem Katalog schon längst existierte; (2) der grüne Auswahlrahmen + rote ×-Löschen-Gruppe blieben starr an der alten Position stehen, während der Sprite selbst live unter dem Cursor mitwanderte — der Rahmen "löste sich" sichtbar vom Objekt
  - Ursache für (1): Die Footprint-Vorschau-Logik (`findNearestFreeSlot` + Footprint-Berechnung) steckte bisher nur im `window`-Mousemove-Handler für den HTML-basierten Katalog-Drag — der Sprite-Move-Pfad läuft komplett separat über Konvas eigenes natives `draggable`, das diese Handler nie durchläuft. Behoben durch Extraktion einer gemeinsamen `computeHoverSlots(component, stageX, stageY, excludeItemId?)`-Funktion in `CanvasView`, die jetzt aus **beiden** Drag-Pfaden aufgerufen wird — neu für den Move-Pfad über eine `onItemDragMove`-Prop-Kette (analog zu `onItemDragEnd`, aber bei jedem `dragmove`/`dragstart` statt nur am Ende), die von `CanvasNode` bis zur gezogenen Komponente durchgereicht wird. `excludeItemId` sorgt dafür, dass ein Item beim Verschieben seine eigenen aktuell belegten Slots als "frei genug zum Zurücklegen" behandelt — genau wie es `moveExistingItem` beim tatsächlichen Drop schon immer tat, jetzt aber auch konsistent in der Live-Vorschau
  - Ursache für (2): `Rect`/`Group` für Auswahlrahmen und Löschen-Button in `CanvasNode` nutzten immer die statische Ruheposition `x`/`y`, nie den während eines Drags mitgeführten `dragPos`-State (der schon für die MountPoint-Punkte existierte). Jetzt `dragPos?.x ?? x` / `dragPos?.y ?? y`, wodurch beide Elemente exakt so mitlaufen wie der Sprite selbst
  - Nebenbei `placeComponent`/`moveExistingItem` selbst auf dieselbe `findNearestFreeSlot`-Funktion umgestellt (vorher je eine eigene, fast identische Kopie der Nächster-Slot-Suche) — weniger Duplikation, und Vorschau/tatsächlicher Drop können jetzt nicht mehr auseinanderlaufen, weil beide über denselben Code laufen
  - Das Footprint-Overlay (HTML, `z-index: 150`) wird jetzt nicht mehr an die Katalog-Drag-spezifische `dragging`-Variable gekoppelt, sondern rein an `hoveredSlots.size > 0` — die ist bei beiden Drag-Arten (und sonst nie) gefüllt, was die Bedingung sowohl vereinfacht als auch für den neuen Fall korrekt macht
  - Mit Playwright verifiziert (inkl. temporärem Debug-Log zur Fehlersuche, da die erste Testversion mit ungenauen Greif-/Zielkoordinaten fälschlich "funktioniert nicht" nahelegte): Footprint-Vorschau erscheint beim Verschieben einer platzierten Pouch genauso wie beim Ersteinsatz aus dem Katalog (alle 8 cyan an einer freien Zielstelle), Auswahlrahmen + ×-Button laufen sichtbar mit dem Sprite mit, keine Konsolenfehler, bestehende Katalog-Drag-Tests (inkl. Misch-Vorschau 4 cyan/4 rot) weiterhin grün
- **"My Loadouts"-Seite statt Dropdown** ✅ erledigt (2026-07-30) — das bisherige `LoadoutSwitcher`-Dropdown im Topbar (nur eine Namensliste) ersetzt durch eine eigene Route `/loadouts` (`LoadoutsPage`, später am selben Tag zur neuen Startseite `/` befördert, siehe IA-Überarbeitung weiter unten) mit einem Kachelraster: pro Loadout eine Karte mit Name, Item-Anzahl, Erstellungsdatum und einer echten **komponierten Thumbnail-Vorschau** (nicht nur ein Icon der Basis-Komponente)
  - Neue `LoadoutThumbnail`-Komponente (`frontend/src/components/LoadoutThumbnail.tsx`) ist das nicht-interaktive Gegenstück zu `CanvasNode`: dieselbe "Anker-Mountpoint landet exakt auf dem Parent-Slot"-Logik (`getAnchorMountPointPercent`, `getDisplayWidth`), aber rein in CSS statt Konva — kein Stage/Canvas pro Kachel nötig. Der Trick: ein `position:relative`-Wrapper ohne explizite Höhe um ein `<img style={{width:'100%',height:'auto'}}>` übernimmt automatisch die Bildhöhe, wodurch Kinder per `left/top`-Prozent + einem eigenen `transform: translate(-anchor%, -anchor%)` exakt positioniert werden können, ganz ohne die JS-seitige Naturmaß-Messung, die `CanvasNode` für Konva braucht
  - Skaliert Kinder relativ zum Root über dasselbe `RealWidthMm`-Verhältnis wie im echten Canvas (`getDisplayWidth(child)/getDisplayWidth(root) * THUMB_ROOT_WIDTH`), damit z.B. eine Pouch auf einem Plattenträger in der Kachel genauso proportional aussieht wie im Canvas selbst
  - `LoadoutsPage` lädt dafür pro Loadout die volle `LoadoutResponse` (nicht nur die schlanke `LoadoutSummary`-Liste) sowie einmalig alle darin vorkommenden `ComponentResponse`s (dedupliziert über alle Loadouts hinweg) — bewusst ohne Backend-Änderung, reine Mehrfach-Abrufe bestehender Endpunkte, da die Anzahl der Loadouts für ein Solo-Dev-Projekt klein bleibt
  - Leere Loadouts (kein Root-Item) zeigen einen simplen "Empty"-Platzhalter statt eines leeren Rahmens
  - `LoadoutSwitcher.tsx`/`.module.css` komplett entfernt (kein Restcode), Topbar-Link "My Loadouts" verweist jetzt auf die neue Route; die "+ New Loadout"-Erstellung bleibt dieselbe Funktion aus `App.tsx`, nur zusätzlich als Prop an die neue Seite durchgereicht für deren Empty-State-Button
  - Mit Playwright verifiziert: Kachel mit zusammengesetzter Vorschau (Plattenträger + angedockte Pouch, korrekt proportioniert und positioniert), Kachel für ein leeres Loadout zeigt den Platzhalter, Klick auf eine Kachel navigiert korrekt zur Listenansicht, keine Konsolenfehler
  - **Löschen direkt aus der Kachelübersicht** ✅ erledigt (2026-07-30, auf Wunsch des Projektinhabers direkt im Anschluss ergänzt) — jede Kachel hat jetzt oben rechts ein rotes ×, das den `DELETE /api/loadouts/{id}`-Endpunkt aufruft, der serverseitig schon vorhanden war, aber im Frontend-API-Client noch fehlte (`api.loadouts.remove` ergänzt). Vor dem eigentlichen Löschen fragt ein natives `window.confirm` nach (Muster wie der bestehende `window.prompt` beim Erstellen), da das Löschen eines ganzen Loadouts — anders als das Entfernen eines einzelnen Items — nicht rückgängig zu machen ist. Der Button liegt zwar innerhalb der Karten-`<Link>`, ruft aber `preventDefault`/`stopPropagation` auf, damit ein Klick darauf nicht zusätzlich zur Listenansicht navigiert
  - Mit Playwright verifiziert: Löschen entfernt die Kachel sofort ohne Reload/Navigation, Abbrechen des Bestätigungsdialogs lässt die Kachel unangetastet, keine Konsolenfehler
- **IA-Überarbeitung: Warenkorb-Fokus entfernt, Canvas ist jetzt die einzige Loadout-Seite** ✅ erledigt (2026-07-30) — der Projektinhaber merkte an, dass die App trotz der Kernvision aus Abschnitt 1 immer noch stark nach "Warenkorb zuerst" aussah/funktionierte (Startseite = Produktkatalog, Loadout öffnen = Karten-Grid mit `+`-Buttons und Gesamtgewicht/-preis, Canvas nur ein Link daraus erreichbar). Nach gemeinsamer Abstimmung auf folgende neue Informationsarchitektur umgebaut:
  - **`/` ist jetzt `LoadoutsPage`** (die Kachelübersicht aus dem vorherigen Abschnitt) statt des bisherigen `ComponentBrowser`-Katalogs — die Übersicht der eigenen Loadouts ist der natürliche Einstiegspunkt für ein loadout-zentriertes Tool, kein Produktkatalog
  - **`/loadout/:id` ist jetzt direkt `CanvasView`** (vorher `LoadoutBuilder`, eine reine Warenkorb-Seite mit Katalog-Grid + `+`-Buttons + Sidebar-Summe; Canvas lag dahinter versteckt unter einem separaten `/loadout/:id/canvas`). Der Konfigurator ist die in Abschnitt 1 beschriebene Kernfunktion — er sollte nicht hinter einem Zwischenschritt liegen
  - **`ComponentBrowser` komplett entfernt** (Page + CSS) — sein einziger Zweck (Katalog durchstöbern) ist durch das ohnehin vorhandene Katalog-Panel im Canvas bereits abgedeckt; als eigener, prominent verlinkter Menüpunkt verstärkte er aber genau den Shop-Eindruck, den der Projektinhaber loswerden wollte
  - **`LoadoutBuilder` komplett entfernt** (Page + CSS) — nicht durch eine neue "Liste/Summe"-Zweitseite ersetzt, weil sich beim genaueren Hinsehen herausstellte, dass `CanvasView` die Item-Liste samt Gesamtgewicht/-preis (`LoadoutSidebar`) ohnehin schon dauerhaft eingebettet zeigt (seit der Item-Liste-Funktion vom 2026-07-27) — eine separate Zweitseite wäre reine Dopplung gewesen. Der "nette Zusatz Warenkorb" aus der Anforderung existiert also weiterhin, nur als schmale, immer sichtbare Randspalte statt als eigene Hauptseite
  - **`ComponentCard` komplett entfernt** (Page-Komponente ohne verbleibende Verwender, da beide Seiten weg sind, die sie einsetzten)
  - **`useComponents`-Hook aufgeräumt**: `loading`/`error`/`totalWeight` entfernt, da nach dem Wegfall von `ComponentBrowser`/`LoadoutBuilder` kein einziger verbleibender Aufrufer (nur noch `CanvasView`) diese Felder je gelesen hatte — totes Gewicht im Hook
  - Nebenbei tote/veraltete Texte korrigiert, die auf die jetzt nicht mehr existierende Listenansicht verwiesen (Leerzustand-Hinweis im Canvas, "Zurück"-Link, `LoadoutSidebar`-Leertext)
  - Topbar-Logo ist jetzt selbst ein Link nach `/`, Nav besteht nur noch aus einem einzigen Punkt ("My Loadouts")
  - Mit Playwright verifiziert: `/` zeigt die Kachelübersicht, "+ New Loadout" landet direkt im Canvas (nicht mehr auf einer Zwischenseite), Klick auf eine bestehende Kachel öffnet ebenfalls direkt den Canvas mit allen platzierten Items, keine Konsolenfehler, `tsc --noEmit` clean

---

## 5. Setup auf einem neuen Rechner

### Voraussetzungen installieren

| Tool | Version | Download |
|---|---|---|
| **Git** | beliebig | https://git-scm.com |
| **.NET SDK** | **10.0** | https://dotnet.microsoft.com/download/dotnet/10.0 |
| **Node.js** | **22 LTS** (oder neuer) | https://nodejs.org |
| **EF Core CLI Tools** | global | `dotnet tool install -g dotnet-ef` |
| Editor | VS Code empfohlen | https://code.visualstudio.com |

**VS Code Extensions (empfohlen):**
- `ms-dotnettools.csharp` (C# Dev Kit)
- `ms-dotnettools.csdevkit`
- `dbaeumer.vscode-eslint`
- `bradlc.vscode-tailwindcss` (optional, falls später)

### Repo klonen und einrichten

```powershell
# 1. Repo klonen
git clone https://github.com/IntinGtion/airsoft-loadout-configurator.git
cd "airsoft-loadout-configurator"

# 2. Frontend-Abhängigkeiten installieren
cd frontend
npm install
cd ..

# Backend braucht kein "install" — NuGet-Pakete werden beim ersten Build automatisch geladen
```

### Datenbank einrichten

Die SQLite-Datenbank (`loadout.db`) wird **automatisch beim ersten Start** angelegt und mit Seed-Daten befüllt. Kein manueller Schritt nötig.

### Figma-Zugang einrichten (nur nötig für den Asset-Import-Workflow, siehe Abschnitt 4 "Assets")

Der Figma-Token ist ein Credential und wird **nie** eingecheckt (`.env` steht in `.gitignore`). Er muss auf jedem Rechner manuell hinterlegt werden:

```powershell
cd backend\LoadoutConfigurator.Api
copy .env.example .env
# .env öffnen und beide Werte eintragen:
```

| Variable | Wo finden |
|---|---|
| `FIGMA_TOKEN` | Figma → Account-Einstellungen → Security → Personal access tokens (bereits vorhandenen Token wiederverwenden, sicher übertragen — nicht per Chat/Git) |
| `FIGMA_FILE_KEY` | Aus der Figma-Datei-URL: `figma.com/file/<FILE_KEY>/...` |

Der Token ist nicht an einen Rechner gebunden — auf einem neuen PC muss er nicht neu erstellt werden, nur erneut manuell in die dortige `.env` eingetragen werden.

---

## 6. Projekt starten (täglich)

Zwei separate Terminal-Fenster/Tabs öffnen:

**Terminal 1 — Backend:**
```powershell
cd "C:\Dev\GitHub\Airsoft Loadout Configurator\backend\LoadoutConfigurator.Api"
dotnet run
# Läuft auf http://localhost:5154
# Beim ersten Start: DB wird erstellt + Seed-Daten werden eingespielt
```

**Terminal 2 — Frontend:**
```powershell
cd "C:\Dev\GitHub\Airsoft Loadout Configurator\frontend"
npm run dev
# Läuft auf http://localhost:5173
# Proxy leitet /api/* automatisch an Backend weiter
```

Browser öffnen: **http://localhost:5173**

### Häufige Probleme

| Problem | Lösung |
|---|---|
| `port already in use` | `Get-Process -Name dotnet | Stop-Process` (Backend) oder `npx kill-port 5173` (Frontend) |
| `no such table` beim Start | `*.db`, `*.db-shm`, `*.db-wal` im Backend-Ordner löschen, dann neu starten |
| `FOREIGN KEY constraint failed` beim Migrations-Apply | Typisch nach `git pull` auf einem der anderen Rechner (siehe Multi-PC-Hinweis in Abschnitt 1): lokale `loadout.db*` ist veraltet gegenüber neuen Migrationen. `loadout.db`, `loadout.db-shm`, `loadout.db-wal` löschen, neu starten |
| SQLite Lock hängt | Alle `dotnet`-Prozesse killen, alle `loadout.db*`-Dateien löschen |
| Migration fehlt nach Code-Änderung | `dotnet ef migrations add <Name>` im Backend-Ordner |

---

## 7. Nächste Schritte

**Blocker für den Canvas-Konfigurator — erledigt (2026-07-27):** Basis-Komponente (Condor MOPC, echtes SVG + 36 echte Slots) UND anbaubare Komponente (BFG Ten-Speed Pouch, echtes SVG + 8 echte MountPoints) liegen jetzt vor, siehe Abschnitt 4 "Assets". Datenmodell dafür erweitert (`MountPoint`, siehe Abschnitt 3). Offen ist jetzt die eigentliche Canvas-Implementierung und die Footprint-Match-Logik (siehe unten).

### Kurzfristig — Loadout-Verwaltung als Nebenfunktion ✅ erledigt (2026-07-26, seit der IA-Überarbeitung 2026-07-30 in anderer Form)
War von Anfang an als Nebenfunktion gedacht (siehe Abschnitt 1): Loadout erstellen, Komponenten hinzufügen, Sidebar mit Gesamtgewicht/-preis, Entfernen, Auffindbarkeit aller eigenen Loadouts. Ursprünglich als eigene `LoadoutBuilder`-Katalog-Seite + `LoadoutSwitcher`-Dropdown umgesetzt (2026-07-26) — beide inzwischen entfernt und durch die Kachelübersicht (`/`, `LoadoutsPage`) sowie die dauerhaft im Canvas eingebettete `LoadoutSidebar` ersetzt, siehe Abschnitt 4 "Frontend" (IA-Überarbeitung 2026-07-30).

### Mittelfristig — Canvas-Konfigurator (**das ist die eigentliche Kernfunktion**, siehe Abschnitt 1 + 3 "Layered-Rendering-Konzept")
- `react-konva` installiert, Grundgerüst steht ✅ erledigt (2026-07-27), siehe Abschnitt 4 "Frontend"
- Server-seitige **Footprint-Match-Logik** ✅ erledigt (2026-07-27), siehe Abschnitt 3 "Footprint-Matching" — Grid-basiert (`GridColumn/GridRow`), bewusst ohne Toleranz-Problematik, da unabhängig vom Prozent-/Pixel-Rendering
- **Footprint-Belegung visuell im Canvas** ✅ erledigt (2026-07-27) — belegte Nicht-Anker-Slots werden jetzt ausgegraut, siehe Abschnitt 3
- **Drag & Drop** ✅ erledigt (2026-07-27) — Klick-zu-Platzieren abgelöst, siehe Abschnitt 4 "Frontend"
- **Colorway-Umschalter** ✅ erledigt (2026-07-27), siehe Abschnitt 3 — nur solide Farben, kein Multicam-Muster (siehe dort)
- **Live-Hervorhebung des nächstgelegenen Drop-Ziels während des Ziehens** ✅ erledigt (2026-07-28), siehe Abschnitt 4 "Frontend" — Slot-genaues Feedback (cyan/rot) direkt am Drag-Ghost, nicht mehr nur ein Rahmen-Highlight auf der ganzen Stage
- Rekursion über mehr als 2 Ebenen testen (z.B. Optik auf Rail auf Gewehr) — bisher nur Plattenträger→Pouch verifiziert
- **Relative Größe zwischen Komponenten** (`ComponentTemplate.RealWidthMm`) ✅ erledigt (2026-07-27), siehe Abschnitt 3 "Gemeinsamer Maßstab"
- **Exakte geometrische Übereinstimmung** zwischen Assets verschiedener Figma-Dateien (Teil 2) ✅ erledigt für Raster-Assets (2026-07-28) — statt einer Maßstabs-Konvention wird `RealWidthMm` jetzt aus dem MOLLE-Gitterabstand jedes Assets selbst berechnet (physikalische PALS/MOLLE-Norm als Referenz), siehe Abschnitt 3 "Gemeinsamer Maßstab". Bleibt offen für künftige gitterlose Komponenten (Gewehre, Optiken) — die brauchen weiterhin eine Schätzung, sobald sie zurück in den Katalog kommen
- Multicam-/Muster-Colorways (aktueller Ansatz kann nur solide Farben, siehe Abschnitt 3)
- Restliche Seed-Komponenten (Gewehre, Optiken, andere Taschen) brauchen ebenfalls noch echte Assets nach demselben Workflow (Abschnitt 4)

### Langfristig
- Share-Link-Page: Read-only View eines Loadouts per GUID
- Authentifizierung (optional): mehrere Loadouts pro User
- PostgreSQL-Migration für Deployment
- Deployment (z.B. Fly.io für Backend, Vercel für Frontend)

---

*Zuletzt aktualisiert: 2026-07-30 — Verschieben eines platzierten Items jetzt vollständig konsistent mit der Erstplatzierung aus dem Katalog: Footprint-Vorschau (cyan/rot) erscheint jetzt auch beim Verschieben (vorher nur beim ersten Ziehen aus dem Katalog), und Auswahlrahmen/Löschen-Button laufen live mit dem Sprite mit statt starr an der alten Position zu bleiben, siehe Abschnitt 4 "Frontend". Davor am selben Tag: beim erneuten Aufnehmen eines bereits platzierten Items (z.B. die Pouch vom Plattenträger lösen und woanders hinsetzen) tauchen jetzt wieder dessen eigene MountPoint-Punkte auf, solange der Sprite-Drag läuft (vorher nur beim allerersten Ziehen aus dem Katalog sichtbar), siehe Abschnitt 4 "Frontend". Davor am selben Tag: Informationsarchitektur überarbeitet, um den ursprünglichen Warenkorb-Fokus loszuwerden: Startseite ist jetzt die Kachelübersicht (`/`), ein Loadout öffnen führt direkt in den Canvas-Konfigurator (`/loadout/:id`) statt über eine Zwischenseite, `ComponentBrowser`/`LoadoutBuilder`/`ComponentCard` wurden komplett entfernt (Katalog-Browsing und Item-Liste/Summe waren dank des Canvas-eigenen Katalog-Panels und der eingebetteten `LoadoutSidebar` ohnehin schon dort abgedeckt). Siehe Abschnitt 4 "Frontend" für Details. Davor am selben Tag: Kachelübersicht um ein rotes Lösch-× pro Kachel ergänzt (`api.loadouts.remove`, nutzt den schon vorhandenen `DELETE /api/loadouts/{id}`-Endpunkt), mit Bestätigungsdialog vor dem endgültigen Löschen. Davor am selben Tag: "My Loadouts" vom Topbar-Dropdown zu einer eigenen Kachel-Seite mit echten komponierten Thumbnails ausgebaut, siehe Abschnitt 4 "Frontend". Davor am selben Tag: Live-Hervorhebung beim Katalog-Drag von einem einzelnen Anker-Slot auf die vollständige Footprint-Vorschau erweitert (alle Slots, die eine mehrpunktige Komponente wie die Pouch belegen würde, einzeln als cyan/rot markiert statt nur ein Gesamt-Glow auf dem Drag-Ghost), siehe Abschnitt 4 "Frontend". Davor am selben Tag: dritten Gotcha gefunden und behoben: der re-exportierte `jpc-plate-carrier.svg` enthielt entgegen dem dokumentierten Workflow noch alle 52 Marker-Ellipsen (unauffällig, da farblich identisch zur Silhouette), jetzt entfernt und mit Playwright neu verifiziert; siehe Abschnitt 4 "Assets". Dabei außerdem den veralteten Nächste-Schritte-Eintrag zur Live-Slot-Hervorhebung als erledigt markiert (war bereits am 2026-07-28 umgesetzt, siehe Abschnitt 7). Davor, 2026-07-28: zwei fehlende MOLLE-Webbing-Stege in `jpc-plate-carrier.svg` direkt im SVG gepatcht (geometrisch aus den Nachbar-Stegen abgeleitet), nachdem sich herausstellte, dass der Fehler nicht am Export-Workflow lag, sondern vermutlich an einer sich selbst auslöschenden Vektorform in Figma, die nur beim Export sichtbar wird (siehe Abschnitt 4 "Assets"). Davor am selben Tag: Live-Highlight des Ziel-Slots beim Katalog-Drag ergänzt (Abschnitt 4), inkl. der Erkenntnis, dass das Feedback auf dem Drag-Ghost selbst sitzen muss statt auf dem darunterliegenden Konva-Marker. Davor am selben Tag: Katalog aufgeräumt, drittes echtes Asset (JPC Plate Carrier), Teil 2 des Maßstabs-Themas gelöst (MOLLE-Pitch-Methode) und `ComponentTemplate` eingeführt, siehe Nachträge unten und Abschnitt 3/4. Davor, 2026-07-27: Nach der Item-Liste/Verschieben/Löschen-Funktion (Abschnitt 4) noch zwei vom Projektinhaber beim Testen gefundene Bugs behoben: eine Z-Order-Regression, die kurzzeitig alle Slot-Punkte eines frischen Plattenträgers unsichtbar machte, und ein "alles verschwindet kurz"-Effekt bei jedem Hinzufügen/Verschieben/Löschen, weil `reload()` bisher immer den vollen Ladezustand (inkl. Stage-Unmount) auslöste — jetzt nur noch beim allerersten Laden. Damit läuft das Canvas jetzt durchgehend flüssig. Davor: Item-Liste + Verschieben/Löschen direkt im Canvas ergänzt (inkl. eines dabei gefundenen, vorher nie ausgelösten Backend-Bugs im `MoveItem`-Endpoint), und Teil 1 des Maßstabs-Themas (`Component.RealWidthMm` für relative Größenverhältnisse). Teil 2 des Maßstabs-Themas (pixelgenaue geometrische Übereinstimmung zwischen unabhängigen Figma-Dateien inkl. Toleranzschwelle) bleibt weiterhin bewusst offen, siehe Abschnitt 3.
Direkt danach beim ersten eigenen Test des Projektinhabers im echten Browser gefunden und behoben: eine leere Canvas ohne Root-Item hatte gar kein Drop-Ziel (nur Text statt Stage), und selbst mit Root-Item konnte man per Drag & Drop nichts als neues eigenständiges Item ablegen — nur an bestehende Slots andocken. Beides gefixt: die Stage ist jetzt immer ein Drop-Ziel (mit Hinweis-Overlay wenn leer), und ein Drop ohne nahen Slot legt das Item einfach als neues eigenständiges Root-Item an (wie der alte "+"-Button in der Listenansicht).

**Nachtrag, noch am selben Tag:** Auch nach obigem Fix ließ sich im echten Browser des Projektinhabers nichts an einen Slot andocken (Item landete immer nur an der festen Root-Stapel-Position) — mit Playwright ließ sich das zunächst nicht reproduzieren. Ursache: natives HTML5-Drag-and-Drop (`draggable`/`dragstart`/`dragover`/`drop`) ist über einem `<canvas>`-Element (react-konva Stage) browserübergreifend unzuverlässig; Playwrights `dragTo()` simuliert die komplette native DnD-Sequenz selbst und reproduziert diesen Bug nicht. Behoben durch kompletten Umbau auf reine Maus-Events (`mousedown`/`mousemove`/`mouseup`) inkl. eigenem Cursor-Tag (da kein Browser-natives Drag-Preview mehr) — siehe `CanvasView.tsx`. Verifiziert mit Playwright über echte `mouse.move`-Sequenzen (nicht `dragTo()`, das diesen Codepfad gar nicht mehr auslöst).

**Zweiter Nachtrag:** Feedback nach dem ersten funktionierenden Test: Anker-Konnektor sollte immer exakt unter dem Mauszeiger sitzen (nicht die Bildmitte), alle Konnektoren der gezogenen Komponente sollten sichtbar sein, und nach dem Ablegen sollten wirklich alle belegten Slots ausgeblendet werden, nicht nur einer. Der letzte Punkt entpuppte sich als echter Rendering-Bug: `CanvasNode` zentrierte angehängte Kind-Sprites bisher einfach auf dem Parent-Slot, unabhängig davon, wo der Anker-Mountpoint tatsächlich innerhalb der eigenen Silhouette liegt (bei der BFG-Pouch z.B. oben links, nicht mittig) — dadurch stimmten Bildposition und die (korrekt berechneten) belegten Slots nicht überein. Jetzt löst `CanvasNode` seine Render-Position aus `targetX/targetY` (Zielpunkt) + `anchorPercent` (wo der Anker innerhalb der eigenen SVG liegt) zurück; Root-Items nutzen `anchorPercent={0,0}`, was sich exakt wie vorher verhält. Der Drag-Ghost nutzt dieselbe Logik und zeigt zusätzlich alle eigenen Mountpoints der gezogenen Komponente als Punkte an. Mit Playwright verifiziert.

**Nachtrag 2026-07-28 — `ComponentTemplate` eingeführt:** Nach einer Architektur-Diskussion des Projektinhabers mit Claude Desktop (unabhängig von dieser Session, daher auf Aktualität geprüft statt blind übernommen) wurde `ComponentTemplate` als eigene Entity eingeführt, um Visuals/Formdaten (`SvgAssetPath`, `RealWidthMm`, `Slot[]`, `MountPoint[]`, `AcceptedAttachmentTypes[]`) von den Produktdaten (`Component`: Name, Manufacturer, WeightGrams, PriceEur) zu trennen — Motivation: mehrere Hersteller können optisch identische Klone verkaufen, die künftig ein Template teilen sollen, statt Formdaten pro Produkt zu duplizieren. Details, Datenmodell-Diagramm und Begründung siehe Abschnitt 3. Die öffentliche `ComponentResponse`-API-Form wurde bewusst unverändert (flach) gelassen, wodurch das Frontend ohne jede Codeänderung weiterlief — per Playwright-Smoketest verifiziert (Plattenträger + Pouch platzieren, verschieben, Footprint-Konflikt auslösen; alles wie vor der Migration). Migration `IntroduceComponentTemplates` erzeugt einen nicht datenerhaltenden FK-Umbau (`Slot`/`MountPoint` zeigen jetzt auf `ComponentTemplateId` statt `ComponentId`); da SeedData Katalogdaten nur bei leerer DB neu anlegt, wurde die lokale `loadout.db` bewusst gelöscht statt eine Custom-Datenmigration zu schreiben — reine Dev-Wegwerfdaten, kein produktiver Bestand betroffen.

**Nachtrag 2026-07-28 — Katalog aufgeräumt + drittes echtes Asset:** Direkt im Anschluss an die `ComponentTemplate`-Einführung (praktischer Anwendungsfall kam prompt: der Projektinhaber hatte parallel ein neues Figma-Asset für einen generischen leichten Plattenträger gebaut) wurden auf Wunsch des Projektinhabers alle 16 Seed-Komponenten gelöscht — die meisten waren geratene Platzhalter ohne echtes Asset. Übrig/neu: `JPC Plate Carrier` (neues Asset, siehe Abschnitt 4 "Assets") und die vormalige `BFG Ten-Speed M4 Pouch`, umbenannt zu `Open Fast Mag Pouch` und generalisiert (Datei `bfg-tenspeed.svg` → `open-fast-mag-pouch.svg`, Manufacturer/Gewicht/Preis auf null, da beide jetzt generische Templates statt konkreter Produkte sind). `Component.Manufacturer` wurde dafür nullable gemacht (Migration `MakeManufacturerOptional`). Categories/AttachmentTypes bleiben als Stammdaten erhalten. Dabei auch die wichtige Figma-API-Kontingent-Lektion gelernt (Starter-Plan, mehrtägiges Rate-Limit auf den Bildexport) — Workflow entsprechend angepasst, siehe Abschnitt 4 "Assets". Mit Playwright verifiziert: neuer Plattenträger zeigt alle 52 Slot-Punkte deckungsgleich mit den MOLLE-Reihen, Pouch dockt korrekt an.

**Nachtrag 2026-07-28 — Teil 2 des Maßstabs-Themas gelöst (MOLLE-Pitch-Methode):** Direkt im Anschluss bemerkte der Projektinhaber, dass Plattenträger und Pouch im Verhältnis nicht stimmten (Plattenträger zu klein, Pouch zu groß) und schlug vor, den MOLLE-Reihen-/Schlitzabstand als Referenz für die Größenberechnung zu nutzen, statt Datenblatt-Maße zu raten — mit dem Hinweis, dass die Assets nur nachgezeichnet und nicht real vermessen sind. Umgesetzt: reale PALS/MOLLE-Norm (≈25,4mm Reihenabstand, ≈38,1mm Spaltenabstand) gegen den gemessenen Pixel-Pitch der jeweiligen `GridColumn`/`GridRow`-Punkte gerechnet → `RealWidthMm` neu berechnet (JPC Plate Carrier: 270→**392mm**, Open Fast Mag Pouch: 80→**84mm**). Löst "Teil 2" des Maßstabs-Themas (siehe Abschnitt 3 "Gemeinsamer Maßstab") für alle Raster-Assets, ohne die zuvor angedachte Figma-Einheiten-Konvention zu brauchen. Architektur unverändert (`RealWidthMm` + `PX_PER_MM`), nur die Werte sind jetzt aus der Grafik selbst abgeleitet statt geschätzt. Mit Playwright visuell verifiziert: Plattenträger deutlich größer, Pouch minimal kleiner, Größenverhältnis wirkt jetzt stimmig.*
