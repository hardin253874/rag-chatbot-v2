import { loadPDF, loadText, loadWebPage } from './loaders';
import { splitDocuments } from './splitter';
import { storeDocuments } from './vectorstore';

export type SourceType = 'pdf' | 'text' | 'url';

export async function ingest(source: string, type: SourceType, vectorStore?: string, sourceName?: string): Promise<void> {
  const displayName = sourceName || source;
  console.log(`\nIngesting [${type}]: ${displayName}`);

  let docs;
  if (type === 'pdf') {
    docs = await loadPDF(source);
  } else if (type === 'text') {
    docs = await loadText(source);
  } else {
    docs = await loadWebPage(source);
  }

  // Override source metadata with original filename if provided
  if (sourceName) {
    docs.forEach(doc => { doc.metadata.source = sourceName; });
  }

  const chunks = await splitDocuments(docs);

  if (chunks.length === 0) {
    throw new Error('No content could be extracted from this document.');
  }

  await storeDocuments(chunks, vectorStore);
  console.log(`Ingestion complete for: ${displayName}\n`);
}