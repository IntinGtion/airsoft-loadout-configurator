# Airsoft Loadout Configurator — Entwicklerdokumentation

Dieses Dokument erklärt den aktuellen Stand des Projekts, die getroffenen Architekturentscheidungen und wie das Projekt auf einem neuen Rechner aufgesetzt wird.

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

Praktisch heißt das: Komponenten (Westen, Waffen, Optiken, Pouches) aus einem Katalog wählen und per Drag & Drop auf einer 2D-Silhouetten-Canvas an echten Anbaupunkten (Slots) zusammensetzen — nicht nur in eine Liste packen. Die Loadout-Liste mit Gesamtgewicht/-preis (siehe Abschnitt 4, `LoadoutBuilder`) ist bewusst nur eine **Nebenfunktion** — nett zu haben, aber nicht der Grund, warum dieses Projekt existiert. Der Canvas-Konfigurator (Abschnitt 3 "Layered-Rendering-Konzept" und Abschnitt 7 "Mittelfristig") ist das eigentliche Produkt.

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
- `ComponentTemplate.RealWidthMm` (nullable) ist ein reales Referenzmaß in mm (aus öffentlichen Produktdaten, ca.-Werte) — für alle 16 Seed-Komponenten befüllt. Wird fürs **relative Größenverhältnis im Canvas** verwendet, siehe Abschnitt 7 "Gemeinsamer Maßstab"

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

### Gemeinsamer Maßstab — Teil 1 (relative Größe) ✅ erledigt (2026-07-27)

Das "Maßstab"-Thema hat zwei unabhängige Teile:

1. **Relative Größe zwischen Komponenten** (ein Gewehr soll größer wirken als eine Pistole) — löst rein die Anzeigegröße im Canvas, keine Positions-/Geometrieprüfung betroffen.
2. **Exakte geometrische Übereinstimmung** (passt das MOLLE-Raster der Pouch pixelgenau auf das Raster des Plattenträgers) — das geht nicht rein im Code, weil jede Figma-Datei einen beliebigen eigenen internen Maßstab hat. Braucht künftig eine Konvention des Projektinhabers (z.B. "1 Figma-Einheit = 1 mm" in jeder neuen Datei) und dann eine Toleranzschwelle beim Abgleich, da reale Positionen nie exakt übereinstimmen werden (siehe Notiz des Projektinhabers vom 2026-07-27). **Weiterhin offen**, siehe Abschnitt 7.

Für Teil 1 wurde `Component.RealWidthMm` eingeführt (reales Referenzmaß in mm, für alle 16 Seed-Komponenten mit ungefähren, öffentlich bekannten Produktmaßen befüllt — bei Plattenträgern die Frontpanel-Breite, bei Gewehren/Pistolen die Gesamtlänge als visuell dominante Ausdehnung, bei Optiken/Taschen die Breite). `frontend/src/components/canvas/scale.ts` rechnet das über eine feste `PX_PER_MM`-Konstante (kalibriert auf den Condor MOPC, damit sich die bisherige Canvas-Größe nicht sprunghaft ändert) in eine Anzeigebreite um — sowohl für Root-Komponenten (`CanvasView`) als auch für rekursiv angehängte Kind-Komponenten (`CanvasNode`, ersetzt die bisher fixe `CHILD_DISPLAY_WIDTH`). Komponenten ohne `RealWidthMm` fallen auf die alten festen Pixelwerte zurück. Sichtbarer Effekt: die BFG Ten-Speed Pouch (80mm, 2 MOLLE-Spalten breit) rendert jetzt satt größer als vorher und deckt visuell ungefähr die zwei Spalten ab, die sie laut Footprint auch tatsächlich belegt — vorher war sie durch die feste 64px-Größe künstlich zu klein. Mit Playwright verifiziert.

### Seed-Daten (16 Produkte)

| Kategorie | Produkte |
|---|---|
| Plate Carrier | Crye JPC 2.0, Ferro FCPC V5, Condor MOPC |
| Rifle | TM MWS GBBR, WE-Tech M4, ICS CXP-UK1 |
| Pistol | TM Hi-Capa 5.1, WE G17 Gen4 |
| Optic | Aimpoint T2, EOTech 553, EOTech XPS3, Vortex Crossfire |
| Pouch | Condor Admin Pouch, WAS Double Mag Pouch, BFG Ten-Speed, NAR IFAK |

---

## 4. Was bisher gebaut wurde

