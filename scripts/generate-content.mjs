import { mkdir, readFile, writeFile } from 'node:fs/promises';

const sourcePath = 'content-source/degenref_content_pack.json';
const targetPath = 'src/content/generated/appContent.json';

const source = JSON.parse(await readSourceContent());
const tournamentThemeRooms = {
  'room-1-basis': {
    title: 'Basis en wedstrijdprotocol',
    subtitle: 'Begroeting, houding, oproep en algemene wedstrijdcontext',
  },
  'room-2-piste': {
    title: 'Piste en grenzen',
    subtitle: "Stelling, commando's, verplaatsing en pistegrenzen",
  },
  'room-3-tijd': {
    title: 'Tijd en wedstrijdvorm',
    subtitle: 'Poule, directe eliminatie, teamverloop en onderbrekingen',
  },
  'room-4-materiaal': {
    title: 'Materiaal en wedstrijdtafel',
    subtitle: 'Controle, registratie, video en administratieve procedure',
  },
  'room-5-degen': {
    title: 'Degenacties',
    subtitle: 'Trefvlak, lampmeldingen, dubbele treffers en annuleringen',
  },
  'room-6-straffen': {
    title: 'Sancties en protest',
    subtitle: 'Kaarten, discipline, beroep en afronding',
  },
};
const tournamentPhaseMissions = {
  'mission-01-salute-start': {
    title: 'Aanmelding en wedstrijdprotocol',
    story:
      'Je begint de toernooidag bij de oproep, begroeting en eerste instructies aan de piste.',
    articles: ['t.1', 't.7', 't.8', 't.9', 't.10', 't.11', 't.12', 't.13', 't.14', 't.15'],
    tasks: [
      { type: 'question', instruction: 'Controleer begroeting en wedstrijdhouding.' },
      { type: 'question', instruction: 'Beoordeel aanwezigheid, weigering en sportief gedrag.' },
      { type: 'question', instruction: 'Kies de juiste eerste procedure aan de piste.' },
    ],
    passCondition: 'Rond de fase af met duidelijke beslissingen op protocolvragen.',
    reward: 'Startkaart voor de pouleronde',
  },
  'mission-02-build-piste': {
    title: 'Pistecontrole voor de eerste ronde',
    story:
      'Voor de poules starten controleer je de piste, lijnen en wedstrijdzone.',
    articles: ['t.16', 't.17', 't.18', 't.19', 't.20'],
    tasks: [
      { type: 'question', instruction: 'Herken middenlijn, stellijnen en achterlijnen.' },
      { type: 'question', instruction: 'Controleer afmetingen en veiligheidszones.' },
      { type: 'question', instruction: 'Beoordeel situaties rond de laatste meters van de piste.' },
    ],
    passCondition: 'Rond de pistecontrole af zonder openstaande basisfouten.',
    reward: 'Pistekaart',
  },
  'mission-03-ready-check': {
    title: 'Oproep, opstelling en Allez',
    story:
      'De poule staat klaar; jij brengt schermers correct op afstand en start het gevecht.',
    articles: [
      't.21',
      't.22',
      't.23',
      't.24',
      't.25',
      't.26',
      't.27',
      't.114',
      't.115',
      't.116',
      't.117',
      't.118',
      't.119',
      't.120',
      't.121',
      't.122',
      't.123',
    ],
    tasks: [
      { type: 'question', instruction: 'Plaats schermers correct en start met de juiste commando’s.' },
      { type: 'question', instruction: 'Herken fouten rond oproep, houding en gereedheid.' },
      { type: 'question', instruction: 'Beoordeel procedurefouten voordat het gevecht echt loopt.' },
    ],
    passCondition: 'Start de partij en handel vroege proceduremomenten correct af.',
    reward: 'Startprocedure afgerond',
  },
  'mission-04-boundary-lab': {
    title: 'Acties aan de zijlijn',
    story:
      'Tijdens actieve touches beoordeel je passeren, grenzen, corps-a-corps en herplaatsen.',
    articles: ['t.28', 't.29', 't.30', 't.31', 't.32', 't.33', 't.34', 't.35', 't.36', 't.37'],
    tasks: [
      { type: 'question', instruction: 'Bepaal wanneer een grens volledig is overschreden.' },
      { type: 'question', instruction: 'Beoordeel passeren, corps-a-corps en verlaten van de piste.' },
      { type: 'question', instruction: 'Kies de juiste herplaatsing na een onderbreking.' },
    ],
    passCondition: 'Beoordeel de pisteactie en hervat het gevecht op de juiste plaats.',
    reward: 'Grenssituatie opgelost',
  },
  'mission-05-pool-lock': {
    title: 'Poulefase en scoreverloop',
    story:
      'Je leidt korte poulegevechten en bewaakt score, tijdsverloop en gelijke standen.',
    articles: ['t.38', 't.41', 't.42', 't.44'],
    tasks: [
      { type: 'question', instruction: 'Beoordeel de opbouw van een poulegevecht.' },
      { type: 'question', instruction: 'Volg score en resterende tijd zonder exacte tijdsbelofte.' },
      { type: 'question', instruction: 'Los een gelijke stand procedureel op.' },
    ],
    passCondition: 'Rond de poulefase af met correcte score- en tijdkeuzes.',
    reward: 'Poulekaart verwerkt',
  },
  'mission-06-de-clock': {
    title: 'Directe eliminatie onder tijdsdruk',
    story:
      'In een directe-eliminatiepartij bewaak je periodes, beslissende momenten en non-combativity.',
    articles: ['t.39', 't.40', 't.43', 't.124'],
    tasks: [
      { type: 'question', instruction: 'Herken de opbouw van directe eliminatie en teammomenten.' },
      { type: 'question', instruction: 'Beoordeel tijd, eindsignaal en beslissende minuut.' },
      { type: 'question', instruction: 'Pas de seizoensgebonden t.124-vragen gescheiden toe.' },
    ],
    passCondition: 'Houd de partij onder tijdsdruk procedureel zuiver.',
    reward: 'Chronometercontrole afgerond',
  },
  'mission-07-medical-room': {
    title: 'Blessure en onderbreking',
    story:
      'Een partij wordt onderbroken door blessure, herstelcontrole of een onverwachte pauze.',
    articles: ['t.45', 't.46', 't.47', 't.48', 't.49', 't.50', 't.51', 't.52', 't.53', 't.54', 't.55'],
    tasks: [
      { type: 'question', instruction: 'Bepaal wie behandeltijd en geschiktheid vaststelt.' },
      { type: 'question', instruction: 'Beoordeel herhaalde of aanvullende onderbrekingen.' },
      { type: 'question', instruction: 'Hervat de partij met de juiste procedure.' },
    ],
    passCondition: 'Handel onderbrekingen af zonder de partijcontext te verliezen.',
    reward: 'Onderbrekingsrapport',
  },
  'mission-08-equipment-vault': {
    title: 'Materiaalcontrole aan de piste',
    story:
      'Voor en tijdens de partij beoordeel je kleding, wapens en controleprocedures.',
    articles: ['t.64', 't.65', 't.66', 't.67', 't.68', 't.69', 't.70', 't.71', 't.72', 't.73', 't.74', 't.75'],
    tasks: [
      { type: 'question', instruction: 'Controleer keurmerken, isolatie, veerdruk en reservemateriaal.' },
      { type: 'question', instruction: 'Onderscheid wedstrijdschade, niet-reglementair materiaal en fraude.' },
      { type: 'question', instruction: 'Kies de juiste vervolgstap bij materiaalproblemen.' },
    ],
    passCondition: 'Rond de materiaalcontrole af met correcte classificaties.',
    reward: 'Materiaalcontrole afgerond',
  },
  'mission-09-video-desk': {
    title: 'Video en wedstrijdadministratie',
    story:
      'Aan de wedstrijdtafel beoordeel je videoverzoeken, notatie en administratieve stappen.',
    articles: ['t.60', 't.61', 't.62', 't.63'],
    tasks: [
      { type: 'question', instruction: 'Bereken hoeveel videoverzoeken beschikbaar en behouden zijn.' },
      { type: 'question', instruction: 'Beoordeel herhaling, snelheid en definitieve beslissing.' },
      { type: 'question', instruction: 'Verwerk administratieve keuzes rond de wedstrijdtafel.' },
    ],
    passCondition: 'Maak video- en administratiekeuzes die passen bij de broncontent.',
    reward: 'Wedstrijdtafel bijgewerkt',
  },
  'mission-10-double-hit-lab': {
    title: 'Degenacties en treffers',
    story:
      'Je beoordeelt trefvlak, dubbele treffers en geldigheid van registraties.',
    articles: ['t.90', 't.91', 't.92', 't.93'],
    tasks: [
      { type: 'question', instruction: 'Controleer trefvlak en wijze van treffen.' },
      { type: 'question', instruction: 'Interpreteer enkele en dubbele lampmeldingen.' },
      { type: 'question', instruction: 'Gebruik de inhoudelijke oplossing uit de vraagdata.' },
    ],
    passCondition: 'Ken alleen treffers toe die volgens de vraagdata juist zijn.',
    reward: 'Trefferbeeld beoordeeld',
  },
  'mission-11-bodywire-fault': {
    title: 'Storing na de treffer',
    story:
      'Na een lampmelding onderzoek je materiaalstoring, draadproblemen en annulering.',
    articles: ['t.56', 't.57', 't.58', 't.59', 't.94', 't.95'],
    tasks: [
      { type: 'question', instruction: 'Bepaal waar een storing of loskoppeling relevant is.' },
      { type: 'question', instruction: 'Controleer het veiligheidssysteem en de registratie.' },
      { type: 'question', instruction: 'Beoordeel of annulering volgens de vraagdata aan de orde is.' },
    ],
    passCondition: 'Maak onderscheid tussen geldige registratie en storing.',
    reward: 'Storingsmoment afgerond',
  },
  'mission-12-card-maze': {
    title: 'Kaarten, protest en afronding',
    story:
      'Aan het eind van de toernooidag handel je sancties, beroep en afsluiting zorgvuldig af.',
    articles: [
      't.107',
      't.108',
      't.109',
      't.110',
      't.111',
      't.112',
      't.113',
      't.125-t.178',
    ],
    tasks: [
      { type: 'question', instruction: 'Plaats overtredingen in de juiste categorie of procedure.' },
      { type: 'question', instruction: 'Beoordeel kaarten en sancties op basis van de content.' },
      { type: 'question', instruction: 'Onderscheid protest, beroep en afronding van de wedstrijd.' },
    ],
    passCondition: 'Rond sanctie- en protestmomenten af zonder officiële goedkeuringsclaim.',
    reward: 'Toernooidag afgerond',
  },
};

