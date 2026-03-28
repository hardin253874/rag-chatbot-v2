import { Pinecone } from '@pinecone-database/pinecone';
import { Document } from '@langchain/core/documents';
import { VectorStore } from './vectorstore-interface';

const INDEX_NAME = 'rag-chatbot-v2';
const NAMESPACE = 'rag-chatbot';

function getClient() {
  return new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
}

function getIndex() {
  return getClient().index(INDEX_NAME);
}

export const pineconeStore: VectorStore = {
  async storeDocuments(docs: Document[]): Promise<void> {
    const index = getIndex();

    const records = docs.map((doc, i) => ({
      _id: `doc_${Date.now()}_${i}`,
      chunk_text: doc.pageContent,
      source: (doc.metadata?.source as string) || '',
    }));

    // Pinecone upsertRecords has a limit per call
    const batchSize = 96;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await index.upsertRecords({ records: batch, namespace: NAMESPACE });
      console.log(`Upserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} records) into Pinecone`);
    }

    console.log(`Stored ${docs.length} chunks into Pinecone`);
  },

  async similaritySearch(question: string, topK: number = 5): Promise<Document[]> {
    const index = getIndex();

    const response = await index.searchRecords({
      query: {
        inputs: { text: question },
        topK,
      },
      namespace: NAMESPACE,
    });

    const result = response as any;
    const hits = result.result?.hits ?? [];

    return hits.map((hit: any) => new Document({
      pageContent: (hit.fields?.chunk_text as string) ?? '',
      metadata: { source: (hit.fields?.source as string) ?? '' },
    }));
  },

  async listSources(): Promise<string[]> {
    const index = getIndex();

    // Use a broad search to collect unique sources
    const response = await index.searchRecords({
      query: {
        inputs: { text: 'document' },
        topK: 100,
      },
      fields: ['source'],
      namespace: NAMESPACE,
    });

    const result = response as any;
    const hits = result.result?.hits ?? [];
    const sources: string[] = hits
      .map((hit: any) => (hit.fields?.source as string) ?? '')
      .filter(Boolean);
    return [...new Set(sources)];
  },

  async resetCollection(): Promise<void> {
    const index = getIndex();
    await index.namespace(NAMESPACE).deleteAll();
    console.log('Pinecone namespace cleared.');
  },
};
