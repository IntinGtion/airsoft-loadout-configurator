# Airsoft Loadout Configurator

Ein webbasierter Konfigurator zum visuellen Zusammenstellen von Airsoft-Ausruestungen. Komponenten (Westen, Waffen, Optiken, Pouches) werden per Drag & Drop auf einer 2D-Canvas an echten Anbaupunkten platziert -- mit Live-Anzeige von Gesamtgewicht und Kosten.

**Stack:** ASP.NET Core 10 + EF Core + SQLite | React 19 + TypeScript + Vite + react-konva

---

## Schnellstart

**Voraussetzungen:** .NET 10 SDK, Node.js 22+, Git

```powershell
git clone https://github.com/IntinGtion/airsoft-loadout-configurator.git
cd airsoft-loadout-configurator
cd frontend && npm install && cd ..
```

Danach einmalig und bei jedem Entwicklungsstart:

```powershell
.\dev.ps1
```

Das Skript stoppt laufende Prozesse, loescht und erstellt die Datenbank neu, startet Backend (`:5154`) und Frontend (`:5173`) in eigenen Fenstern und oeffnet den Browser automatisch.

```powershell
.\dev.ps1 -KeepDb   # Start ohne DB-Reset
```

---

## Projektstruktur

```
backend/   ASP.NET Core REST API
frontend/  React + Vite SPA
dev.ps1    Ein-Befehl Dev-Start (Windows)
```

Ausfuehrliche Dokumentation (Architekturentscheidungen, Setup auf neuem Rechner, naechste Schritte): [DEVELOPMENT.md](DEVELOPMENT.md)
