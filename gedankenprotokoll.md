Also wir müssen eigentlich Odoo im CRM / Lager / Produkte / Angebote / Rechnungen / Kontakte / Vertragsunterschriftstool / das bereits eingebaute Bestellungstool / Buchhaltungstool „nachbauen“ – zusätzlich noch eine Funktion „Auslieferungsplanung“, welches mit Tools interagiert und sowohl die Maschinen aus den Angeboten und Rechnungen immer berücksichtigt mit einer Maps api Schnittstelle. Damit er auch in einer Deutschlandkarte die Kunden auswählt und sieht, wo die sich geografisch befinden, damit er eine perfekte Tour zusammenstellen kann. Des Weiteren muss alles steuerlich sauber gebaut werden müssen, damit wir so einfach wie möglich Belege hochladen können. Wir müssen eine KI anbinden die eingelesene Belege ausliest und diese automatisch einliest wie in Odoo die OCR Funktion. Angebote und Rechnungen sowie Lieferscheine und jegliche Form von Gutschriften muss eine saubere frequentier laufende Nummer haben. Das muss in den Einstellungen alles einstellbar sein. Lieferscheine müssen aufgeteilt werden können mit und ohne Berechnung oder in zwei separat aufgeteilte. Weil wir oft beim Verkauf von einer Eismaschine immer ein sogenanntes „kostenloses Starterpaket“ mitgeben. Da ist dann kostenloses Eis mit dabei. In Zukunft soll dann auch über eine „Auslieferungsapp“ für den Auslieferer alles am iPad machbar sein, sprich den Lieferschein durchgehen und unterschreiben aufm iPad. Es muss auch direkt das Sepa mit ausgefüllt werden können. Und wenn dann der Kunde abgehackt wird, wird alles als erledigt bei der Buchhaltung erscheinen mit einer Benachrichtigung an buchhaltung@eistechnikcenter, dass der Kunde ausgeliefert worden ist. Der Kunde muss eine volle Historie haben. Ganz am Anfang soll unbedingt nach importieren aller aktuellen Kunden mir ein separates Feld (kachel) erstellt werden temporär, welche doppelte Kunden findet und anzeigt. Das wäre super wichtig beim exportieren der Kunden und crm akten die email verläufe sowie zugewiesene Dokumente von Odoo auch als information mitzunehmen. Es muss möglich sein, den Email verlauf von CRM oder Kontakt und Serviceticket ebenfalls zu exportieren und mitzunehmen. Das tool soll in chrome über die Web-app funkion genau so super laufen wie aktuell odoo, damit man nicht immer den Browser dafür braucht. (ios und android App wäre super gleich mit einzuplanen, weil die Browser version nicht so gut funktioniert auf tablets oder handys, es muss intuitiv funktionieren. Wir müssen die aktuellen Kundendaten direkt in Supabase einarbeiten – auch alle möglichen 
Design:
- Es soll eine Übersicht auf 75% des width des Browsers auf jeden Fall alles in Kacheln angezeigt werden
- minimalistisch und schön gestaltet mit dem Logo von Eistechnikcenter

Bestellungstool:
- das soll während der Neuentwicklung erst mal so wie es grad ist unangetastet werden. Es soll dann eine V2 nebendran erstellt werden, damit der Vertrieb es weiterhin nutzen kann, wenn wir die Meilensteine in github pushen.
- die V2 muss aufjedenfall zwischen Lieferadresse und Rechnungsadresse unterscheiden können
- hier ist es super wichtig, dass in der Bestellung noch eine Checkbox angeklickt werden kann (immer automatisch ausgewählt ist) es sei denn die kunden wollen das nicht sollen dann auf die email buchhaltung@eistechnikcenter.de eine Abmeldung fordern oder beim ersten Newsletter dann auf abmelden klicken und abmelden. Der Mailer muss das anbieten. 

Rechnungen
- müssen auf jeden Fall auch Vorlagen haben
- Rechnungen müssen aus Angebote erstellt werden können
- Rechnungen müssen aus Lieferscheinen generiert werden können
- ich muss einfache PNG’s bei der Bearbeitung der Rechnungen einfügen können damit ich Kopf und Fußzeile schön designed haben
- die MB der Bestellungen oder Angebote als PDF müssen maximal klein gehalten werden
- Es müssen Sonderzahlungen, Teilzahlungen  (Teilzahlungen sollen auch terminierbar sein inkl. Notification an die Buchhaltung – sprich wie viel bis wann ausgeglichen werden soll – sowie Implementierungen in das Mahnwesen) gemacht werden können oder Anzahlungen
- alles muss sich aber den deutschen E-Rechnungsstandard halten
- Es soll unbedingt die Möglichkeit bestehen z.B. wenn man Rechnungen an die Leasingesellschaften schreibt, dass man einen weiteren „Kunden“ anbindet weil die Rechnung geht zwar an den „Kunden“ bzw. Rechnungsempfänger AGL (Leasing Gesellschaft) aber ist für den Leasingnehmer (der eigentliche Kunde) dann verknüpft, das geht aktuell mit Odoo nicht. Sprich wir können beim Anklicken eines Kunden und öffnen der Kundenakte nicht einfach einsehen, welche Maschinenrechnungen für diesen Kunden rausgingen, WENN der Kunde über AGL die Maschine geleased hat. Das hat zur Folge, dass man in Odoo keine Rechnungen einsehen kann die an die AGL geschrieben worden sind, aber für diese Kunden (Leasing Nehmer) gedacht waren.
- wenn jemand mit „normalen“ Rechten sprich z .b. vertrieb Rechnungen schreibt, wäre das super wenn das zur Freigabe an die Buchhaltung gehen würde via Benachrichtigungen direkt an die Buchhaltung@ email gehen. Bis man in dann in den Einstellungen als Admin die jeweiligen Rechte wieder anpasst. 
- jede Rechnung soll problemlos storniert werden können es muss eine saubere Historie sein, wann immer jemand was geändert hat muss das mit datum und Uhrzeit sowie nutzer dokumentiert werden
- wenn eine Rechnung storniert wird muss automatisch eine Stornierungsrechnung erstellt werden
- Alle Rechnungen müssen eine saubere Vorschau haben wie das dokument wirklich aussieht und automatisch aktualisiert werden, wenn der Nutzer auf speichern geht. 
- Änderungen in den Notizen oder Adressänderungen z.B. Lieferadressänderungen (wenn vom selben Kunden) soll nicht grund sein um es zu stornieren, was nach der „bestätigten“ oder „validierten“ Rechnung nicht mehr geändert werden sollte ist preis + Anzahl sowie der eigentliche Rechnungsinhalt.
- Man sollte immer problemlos die PDF ausleiten können via „PDF runterladen“ 
- eine Intelligente Seitenzählung  sowie Seitenaufteilung sollte aufjedenfall gut funktionieren: Damit meine ich speziell die Seitenumbrüche. Oft ist es aktuell bei Odoo so, wenn einige positionen sind, dann landet nur der Rechnungstext oder signatur-linie auf der zweiten seite .. sonst nichts, das ist total störend weil man das auch nicht wirklich zurecht „schieben“ kann. Das müsste super intelligent gelöst werden

Auftragsbestätigungen
-	Aktuell nicht vorhanden in Odoo: Auftragsbestätigungen
-	Kunde bekommt Angebot geschickt, kann entweder über einen link das Angebot anklicken und auf bestägigen klicken – mit einem Info-Popup: „Sind Sie sicher, dass Sie dieses Angebot verbindlich bestätigen wollen, damit bestätigen Sie den Auftrag und sind verpflichtet die nachfolgende Rechnung zu bezahlen“ <- hierzu auf die AGB’s hinweisen
o	Wenn das so klappen wird, wird automatisch eine Rechnung generiert und zugesandt – in der Historie der Rechnung muss auch stehen, dass es aus diesem Vorgang entstanden ist
-	Oder man bestätigt das Angebot selber manuell, wenn der Kunde über den „altmodischen“ weg das via Email bestätigt hat, nicht alle sind sehr Technik afin und möchten das so machen, manuelle schritte müssen immer noch möglich sein
-	Wichtig: Dass die Historie all das dokumentiert

Angebote
- die müssen einfach schreibbar sein, ohne ein neues Produkt anzulegen, ohne eine Seriennummer oder IC Nummer zu wählen – aber man sollte eine „normale“ neutrale Bestellung (wie sie aktuell besteht) abschicken können als pdf direkt via E-Mail über ein signing tool und das dann über supabase als pdf ablegen und in die Historie des Kunden einsehen können – sowie einen Dokumenten Zuweisung
- PDF Vorschau muss gegeben sein beim speichern 
- wenn Änderungen hinzukommen müssen diese direkt in der Vorschau nach speichern des Angebots aktualisiert werden
Einstellungen:
- es muss einmal nur Einstellungen zu name vorname profilbild sowie signatur für jeden
- Nutzer soll die Möglichkeit haben seine Signatur einzustellen, sowie profilbild und alle anderen persönlichen Daten
- passwort ändern sowie zurücksetzen
- nutzer muss einen Log haben, wann er von welchem Ort online war
- 2FA zu aktivieren oder ändern 
- in den Einstellungen der administratoren muss man eine übersicht haben, über alle mit arbeiter, sowie welche entfernen oder neue hinzufügen
- in den Einstellungen sollten die Admins aufjedenfall rechts zuweisen oder entfernen können. 

Lager (+ Lieferscheine (Lieferung) + Eingänge (Einkäufe, Anlieferungen))
- muss am besten mit Shopify eine Schnittstelle haben
- muss einen sauberen Wareneingang haben – sprich Lieferschein hochladen und dann 
- eine Scanfunktion, mit der man mit dem Handy Barcodes einlesen kann. 
- Es muss unbedingt auch bei den Lieferscheinen die Inhalte suchbar sein, z.B. wenn eine Maschine oder ein Rohstoff verwendet worden ist. 
- bei der Erstellung der Lieferscheine sollte natürlich die Produkte auffindbar sein
- die Produkte sollen auch über den Lieferschien aufrufbar sein
- Grundsätzlich soll auch bei jedem Produkt (wie aktuell bei Odoo) eine Notizhistorie sein, damit schreiben kann 
- Eingeben Lagerbestand Anzahl mit MHD (z.B. von Softeismix 20 mit MHD bis Juli und 30 mit MHD bis September) und dann eine Benachrichtigung an Lagermitarbeiter, wenn ein MHD 2 Wochen vor MHD ist. 
- Individuelle Felder je nach Produkttyp
- Verknüpfung / Erwähnung mit Lieferanten
- Liste der Kunden, die dieses Produkt gekauft haben
Servicetickettool: 
- Kunde muss automatisch zugeordnet werden
- wenn mehrere Kunden laut suche zugeordnet werden könnten muss eine meldung kommen „3 potentielle Zuordnungen gefunden bitte auswählen“
- das Servicetool muss alle Infos der kontaktkarte beinhalten
Kontakte: 
- So wie in odoo aktuell und noch mehr. Alle admins sollen oben die möglichkeit haben mehrere Felder hinzuzufügen wie das „odoo-studio“ tool um noch mehr felder hinzuzufügen
- Kunden müssen Stichwörter haben sowie Branchen
- kunden müssen quellen haben z.B. von Meta Ads oder Glorya so wie aktuell
- in der Kundenakte muss wie in odoo aktuell eine übersicht sein, wie viele Lieferscheine erstellt worden sind, oder Rechnungen ob tickets offen oder geschlossen sind- wenn man dann zum Beispiel auf „Lieferscheine“ geht muss man direkt diese abrufen können oder in die Lieferschein app rein gehen und direkt einen suchfilter offen haben der nur lieferscheine zu diesem kunden anzeigt. Sprich es muss eine perfekte Verknüpfung zu allen dokumenten haben
- der Kontakt muss eine sehr übersichtliche und einfache Lösung haben, wie verschiedene Ansprechpartner / GbR-Inhaber / GmbH-Geschäftsführer
- beim erstellen eines neuen kontaktes MUSS das tool sofort welche Vorschlagen oder wenn sich zwar der Name der Gmbh Gbr oder des Unternehmens allgemein von dem unterscheidet, was schon angelegt ist, aber spätestens beim Eintragen der Email oder Telefonnummer MUSS das System vorwarnen, dass der Kontakt bereits existiert.
- bei kontakten müssen wir auch suchlisten einbauen können wir müssen kunden mit gewissen produkten verbinden können
Alle Kontakte müssen mit supabase zeitgleich synchronisiert werden, sobald eine angelegt wird, muss es direkt in Supabase abgelegt werden, dass wenn das Tool fertig ist, wir uns von Odoo abkapseln können. 
Chatter / Email historie
- Der Nutzer muss bei jedem Produkt Notizen hinterlegen können (wie in odoo aktuell) und in diesen Notizen auch Leute mit @ erwähnen können, die dann eine Benachrichtigung bekommen.
- Nutzer soll problemlos direkt bei Rechnungen oder Tickets eine Email aus dem System schreiben können – damit die dann in Outlook im jeweiligen Email account auch im gesendeten Ordner landet + soll man wie aktuell bei Odoo auch mit Vorlagen arbeiten können, und dann die Vorlagen eventuell anderen Postausgangsserver zuordnen können, zB. Wenn vertriebler mit ihren privaten emails eingeloggt sind, aber Angebote oder Kommunikationsemails immer von „vertrieb@“ z.B. schreiben können
- Emails aus System mit CC & BCC Möglichkeit (aktuell in Odoo nicht möglich)

Zugang Kunde: 
-	Unabhängig von allen Funktionen müssen aber Mitarbeiter und Amins die Zugänge von Kunden verwalten können
-	Die EINZIGE Funktion dieses Zugangs soll auf keinen Fall zu irgendwelchen Internen Sachen sein NUR ausschließlich zu eine Art Dokumenten “tresor“ – dass der Kunde jederzeit seine Dokumente einsehen kann, sowie Rechnungen und alle unterschriebenen Auslieferungsdokumente
-	Eine weitere Einsicht soll der Kunde passend zu seiner Maschine folgende Sachen sehen können:
o	Bedienungsanleitung zur individuellen Maschine
o	Sowie 
o	Bedienungsvidoes (die wir alle noch erstellen müssen) – vorerst temporär die Firmeneigenen Videos, bis wir alle selber erstellen. Aber das wäre das Ultimative Endlevel dieses tools
o	Und alle mitarbeiter und admins sollen alles dem Kunden hinzufügen oder entfernen
	Im bestenfall ist schon alles einzusehen was schon im Verkaufsprozess alles hinterlegt worden ist

Genauso auch das Lager mit allen aktuellen Produkten. 
Aktuell läuft noch alles über API zu Odoo, Ziel ist es sich langsam von Odoo abzukapseln. Aber es bleibt so lange bestehen, bis alle Funktionen über Supabase funktionieren.
Es müssen auch folgende Funktionen noch implementiert werden: 
- mailer (damit auch der Verlauf mit den Kunden über CRM und Kontakte und Rechnungen dokumentiert werden kann) aktuell steht im Raum. 
- Outlook Anbindung, damit über das Tool die E-Mail gesendet wird, aber dann in dem jeweiligen Ausgangsserver landet. 
- signing tool (nur die händische Unterschrift – kein vorgefertigter Name) 
- eine Schnittstelle zu Google Drive/ OneDrive, damit immer die aktuellsten PDF Anhänge sowie Angebotsanhänge immer abrufbar sind, damit wir nicht den recht begrenzen Speicher von supabase oder Vercel voll machen .. wir haben 1TB auf OneDrive zur Verfügung
- Schnittstelle zu Bunny CDN oder Microsoft OneDrive könnte hier auch ausreichen wo ein separater buchhaltungsordner für die Belege und Lieferscheine für den Wareneingang passiert
- ein barcode leser, damit die Handyversion der Browseransicht oder WebApp später dann via handy-photo ab auch den Barcode den wir extra anbringen scannen und ablesen kann. 

Notificationsystem
Das Tool soll unbedingt die Nutzer immer und überall über alles benachrichtigen
Newslettertool 
- man muss hier den bezug herstellen zwischen kunden und den artikeln auf den lieferscheinen. Z.B. sortieren nach „allen Kunden die eine Maschine erhalten haben“ oder „alle Kunden die Rohstoffe gekauft haben“ 
- dann kann man denen angebote verschicken als Newsletter oder als Liste abtelefonieren

Mahnwesen:
- 4-stufiges automatisches Mahnwesen und bei E-Mail werden die offenen Rechnungen versendet. Man kann das Versenden der Mahnungen aber manuell umstellen.‘
- separates Mahnungstool mit vollständige offene Rechnungen und welche Mahnung wann versand wurden und mit verknüpften Emalverlauf‘
- wann ist wie viel überfällig
- automatische Emailvorlagen an inkasso
Bei Kunden:
-	 hinterlegen der Leasingraten und evtl. Schnittstelle zu AGL, um zu sehen, ob die Raten bezahlt werden
-	Verknüpfung Kunde → Maschine, Rohstoff Käufe, Tickets
-	Bei den Kunden Möglichkeit Tags hinzuzufügen nach denen man auch filtern kann. Diese sind vordefiniert, aber man kann bei Bedarf auch neue hinzufügen → Meta, Google, Kaltkontakt, Webseite, Eisfachschule, Ebay, Serviceticket sowie Tags welche Art von Geschäft (Eisdiele, Kino, Imbiss, Foodtruck, Freibad, Burgerbude) 
-	Checkfeld inkl. Hinterlegtem Dokument, ob Fotoeinwiligung gegeben wurde.
-	Prüfen Brevo Verknüpfung, um immer die aktuelle Kundenliste inkl. aller Kontaktdaten und der Tags nutzen zu können. Dann kann man auch personalisiert und Zielgruppenspezifische Newsletter versenden. 
o	Und später noch ein Schritt weiter, sobald es mit diesem Kunden vor Gericht geht → wird dieser automatisch auf Blockliste für Newsletter gesetzt und Checkfeld für Fotoeinwillugung entfernt → Benachrichtigung geht raus
Fuhrparkmanagement: Autos hinterlegen, Raten und Laufzeit, wer fährt, Tankkarte, Versicherung inkl. Kosten, Anbinden der Unterlagen, Verknüpfung mit GPS Tracker System


Wie das Tool am Ende auszusehen hat: 
-	Am ende muss es einen sauberen zusammenhang zwischen Kunde und Maschine, sowie ggfs. Rohstoffe und allen anderen Tools haben
-	Aktuell: 
o	Maschinenausliefer nehmen viele Papiere mit und lassen es unterschreiben
o	Fotografieren die Personalausweise (oder lassen kopieren) 
o	Wenn der ausliefer dann die Papiere händisch übergibt, pflegt die buchhaltung alles via kopie ein
o	= doppelte Arbeit, dauert alles zu lange, Fehleranfällig, nicht immer sauber dokumentiert (wenn jemand nicht aufpasst). Dokumente können vergessen werden, vergessen oder verloren werden, der Vertrieb rennt den Kunden hinterher um Dokumente notfalls nachzuliefern
-	So muss das tool funktionieren, wenn es fertig ist: 
o	Auslieferer hat seinen perfekt organisierten und geplanten Auslieferungsplan
o	Er/Sie hat sein iPad dabei und klickt den Auslieferungsauftrag an
o	Alles ist sauber und perfekt dokumentiert und schon vorbereitet
	Mal mit Leasingvertrag, mal nur Lieferscheine – also sehr individuell je nach Vorbereitung
o	Er/Sie klickt sich durch den Auslieferungs-Prozess-App und springt von Unterschrift zu Unterschrift oder geht den ganzen vertrag via scrollen einmal durch
	Da wird er vermutlich nochmal Kopien dabei haben aber unterschrieben wird auf dem Tablet
o	Dann wird Ausweis oder Reisepass und ggfs. Aufenthaltstitel fotografiert
o	IM BESTEN FALL geht eine Ki die Unterschrift auf dem Ausweisdokument sowie den frisch unterschriebenen Dokumenten einmal durch wenn voneinander stark abweichen wird eine neue Unterschrift gefordert (das darf nicht ZU GENAU sein, sonst würde das ständig nicht vorwärts gehen, eine gewissen toleranz muss sein
o	Nach Abschluss dieses Vorgangs bekommt der Kunde alle unterschriebenen dokumente via email und willkommensemails etc.
o	Der Auslieferer muss während den unterschriften noch entscheiden können wenn beim Warenlieferschein dinge dabei sind, die der Kunde nicht will, dass es noch abgewählt und auf „retoure“ geschickt werden kann – damit das beim Lager wieder eingeht und nicht nur als ausgang drin ist. All das muss automatisch sauber dokumentiert werden
-	Wichtig wäre aus meiner Sicht, dass das System den Auslieferer Schritt für Schritt durch den gesamten Prozess führt und genau vorgibt, welche Angaben der Kunde an welcher Stelle machen muss (z. B. Unterschrift auf Seite 1, 2 und 3, Datum auf Seite 2 und 4, Bankverbindung auf Seite 5 usw.). Ebenso sollte es Pflichtfelder bzw. Checklisten geben, z. B. dass der Ausweis fotografiert wurde. Fehlt eine Unterschrift oder ein erforderliches Dokument, sollte eine Fehlermeldung erscheinen und der Vorgang nicht abgeschlossen werden können. So kann nichts vergessen werden.
-	Die Kirsche auf der Torte wäre, wenn der Ausweis bereits zu Beginn mit dem Tablet fotografiert und im System gespeichert wird. Erst danach sollte der Vertragsprozess starten. Das System könnte dann die Unterschrift auf dem Ausweis automatisch mit der Unterschrift auf dem Vertrag vergleichen. Wurde der Ausweis noch nicht hochgeladen, sollte der Prozess gar nicht erst fortgesetzt werden können. Das würde viele Rückfragen und Nacharbeiten vermeiden und den gesamten Ablauf deutlich sicherer und effizienter machen.

Checkliste Datensicherheit: Anforderungsliste / Sicherheitskonzept: Internes Mandanten- & Vertragsverwaltungstool
1. Datenhaltung & Datenbank-Sicherheit (Supabase)
•	Hosting-Standort: Das Supabase-Projekt muss zwingend in einer EU-Region (z. B. Frankfurt / eu-central-1) gehostet werden.
•	Row Level Security (RLS):
o	RLS muss aufnahmslos für alle Tabellen der Datenbank aktiviert werden.
o	Es dürfen keine Abfragen ohne Prüfung der Benutzeridentität (auth.uid()) möglich sein.
•	Spaltenverschlüsselung: Besonders sensible Kundendaten (z. B. Bankverbindungen, Steuernummern) müssen zusätzlich auf Spaltenebene mittels der PostgreSQL-Extension pgcrypto verschlüsselt werden.
•	Rechtliches: Abschluss eines DSGVO-konformen Auftragsverarbeitungsvertrags (AVV) mit dem Datenbank-Anbieter.
2. Authentifizierung & Zugriffssteuerung (IAM)
•	Multi-Faktor-Authentifizierung (MFA/2FA):
o	Die Anmeldung erfolgt via E-Mail, Passwort und verpflichtendem zweiten Faktor (2FA).
o	Die Aktivierung von 2FA ist für alle 11 Mitarbeiter zwingend erforderlich (kein Opt-out).
•	Rollenbasiertes Rechtemodell (RBAC):
o	Implementierung eines klaren Rollenkonzepts (z. B. Geschäftsführung, Admin, Standard-Mitarbeiter).
o	Vergabe von Rechten (Lesen, Schreiben, Löschen) basierend auf Custom Claims in Supabase Auth oder einer dedizierten Rechtemabelle.
•	Session-Management:
o	Die Gültigkeitsdauer der Access-Tokens ist kurz zu halten (z. B. maximal 1 Stunde).
o	Einrichtung eines automatischen Logouts bei Inaktivität.
3. Dokumentenmanagement & Storage (Leasingverträge)
•	Private Buckets: Alle Dokumenten-Buckets (insb. für Leasingverträge und PDFs) müssen als "Privat" konfiguriert sein.
•	Storage-RLS: Zugriff auf hochgeladene Dateien wird über RLS-Regeln streng an die Mitarbeiterrolle und -berechtigung gekoppelt.
•	Temporäre Download-Links (Signed URLs): Dokumente dürfen niemals über statische Pfade abrufbar sein. Der Zugriff erfolgt ausschließlich über zeitlich begrenzte, signierte URLs (Gültigkeit z. B. max. 5 Minuten).
4. Frontend- & API-Architektur
•	Geheimhaltung von API-Schlüsseln:
o	Im Frontend dürfen nur der supabase_url und der anon_key sichtbar sein.
o	Der service_role_key (Admin-Schlüssel) darf unter keinen Umständen im Client-Code/Frontend landen.
•	Backend-Logik für administrative Aufgaben: Alle Prozesse, die RLS umgehen müssen, sind in sichere Umgebungen (z. B. Supabase Edge Functions oder ein separates Backend) auszulagern.
•	Input-Validierung: Generelle Überprüfung und Bereinigung aller Benutzereingaben vor der Verarbeitung durch die API, um Injections und Datenkorruption zu verhindern.
5. Protokollierung & Business Continuity (Audit & Backup)
•	Audit-Log (Aktivitätsprotokoll): Kritische Aktionen (z. B. Anzeigen von Verträgen, Ändern von Kundendaten, Löschvorgänge) müssen in einer separaten, manipulationssicheren Tabelle (audit_logs) mit Zeitstempel und User-ID protokolliert werden.
•	Backup-Strategie:
o	Einrichtung eines automatisierten, täglichen Backups der gesamten Datenbank und des Storages.
o	Die Backups müssen versioniert und an einem separaten, DSGVO-konformen Speicherort gesichert werden (Disaster Recovery).

Accountliste
Name	                Login / E-Mail	                        Rolle
Andreas Gretzinger	    admin                    	            Administrator
Benny Weiß	            b.weiss@eistechnikcenter.de	            Mitglied
Franziska Schumacher	f.schumacher@eistechnikcenter.de	    Mitglied
Ihab Assaf	            i.assaf@eistechnikcenter.de	            Mitglied
Isabell Richter	        i.richter@eistechnikcenter.de	        Mitglied
Lea Lehmann	            l.lehmann@eistechnikcenter.de	        Mitglied
Maik Schröder	        m.schroeder@eistechnikcenter.de	        Mitglied
Marina Carucci	        m.carucci@eistechnikcenter.de	        Mitglied
Michael Gellert	        m.gellert@eistechnikcenter.de	        Mitglied
Olga Gretzinger	        o.gretzinger@eistechnikcenter.de	    Administrator
Samir Assaf	            s.assaf@eistechnikcenter.de	            Administrator
Stefan Lenk	            s.lenk@eistechnikcenter.de	            Mitglied
Wilhelm Breuer	        w.breuer@eistechnikcenter.de	        Administrator

Gedankenprotokoll & Anforderungsliste: Odoo-Ablösung / -Umbau
Projektkontext: Aktuelle Odoo-Implementierung blockiert operative Prozesse. Es wird entweder ein tiefgreifender Refactoring-Prozess oder ein Systemwechsel vorbereitet. Ziel für die Entwicklung: Diese Liste definiert die unumstößlichen System-Mindestanforderungen (Must-Haves) und dokumentiert die aktuellen Architektur-Schwachstellen.
I. Ist-Analyse: Wo Odoo aktuell versagt (Schmerzpunkte)
•	Fehlerhafte Core-Logik / Dateninkonsistenz:
o	Problem: Bei bestimmten Statusänderungen (z. B. Stornierungen, Retouren) erfolgt keine automatische Bestandsrückbuchung.
o	Folge: Massive Differenzen zwischen physischem Lager und DB-Beständen.
•	Fehlerhafte Steuer-/Buchhaltungsmatrix:
o	Problem: Die automatisierte Zuordnung von Steuer-IDs und Logiken bei [z. B. innergemeinschaftlichen Lieferungen / Drittland] greift regelmäßig fehl.
o	Folge: Hoher manueller Korrekturaufwand in der DB / Buchhaltung.
•	Instabile Schnittstellen (API-Flops):
o	Problem: Die Synchronisation mit externen Drittsystemen [z. B. Onlineshop / ERP XY] bricht unvorhersehbar ab.
o	Folge: Silent Fails – das System wirft keine sauberen Fehlermeldungen (Logs) aus, Daten gehen verloren.
•	Iniziente UI/UX & Workflow-Overhead:
o	Problem: Standardprozesse wie [z. B. das Zusammenführen von Datensätzen] erfordern zu viele Klicks und verschachtelte Ansichten.
o	Folge: Hohe Fehlerrate durch User-Frustration und mangelnde Validierung im Frontend.
II. Soll-Konzept: Must-Haves für das zukünftige Tool (Tech-Stack-unabhängig)
Das neue System bzw. die Modifikation muss folgende Kriterien nativ und ohne instabile Workarounds erfüllen:
1. Datenintegrität & Lagerlogistik
•	Echtzeit-Synchronisation: Jede Transaktion (Verkauf, Storno, Retoure) muss atomar und in Echtzeit auf die Bestände durchschlagen.
•	Automatisierte Validierung: Systemseitige Sperre bei negativen Beständen (außer explizit erlaubt), um Geisterbestände zu verhindern.
2. Compliance & automatisierte Finanzen
•	Dynamische Steuer-Engine: Regelbasiertes Mapping von Steuersätzen basierend auf Liefer- und Rechnungsland, das sich ohne Code-Änderung (über Rules) anpassen lässt.
•	Rechtssicherheit (GoBD-konform): Unveränderbarkeit von einmal festgeschriebenen Belegen im System.
3. Schnittstellen & Systemarchitektur
•	Robuste REST- oder GraphQL-API: Jede Schnittstelle muss über ein zentrales Dashboard überwachbar sein.
•	Error-Handling / Alerting: Bei Synchronisationsabbrüchen muss das System automatisch einen Webhook (z. B. an Slack/Teams) oder eine E-Mail mit dem genauen Payload und Stacktrace senden.
4. Usability & Performance (Batch-Processing)
•	Massenverarbeitung (Bulk Actions): [Z. B. Rechnungen oder Picklisten] müssen sich per Checkbox-Auswahl in der Listenansicht gesammelt mit maximal zwei Klicks prozessieren lassen.
•	State Management: Keine Seiten-Reloads bei einfachen Statusänderungen; schnelle asynchrone Verarbeitung im Hintergrund.
III. Dev-Checkliste für die Evaluierung
•	[ ] Lässt sich das im Odoo-Standard über saubere Vererbung (Inheritance) und eigene Module lösen, oder blockiert uns die Odoo-Core-Architektur?
•	[ ] Gibt es bereits bestehende API-Wrapper für unsere Drittsysteme, die ein echtes Error-Logging unterstützen?
•	[ ] Bietet das potenzielle neue Tool eine offene DB-Struktur, die Migrationen ohne Datenverlust ermöglicht?
