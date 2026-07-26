# Teststrategie

De automatische tests controleren gedrag waar dat betrouwbaar kan:

- Contentvalidatie en waarschuwingen.
- Fase- en seizoensfiltering, inclusief t.124-selectie.
- localStorage, migratie en herstel bij beschadigde opslag.
- Score, levens, hints, categorieen en open-fasestatus.
- Meerkeuze- en volgordevragen.
- Resultatenscherm en deterministisch oefenadvies.
- Regelbibliotheek zoeken en filteren.
- Reviewmodus, reviewnotities en export.
- Belangrijke routes en basis-toegankelijkheid met axe.

Voer lokaal uit:

```bash
npm run lint
npm run typecheck
npm run content:validate
npm run test:run
npm run build
```

Handmatig blijven nodig:

- Echte browserconsole.
- Volledige toetsenbordflow.
- Schermlezercontrole.
- Mobiele visuele controle.
- PWA/offlinegedrag.
- Inhoudelijke review door een bevoegde scheidsrechter.
