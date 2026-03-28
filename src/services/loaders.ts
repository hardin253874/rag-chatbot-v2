import { TextLoader } from 'langchain/document_loaders/fs/text';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { Document } from '@langchain/core/documents';
import pdfParse from 'pdf-parse';
import fs from 'fs';

export async function loadPDF(filePath: string): Promise<Document[]> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const doc = new Document({
    pageContent: data.text,
    metadata: { source: filePath, pages: data.numpages },
  });
  console.log(`Loaded PDF: ${filePath} — ${data.numpages} page(s)`);
  return [doc];
}

export async function loadText(filePath: string): Promise<Document[]> {
  const loader = new TextLoader(filePath);
  const docs = await loader.load();
  console.log(`Loaded text file: ${filePath} — ${docs.length} doc(s)`);
  return docs;
}

export async function loadWebPage(url: string): Promise<Document[]> {
  const loader = new CheerioWebBaseLoader(url);
  const docs = await loader.load();
  console.log(`Loaded web page: ${url} — ${docs.length} doc(s)`);
  return docs;
}