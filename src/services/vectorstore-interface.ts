import { Document } from '@langchain/core/documents';

export interface VectorStore {
  storeDocuments(docs: Document[]): Promise<void>;
  similaritySearch(question: string, topK?: number): Promise<Document[]>;
  resetCollection(): Promise<void>;
  listSources(): Promise<string[]>;
}
