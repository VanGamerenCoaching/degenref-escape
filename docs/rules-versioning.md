# Regelseizoenen En t.124

DegenRef Escape houdt seizoensgebonden regels gescheiden. Dit is vooral belangrijk voor t.124, omdat non-combativity-inhoud per seizoen kan verschillen.

Huidige seizoenen in de gegenereerde content:

- `2025-2026`
- `2026-2027`

Basisregels:

- Algemene vragen zonder expliciete seizoenswaarde blijven algemeen.
- Seizoensvragen noemen het seizoen expliciet in vraagtekst, uitleg of reglementcontext.
- Een t.124-vraag mag geen oude en nieuwe seizoeninhoud in dezelfde beoordeling mengen.
- Iedere seizoensvariant krijgt een eigen vraag-ID en eigen reviewstatus.
- `rulesVersion`, bronpagina en reviewstatus blijven zichtbaar.

Nieuw seizoen toevoegen:

1. Voeg de nieuwe seizoenswaarde zichtbaar toe aan de broncontent.
2. Voeg seizoensspecifieke t.124-vragen als aparte vragen toe.
3. Draai `npm run content:generate`.
4. Draai `npm run content:validate`.
5. Controleer `npm run content:summary`.
6. Voeg tests toe of werk tests bij voor seizoensfiltering.
7. Laat de inhoud door een bevoegde scheidsrechter controleren.
