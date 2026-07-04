# Projektplan — Eistechnikcenter Plattform (Odoo-Ablösung)

> **Ziel:** Schrittweise alle Odoo-Funktionen durch eine eigene Web-App ersetzen.  
> **Strategie:** Parallelbetrieb — Odoo bleibt aktiv, bis jede Funktion in Supabase vollständig läuft.  
> **Stand:** Juli 2026 · basierend auf [gedankenprotokoll.md](./gedankenprotokoll.md)

---

## Leitprinzipien

| Prinzip | Bedeutung |
|---------|-----------|
| **V1 bleibt stabil** | Route `/v1` — bestehende 5-Kachel-Übersicht und Bestellformular unverändert. Team arbeitet weiter damit. |
| **V2 neben V1** | Route `/v2` — neues 16-Kachel-Dashboard (CDN-Icons). Alle neuen Features nur hier. |
| **Version wählen** | Nach Login: `/` — Disney+-Style Auswahl zwischen V1 und V2. |
| **Dual-Write → Single-Source** | Zuerst Odoo + Supabase parallel, dann nur noch Supabase pro Modul. |
| **Kein Big Bang** | Jedes Modul einzeln live schalten, testen, dann Odoo-Modul abschalten. |
| **EU & DSGVO** | Supabase in `eu-central-1`, RLS überall, sensible Felder verschlüsselt, AVV abgeschlossen. |

---

## Ist-Zustand (Codebase)

**App:** `Eistechnik-App/` (Next.js, Vercel, Port 3000) · Produktname: **ETC-App**

| Bereich | Route | Status |
|---------|-------|--------|
| Version wählen | `/` | ✅ Disney+-Auswahl V1 / V2 |
| Version 1 (Legacy) | `/v1` | ✅ 5 Kacheln unverändert |
| Version 2 (Neu) | `/v2` | ✅ 16-Kachel-Dashboard (Module „Bald verfügbar“) |
| Bestellformular | `/bestellformular` | ✅ Produktiv (V1, Odoo) |
| Anfahrtskosten | `/anfahrtskosten` | ✅ |
| CRM | `/crm` | ✅ |
| Produkte | `/produkte` | ✅ |
| Ad-Auswertung | `/ad-auswertung` | ✅ |

**Supabase:** Projekt `ETC-App` · `eu-central-1` · MCP + Health-API verbunden.  
**Vercel:** `bestellungformular-app.vercel.app` · Root Directory muss `Eistechnik-App` sein.

**Regeln:** Siehe [regeln.md](./regeln.md)

**Team:** 11 Mitarbeiter (4 Admins, 7 Mitglieder) — siehe Accountliste in gedankenprotokoll.

---

## Architektur-Zielbild

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js / Vercel)                                │
│  · Kachel-Dashboard (75 % Breite, minimalistisch, ETC-Logo) │
│  · V1 Bestellformular (unverändert)                          │
│  · V2+ alle neuen Module                                     │
│  · PWA / später native iOS & Android                         │
└──────────────┬──────────────────────────────┬─────────────────┘
               │                              │
       ┌───────▼────────┐            ┌────────▼────────┐
       │  Supabase      │            │  Odoo (Legacy)  │
       │  · Postgres    │◄──sync──►  │  · bis Ablösung │
       │  · Auth + 2FA  │            └─────────────────┘
       │  · Storage     │
       │  · Edge Fns    │
       └───────┬────────┘
               │
   ┌───────────┼───────────────────────────────────┐
   │           │                                   │
