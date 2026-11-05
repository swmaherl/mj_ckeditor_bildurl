# MJ CKEditor Bild-URL

Version: 1.x-1.0.0-alpha3 — Testversion für Backdrop 1.35.2.

Erweitert den vorhandenen Bilddialog um zwei gut sichtbare Auswahlmöglichkeiten:
„Bild hochladen“ und „Bild per URL einfügen“. Die Bildbibliothek wird aus diesem
Dialog entfernt und nicht geladen. Keine Änderungen am Core, keine zusätzliche
CKEditor-Bibliothek, keine Datenbanktabellen oder Konfiguration.

Seit alpha3 korrigiert das Modul zusätzlich die Filterprüfung der
CKEditor-5-Toolbar-Verwaltung. Modulname und Kategorie MJH bleiben erhalten.

## Toolbar-Korrektur in alpha3

Backdrop 1.35.2 sammelt in getAllFilterRules() die Regeln aller Live-Parser,
ohne den Aktivierungsstatus der Filter zu berücksichtigen. Außerdem verwirft
featureIsAllowed() erforderliche Tags, wenn keine ausdrückliche Freigabe vorliegt,
auch wenn überhaupt kein aktiver Filter eine Tag-Freigabeliste verlangt.

Die Ergänzung berücksichtigt nur aktive Filter. Gibt es keine Tag-Freigabeliste,
werden Tags grundsätzlich zugelassen; vorhandene Verbotsregeln und
Attributbeschränkungen werden weiterhin an die unveränderte Core-Prüfung übergeben.
Eine aktive leere Freigabeliste bleibt restriktiv.

Normale JSON-Unicode-Sequenzen wie \u003C werden bereits durch jQuery decodiert.
Sie sind kein Beleg für einen Fehler. Nur wenn nach jQuery.data() noch literale
Sequenzen für HTML-Begrenzer/Anführungszeichen vorhanden sind, normalisiert das
Modul diese zusätzlich. Ob dieser Sonderfall auf der Live-Seite auftritt, ist
noch nicht bestätigt.

Das zusätzliche JavaScript wird nur an den CKEditor-5-Einstellungsbereich im
Textformat-Konfigurationsformular angehängt, auch beim Editorwechsel per AJAX.
Bibliotheksabhängigkeiten laden es nach den Core-Definitionen und vor den
Behaviors. Die Button-Normalisierung erfolgt synchron nach Erzeugung der Toolbar
und vor deren zeitversetzter initialer Prüfung. Keine kopierte Core-JS-Datei,
keine zusätzlichen Event-Handler und keine automatische Konfigurationsmigration.

## Aktualisierung von alpha2

1. Vorhandene Moduldateien durch dieses Paket ersetzen, inklusive Ordner js.
2. Alle Backdrop-Caches leeren (einschließlich aggregierter JS-Dateien).
3. Bereits offene Textformat-Einstellungsseiten schließen und vollständig neu laden.
4. Falls Buttons bereits aus der gespeicherten Toolbar entfernt wurden, diese
   einmal wieder hinzufügen und speichern. Das Modul rekonstruiert keine alten
   Konfigurationen.

update.php ist für diese Version nicht erforderlich. Gespeicherte Textformat-
Konfigurationen werden vom Modul nicht automatisch überschrieben.

## Installation

1. Archiv unter /admin/modules/install installieren oder den enthaltenen Ordner
   mj_ckeditor_bildurl nach modules/custom kopieren.
2. Unter /admin/modules/list „MJ CKEditor Bild-URL“ aktivieren.
3. Backdrop-Caches leeren und die Bearbeitungsseite vollständig neu laden.
4. Den normalen Bild-Button im CKEditor verwenden. Kein neuer Toolbar-Button nötig.

Das Modul wirkt auf alle Textformate, die den Backdrop-Core-Bilddialog verwenden.
Ziel ist CKEditor 5; der gemeinsam verwendete Dialog kann auch CKEditor 4 betreffen.
Upload-Einstellungen, Größenlimits und Berechtigungen bleiben bestehen.
Ohne Upload-Berechtigung steht nur die URL-Option zur Verfügung.
Die Bibliotheksauswahl wird auch für Administratoren entfernt. Dies ist keine
Zugriffssperre für andere Verwaltungsseiten oder bereits öffentliche Bilddateien.

## Verhalten

