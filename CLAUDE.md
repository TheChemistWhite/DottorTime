# CLAUDE.md

Guida di riferimento per chiunque (umano o agente Claude) lavori su questo progetto.

## Cos'è questo progetto

**DottorTime** è un'applicazione desktop (Windows, macOS, Linux) che permette a un medico di gestire la propria agenda ambulatoriale: anagrafica pazienti, appuntamenti e storico delle visite con le relative note cliniche.

Il design è stato mockup nella cartella `Design/agenda-visite-medico/` (bundle esportato da Claude Design). Il mockup rappresenta lo studio di un oftalmologo (Dr. Giuseppe Francione) e alcuni campi del form "Nuova visita" sono specifici per l'oculistica (acuità visiva OD/OS, pressione intraoculare OD/OS). Questi campi vanno replicati così come sono nel design; se in futuro l'app dovrà supportare altre specialità, i campi clinici andranno resi configurabili — ma non è lo scope attuale.

**Stato attuale: implementazione iniziale completa.** Struttura Electron + React + TypeScript, schema SQLite, IPC, le tre schermate del design e l'export/import dati sono già implementati (vedi `src/`). Questo file resta la guida di riferimento per chi continua lo sviluppo. Note sulle scelte fatte in fase di implementazione:

- **Titlebar**: su Windows/Linux si usa la titlebar nativa (`frame` di default) con sotto una barra applicativa da 52px in stile mockup (titolo + data). Su macOS si usa `titleBarStyle: 'hiddenInset'` per mantenere i pallini semaforo *nativi* del sistema (non ridisegnati a mano, per evitare falsi controlli finestra).
- **Riquadro esterno del mockup** (finestra 1440×900 con ombra/angoli arrotondati/gradiente su sfondo scrivania) non è stato replicato: era la messa in scena del tool di design per mostrare "una finestra"; nell'app reale la `BrowserWindow` di Electron è già quella finestra.
- **Aggiunte non presenti nel mockup ma necessarie per un'app funzionante**: form "Nuovo paziente" (il design non prevedeva modo di creare pazienti, solo 6 pazienti precaricati) e un pannello "Impostazioni" (icona ⚙ in fondo alla sidebar) con dati medico + export/import — nel design queste azioni non avevano una UI dedicata.
- **Cifratura del file di export**: non implementata (il file `.dottortime` è JSON in chiaro). Da valutare con l'utente se serve, come indicato più sotto.

## Design di riferimento — leggerlo prima di scrivere codice

File principale: `Design/agenda-visite-medico/project/Agenda Medico.dc.html`

Questo è un prototipo HTML/CSS/JS (formato proprietario di Claude Design, non va copiato struttura per struttura), da **ricreare pixel-perfect** in Electron/React. Non aprire questi file nel browser: tutte le informazioni su colori, dimensioni e layout sono già leggibili nel sorgente.