### Backend (vollständig)

- [x] EF Core Datenbankschema mit Auto-Migration beim Start
- [x] Auto-Seed mit 16 echten Produkten (idempotent — läuft nicht doppelt)
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
- [x] SVG unter `frontend/public/components/bfg-tenspeed.svg`, visuell verifiziert

**Workflow für weitere Assets (Rezept):**
1. Attachment-Points in Figma als eigene benannte Ellipsen/Frames auf der Silhouette platzieren (Namenskonvention wie oben)
2. Vorab klären: bietet die Komponente diese Punkte an (→ `Slot`, z.B. Plattenträger, Rail) oder befestigt sie sich selbst damit an einem Parent (→ `MountPoint`, z.B. Tasche, Optik)? Beides kann auch gleichzeitig vorkommen (z.B. eine Rail hat MountPoints zum Gewehr UND eigene Slots für eine Optik)
3. Datei per `GET /v1/files/{file_key}` abrufen, Node-IDs der Artwork-Layer und der Marker-Gruppe identifizieren
4. Artwork-Layer einzeln per `GET /v1/images/{file_key}?ids=...&format=svg` exportieren, Marker-Gruppe NICHT mit-exportieren
5. Layer-Offsets relativ zur Basis-Frame-BoundingBox berechnen, in ein kombiniertes SVG zusammensetzen
6. Marker-Ellipsen-Zentren relativ zur Frame-BoundingBox in Prozent umrechnen → `Slot.PositionXPercent/Y` bzw. `MountPoint.PositionXPercent/Y`
7. `SvgAssetPath` + Slots/MountPoints im `SeedData.cs` eintragen, DB-Dateien löschen und neu seeden lassen

### Frontend (Grundgerüst + Nebenfunktion "Loadout-Liste")

- [x] Vite-Proxy: `/api/*` → `http://localhost:5154` (kein CORS-Problem im Dev)
- [x] TypeScript API-Client (`src/api/index.ts` + `src/api/types.ts`)
- [x] Dunkles Militärtheme (CSS-Variablen in `index.css`)
- [x] `CategoryNav` — Sidebar mit Kategoriefilter
- [x] `ComponentCard` — Karte mit Gewicht, Preis, Attachment-Tags, optionalem `+`-Button
- [x] `ComponentBrowser` — Page mit Grid-Layout, Filterung, Gesamtgewicht
- [x] App-Shell (Topbar + Body-Layout)
- [x] React-Router-DOM aktiviert: `/` → `ComponentBrowser`, `/loadout/:id` → `LoadoutBuilder`
- [x] `LoadoutBuilder` — Loadout erstellen, Komponenten per `+`-Button hinzufügen, Sidebar mit Items/Gesamtgewicht/-preis, Entfernen
- [x] `LoadoutSwitcher` — Dropdown im Topbar, listet vorhandene Loadouts (sonst nach Verlassen der Seite nicht mehr auffindbar)
- [x] **Canvas-Grundgerüst** (`react-konva` + `konva` + `use-image` installiert) — neue Route `/loadout/:id/canvas` (`CanvasView`), siehe Abschnitt 1 + 3 für die Kernvision:
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
| SQLite Lock hängt | Alle `dotnet`-Prozesse killen, alle `loadout.db*`-Dateien löschen |
| Migration fehlt nach Code-Änderung | `dotnet ef migrations add <Name>` im Backend-Ordner |

---

## 7. Nächste Schritte

**Blocker für den Canvas-Konfigurator — erledigt (2026-07-27):** Basis-Komponente (Condor MOPC, echtes SVG + 36 echte Slots) UND anbaubare Komponente (BFG Ten-Speed Pouch, echtes SVG + 8 echte MountPoints) liegen jetzt vor, siehe Abschnitt 4 "Assets". Datenmodell dafür erweitert (`MountPoint`, siehe Abschnitt 3). Offen ist jetzt die eigentliche Canvas-Implementierung und die Footprint-Match-Logik (siehe unten).

### Kurzfristig — Loadout-Builder Page ✅ erledigt (2026-07-26)
War als Nebenfunktion gedacht (siehe Abschnitt 1), ist fertig: Loadout erstellen, Komponenten per `+`-Button hinzufügen, Sidebar mit Gesamtgewicht/-preis, Entfernen, Loadout-Switcher im Topbar. Details siehe Abschnitt 4.

