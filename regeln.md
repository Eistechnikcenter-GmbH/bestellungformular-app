# Regeln — ETC-App Entwicklung

Diese Regeln gelten für alle weiteren Änderungen an der ETC-App. Bitte immer einhalten.

---

## 1. Ehrliche technische Einschätzung

Gib **niemals pauschal recht**, wenn etwas technisch keinen Sinn macht, sich widerspricht, eine andere Funktion behindert, technisch unmöglich ist oder aktuell nicht geht und andere Software, Lizenzen oder Zugriffe braucht.

### 1.1 Chaotische Anforderungen

Wenn Anforderungen durcheinander oder nicht in der richtigen Reihenfolge kommen — das ist normal. Sortieren, priorisieren und bei Widersprüchen nachfragen.

---

## 2. Projektplan im Blick behalten

Egal wie viele Zwischenänderungen geplant sind: immer **[Projektplan.md](./Projektplan.md)** als Leitfaden nutzen. Phasen anpassen, erweitern oder umsortieren, wenn nötig.

### 2.1 Nächster Schritt nach Freigabe

Am Ende einer Änderung vorschlagen, was als Nächstes ansteht — **erst nach Freigabe und erfolgreichem Push** (siehe Regel 7).

---

## 3. Fragen stellen statt raten

Nicht pauschal immer Fragen stellen — aber **wenn** etwas unklar, widersprüchlich oder technisch nicht machbar ist: gezielt fragen, sodass danach klar ist, wie weitergearbeitet wird. Bei unklaren Antworten nachfragen.

---

## 4. Localhost (Port 3000) — immer prüfen, starten, ggf. neustarten

Der Dev-Server (`localhost:3000`) ist **nach jedem Rechner-Neustart offline**. Das ist normal — nicht davon ausgehen, dass er noch läuft.

### 4.1 Ablauf nach jeder Änderung (Pflicht)

1. **Prüfen**, ob Port 3000 belegt ist (`lsof -ti:3000` oder Health-Check `curl http://localhost:3000/api/health`)
2. **Wenn offline** → Server starten (`cd Eistechnik-App && npm run dev`)
3. **Wenn bereits online** → Server **neu starten** (kill + `npm run dev`), damit Änderungen sicher geladen werden
4. **Ausnahme:** Wenn die Änderung **erst eingepflegt** wurde und der Server **danach zum ersten Mal** gestartet wird → kein extra Neustart nötig
5. **Am Ende bestätigen**, dass `localhost:3000` erreichbar ist (kein `ERR_CONNECTION_REFUSED`)

### 4.2 Warum

Ohne laufenden oder frisch gestarteten Server gibt es oft **Internal Server Errors** oder die Seite ist komplett offline — auch wenn der Code korrekt ist.

### 4.3 Kurz-Checkliste

| Situation | Aktion |
|-----------|--------|
| Rechner neu gestartet | Server starten |
| Änderung gemacht, Server war aus | Erst ändern, dann starten |
| Änderung gemacht, Server lief schon | Server neustarten |
| Vor „bitte testen“-Hinweis an Nutzer | Immer prüfen, dass Server läuft |

---

## 5. Projektplan aktuell halten

Nach jedem Prompt / jeder Änderung **Projektplan.md** prüfen und bei Bedarf aktualisieren, erweitern oder bereinigen.

---

## 6. Supabase & Deploy automatisiert

Supabase-Migrationen, Git-Push und Vercel-Deploy sollen von hier aus vollständig automatisiert ablaufen — ohne manuelle Zwischenschritte, sobald Freigabe erteilt ist.

---

## 7. Freigabe vor Push

Nach jeder implementierten Änderung:

1. **Beschreiben**, was geändert wurde und **was getestet werden muss**
2. **Fragen**, ob die Änderung funktioniert
3. **Erst pushen**, wenn Freigabe erteilt wurde
4. **Nächsten Schritt vorschlagen**, wenn der Nutzer bestätigt: **„Push war erfolgreich“** (Deployments können fehlschlagen)

---

## 8. Immer Production deployen

Pushes immer auf **Production** — kein Preview-Deploy, um Doppelarbeit zu vermeiden.

---

## 9. V1 vs. V2 (kritisch)

| Version | Route | Regel |
|---------|-------|-------|
| **Version 1** | `/v1` | Bestehende Übersicht und Bestellformular **unverändert** lassen. Team arbeitet weiter damit. |
| **Version 2** | `/v2` | Alle neuen Features und UI-Änderungen nur hier. |
| **Auswahl** | `/` nach Login | Disney+-Style: Nutzer wählt V1 oder V2. |

- Bestellformular-Änderungen nur mit lokalem Test bis Freigabe
- Ziel: Bestellungen möglichst schnell zusätzlich in **Supabase** speichern — ohne V1 zu brechen
