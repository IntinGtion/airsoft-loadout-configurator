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
    └── Component    (z.B. "Crye JPC 2.0", "TM MWS GBBR")
          ├── Slot[]               Befestigungspunkte (mit X/Y-Position in %)
          │     └── AttachmentType  (molle, picatinny, gbb-mag-well, ...)
          └── AcceptedAttachmentTypes[]  (n:m — welche Slot-Typen akzeptiert diese Komponente)

Loadout
    └── LoadoutItem[]
          ├── Component
          └── ParentSlot?   (optional: an welchem Slot befestigt)
```

**Wichtige Designentscheidungen:**
- `Slot` gehört einer `Component` und hat einen `AttachmentType` (z.B. Picatinny)
- `Component.AcceptedAttachmentTypes` sagt, an welchen Slot-Typen die Komponente befestigt werden kann
- Beim Hinzufügen zu einem Loadout prüft der Server: passt `Component.AcceptedAttachmentTypes` zu `Slot.AttachmentTypeId`? Wenn nicht → 422 Unprocessable Entity
- `Slot.PositionXPercent/YPercent` sind geometrische Platzhalter (0–100); exakte Koordinaten kommen später aus Figma/Inkscape

### Layered-Rendering-Konzept für den Canvas-Konfigurator (geplant, siehe Abschnitt 7)

So soll die eigentliche Kernfunktion (siehe Abschnitt 1) technisch funktionieren, sobald echte SVG-/Slot-Daten vorliegen:

1. Eine Basis-Komponente (z.B. Plattenträger, Gewehr) wird als SVG auf die Canvas gelegt.
2. Ihre `Slot`-Punkte (`PositionXPercent/Y`) markieren Anbaustellen auf dieser Silhouette.
3. Zieht man eine kompatible Komponente auf einen Slot, wird deren SVG passgenau an dieser Position eingeblendet — nicht als Icon in einer Liste, sondern als echtes zusammengesetztes Bild.
4. Das ist **rekursiv**: `LoadoutItem.ParentSlotId` verweist auf einen Slot, egal wie tief verschachtelt — eine Tasche kann selbst wieder eigene Slots haben (z.B. für einen Patch), eine Rail selbst wieder für eine Optik. Das Datenmodell trägt das bereits, ohne Änderung.
5. Die bereits vorhandene 422-Kompatibilitätsprüfung verhindert dann auch visuell falsche Kombinationen direkt beim Draufziehen.

**Colorway-Idee (noch nicht umgesetzt, keine Datenmodell-Änderung bisher):** Statt jede Komponente in jeder Farbe einzeln zu zeichnen, sollten die SVGs als einfarbige Silhouetten angelegt werden, die sich per CSS/SVG-Fill einfärben lassen. Damit ließe sich ein globaler Colorway-Umschalter bauen (Multicam, Ranger Green, Coyote Tan, Black, ...), der das komplette zusammengebaute Loadout in Echtzeit umfärbt — beantwortet direkt die Frage "passt der Tan-Ton zur restlichen Ausrüstung", ohne dass für jede Farbkombination eigenes Artwork nötig wäre.

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

**Alle API-Routen:**
```
GET/POST        /api/categories
GET/PUT/DELETE  /api/categories/{id}

GET/POST        /api/components          (?categoryId=X zum Filtern)
GET/PUT/DELETE  /api/components/{id}

GET/POST        /api/attachmenttypes
GET/PUT/DELETE  /api/attachmenttypes/{id}

GET/POST        /api/slots               (?componentId=X zum Filtern)
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

**Workflow für weitere Assets (Rezept):**
1. Attachment-Points in Figma als eigene benannte Ellipsen/Frames auf der Silhouette platzieren (Namenskonvention wie oben)
2. Datei per `GET /v1/files/{file_key}` abrufen, Node-IDs der Artwork-Layer und der Marker-Gruppe identifizieren
3. Artwork-Layer einzeln per `GET /v1/images/{file_key}?ids=...&format=svg` exportieren, Marker-Gruppe NICHT mit-exportieren
4. Layer-Offsets relativ zur Basis-Frame-BoundingBox berechnen, in ein kombiniertes SVG zusammensetzen
5. Marker-Ellipsen-Zentren relativ zur Frame-BoundingBox in Prozent umrechnen → `Slot.PositionXPercent/Y`
6. `SvgAssetPath` + Slots im `SeedData.cs` eintragen, DB-Dateien löschen und neu seeden lassen

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
- [ ] react-konva Canvas — **noch nicht installiert, das ist die eigentliche Kernfunktion (siehe Abschnitt 1 + 3), nicht die Liste oben**

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

**Blocker für den Canvas-Konfigurator — teilweise erledigt (2026-07-27):** Erste Basis-Komponente (Condor MOPC) hat jetzt echtes SVG + 36 echte Slot-Koordinaten, siehe Abschnitt 4 "Assets". Es fehlt noch mindestens eine anbaubare Komponente (z.B. eine MOLLE-Tasche) mit eigenem Artwork, damit das Zusammenspiel (Tasche auf Plattenträger-Slot) end-to-end gebaut und getestet werden kann.

### Kurzfristig — Loadout-Builder Page ✅ erledigt (2026-07-26)
War als Nebenfunktion gedacht (siehe Abschnitt 1), ist fertig: Loadout erstellen, Komponenten per `+`-Button hinzufügen, Sidebar mit Gesamtgewicht/-preis, Entfernen, Loadout-Switcher im Topbar. Details siehe Abschnitt 4.

### Mittelfristig — Canvas-Konfigurator (**das ist die eigentliche Kernfunktion**, siehe Abschnitt 1 + 3 "Layered-Rendering-Konzept")
- `react-konva` installieren
- SVG-Silhouetten für mindestens eine Basis-Komponente (Plattenträger) + eine anbaubare Komponente erstellen (Inkscape/Figma) — **wartet auf Assets vom Projektinhaber**
- Slot-Positionen (PositionXPercent/Y) mit echten Koordinaten befüllen
- Drag & Drop: Komponenten auf Slots ziehen, SVGs werden layered/positioniert gerendert (nicht nur als Icon in einer Liste)
- Rekursives Anbauen testen (z.B. Optik auf Rail auf Gewehr)
- Colorway-Umschalter (Einfärben der Silhouetten per Fill, siehe Abschnitt 3) — beantwortet die "passt der Tan-Ton"-Frage, die der eigentliche Anlass für dieses Projekt war

### Langfristig
- Share-Link-Page: Read-only View eines Loadouts per GUID
- Authentifizierung (optional): mehrere Loadouts pro User
- PostgreSQL-Migration für Deployment
- Deployment (z.B. Fly.io für Backend, Vercel für Frontend)

---

*Zuletzt aktualisiert: 2026-07-27 — Erstes echtes Asset (Condor MOPC, 36 MOLLE-Slots) per Figma-API importiert und im Backend verankert, siehe Abschnitt 4 "Assets" für den wiederholbaren Workflow. Setup auf Dritt-PC verifiziert (Node.js 22.18.0, .NET SDK 10.0.302, dotnet-ef 10.0.10 neu installiert).*
