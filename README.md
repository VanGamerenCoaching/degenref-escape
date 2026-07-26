# DegenRef Escape

DegenRef Escape is een Nederlandstalige, niet-officiele educatieve webapp voor mensen die leren arbitreren bij het degenschermen. De app laat gebruikers oefenen met beslissingen, regelverwijzingen, open toernooifases, hints, feedback en resultaten op basis van meegeleverde contentbestanden.

De app is bedoeld voor beginnende en gevorderde degenscheidsrechters, opleiders, clubbegeleiders en schermers die regels beter willen begrijpen. De app is geen officieel examen en geen officiele app van de FIE, KNAS of een andere schermbond.

## Niet-Officiele Status

De Nederlandse teksten zijn een niet-officiele leervertaling. Raadpleeg bij twijfel altijd het officiele reglement. Content met `reviewed: false` is zichtbaar gemarkeerd als niet gecontroleerd en mag niet worden gepresenteerd als officieel goedgekeurd.

## Schermen En Functies

- Startscherm met onboarding voor spelmodus, regelseizoen en ervaringsniveau
- Faseoverzicht met filters, voortgang en beste scores
- Fasedetailpagina met situatie-introductie, leerdoelen en regelartikelen
- Speelroute voor meerkeuzevragen en volgordevragen
- Hints, levens, score en modusafhankelijke feedback
- Resultatenscherm met score, categorieanalyse en deterministisch oefenadvies
- Doorzoekbare regelbibliotheek met artikelpagina's
- Instellingen voor seizoen, modus, reviewfilter, animaties, geluid en opslag
- Lokale contentreviewmodus voor opleiders en scheidsrechters
- Optionele PWA-ondersteuning voor offline opnieuw openen van de reeds geladen app

## Technische Stack

- React
- TypeScript
- Vite
- React Router met `HashRouter`
- Gewone CSS met CSS-variabelen
- Vitest
- React Testing Library
- localStorage
- GitHub Pages via GitHub Actions
- Optioneel: `vite-plugin-pwa` als gratis builddependency voor service worker en manifest

## Geen Backend Of API

De app gebruikt geen backend, database, accounts, OpenAI API, andere AI-API, betaalde diensten, externe analytics, trackingcookies of externe afbeeldingen die nodig zijn om de app te gebruiken.

## Lokale Gegevensopslag

Voortgang en instellingen worden alleen in deze browser opgeslagen via localStorage. De hoofdsleutel is:

```text
degenref-escape-state
```

Reviewnotities uit de lokale reviewmodus blijven ook lokaal. Er wordt niets naar een server gestuurd. Het wissen van browsergegevens kan voortgang verwijderen.

## Project Installeren

Installeer dependencies met npm:

```bash
npm ci
```

Gebruik bij actief ontwikkelen eventueel:

```bash
npm install
```

## Development Starten

Start de lokale developmentserver:

```bash
npm run dev
```

Open daarna:

```text
http://127.0.0.1:5173/
```

## Tests Uitvoeren

Voer de vaste controles uit:

```bash
npm run lint
npm run typecheck
npm run content:validate
npm run test:run
```

Voor interactieve Vitest-runs:

```bash
npm run test
```

## Content Valideren

Controleer de gegenereerde content:

```bash
npm run content:validate
```

Toon een samenvatting van de huidige content:

```bash
npm run content:summary
```

De huidige gegenereerde content bevat 6 bronthema's, 153 leerkaarten, 12 open toernooifases en 231 vragen. De seizoenswaarden zijn `2025-2026` en `2026-2027`. Op dit moment zijn alle 231 vragen als niet gereviewd gemarkeerd.

## Productiebuild Maken

Maak een productiebuild:

```bash
npm run build
```

Controleer de build lokaal:

```bash
npm run preview
```

## GitHub Pages Publiceren

De app is voorbereid op GitHub Pages met `HashRouter`, zodat routes zoals `#/missions` en `#/rules/t.90` werken zonder serverconfiguratie.

De workflow staat in:

```text
.github/workflows/deploy-pages.yml
```

De workflow gebruikt `npm ci` en publiceert alleen wanneer deze controles slagen:

```bash
npm run lint
npm run typecheck
npm run content:validate
npm run test:run
npm run build
```

De Vite `base` wordt automatisch bepaald:

- Lokaal: `./`
- In GitHub Actions: `/<REPOSITORY_NAAM>/`, afgeleid uit `GITHUB_REPOSITORY`
- Handmatig: via `VITE_BASE_PATH`

Verwachte publicatie-URL:

```text
https://<GITHUB_GEBRUIKERSNAAM>.github.io/<REPOSITORY_NAAM>/
```

Activeer in GitHub onder `Settings` -> `Pages` de bron `GitHub Actions`. Push niets voordat je bewust hebt gecommit.

