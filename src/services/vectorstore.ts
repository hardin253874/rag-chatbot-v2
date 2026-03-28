import { Document } from '@langchain/core/documents';
import { VectorStore } from './vectorstore-interface';
import { chromaStore } from './vectorstore-chroma';
import { pineconeStore } from './vectorstore-pinecone';

function getStore(override?: string): VectorStore {
  const mode = override || process.env.VECTOR_STORE || 'local';
  if (mode === 'cloud') return pineconeStore;
  return chromaStore;
}

export async function storeDocuments(docs: Document[], vectorStore?: string): Promise<void> {
  return getStore(vectorStore).storeDocuments(docs);
}

export async function similaritySearch(question: string, topK: number = 5, vectorStore?: string): Promise<Document[]> {
  return getStore(vectorStore).similaritySearch(question, topK);
}

export async function resetCollection(vectorStore?: string): Promise<void> {
  return getStore(vectorStore).resetCollection();
}

export async function listSources(vectorStore?: string): Promise<string[]> {
  return getStore(vectorStore).listSources();
}
