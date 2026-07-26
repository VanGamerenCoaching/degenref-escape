# Changelog

Alle noemenswaardige wijzigingen aan DegenRef Escape worden in dit bestand bijgehouden.

## 0.1.0 - Eerste Releasekandidaat

### Toegevoegd

- React-, TypeScript- en Vite-app met HashRouter voor GitHub Pages.
- Nederlandstalige applicatieschil met startscherm, onboarding, missies, spelen, feedback, resultaten, regelbibliotheek, instellingen, over-pagina en lokale reviewmodus.
- Lokale state- en opslaglaag op basis van localStorage.
- Ondersteuning voor spelmodi leren, oefenen en examen.
- Contentloader, runtimevalidatie, contentvalidatiescript en contentsamenvatting.
- Gegenereerde appcontent met 12 missies, 231 vragen, 153 leerkaarten en seizoenen `2025-2026` en `2026-2027`.
- Vraagengine voor meerkeuzevragen en volgordevragen.
- Score, hints, levens, categorieanalyse en deterministisch oefenadvies.
- Regelbibliotheek met zoeken, filters, bronverwijzingen, reviewstatus en seizoenswaarschuwingen.
- Instellingen voor seizoen, standaardmodus, niveau, niet-gecontroleerde vragen, animatie, geluid, missieontgrendeling, resultaatopslag en gegevens wissen.
- Lokale contentreviewmodus met filters, reviewnotities, JSON-export en printvriendelijke weergave.
- Optionele PWA-configuratie met lokale iconen, manifest, service worker en updatebanner.
- GitHub Pages-workflow met `npm ci`, lint, typecheck, contentvalidatie, tests en build voor publicatie.
- Release-documentatie, projectinstructies en `.gitignore`.

### Bekende Beperkingen

- Alle ingebouwde vragen, leerkaarten en missies zijn nog niet inhoudelijk gereviewd.
- `content-source/` ontbreekt in deze werkmap; bronbestanden moeten bewust worden toegevoegd wanneer publicatie is toegestaan.
- De app is geen officieel examen en geen officiele app van de FIE, KNAS of een andere schermbond.
- Offline gedrag moet nog handmatig in een echte browser worden bevestigd.
- `npm audit` meldde eerder high-severity waarschuwingen in dependencies; voer voor publicatie opnieuw `npm audit --json` uit en beoordeel de impact.
