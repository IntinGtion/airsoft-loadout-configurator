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

Ein webbasierter Konfigurator, mit dem Airsoft-Spieler ihre Ausrüstung (Loadout) visuell zusammenstellen können:

- Komponenten (Westen, Waffen, Optiken, Pouches) aus einem Katalog auswählen
- Diese per Drag & Drop auf einer 2D-Silhouetten-Canvas anordnen
- Gewicht und Kosten live sehen
- Loadouts per Link teilen (Share-Token)

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

### Frontend: React 19 + TypeScript + Vite

| Entscheidung | Begründung |
|---|---|
| React 19 | Aktuell, großes Ökosystem |
| Vite 8 | Deutlich schneller als CRA, HMR out-of-the-box |
| TypeScript ~6 | Type-Safety, IDE-Support |
| CSS Modules | Scoped Styles ohne Framework-Overhead; kein Tailwind-Overhead |
| react-router-dom v7 | Installiert, noch nicht verdrahtet — wird für Multi-Page-Navigation gebraucht |
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

### Frontend (Grundgerüst)

- [x] Vite-Proxy: `/api/*` → `http://localhost:5154` (kein CORS-Problem im Dev)
- [x] TypeScript API-Client (`src/api/index.ts` + `src/api/types.ts`)
- [x] Dunkles Militärtheme (CSS-Variablen in `index.css`)
- [x] `CategoryNav` — Sidebar mit Kategoriefilter
- [x] `ComponentCard` — Karte mit Gewicht, Preis, Attachment-Tags, optionalem `+`-Button
- [x] `ComponentBrowser` — Page mit Grid-Layout, Filterung, Gesamtgewicht
- [x] App-Shell (Topbar + Body-Layout)
- [ ] `LoadoutBuilder` — noch nicht gebaut
- [ ] React-Router-DOM — installiert, aber noch nicht verdrahtet
- [ ] react-konva Canvas — noch nicht installiert

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

In dieser Reihenfolge geplant:

### Kurzfristig — Loadout-Builder Page
- `LoadoutBuilder.tsx` — Loadout erstellen, Komponenten per `+`-Button hinzufügen
- Sidebar: aktive Loadout-Items mit Gesamtgewicht + Gesamtpreis
- `DELETE /api/loadouts/{id}/items/{itemId}` verdrahten für "Entfernen"
- React-Router-DOM aktivieren: `/` → ComponentBrowser, `/loadout/:id` → LoadoutBuilder

### Mittelfristig — Canvas-Konfigurator
- `react-konva` installieren
- SVG-Silhouetten für Plate Carriers erstellen (Inkscape/Figma)
- Slot-Positionen (PositionXPercent/Y) mit echten Koordinaten befüllen
- Drag & Drop: Komponenten auf Slots ziehen, visuelle Verbindung

### Langfristig
- Share-Link-Page: Read-only View eines Loadouts per GUID
- Authentifizierung (optional): mehrere Loadouts pro User
- PostgreSQL-Migration für Deployment
- Deployment (z.B. Fly.io für Backend, Vercel für Frontend)

---

*Zuletzt aktualisiert: 2026-07-26*