### Mittelfristig — Canvas-Konfigurator (**das ist die eigentliche Kernfunktion**, siehe Abschnitt 1 + 3 "Layered-Rendering-Konzept")
- `react-konva` installiert, Grundgerüst steht ✅ erledigt (2026-07-27), siehe Abschnitt 4 "Frontend"
- Server-seitige **Footprint-Match-Logik** ✅ erledigt (2026-07-27), siehe Abschnitt 3 "Footprint-Matching" — Grid-basiert (`GridColumn/GridRow`), bewusst ohne Toleranz-Problematik, da unabhängig vom Prozent-/Pixel-Rendering
- **Footprint-Belegung visuell im Canvas** ✅ erledigt (2026-07-27) — belegte Nicht-Anker-Slots werden jetzt ausgegraut, siehe Abschnitt 3
- **Drag & Drop** ✅ erledigt (2026-07-27) — Klick-zu-Platzieren abgelöst, siehe Abschnitt 4 "Frontend"
- **Colorway-Umschalter** ✅ erledigt (2026-07-27), siehe Abschnitt 3 — nur solide Farben, kein Multicam-Muster (siehe dort)
- Live-Hervorhebung des nächstgelegenen Drop-Ziels **während** des Ziehens (aktuell nur Rahmen-Highlight auf der ganzen Stage, kein Slot-genaues Feedback vor dem Loslassen)
- Rekursion über mehr als 2 Ebenen testen (z.B. Optik auf Rail auf Gewehr) — bisher nur Plattenträger→Pouch verifiziert
- **Relative Größe zwischen Komponenten** (`Component.RealWidthMm`) ✅ erledigt (2026-07-27), siehe Abschnitt 3 "Gemeinsamer Maßstab — Teil 1"
- **Exakte geometrische Übereinstimmung** zwischen Assets verschiedener Figma-Dateien (Teil 2, siehe Abschnitt 3) — braucht eine Maßstabs-Konvention des Projektinhabers für künftige Figma-Dateien (z.B. "1 Einheit = 1 mm") und danach eine Toleranzschwelle beim Abgleich, da reale Positionen nie exakt übereinstimmen werden. Das Footprint-Matching selbst ist davon nicht betroffen (läuft über Rasterkoordinaten, Abschnitt 3), es geht nur noch um pixelgenaues visuelles Rendering
- Multicam-/Muster-Colorways (aktueller Ansatz kann nur solide Farben, siehe Abschnitt 3)
- Restliche Seed-Komponenten (Gewehre, Optiken, andere Taschen) brauchen ebenfalls noch echte Assets nach demselben Workflow (Abschnitt 4)

### Langfristig
- Share-Link-Page: Read-only View eines Loadouts per GUID
- Authentifizierung (optional): mehrere Loadouts pro User
- PostgreSQL-Migration für Deployment
- Deployment (z.B. Fly.io für Backend, Vercel für Frontend)

---

*Zuletzt aktualisiert: 2026-07-28 — `ComponentTemplate` eingeführt, siehe Nachtrag unten und Abschnitt 3/4. Davor, 2026-07-27: Nach der Item-Liste/Verschieben/Löschen-Funktion (Abschnitt 4) noch zwei vom Projektinhaber beim Testen gefundene Bugs behoben: eine Z-Order-Regression, die kurzzeitig alle Slot-Punkte eines frischen Plattenträgers unsichtbar machte, und ein "alles verschwindet kurz"-Effekt bei jedem Hinzufügen/Verschieben/Löschen, weil `reload()` bisher immer den vollen Ladezustand (inkl. Stage-Unmount) auslöste — jetzt nur noch beim allerersten Laden. Damit läuft das Canvas jetzt durchgehend flüssig. Davor: Item-Liste + Verschieben/Löschen direkt im Canvas ergänzt (inkl. eines dabei gefundenen, vorher nie ausgelösten Backend-Bugs im `MoveItem`-Endpoint), und Teil 1 des Maßstabs-Themas (`Component.RealWidthMm` für relative Größenverhältnisse). Teil 2 des Maßstabs-Themas (pixelgenaue geometrische Übereinstimmung zwischen unabhängigen Figma-Dateien inkl. Toleranzschwelle) bleibt weiterhin bewusst offen, siehe Abschnitt 3.
Direkt danach beim ersten eigenen Test des Projektinhabers im echten Browser gefunden und behoben: eine leere Canvas ohne Root-Item hatte gar kein Drop-Ziel (nur Text statt Stage), und selbst mit Root-Item konnte man per Drag & Drop nichts als neues eigenständiges Item ablegen — nur an bestehende Slots andocken. Beides gefixt: die Stage ist jetzt immer ein Drop-Ziel (mit Hinweis-Overlay wenn leer), und ein Drop ohne nahen Slot legt das Item einfach als neues eigenständiges Root-Item an (wie der alte "+"-Button in der Listenansicht).

