# Turniamo — Specifica del progetto
 
Web app per la gestione dei turni di lavoro: inserimento manuale dei turni (mattina, pomeriggio, notte o custom) e conteggio automatico delle ore, con riepilogo per settimana e per mese.
 
Esiste già una versione funzionante come Claude Artifact:
https://claude.ai/artifact/WNtStaof3mmtjg5zCWMmdv
Questa specifica descrive cosa fa l'app, così da poterla ricostruire o estendere (es. come progetto standalone).
 
## Obiettivo
 
Un utente registra ogni turno lavorato (data, tipo, orario inizio/fine) e l'app calcola da sola le ore, mostrando totali aggregati per settimana e mese corrente, oltre allo storico completo modificabile.
 
## Funzionalità principali
 
1. **Inserimento turno** tramite form: data, tipo turno, orario di inizio e fine, nota facoltativa.
2. **Tipi di turno**: Mattina, Pomeriggio, Notte, Custom (con etichetta libera per il custom). Gli orari sono **sempre inseriti manualmente**, anche per i tipi standard — non ci sono orari preimpostati automatici.
3. **Calcolo ore** automatico dal form, con anteprima live mentre si compilano gli orari.
4. **Turni a cavallo della mezzanotte** (tipici del turno di notte): se l'orario di fine è precedente o uguale a quello di inizio, si assume che il turno prosegua nel giorno successivo e si sommano 24 ore alla differenza.
5. **Riepilogo ore**:
   - Ore totali nel mese selezionato
   - Numero turni nel mese selezionato
   - Ore nella settimana corrente (indipendente dal mese selezionato)
   - Ore totali per tipo di turno (mattina/pomeriggio/notte/custom) nel mese selezionato
   - Tabella con il dettaglio ore per ciascuna settimana del mese selezionato (settimana lunedì-domenica)
6. **Elenco turni** del mese selezionato, raggruppati per giorno, ordinati dal più recente. Ogni turno è modificabile ed eliminabile.
7. **Salvataggio persistente**: i turni restano salvati chiudendo e riaprendo l'app, anche da un altro dispositivo/browser (non solo per la sessione corrente).
## Modello dati
 
Ogni turno è un record con questi campi:
 
| Campo | Tipo | Note |
|---|---|---|
| `date` | stringa `YYYY-MM-DD` | data del turno |
| `type` | `mattina` \| `pomeriggio` \| `notte` \| `custom` | categoria del turno |
| `label` | stringa | etichetta visualizzata: nome del tipo per i turni standard, testo libero per i custom |
| `start` | stringa `HH:MM` | orario di inizio |
| `end` | stringa `HH:MM` | orario di fine |
| `hours` | numero decimale | ore calcolate (vedi logica sotto) |
| `note` | stringa opzionale | nota libera |
 
## Logica di calcolo delle ore
 
```
diff_minuti = minuti(end) - minuti(start)
se diff_minuti <= 0:
    diff_minuti += 24 * 60   // turno a cavallo della mezzanotte
ore = diff_minuti / 60
```
 
## Raggruppamenti temporali
 
- **Settimana**: da lunedì a domenica (convenzione ISO/italiana), non domenica-sabato.
- **Mese**: mese di calendario, selezionabile tramite un selettore mese (default: mese corrente).
## Struttura dell'interfaccia
 
L'app è divisa in **due pagine separate**, raggiungibili tramite una barra di navigazione a schede (tab) sempre visibile in alto:
 
- **Pagina "Visualizza"** (pagina di default all'apertura): contiene il riepilogo e lo storico, non il form di inserimento.
  - Intestazione con titolo e pulsante "+ Nuovo turno" che porta direttamente alla pagina di inserimento.
  - **Pannello "Riepilogo"**: selettore mese, tre tile con i totali (ore mese, turni mese, ore settimana corrente), legenda con ore per tipo di turno, tabella ore per settimana.
  - **Pannello "Turni registrati"**: elenco dei turni del mese selezionato, raggruppati per giorno, con azioni di modifica ed eliminazione per ciascun turno. Toccare "modifica" su un turno porta alla pagina di inserimento con il form precompilato.
- **Pagina "Inserisci turno"**: contiene solo il form per aggiungere (o modificare) un turno — data, selettore tipo turno (4 pulsanti), campo etichetta custom (visibile solo se tipo = custom), orario inizio/fine, anteprima durata in tempo reale, nota facoltativa, pulsante salva. Lo stesso form viene riutilizzato per la modifica di un turno esistente (con un banner "Modifica in corso" e pulsante "Annulla").
  - Dopo il salvataggio di un **nuovo** turno, l'utente resta su questa pagina (per poterne inserire altri di seguito) e il form si svuota pronto per il prossimo inserimento.
  - Dopo il salvataggio di una **modifica**, l'app torna automaticamente alla pagina "Visualizza".
## Persistenza dei dati
 
I dati devono essere salvati in modo permanente e accessibili da più dispositivi/sessioni dello stesso utente (non solo `localStorage` del browser, che resta legato a un singolo browser/dispositivo). Nella versione attuale questo è realizzato con lo storage integrato degli Artifact di Claude (capability `db`); se ricostruita come progetto standalone, va sostituito con un backend/database equivalente (es. un piccolo server + database, o un servizio di storage cloud).
 
## Note per chi estende il progetto
 
- Nessun preset di orari per mattina/pomeriggio/notte: sono etichette di categoria, non fasce orarie fisse — l'utente inserisce sempre gli orari a mano.
- Il conteggio ore richiesto è per periodo (settimana/mese); la suddivisione per tipo turno è una funzionalità aggiuntiva già inclusa ma non è il focus principale.
- Lingua dell'interfaccia: italiano.