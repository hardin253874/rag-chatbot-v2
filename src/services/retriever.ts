import { similaritySearch } from './vectorstore';
import { Document } from '@langchain/core/documents';

export async function retrieveChunks(
  question: string,
  topK: number = 5,
  vectorStore?: string
): Promise<Document[]> {
  const results = await similaritySearch(question, topK, vectorStore);
  console.log(`Retrieved ${results.length} chunks for: "${question}"`);
  return results;
}
