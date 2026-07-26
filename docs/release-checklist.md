# Releasechecklist 0.1.0

Gebruik deze checklist voordat de eerste publieke release wordt gecommit, gepusht of gedeeld.

## Repository

- [ ] `git status` is bekeken op een machine waar git beschikbaar is.
- [ ] Alleen bronbestanden, configuratie, documentatie en lockfile staan klaar voor commit.
- [ ] `node_modules/`, `dist/`, `tmp/`, logs, editorbestanden en `.env*` staan niet klaar voor commit.
- [ ] `content-source/` is bewust wel of niet toegevoegd.
- [ ] Er zijn geen API-keys, tokens, wachtwoorden, secrets of persoonsgegevens aanwezig.
- [ ] Er is een bewuste licentiekeuze gemaakt of de licentieplaceholder blijft zichtbaar.

## Content

- [ ] `npm run content:validate` slaagt.
- [ ] Alle waarschuwingen over `reviewed: false` zijn gelezen.
- [ ] Niet-gecontroleerde inhoud wordt zichtbaar als niet gecontroleerd gemarkeerd.
- [ ] t.124-vragen en andere seizoensregels blijven per seizoen gescheiden.
- [ ] Bronartikel, bronpagina, reglementversie en reviewstatus zijn zichtbaar in de UI.

## Techniek

- [ ] `npm run lint` slaagt.
- [ ] `npm run typecheck` slaagt.
- [ ] `npm run test:run` slaagt.
- [ ] `npm run build` slaagt.
- [ ] GitHub Pages gebruikt HashRouter en de juiste Vite `base`.
- [ ] De GitHub Pages-workflow gebruikt alleen officiele GitHub Actions.
- [ ] Er zijn geen secrets nodig voor publicatie.

## Handmatige Controle

- [ ] Startscherm opent zonder consolefouten.
- [ ] Nieuwe training starten werkt.
- [ ] Modus, seizoen en niveau kiezen werkt met toetsenbord.
- [ ] Missies laden en ontgrendelen logisch.
- [ ] Meerkeuzevraag spelen werkt.
- [ ] Volgordevraag spelen werkt.
- [ ] Hints, levens, feedback en score werken.
- [ ] Resultatenscherm toont advies zonder officiele slagingsclaim.
- [ ] Regelbibliotheek zoekt op `t.90`, `t90` en `90`.
- [ ] Instellingen wissen lokale gegevens echt.
- [ ] Reviewmodus opent zonder login en wijzigt de broncontent niet.
- [ ] Mobiele breedtes 320, 375, 430, 768 en 1024+ px zijn gecontroleerd.
- [ ] Offline/PWA-gedrag is gecontroleerd in een productiebuild.

## Release

- [ ] Eerste commit is gemaakt met een duidelijke commitboodschap.
- [ ] Push naar GitHub gebeurt pas nadat de eigenaar akkoord is.
- [ ] GitHub Pages staat ingesteld op `GitHub Actions`.
- [ ] De live URL is gecontroleerd na publicatie.
