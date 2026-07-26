import { mkdir, readFile, writeFile } from 'node:fs/promises';

const sourcePath = 'content-source/degenref_content_pack.json';
const targetPath = 'src/content/generated/appContent.json';

const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const missionQuestionLinks = source.missions.map((mission) => ({
  missionId: mission.id,
  questionIds: source.questions
    .filter(
      (question) =>
        mission.articles.includes(question.article) ||
        question.roomId === mission.roomId,
    )
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
      source: {
        canonicalFile: sourcePath,
        supportingFiles: [
          'content-source/degenref_questions.json',
          'content-source/degenref_missions.json',
          'content-source/degenref_coverage.csv',
        ],
        relationStrategy: 'mission-room-article-match',
      },
      ...source,
      missionQuestionLinks,
      seasonValues: seasonValues.length === 0 ? ['2025-2026'] : seasonValues,
    },
    null,
    2,
  )}\n`,
);

console.log(`Generated ${targetPath}`);