`Design/agenda-visite-medico/project/macos-window.jsx` è uno scaffold generico di finestra in stile macOS (Liquid Glass) fornito dal tool di design: **non è usato** dal mockup principale (che disegna la propria titlebar con i pallini semaforo direttamente nell'HTML). Ignoralo salvo indicazioni diverse.

### Cosa mostra il mockup

Finestra unica 1440×900, bordi arrotondati (18px), titlebar custom da 52px con pallini rosso/giallo/verde (decorativi — l'app dovrà usare la titlebar nativa del sistema operativo o una sua replica coerente con questo stile), sidebar a sinistra (220px) e area contenuto a destra.

**Sidebar**: avatar con iniziali del medico + specializzazione, menu (Dashboard / Pazienti / Nuova visita), lista "Pazienti recenti" cliccabile, footer con versione app.

**Schermata Dashboard**: saluto + data corrente, campo ricerca paziente, bottone "+ Nuova visita", 4 card statistiche (visite oggi, pazienti totali, prossimo appuntamento, note in attesa), calendario mensile con puntini sui giorni con appuntamenti, lista prossimi appuntamenti cliccabile (porta al dettaglio paziente).

**Schermata Paziente**: header con avatar/nome/età/telefono/diagnosi + bottone nuova visita, colonna anagrafica (data di nascita, telefono, email, indirizzo, diagnosi principale, ultima visita), colonna storico visite (scrollabile) con per ogni visita: data, motivo (badge), acuità visiva OD/OS, pressione oculare (PIO) OD/OS, note cliniche.

**Schermata Nuova visita**: form con paziente (select), motivo, data, ora, sezione "Parametri oftalmologici" (acuità OD/OS, PIO OD/OS), note cliniche (textarea), bottoni Annulla/Salva.

### Palette e stile (da riusare fedelmente)

- Colori definiti in `oklch()`. Sfondo app: `oklch(98% 0.006 70)`. Sfondo pagina esterna alla finestra: gradiente radiale caldo (`oklch(93% 0.025 65)` → `oklch(87% 0.03 50)` → `oklch(80% 0.035 40)`).
- Colore accento/brand: `oklch(60% 0.13 35)` (arancione bruciato caldo), usato per bottoni primari, stato attivo, badge; gradiente accento `linear-gradient(135deg, oklch(72% 0.14 55), oklch(60% 0.13 35))` per gli avatar.
- Testo primario `oklch(26-30% 0.02 50)`, testo secondario `oklch(50-58% 0.015 55)`.
- Card: sfondo bianco, bordo `1px solid oklch(91% 0.012 55)`, `border-radius: 14px`.
- Font: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif` — su Windows/Linux ricadrà su un system font sans-serif equivalente (va bene, non serve imbundlare SF Pro).
- Border-radius generosi (8–18px), niente ombre pesanti tranne quella della finestra stessa.

Quando implementi, traduci questi valori in CSS variables/token coerenti (es. Tailwind config o CSS custom properties), non hard-codare oklch ovunque.

## Stack tecnologico (deciso)

- **Electron** per il packaging multipiattaforma (Windows/macOS/Linux) — scelto per maturità dell'ecosistema, documentazione e facilità di implementare export/import su filesystem.
- **React + TypeScript** per la UI.
- **SQLite** come storage locale, via `better-sqlite3` (accesso solo dal main process).
- **electron-builder** per generare gli installer (.exe/.dmg/.AppImage o simili).

Nessun backend remoto, nessuna sincronizzazione cloud: tutto locale sulla macchina del medico.

## Architettura

- **Main process** (`src/main/`): gestisce la finestra Electron, il database SQLite (apertura, migrazioni, query), e le operazioni di import/export su filesystem. Espone funzionalità al renderer solo tramite IPC (`contextBridge` + `ipcMain.handle`), con `contextIsolation: true` e `nodeIntegration: false`.
- **Preload script** (`src/preload/`): espone un'API tipizzata e minimale al renderer (es. `window.api.patients.list()`, `window.api.visits.create(...)`, `window.api.data.exportToFile()`, `window.api.data.importFromFile()`).
- **Renderer** (`src/renderer/`): app React che replica le tre schermate del design (Dashboard, Paziente, Nuova visita) più eventuali schermate di supporto (impostazioni, import/export).
- Il file del database SQLite vive nella cartella dati utente del sistema operativo (`app.getPath('userData')`), non nella cartella di installazione.

## Modello dati (bozza, da raffinare in fase di implementazione)

**Patient**
`id, firstName, lastName, dob, phone, email, address, diagnosis, createdAt, updatedAt`

**Visit**
`id, patientId, date, time, reason, acuityOD, acuityOS, iopOD, iopOS, notes, createdAt`

Nota: nel design i campi mostrano "acuità visiva" e "pressione oculare (PIO)" come stringhe libere (es. "8/10", "19") — vanno mantenuti come testo libero salvo diversa indicazione, per non forzare formati che il medico potrebbe voler scrivere diversamente.

Da aggiungere in fase di implementazione: eventuale tabella `Settings`/`Doctor` per nome medico, specializzazione, iniziali mostrate in sidebar (attualmente hard-coded nel mockup come "Dr. Giuseppe Francione — Oftalmologia").

## Import / Export dati

Requisito esplicito dell'utente: poter esportare tutti i dati e reimportarli tramite un file generato dall'app (nessuna dipendenza da servizi esterni).

Approccio consigliato:
- **Export**: l'app genera un singolo file (es. `.dottortime` o `.json`, da decidere in implementazione) contenente un dump strutturato e versionato di tutte le tabelle (pazienti + visite + eventuali impostazioni). Includere un campo `schemaVersion` per gestire import futuri da versioni precedenti dell'app.
- **Import**: l'app legge il file, valida lo schema/versione, e permette di sostituire o unire i dati correnti (chiarire con l'utente il comportamento desiderato in fase di implementazione: sovrascrittura totale vs merge).
- Trattandosi di dati clinici, valutare in implementazione se cifrare il file esportato (es. passphrase) — da confermare con l'utente prima di implementare, dato che riguarda dati sanitari.

## Privacy e dati sanitari

I dati trattati sono dati sanitari (categoria particolare ai sensi del GDPR). Vincoli da rispettare nell'implementazione:
- Nessuna telemetria che includa dati paziente.
- Nessuna chiamata di rete non necessaria (l'app è local-first/offline).
- Il file del database e gli export vanno trattati come dati sensibili: valutare permessi filesystem e, se richiesto dall'utente, cifratura a riposo.

## Struttura cartelle proposta

```
DottorTime/
  Design/                      # mockup di riferimento (non toccare)
  src/
    main/                     # processo main Electron, DB, IPC handlers
    preload/                  # contextBridge API
    renderer/
      components/
      screens/                # Dashboard, PatientDetail, NewVisit
      styles/                 # design tokens (colori/oklch, tipografia)
  package.json
  electron-builder config
  CLAUDE.md
```

## Convenzioni di codice

- TypeScript ovunque (main, preload, renderer), `strict: true`.
- Testi UI in italiano, coerenti con il design (es. "Nuova visita", "Pazienti", "Anagrafica").
- Nomi di variabili/funzioni/tipi in inglese nel codice; stringhe visibili all'utente in italiano.
- Nessun accesso diretto a SQLite dal renderer: sempre tramite IPC.

## Comandi

Vedi anche `README.md`.

```bash
npm install          # installa dipendenze + ricompila better-sqlite3 per Electron (postinstall)
npm run dev           # avvia l'app in sviluppo (hot reload renderer)
npm run typecheck     # tsc --noEmit su main/preload e su renderer
npm run build         # build di produzione in out/ (senza installer)
npm run dist:win      # installer .exe (da lanciare su Windows)
npm run dist:mac      # installer .dmg (da lanciare su macOS)
npm run dist:linux    # AppImage (da lanciare su Linux)
```

## Prossimi passi

1. ~~Inizializzare il progetto Electron + React + TypeScript.~~ Fatto.
2. ~~Implementare lo schema SQLite e il layer di accesso dati nel main process.~~ Fatto.
3. ~~Ricreare le tre schermate del design con i design token estratti sopra.~~ Fatto.
4. ~~Implementare export/import.~~ Fatto (JSON non cifrato, vedi sopra).
5. ~~Configurare electron-builder per Windows/macOS/Linux.~~ Fatto (`electron-builder.yml` + `build/icon.png` generata dalle iniziali "GF" nella palette dell'app + workflow GitHub Actions in `.github/workflows/build.yml` per buildare `.exe`/`.dmg`/`.AppImage` senza possedere fisicamente le tre piattaforme — vedi README). Non testato con una build reale su Mac/Linux in questo ambiente (solo build locale del renderer/main, non il packaging installer).
6. Decidere se cifrare il file di export/import (dati sanitari — vedi sezione Privacy).
7. Aggiungere test automatici (attualmente assenti).
8. Se l'app dovrà essere distribuita a più utenti (non solo uso personale del Dr. Francione), valutare la firma del codice (certificato sviluppatore Apple/Microsoft) per evitare gli avvisi Gatekeeper/SmartScreen agli installer non firmati.