Externe Bildadressen werden als src eingebunden, nicht heruntergeladen.
HTTPS-Adressen verwenden. Eine URL muss direkt ein Bild liefern, nicht eine
Webseite mit einem Bild. Vorhandene relative Bildpfade bleiben bearbeitbar.
Alternativtext, Ausrichtung, Bildunterschrift und Abmessungen bleiben im Core-Dialog.
Bildstile gelten nur für hochgeladene Bilder. Keine automatische Bildvorschau.
Beim Wechsel zwischen Upload und URL entscheidet ausschließlich die gewählte Option.
Bereits hochgeladene Dateien werden durch einen Wechsel nicht gelöscht.

## Test auf der eigenen Installation

- Unter /admin/config/content/formats/3 bei deaktiviertem HTML-Begrenzungsfilter
  fontColor, alignment:right und backdropImage hinzufügen, speichern und erneut
  öffnen. Alle drei müssen erhalten bleiben.
- Auf einem separaten Testformat mit aktivem HTML-Begrenzungsfilter prüfen,
  dass Buttons für nicht erlaubte Tags weiterhin entfernt werden.
- Mit eingeschalteter und ausgeschalteter JavaScript-Zusammenfassung prüfen.
- Editorwechsel per AJAX und erneutes Öffnen der Einstellungen prüfen.

- Als normaler Benutzer und als Administrator den Bilddialog öffnen.
- Prüfen: zwei sichtbare Optionen, keine Bibliothek.
- Bild hochladen, einfügen, speichern und erneut bearbeiten.
- Externe HTTPS-Bildadresse einfügen, speichern, erneut bearbeiten.
- Lokales Bild durch URL ersetzen und umgekehrt; gespeichertes src kontrollieren.
- Leere/falsche URL sowie Upload ohne Datei: verständliche Fehlermeldung.
- Benutzer ohne Upload-Berechtigung: ausschließlich URL anbieten.
- Falls mehrere Textformate verwendet werden, jedes separat prüfen.

Die Anpassung wurde gegen den Quellcode von Backdrop 1.35.2 entwickelt.
Ein vollständiger Integrationstest in einer laufenden Backdrop-Installation
ist vor dem produktiven Einsatz noch erforderlich.

## Rückbau

Modul deaktivieren und Caches leeren. Der ursprüngliche Bilddialog kehrt zurück.
Bereits eingefügte Bilder und gespeicherte Inhalte bleiben erhalten.

Lizenz: GPL-2.0-or-later.

## Tatsächlich durchgeführte Prüfungen

- 17 automatisierte DOM-Regressionstests mit jsdom und jQuery 3.7.1 gegen die
  unveränderten filter.admin.js, filter.filtered_html.admin.js und
  ckeditor5.admin.js aus Backdrop 1.35.2: bestanden.
- Fehler im unveränderten Core reproduziert; deaktivierte/aktive Filter,
  leere Freigabeliste, Attributverbote und zusätzliche Filterregeln geprüft.
- Normale und zusätzlich maskierte Anforderungen, simuliertes Speichern über
  das Toolbar-Textarea und erneutes Laden, Tastatur-Umsortieren, AJAX-Ersatz
  sowie mehrfache Behavior-/Skriptinitialisierung geprüft.
- Separate Skripte und zusammengefügte Skripte getestet. Das ist keine Prüfung
  des tatsächlichen Backdrop-Aggregators oder dessen Cache auf einem Webserver.
- JavaScript-Syntax mit Node geprüft; PHP-Syntax mit php-parser im PHP-7.4-Modus
  geprüft (kein PHP-Laufzeittest).
- Bestehender Bilddialog-Code und seine CSS-Datei gegenüber alpha2 unverändert.

Offen bleiben der vollständige Test in einer laufenden Backdrop-Installation,
das tatsächliche serverseitige Speichern, die Integration mit dem installierten
Plugin Pack, Drag-and-drop im Browser sowie Upload/URL-Einfügen im Bilddialog.
Die Tests verwenden Toolbar-Button-Definitionen als Fixtures, nicht einen
laufenden CKEditor oder das vollständige Plugin Pack.

Testaufruf (Core-Dateien vorher aus dem Tag 1.35.2 herunterladen):

```sh
npm install --prefix /tmp/mj-toolbar-tests jsdom jquery@3.7.1
NODE_PATH=/tmp/mj-toolbar-tests/node_modules node tests/toolbar-admin.test.cjs /pfad/zu/core-js
```

Die drei Core-Dateien liegen im Backdrop-Repository unter core/modules/filter/js/
bzw. core/modules/ckeditor5/js/. Sie werden nicht mit diesem Modul ausgeliefert.
