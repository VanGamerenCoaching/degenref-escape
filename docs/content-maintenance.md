# Contentonderhoud

De broncontent hoort in `content-source/`. De canonieke bron is:

```text
content-source/degenref_content_pack.json
```

Ondersteunende bestanden:

```text
content-source/degenref_questions.json
content-source/degenref_missions.json
content-source/degenref_coverage.csv
```

Wijzig correcte antwoorden, regelreferenties of uitleg niet zonder expliciete inhoudelijke opdracht. Bewerk de bronbestanden en genereer daarna opnieuw:

```bash
npm run content:generate
npm run content:validate
npm run content:summary
```

`src/content/generated/appContent.json` is de gegenereerde appcontent. Pas dit bestand niet handmatig aan wanneer de bronbestanden beschikbaar zijn.

## Reviewstatus

Gebruik `reviewed: false` voor inhoud die nog niet inhoudelijk is gecontroleerd. Zet `reviewed: true` pas na controle door een bevoegde reviewer. Een gereviewde vraag is binnen dit project gecontroleerd, maar is niet officieel goedgekeurd door een schermbond.

De route `#/review` kan lokale reviewnotities exporteren als JSON. Die export wijzigt de ingebouwde content niet; verwerk opmerkingen handmatig in de bron-JSON.

## Publicatiebesluit

`content-source/` is niet genegeerd in `.gitignore`, maar ontbreekt momenteel in deze werkmap. Publiceer bronbestanden alleen wanneer de eigenaar bewust heeft besloten dat de aangeleverde broncontent in de repository mag staan.
