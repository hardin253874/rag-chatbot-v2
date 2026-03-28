import { setVectorStore } from './setup-env';
setVectorStore('cloud');

import path from 'path';
import { ingest, SourceType } from '../services/ingest';

/**
 * Usage:
 *   npx ts-node src/tests/test-ingest-cloud.ts test-sample.md
 *   npx ts-node src/tests/test-ingest-cloud.ts report.pdf
 *   npx ts-node src/tests/test-ingest-cloud.ts https://example.com/article
 *
 * Files are resolved from the documents/ folder.
 */

function resolveType(fileOrUrl: string): SourceType {
  if (fileOrUrl.startsWith('http://') || fileOrUrl.startsWith('https://')) return 'url';
  const ext = path.extname(fileOrUrl).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  return 'text';
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: npx ts-node src/tests/test-ingest-cloud.ts <filename|url>');
    process.exit(1);
  }

  const type = resolveType(input);
  const source = type === 'url' ? input : path.resolve(__dirname, '../../documents', input);

  console.log(`Ingesting [${type}]: ${source}`);
  await ingest(source, type);
  console.log('Ingestion complete!');
}

main().catch(console.error);
