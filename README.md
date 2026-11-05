# MJ CKEditor Bild-URL

Version: 1.x-1.0.0-alpha2 — Testversion für Backdrop 1.35.2.

Erweitert den vorhandenen Bilddialog um zwei gut sichtbare Auswahlmöglichkeiten:
„Bild hochladen“ und „Bild per URL einfügen“. Die Bildbibliothek wird aus diesem
Dialog entfernt und nicht geladen. Keine Änderungen am Core, keine zusätzliche
CKEditor-Bibliothek, keine Datenbanktabellen oder Konfiguration.

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