**Nachtrag, noch am selben Tag:** Auch nach obigem Fix ließ sich im echten Browser des Projektinhabers nichts an einen Slot andocken (Item landete immer nur an der festen Root-Stapel-Position) — mit Playwright ließ sich das zunächst nicht reproduzieren. Ursache: natives HTML5-Drag-and-Drop (`draggable`/`dragstart`/`dragover`/`drop`) ist über einem `<canvas>`-Element (react-konva Stage) browserübergreifend unzuverlässig; Playwrights `dragTo()` simuliert die komplette native DnD-Sequenz selbst und reproduziert diesen Bug nicht. Behoben durch kompletten Umbau auf reine Maus-Events (`mousedown`/`mousemove`/`mouseup`) inkl. eigenem Cursor-Tag (da kein Browser-natives Drag-Preview mehr) — siehe `CanvasView.tsx`. Verifiziert mit Playwright über echte `mouse.move`-Sequenzen (nicht `dragTo()`, das diesen Codepfad gar nicht mehr auslöst).

**Zweiter Nachtrag:** Feedback nach dem ersten funktionierenden Test: Anker-Konnektor sollte immer exakt unter dem Mauszeiger sitzen (nicht die Bildmitte), alle Konnektoren der gezogenen Komponente sollten sichtbar sein, und nach dem Ablegen sollten wirklich alle belegten Slots ausgeblendet werden, nicht nur einer. Der letzte Punkt entpuppte sich als echter Rendering-Bug: `CanvasNode` zentrierte angehängte Kind-Sprites bisher einfach auf dem Parent-Slot, unabhängig davon, wo der Anker-Mountpoint tatsächlich innerhalb der eigenen Silhouette liegt (bei der BFG-Pouch z.B. oben links, nicht mittig) — dadurch stimmten Bildposition und die (korrekt berechneten) belegten Slots nicht überein. Jetzt löst `CanvasNode` seine Render-Position aus `targetX/targetY` (Zielpunkt) + `anchorPercent` (wo der Anker innerhalb der eigenen SVG liegt) zurück; Root-Items nutzen `anchorPercent={0,0}`, was sich exakt wie vorher verhält. Der Drag-Ghost nutzt dieselbe Logik und zeigt zusätzlich alle eigenen Mountpoints der gezogenen Komponente als Punkte an. Mit Playwright verifiziert.

**Nachtrag 2026-07-28 — `ComponentTemplate` eingeführt:** Nach einer Architektur-Diskussion des Projektinhabers mit Claude Desktop (unabhängig von dieser Session, daher auf Aktualität geprüft statt blind übernommen) wurde `ComponentTemplate` als eigene Entity eingeführt, um Visuals/Formdaten (`SvgAssetPath`, `RealWidthMm`, `Slot[]`, `MountPoint[]`, `AcceptedAttachmentTypes[]`) von den Produktdaten (`Component`: Name, Manufacturer, WeightGrams, PriceEur) zu trennen — Motivation: mehrere Hersteller können optisch identische Klone verkaufen, die künftig ein Template teilen sollen, statt Formdaten pro Produkt zu duplizieren. Details, Datenmodell-Diagramm und Begründung siehe Abschnitt 3. Die öffentliche `ComponentResponse`-API-Form wurde bewusst unverändert (flach) gelassen, wodurch das Frontend ohne jede Codeänderung weiterlief — per Playwright-Smoketest verifiziert (Plattenträger + Pouch platzieren, verschieben, Footprint-Konflikt auslösen; alles wie vor der Migration). Migration `IntroduceComponentTemplates` erzeugt einen nicht datenerhaltenden FK-Umbau (`Slot`/`MountPoint` zeigen jetzt auf `ComponentTemplateId` statt `ComponentId`); da SeedData Katalogdaten nur bei leerer DB neu anlegt, wurde die lokale `loadout.db` bewusst gelöscht statt eine Custom-Datenmigration zu schreiben — reine Dev-Wegwerfdaten, kein produktiver Bestand betroffen.*
