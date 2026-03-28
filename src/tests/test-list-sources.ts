import { setVectorStore, Environment } from './setup-env';

// Usage:
//   npx ts-node src/tests/test-list-sources.ts local
//   npx ts-node src/tests/test-list-sources.ts cloud

const store = (process.argv[2] as Environment) || 'local';
setVectorStore(store);

import { listSources } from '../services/vectorstore';

async function main() {
  console.log('Listing sources...\n');
  const sources = await listSources();

  if (sources.length === 0) {
    console.log('No resources found in knowledge base.');
  } else {
    console.log(`Found ${sources.length} source(s):`);
    sources.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s}`);
    });
  }
}

main().catch(console.error);