## Contentbestanden Bijwerken

De bronbestanden horen in:

```text
content-source/
```

Canonieke bron:

```text
content-source/degenref_content_pack.json
```

Ondersteunende bronbestanden:

```text
content-source/degenref_questions.json
content-source/degenref_missions.json
content-source/degenref_coverage.csv
```

Werk broncontent in de bronbestanden bij, niet direct in `src/content/generated/appContent.json`. Genereer daarna opnieuw:

```bash
npm run content:generate
npm run content:validate
npm run content:summary
```

Verander correcte antwoorden, regelreferenties of uitleg niet zonder expliciete inhoudelijke opdracht en review.

## Nieuw Regelseizoen Toevoegen

Zie ook [docs/rules-versioning.md](docs/rules-versioning.md).

Een nieuw seizoen moet zichtbaar en apart in de content voorkomen, bijvoorbeeld `2027-2028`. Voeg seizoensgebonden vragen en leerkaarten zo toe dat algemene vragen algemeen blijven en seizoensspecifieke vragen alleen dat seizoen raken.

Voor t.124 geldt extra voorzichtigheid: vermeng oude en nieuwe non-combativity-inhoud nooit in een beoordelingsvraag. Gebruik aparte vragen, aparte uitleg en duidelijke seizoensteksten.

## Reviewstatus Beheren

Gebruik `reviewed: false` voor niet-gecontroleerde inhoud. Zet `reviewed: true` pas na inhoudelijke controle door een bevoegde reviewer. Vul `reviewedBy` alleen met een passende naam of rol wanneer die lokaal of in de bron bewust is vastgelegd.

De route `#/review` helpt bij lokale controle. De browser wijzigt de ingebouwde content niet; reviewnotities moeten daarna handmatig in de bron-JSON worden verwerkt.

## Projectstructuur

```text
src/
  app/          Applicatieschil, routerintegratie en PWA-melding
  components/   Herbruikbare UI-componenten
  content/      Contenttypes, loader, validatie en gegenereerde content
  features/     Game-, fase-, vraag-, resultaat-, regel- en reviewlogica
  hooks/        Herbruikbare React-hooks
  pages/        Routepagina's
  storage/      localStorage, state, reducers en migraties
  styles/       Globale CSS en CSS-variabelen
  test/         Testsetup
  types/        Gedeelde types
  utils/        Kleine hulpfuncties
docs/           Onderhouds- en testdocumentatie
public/         Statische assets en PWA-iconen
scripts/        Contentgeneratie en contentvalidatie
```

## Bekende Beperkingen

- De app is educatief en niet officieel.
- De Nederlandse leervertaling moet inhoudelijk gecontroleerd blijven worden.
- Niet alle mogelijke schermsituaties of vraagtypen hoeven al volledig ondersteund te zijn.
- De app heeft geen synchronisatie tussen apparaten.
- localStorage kan door browserinstellingen of opschonen verdwijnen.
- Offline gebruik werkt pas nadat de productie-app eerder is geopend en de service worker actief is.
- `AGENTS.md` ontbreekt momenteel in deze werkmap, terwijl de projectafspraken daar normaal horen te staan.

## Toegankelijkheid

De app gebruikt semantische HTML, zichtbare focusindicatoren, toetsenbordbediening, aria-live-statussen en ondersteuning voor `prefers-reduced-motion`. Zie [docs/manual-test-checklist.md](docs/manual-test-checklist.md) voor handmatige controles en [docs/test-strategy.md](docs/test-strategy.md) voor geautomatiseerde tests.

## Privacy

- Geen account
- Geen backend
- Geen analytics
- Geen tracking
- Geen gegevens naar een server
- Voortgang blijft alleen in deze browser
- Reviewnotities blijven lokaal
- Browsergegevens wissen kan voortgang verwijderen

## Licentie

Licentieplaceholder: er is nog geen licentie gekozen.

De eigenaar van het project moet later bewust een licentie kiezen en deze vastleggen in een `LICENSE`-bestand. Tot die tijd zijn hergebruik, verspreiding en bijdragen niet automatisch toegestaan.

## Bijdragen Aan Het Project

Bijdragen zijn welkom wanneer ze de bestaande inhoudelijke grenzen respecteren:

- Verander geen officiele regelinhoud, correcte antwoorden of uitleg zonder expliciete review.
- Voeg tests toe voor belangrijke spelberekeningen, opslagfuncties en contentfilters.
- Gebruik Nederlandse interface-teksten.
- Gebruik Engelse namen voor bestanden, types, functies en variabelen.
- Voeg geen production dependency toe zonder duidelijke reden.
- Draai voor afronding `npm run lint`, `npm run typecheck`, `npm run content:validate`, `npm run test:run` en `npm run build`.
