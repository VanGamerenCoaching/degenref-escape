import { loadValidContent } from '../src/content/loadContent';

const content = await loadValidContent();
const questionTypes = countBy(content.questions.map((question) => question.type));
const categories = [...new Set(content.questions.map((question) => question.category))].sort();
const ruleVersions = [...new Set(content.questions.map((question) => question.rulesVersion))].sort();
const reviewStatuses = countBy(content.questions.map((question) => String(question.reviewed)));

console.log('DegenRef Escape content summary');
console.log(`Canonieke bron: ${content.source.canonicalFile}`);
console.log(`Rooms: ${String(content.rooms.length)}`);
console.log(`Lessons: ${String(content.lessons.length)}`);
console.log(`Missions: ${String(content.missions.length)}`);
console.log(`Questions: ${String(content.questions.length)}`);
console.log(`Vraagtypen: ${formatCounts(questionTypes)}`);
console.log(`Categorieen (${String(categories.length)}): ${categories.join(', ')}`);
console.log(`Missies (${String(content.missions.length)}): ${content.missions.map((mission) => mission.id).join(', ')}`);
console.log(`Seizoenswaarden: ${content.seasonValues.join(', ')}`);
console.log(`Reglementversies: ${ruleVersions.join(', ')}`);
console.log(`Reviewstatussen: ${formatCounts(reviewStatuses)}`);

function countBy(values: readonly string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function formatCounts(counts: Record<string, number>): string {
  return Object.entries(counts)
    .map(([key, value]) => `${key} (${String(value)})`)
    .join(', ');
}
