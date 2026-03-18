import fs from 'fs';
import path from 'path';
import { generateMockData } from '../src/data/mockData';

async function main() {
  const components = generateMockData();
  const outDir = path.resolve(__dirname, '..', 'public');
  const outFile = path.join(outDir, 'catalog.json');

  await fs.promises.mkdir(outDir, { recursive: true });
  await fs.promises.writeFile(outFile, JSON.stringify(components, null, 2), 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Wrote ${components.length} components to ${outFile}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

