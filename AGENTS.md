# Projectinstructies

## Project

De projectnaam is DegenRef Escape.

DegenRef Escape is een Nederlandstalige educatieve escape-roomwebapp voor mensen die leren arbitreren bij het degenschermen.

## Techniek

- React
- TypeScript
- Vite
- Gewone CSS met CSS-variabelen
- Vitest voor unit-tests
- React Testing Library voor componenttests
- HashRouter voor GitHub Pages
- localStorage voor lokale voortgang
- Geen backend
- Geen database
- Geen accounts
- Geen OpenAI API
- Geen andere AI-API
- Geen betaalde diensten
- Geen externe analytics
- Geen trackingcookies
- Geen externe afbeeldingen die nodig zijn om de app te gebruiken

## Inhoudelijke Regels

- De meegeleverde JSON-bestanden zijn de inhoudelijke bron.
- Verander correcte antwoorden, regelreferenties of uitleg niet zonder expliciete opdracht.
- Bedenk zelf geen nieuwe officiele schermregels.
- Markeer niet-gecontroleerde inhoud duidelijk.
- Toon dat de Nederlandse tekst een niet-officiele leervertaling is.
- Presenteer de app niet als een officiele app van de FIE, KNAS of een andere schermbond.
- Bewaar bronartikel, bronpagina, reglementversie en reviewstatus.
- Ondersteun afzonderlijke versies van t.124 voor verschillende seizoenen.

## Codekwaliteit

- Gebruik strikte TypeScript-types.
- Gebruik geen `any`, behalve wanneer dit technisch onvermijdelijk is en wordt toegelicht.
- Houd componenten klein en overzichtelijk.
- Scheid content, spelregels, opslag en presentatie.
- Voeg geen production dependency toe zonder te vermelden waarom die nodig is.
- Gebruik semantische HTML.
- Zorg voor toetsenbordbediening.
- Zorg voor zichtbare focusindicatoren.
- Respecteer `prefers-reduced-motion`.
- Gebruik Nederlandse teksten in de interface.
- Gebruik Engelse namen voor bestanden, types, functies en variabelen.
- Voeg tests toe voor belangrijke spelberekeningen en opslagfuncties.

## Verplichte Controle Na Wijzigingen

Voer na iedere belangrijke wijziging uit:

1. `npm run lint`
2. `npm run test`
3. `npm run build`

Als een script nog niet bestaat, maak het op een passende manier aan. Los fouten op voordat de taak wordt afgerond.

## Werkwijze

- Inspecteer eerst de bestaande code.
- Behoud werkende functionaliteit.
- Maak geen volledige herschrijving zonder noodzaak.
- Leg kort uit welke bestanden zijn aangepast.
- Rapporteer welke tests en builds zijn uitgevoerd.
- Vermeld openstaande risico's eerlijk.
- Commit en push niet tenzij dit expliciet wordt gevraagd.