OneDrive   Outlook/Brevo   Shopify   Maps/GPS   KI-OCR
(1 TB)     (Mail)          (Shop)    (Touren)   (Belege)
```

**Dokumente:** Metadaten + Verknüpfungen in Supabase, Dateien primär in OneDrive (1 TB), optional Bunny CDN für öffentliche Assets.

---

## Phasen-Übersicht

| Phase | Name | Dauer (geschätzt) | Odoo-Abhängigkeit danach |
|-------|------|-------------------|--------------------------|
| **0** | Fundament & Supabase-Anbindung | 4–6 Wochen | unverändert |
| **1** | Auth, UI-Shell, Kontakte-Import | 6–8 Wochen | CRM teilweise |
| **2** | Bestellformular V2 | 4–6 Wochen | Bestellung teilweise |
| **3** | Angebote & Auftragsbestätigungen | 6–8 Wochen | Angebote |
| **4** | Rechnungen & Buchhaltung | 10–14 Wochen | Rechnungen |
| **5** | Lager, Lieferscheine, Wareneingang | 8–10 Wochen | Lager |
| **6** | Kommunikation & Benachrichtigungen | 6–8 Wochen | Chatter/Mail |
| **7** | Auslieferungsplanung & Auslieferungs-App | 10–12 Wochen | Lieferung |
| **8** | Erweiterte Module | 8–12 Wochen | diverse |
| **9** | Odoo-Abschaltung & Migration abschließen | 4–6 Wochen | **0 %** |

**Gesamt:** ca. 18–24 Monate bei kontinuierlicher Entwicklung.

---

## Phase 0 — Fundament & erste Supabase-Anbindung

> **Ziel des ersten Push:** Supabase ist verbunden, V1 Bestellformular funktioniert weiterhin 1:1 wie bisher. Keine sichtbare Änderung für den Vertrieb außer evtl. neuem Dashboard-Look.

### 0.1 Supabase-Projekt einrichten
- [x] Projekt in **eu-central-1 (Frankfurt)** anlegen (`ETC-App`)
- [ ] AVV mit Supabase abschließen
- [ ] Env-Vars in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (nur Server)
- [x] `@supabase/supabase-js` + `@supabase/ssr` in Eistechnik-App
- [ ] TypeScript-Typen aus Schema generieren
- [x] Health-API `/api/health` + MCP-Verbindung getestet

### 0.2 Sicherheits-Basis (Pflicht vor Produktivdaten)
- [x] RLS auf **allen** Tabellen aktivieren (`app_connection_checks`)
- [ ] `audit_logs`-Tabelle (User, Aktion, Zeitstempel, IP, Payload-Hash)
- [ ] `pgcrypto` für sensible Spalten (IBAN, Steuernummer, Ausweisdaten)
- [ ] Private Storage-Buckets mit Signed URLs (max. 5 Min Gültigkeit)
- [ ] Edge Functions für Admin-Operationen (Service-Role nie im Client)

### 0.3 Dashboard & Kachel-Design (neu)
- [x] Nach Login: **Version wählen** (`/`) — Disney+-Style V1 / V2
- [x] **V1** (`/v1`): bestehende 5-Kachel-Übersicht unverändert
- [x] **V2** (`/v2`): 16-Kachel-Dashboard, 75 % Breite, CDN-SVG-Icons
- [x] ETC-Logo im Header (V2)
- [ ] Responsive Feinschliff Tablet/Smartphone

### 0.4 Erste Daten in Supabase (ohne V1 zu berühren)
- [ ] Schema: `contacts`, `contact_duplicates` (temporär), `sync_log`
- [ ] Odoo-Export-Skript: Kunden → Supabase (einmalig + nightly Delta)
- [ ] **Temporäre Kachel „Dubletten-Check“**: zeigt doppelte Kunden (Name, E-Mail, Telefon)
- [ ] E-Mail-Verläufe & Odoo-Dokumente beim Export als JSON/Metadaten mitnehmen (Dateien → OneDrive)

### 0.5 Abnahme Phase 0
- [ ] V1 Bestellformular: kompletter Flow getestet (Odoo-Anbindung unverändert)
- [ ] Login funktioniert wie bisher
- [ ] Supabase-Verbindung live, Dubletten-Kachel zeigt Import-Daten
- [ ] Keine Regression in CRM, Produkte, Anfahrtskosten, Ad-Auswertung

**Deliverable:** Erster Push mit Supabase-Fundament + neues Dashboard + V1/V2-Kacheln.

---

## Phase 1 — Auth, Benutzer & Kontakte

### 1.1 Authentifizierung (Supabase Auth)
- [ ] Migration von Credential-Login → Supabase Auth (E-Mail/Passwort)
- [ ] **2FA verpflichtend** für alle 11 Mitarbeiter (kein Opt-out)
- [ ] Session: Access-Token max. 1 h, Auto-Logout bei Inaktivität
- [ ] Login-Log: wann, von welchem Ort/IP
- [ ] Passwort ändern & zurücksetzen

### 1.2 Rollen & Rechte (RBAC)
- [ ] Rollen: `admin`, `geschaeftsfuehrung`, `mitglied`, `buchhaltung`, `lager`, `auslieferung`
- [ ] Rechtetabelle: Lesen / Schreiben / Löschen pro Modul
- [ ] Admin-UI: Mitarbeiter anlegen, entfernen, Rechte zuweisen
- [ ] Custom Claims oder `user_roles`-Tabelle

### 1.3 Einstellungen (pro Nutzer)
- [ ] Profil: Name, Vorname, Profilbild, Signatur (für Dokumente)
- [ ] Persönliche Einstellungen-Seite

### 1.4 Kontakte-Modul (Odoo-Nachbau Kern)
- [ ] Kontaktkarte mit allen Feldern wie Odoo + mehr
- [ ] **Stichwörter, Branchen, Quellen** (Meta, Google, Kaltkontakt, Webseite, Eisfachschule, eBay, …)
- [ ] **Tags** (vordefiniert + neu anlegbar): Eisdiele, Kino, Imbiss, Foodtruck, Freibad, Burgerbude, …
- [ ] Ansprechpartner / GbR-Inhaber / GmbH-Geschäftsführer übersichtlich
- [ ] **Duplikat-Warnung** bei neuer E-Mail oder Telefonnummer
- [ ] Admin: dynamische Felder hinzufügen (Odoo-Studio-ähnlich)
- [ ] Suchlisten: Kunden nach gekauften Produkten filtern
- [ ] Verknüpfungen: Maschinen, Rohstoffe, Tickets, Lieferscheine, Rechnungen
- [ ] Übersicht in Kundenakte: Anzahl Lieferscheine, Rechnungen, offene/geschlossene Tickets (klickbar → gefilterte Liste)
- [ ] Fotoeinwilligung: Checkbox + hinterlegtes Dokument
- [ ] **Dual-Write:** neuer Kontakt → sofort Supabase + Odoo (bis Odoo abgeschaltet)

### 1.5 CRM-Migration
- [ ] CRM-Kachel auf Supabase umstellen (Odoo als Fallback/Lesequelle während Übergang)
- [ ] Chatter-Grundlage: Notizen mit @-Erwähnungen

**Deliverable:** Kontakte leben in Supabase, CRM liest primär aus Supabase.

---

## Phase 2 — Bestellformular V2

> V1 (`/bestellformular`) bleibt frozen. Alle Änderungen nur in V2.

### 2.1 V2 Kernfunktionen
- [ ] Trennung **Lieferadresse ≠ Rechnungsadresse**
- [ ] Alle bestehenden V1-Felder + PDF-Export
- [ ] PDF in Supabase Storage + OneDrive ablegen
- [ ] Verknüpfung zur Kunden-Historie
- [ ] Signing-Tool (echte Handschrift, kein vorgefertigter Name)
- [ ] Versand per E-Mail mit PDF-Anhang

### 2.2 Newsletter-Opt-in
- [ ] Checkbox **standardmäßig aktiviert** („Newsletter erhalten“)
- [ ] Abmeldung: Link in E-Mail → `buchhaltung@eistechnikcenter.de` oder Abmelde-Link im Newsletter
- [ ] Brevo-Sync: Opt-in-Status synchron halten

### 2.3 Datenfluss
- [ ] Bestellung speichern in Supabase (`orders`, `order_lines`)
- [ ] Parallel: optional weiterhin Odoo Sale Order (Übergangsphase)
- [ ] Dokumenten-Zuweisung zur Kundenakte

### 2.4 Umschaltung
- [ ] V2 intern testen (Vertrieb + Buchhaltung)
- [ ] Wenn stabil: V1-Kachel auf „Legacy“ setzen, V2 als Standard empfehlen
- [ ] V1 erst entfernen, wenn V2 4+ Wochen fehlerfrei läuft

**Deliverable:** V2 produktionsreif, V1 weiterhin verfügbar.

---

## Phase 3 — Angebote & Auftragsbestätigungen

### 3.1 Angebote
- [ ] Freies Schreiben **ohne** Produktanlage, Seriennummer oder IC-Nummer
- [ ] „Neutrale Bestellung“ als PDF (wie aktuelles Bestellformular) per E-Mail + Signing
- [ ] PDF-Vorschau live beim Speichern
- [ ] Vorlagen-System
- [ ] Laufende Angebotsnummern (einstellbar)
- [ ] Kleine PDF-Dateigröße (Komprimierung)
- [ ] Ablage Supabase + OneDrive, Historie am Kunden

### 3.2 Auftragsbestätigungen (neu — existiert in Odoo nicht)
- [ ] Kunde bestätigt Angebot per **Link** mit Warn-Popup + AGB-Hinweis
- [ ] Bei Bestätigung: automatisch Rechnung generieren & versenden
- [ ] Historie: „Rechnung entstanden aus Auftragsbestätigung #…“
- [ ] **Manuelle Bestätigung** weiterhin möglich (für nicht-technikaffine Kunden)
- [ ] Vollständige Historie aller Schritte

**Deliverable:** Angebots- und Bestätigungsworkflow ohne Odoo.

---

## Phase 4 — Rechnungen & Buchhaltung

### 4.1 Rechnungserstellung
- [ ] Aus Angebot, aus Lieferschein, manuell
- [ ] Vorlagen mit **PNG-Kopf- und Fußzeile** (einfach einfügbar)
- [ ] Live-Vorschau (aktualisiert sich beim Speichern)
- [ ] Intelligente **Seitenumbrüche** (kein isolierter Text auf Seite 2)
- [ ] PDF-Download jederzeit
- [ ] Laufende Rechnungsnummern (einstellbar, lückenlos)

### 4.2 Zahlungen & Sonderfälle
- [ ] Anzahlungen, Teilzahlungen (terminierbar), Sonderzahlungen
- [ ] Benachrichtigung an Buchhaltung bei fälligen Teilzahlungen
- [ ] Anbindung Mahnwesen (Phase 8)
- [ ] **Leasing-Modell:** Rechnungsempfänger (AGL) ≠ Leasingnehmer — beide verknüpft, Kundenakte zeigt alle Maschinenrechnungen

### 4.3 Storno & Compliance
- [ ] Storno → automatische Stornorechnung
- [ ] GoBD: validierte Rechnungen unveränderbar (Preis, Menge, Inhalt)
- [ ] Adress-/Notizänderungen ohne Storno erlaubt
- [ ] **E-Rechnung** (deutscher Standard: XRechnung/ZUGFeRD)
- [ ] Audit-Trail: jede Änderung mit Datum, Uhrzeit, User

### 4.4 Freigabe-Workflow
- [ ] Vertrieb erstellt Rechnung → Status „Zur Freigabe“
- [ ] Benachrichtigung an `buchhaltung@eistechnikcenter.de`
- [ ] Admin kann Freigabe-Pflicht pro Rolle einstellen

### 4.5 Beleg-OCR (KI)
- [ ] Belege hochladen → KI liest Felder aus (wie Odoo OCR)
- [ ] Buchhaltungsordner in OneDrive
- [ ] Dynamische Steuer-Engine (Land, innergemeinschaftlich, Drittland — regelbasiert, ohne Code-Änderung)

**Deliverable:** Vollständiger Rechnungszyklus inkl. E-Rechnung.

---

## Phase 5 — Lager, Lieferscheine & Wareneingang

### 5.1 Lagerbestand
- [ ] Produkte mit individuellen Feldern je Produkttyp
- [ ] Bestand mit **MHD** (z. B. Softeismix: 20× bis Juli, 30× bis September)
- [ ] Benachrichtigung 2 Wochen vor MHD an Lagermitarbeiter
- [ ] Atomare Bestandsbuchung bei Verkauf, Storno, Retoure
- [ ] Sperre bei negativem Bestand (konfigurierbar)
- [ ] Notizhistorie pro Produkt mit @-Erwähnungen
- [ ] Verknüpfung Lieferanten, Liste Kunden die Produkt kauften

### 5.2 Lieferscheine
- [ ] Erstellung aus Auftrag/Rechnung
- [ ] **Aufteilbar:** mit/ohne Berechnung, getrennte Lieferscheine (Starterpaket-Szenario)
- [ ] Laufende Lieferscheinnummern
- [ ] Inhalte **durchsuchbar** (Maschine, Rohstoff)
- [ ] Von Produkt aus aufrufbar

### 5.3 Wareneingang
- [ ] Lieferschein hochladen → Wareneingang buchen
- [ ] **Barcode-Scan** per Handy-Kamera (WebApp)
- [ ] Shopify-Schnittstelle (Bestandssync)

### 5.4 Produkte-Modul
- [ ] Produkte-Kachel auf Supabase umstellen
- [ ] Import bestehender Odoo-Produkte

**Deliverable:** Lagerlogik ohne Odoo-Bestandsfehler.

---

## Phase 6 — Kommunikation, Mail & Benachrichtigungen

### 6.1 E-Mail-System
- [ ] E-Mails aus Tool schreiben (Rechnungen, Tickets, Kontakte)
- [ ] CC & BCC
- [ ] Vorlagen mit zuordenbarem Postausgangsserver (z. B. `vertrieb@` auch bei privatem Login)
- [ ] **Outlook-Anbindung:** gesendete Mails landen im Outlook-Gesendet-Ordner
- [ ] E-Mail-Verlauf in Kundenakte, CRM, Tickets, Rechnungen

### 6.2 Benachrichtigungssystem
- [ ] In-App-Benachrichtigungen (alle Module)
- [ ] E-Mail-Benachrichtigungen (konfigurierbar pro User)
- [ ] @-Erwähnungen in Notizen → Push/In-App

### 6.3 Newsletter-Tool
- [ ] Zielgruppen nach Lieferschein-Artikeln (Maschinenkäufer, Rohstoffkäufer, …)
- [ ] Brevo-Integration (Kundenliste + Tags sync)
- [ ] Abmeldung, Blockliste (z. B. bei Gerichtsverfahren → auto Block + Fotoeinwilligung entfernen)

### 6.4 Signing-Tool (global)
- [ ] Handschriftliche Unterschrift für alle Dokumenttypen
- [ ] Wiederverwendung in Angeboten, Bestellungen, Lieferscheinen, Verträgen

**Deliverable:** Kommunikation und Notifications ohne Odoo Chatter.

---

## Phase 7 — Auslieferungsplanung & Auslieferungs-App

### 7.1 Tourenplanung (Desktop)
- [ ] Deutschlandkarte (Maps API)
- [ ] Kunden aus Angeboten/Rechnungen geografisch anzeigen
- [ ] Touren zusammenstellen und optimieren
- [ ] Maschinen aus offenen Aufträgen berücksichtigen

### 7.2 Auslieferungs-App (iPad / Tablet)
- [ ] Schritt-für-Schritt-Assistent für Auslieferer
- [ ] Pflicht-Checkliste: Ausweis fotografieren **zuerst**, dann Vertragsprozess
- [ ] Dokumente durchscrollen, Unterschrift pro Seite/Feld (konfigurierbar)
- [ ] SEPA-Formular direkt ausfüllbar
- [ ] Retouren: Positionen abwählen → automatisch Lager-Rückbuchung
- [ ] KI-Unterschriftsvergleich (Ausweis vs. Vertrag, mit Toleranz)
- [ ] Abschluss: alle Dokumente per E-Mail an Kunde + Willkommensmail
- [ ] Benachrichtigung an `buchhaltung@` bei abgeschlossener Auslieferung
- [ ] Status in Buchhaltung: „ausgeliefert & erledigt“

### 7.3 PWA / Native Apps
- [ ] Progressive Web App für Tablet/Smartphone
- [ ] Später: native iOS & Android (wenn Browser-Version nicht reicht)

**Deliverable:** Papierloser Auslieferungsprozess end-to-end.

---

## Phase 8 — Erweiterte Module

### 8.1 Mahnwesen
- [ ] 4-stufiges automatisches Mahnwesen
- [ ] Manuell steuerbar
- [ ] Übersicht: offene Rechnungen, Mahnstufe, Überfälligkeit
- [ ] E-Mail-Vorlagen, Inkasso-Vorlagen
- [ ] Verknüpfter E-Mail-Verlauf

### 8.2 Servicetickets
- [ ] Auto-Zuordnung Kunde
- [ ] Mehrdeutigkeit: „3 potentielle Zuordnungen — bitte auswählen“
- [ ] Alle Infos der Kontaktkarte eingebunden

### 8.3 Kundenportal (Dokumenten-Tresor)
- [ ] Zugänge durch Mitarbeiter/Admins verwaltbar
- [ ] **Nur** Dokumenten-Tresor: Rechnungen, unterschriebene Auslieferungsdokumente
- [ ] Pro Maschine: Bedienungsanleitung, Bedienungsvideos (erst Firmenvideos, später individuell)
- [ ] Kein Zugang zu internen Daten

### 8.4 Fuhrparkmanagement
- [ ] Fahrzeuge, Raten, Laufzeit, Fahrer, Tankkarte
- [ ] Versicherung + Kosten, Unterlagen, GPS-Tracker-Anbindung

### 8.5 Leasing (AGL)
- [ ] Leasingraten am Kunden hinterlegen
- [ ] Optional: Schnittstelle AGL (Ratenzahlungsstatus)

### 8.6 Vertragsunterschriftstool
- [ ] Vertragsvorlagen, mehrseitige Unterschriften, Pflichtfelder

**Deliverable:** Alle Randmodule produktiv.

---

## Phase 9 — Odoo-Abschaltung

### 9.1 Migrations-Checkliste
- [ ] Alle Kunden in Supabase (inkl. Historie, E-Mails, Dokumente)
- [ ] Alle Produkte & Lagerbestände abgeglichen
- [ ] Alle offenen Angebote, Rechnungen, Lieferscheine migriert
- [ ] Buchhaltungs-Export für Steuerberater validiert
- [ ] 4 Wochen Parallelbetrieb ohne Odoo-Zugriff durch Team

### 9.2 Abschaltung
- [ ] Odoo API-Keys deaktivieren
- [ ] Odoo.sh Subscription beenden
- [ ] `odoo-client.ts` und Odoo-Fallbacks entfernen
- [ ] Dubletten-Check-Kachel entfernen (einmalig genutzt)

### 9.3 Nachbetreuung
- [ ] Monitoring-Dashboard für alle Schnittstellen
- [ ] Error-Alerting (E-Mail/Slack bei Sync-Fehlern)
- [ ] Tägliche Backups (DB + Storage), versioniert, DSGVO-konform

**Deliverable:** Odoo vollständig ersetzt.

---

## Modul-Abhängigkeiten (Bau-Reihenfolge)

```
Phase 0 (Fundament)
    └── Phase 1 (Auth + Kontakte)
            ├── Phase 2 (Bestellformular V2)
            ├── Phase 3 (Angebote)
            │       └── Phase 4 (Rechnungen)
            │               ├── Phase 5 (Lager/Lieferscheine)
            │               │       └── Phase 7 (Auslieferung)
            │               └── Phase 8.1 (Mahnwesen)
            └── Phase 6 (Mail/Notifications) — parallel ab Phase 3
                    └── Phase 8.3 (Kundenportal)