const missionArticleNumbers = {
  'mission-01-salute-start': [1, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  'mission-02-build-piste': [16, 17, 18, 19, 20],
  'mission-03-ready-check': [21, 22, 23, 24, 25, 26, 27, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123],
  'mission-04-boundary-lab': [28, 29, 30, 31, 32, 33, 34, 35, 36, 37],
  'mission-05-pool-lock': [38, 41, 42, 44],
  'mission-06-de-clock': [39, 40, 43, 124],
  'mission-07-medical-room': [45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55],
  'mission-08-equipment-vault': [64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75],
  'mission-09-video-desk': [60, 61, 62, 63],
  'mission-10-double-hit-lab': [90, 91, 92, 93],
  'mission-11-bodywire-fault': [56, 57, 58, 59, 94, 95],
  'mission-12-card-maze': [
    107,
    108,
    109,
    110,
    111,
    112,
    113,
    ...Array.from({ length: 54 }, (_, index) => 125 + index),
  ],
};

const articleNumberByMission = new Map(
  Object.entries(missionArticleNumbers).map(([missionId, articleNumbers]) => [
    missionId,
    new Set(articleNumbers),
  ]),
);

const rooms = source.rooms.map((room) => ({
  ...room,
  ...(tournamentThemeRooms[room.id] ?? {}),
}));
const missions = source.missions.map((mission) => ({
  ...mission,
  ...(tournamentPhaseMissions[mission.id] ?? {}),
}));
const missionQuestionLinks = source.missions.map((mission) => ({
  missionId: mission.id,
  questionIds: source.questions
    .filter((question) => articleNumberByMission.get(mission.id)?.has(getArticleNumber(question.article)) ?? false)
    .map((question) => question.id),
}));
const seasonValues = [
  ...new Set(
    JSON.stringify(source)
      .match(/20\d{2}-20\d{2}/g)
      ?.filter((season) => season.startsWith('20')) ?? [],
  ),
].sort();

await mkdir('src/content/generated', { recursive: true });
await writeFile(
  targetPath,
  `${JSON.stringify(
    {
      schemaVersion: 1,
      ...source,
      source: {
        canonicalFile: sourcePath,
        supportingFiles: [
          'content-source/degenref_questions.json',
          'content-source/degenref_missions.json',
          'content-source/degenref_coverage.csv',
        ],
        relationStrategy: 'tournament-phase-article-map',
      },
      rooms,
      missions,
      missionQuestionLinks,
      seasonValues: seasonValues.length === 0 ? ['2025-2026'] : seasonValues,
    },
    null,
    2,
  )}\n`,
);

console.log(`Generated ${targetPath}`);

async function readSourceContent() {
  try {
    return await readFile(sourcePath, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }

    console.warn(
      `${sourcePath} ontbreekt; bestaande gegenereerde content wordt als fallback gebruikt.`,
    );
    return readFile(targetPath, 'utf8');
  }
}

function getArticleNumber(article) {
  return Number(String(article).match(/^t\.(\d+)/i)?.[1] ?? Number.NaN);
}
