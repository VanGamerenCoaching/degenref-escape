import { loadContent } from '../src/content/loadContent';

const result = await loadContent();

if (!result.ok) {
  console.error(result.errorMessage);
  process.exit(1);
}

console.log('Contentvalidatie geslaagd.');
console.log(`Waarschuwingen: ${String(result.warningMessages.length)}`);

for (const warning of result.warningMessages.slice(0, 20)) {
  console.log(`- ${warning}`);
}

if (result.warningMessages.length > 20) {
  console.log(`- ... ${String(result.warningMessages.length - 20)} extra waarschuwingen`);
}