```

---

## Sicherheit & Compliance (querschnittlich, ab Phase 0)

| Anforderung | Umsetzung |
|-------------|-----------|
| Hosting EU | Supabase `eu-central-1` |
| RLS | Alle Tabellen, `auth.uid()` Pflicht |
| Verschlüsselung | `pgcrypto` für IBAN, Steuer-Nr., Ausweisdaten |
| 2FA | Verpflichtend für alle 11 User |
| Audit-Log | `audit_logs`, manipulationssicher |
| Storage | Private Buckets, Signed URLs ≤ 5 Min |
| API-Keys | Nur `anon_key` im Frontend |
| Backups | Täglich, versioniert, separater Speicherort |
| GoBD | Unveränderliche validierte Belege |
| E-Rechnung | XRechnung/ZUGFeRD ab Phase 4 |
| DSGVO | AVV, Fotoeinwilligung, Newsletter-Blockliste |

---

## Externe Schnittstellen (Übersicht)

| System | Zweck | Phase |
|--------|-------|-------|
| **Supabase** | DB, Auth, Storage, Edge Functions | 0 |
| **OneDrive** (1 TB) | PDFs, Belege, Anhänge | 0 |
| **Odoo API** | Legacy bis Ablösung | 0–8 |
| **Outlook** | Gesendete Mails synchron | 6 |
| **Brevo** | Newsletter, Kundenlisten | 2, 6 |
| **Shopify** | Online-Shop Lager sync | 5 |
| **OpenRouteService / Maps** | Anfahrtskosten, Tourenplanung | 7 |
| **KI-OCR** | Belege einlesen | 4 |
| **Bunny CDN** | Optional öffentliche Assets | 4 |
| **AGL** | Leasing-Ratenstatus | 8 |
| **GPS-Tracker** | Fuhrpark | 8 |

---

## Nächste konkrete Schritte (Sofort)

1. **Vercel:** Root Directory → `Eistechnik-App` + Supabase Env-Vars setzen
2. **Freigabe & Push** nach lokalem Test (Login → V1/V2 → Bestellformular V1)
3. **Phase 0.4:** Schema `orders` + Bestellungen aus V1 parallel in Supabase speichern (höchste Priorität)
4. **Phase 0.4:** Odoo-Kundenexport → Supabase + Dubletten-Kachel (in V2)
5. **Phase 1** starten: Supabase Auth + 2FA für Team

---

## Offene Entscheidungen

| Frage | Optionen | Empfehlung |
|-------|----------|------------|
| KI-OCR Anbieter | Azure Document Intelligence, Google Vision, OpenAI | Azure (EU-Region, DSGVO) |
| Maps API | Google Maps, Mapbox, OpenRouteService | OpenRouteService (bereits im Projekt) |
| Native Apps | PWA first vs. React Native | PWA in Phase 7, Native wenn nötig |
| E-Rechnung Library | mustangproject, Konik | mustangproject (Open Source, ZUGFeRD) |
| OneDrive vs. Bunny | OneDrive für interne Docs, Bunny für CDN | Hybrid wie im Gedankenprotokoll |

---

## Referenzen

- Anforderungen (Roh): [gedankenprotokoll.md](./gedankenprotokoll.md)
- Technische Odoo-Infos: [INFO.md](./INFO.md)
- App-Code: [Eistechnik-App/](./Eistechnik-App/)
