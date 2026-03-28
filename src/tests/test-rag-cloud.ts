import { setVectorStore, setQueryMode, QueryMode } from './setup-env';
setVectorStore('cloud');

// Usage:
//   npx ts-node src/tests/test-rag-cloud.ts "your question"
//   npx ts-node src/tests/test-rag-cloud.ts "your question" rewrite
//   npx ts-node src/tests/test-rag-cloud.ts "your question" raw

const queryMode = (process.argv[3] as QueryMode) || 'raw';
setQueryMode(queryMode);

import { ragQuery } from '../services/rag';

async function main() {
  const question = process.argv[2] || 'What is retrieval-augmented generation?';
  console.log(`\nQuestion: ${question}\n`);
  console.log('Answer:');

  await ragQuery(question, (chunk) => {
    process.stdout.write(chunk);
  });

  console.log('\n\nDone!');
}

main().catch(console.error);
