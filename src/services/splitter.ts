import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';


//const splitter = new RecursiveCharacterTextSplitter({
//  chunkSize: 500,
//  chunkOverlap: 50,
//});

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,   // try 250, 500, 1000, 2000
  chunkOverlap: 100, // keep ~10-20% of chunkSize
});

export async function splitDocuments(docs: Document[]): Promise<Document[]> {
  const chunks = await splitter.splitDocuments(docs);
  console.log(`Split into ${chunks.length} chunks`);
  return chunks;
}