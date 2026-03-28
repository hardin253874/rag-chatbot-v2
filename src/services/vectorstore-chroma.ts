import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { VectorStore } from './vectorstore-interface';

const COLLECTION_NAME = 'rag-chatbot';

const client = new ChromaClient({
  path: 'http://localhost:8000',
});

function getEmbeddings() {
  return new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small',
  });
}

async function getCollection() {
  return await client.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: { 'hnsw:space': 'cosine' },
  });
}

export const chromaStore: VectorStore = {
  async storeDocuments(docs: Document[]): Promise<void> {
    const embeddings = getEmbeddings();
    const collection = await getCollection();

    const texts = docs.map(d => d.pageContent);
    const vectors = await embeddings.embedDocuments(texts);
    const ids = docs.map((_, i) => `doc_${Date.now()}_${i}`);
    const metadatas = docs.map(d => d.metadata || {});

    await collection.add({
      ids,
      embeddings: vectors,
      documents: texts,
      metadatas,
    });

    console.log(`Stored ${docs.length} chunks into ChromaDB`);
  },

  async similaritySearch(question: string, topK: number = 5): Promise<Document[]> {
    const embeddings = getEmbeddings();
    const collection = await getCollection();

    const queryVector = await embeddings.embedQuery(question);

    const results = await collection.query({
      queryEmbeddings: [queryVector],
      nResults: topK,
    });

    const documents = (results.documents?.[0] ?? []) as string[];
    const metadatas = (results.metadatas?.[0] ?? []) as Record<string, unknown>[];

    return documents.map((text, i) => new Document({
      pageContent: text ?? '',
      metadata: metadatas[i] ?? {},
    }));
  },

  async listSources(): Promise<string[]> {
    const collection = await getCollection();
    const result = await collection.get({ include: ['metadatas' as any] });
    const sources = result.metadatas
      ?.map(m => m?.source as string)
      .filter(Boolean) ?? [];
    return [...new Set(sources)];
  },

  async resetCollection(): Promise<void> {
    try {
      await client.deleteCollection({ name: COLLECTION_NAME });
      console.log('Collection deleted.');
    } catch {
      console.log('Collection did not exist, nothing to delete.');
    }
    await client.createCollection({
      name: COLLECTION_NAME,
      metadata: { 'hnsw:space': 'cosine' },
    });
    console.log('Fresh collection created.');
  },
};
