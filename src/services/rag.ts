import { ChatOpenAI } from '@langchain/openai';
import { retrieveChunks } from './retriever';
import { processQuery } from './query-rewriter';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Questions that refer to prior conversation rather than documents
function isConversational(question: string): boolean {
  const q = question.toLowerCase();
  return (
    q.includes('you just said') ||
    q.includes('you mentioned') ||
    q.includes('summarise') ||
    q.includes('summarize') ||
    q.includes('what did you') ||
    q.includes('previous') ||
    q.includes('last answer') ||
    q.includes('above') ||
    q.includes('repeat')
  );
}

function getLLM() {
  return new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    streaming: true,
    temperature: 0.2,
  });
}

function buildPrompt(context: string, question: string, history: Message[]): string {
  const historyText = history.length > 0
    ? '\n\nConversation so far:\n' + history
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n')
    : '';

  return `You are a helpful assistant. Answer the question using the context provided below.
Focus on the core topic of the question and use any relevant information from the context to provide a helpful answer.
If the context is partially relevant, answer with what you can and note any gaps.
Only refuse to answer if the context has absolutely nothing to do with the question.

Context:
${context}${historyText}

Question: ${question}`;
}

function buildConversationalPrompt(question: string, history: Message[]): string {
  const historyText = history
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  return `You are a helpful assistant. Based on the conversation below, answer the user's latest question.

Conversation:
${historyText}

Question: ${question}`;
}

export interface QueryOptions {
  vectorStore?: string;
  queryMode?: string;
}

export async function ragQuery(
  question: string,
  onChunk: (text: string) => void,
  history: Message[] = [],
  options: QueryOptions = {}
): Promise<void> {
  // If it's a follow-up question about prior conversation, skip retrieval
  if (isConversational(question) && history.length > 0) {
    const prompt = buildConversationalPrompt(question, history);
    const stream = await getLLM().stream(prompt);
    for await (const chunk of stream) {
      const text = chunk.content?.toString() ?? '';
      if (text) onChunk(text);
    }
    return;
  }

  const searchQuery = await processQuery(question, options.queryMode);
  const chunks = await retrieveChunks(searchQuery, 5, options.vectorStore);
  if (chunks.length === 0) {
    onChunk("I couldn't find any relevant information in the knowledge base.");
    return;
  }

  const context = chunks.map((c, i) => `[${i + 1}] ${c.pageContent}`).join('\n\n');
  const stream = await getLLM().stream(buildPrompt(context, question, history));
  for await (const chunk of stream) {
    const text = chunk.content?.toString() ?? '';
    if (text) onChunk(text);
  }
}

export async function ragQueryWithSources(
  question: string,
  onChunk: (text: string) => void,
  history: Message[] = [],
  options: QueryOptions = {}
): Promise<string[]> {
  // If it's a follow-up question about prior conversation, skip retrieval
  if (isConversational(question) && history.length > 0) {
    const prompt = buildConversationalPrompt(question, history);
    const stream = await getLLM().stream(prompt);
    for await (const chunk of stream) {
      const text = chunk.content?.toString() ?? '';
      if (text) onChunk(text);
    }
    return [];
  }

  const searchQuery = await processQuery(question, options.queryMode);
  const chunks = await retrieveChunks(searchQuery, 5, options.vectorStore);
  if (chunks.length === 0) {
    onChunk("I couldn't find any relevant information in the knowledge base.");
    return [];
  }

  const context = chunks.map((c, i) => `[${i + 1}] ${c.pageContent}`).join('\n\n');
  const stream = await getLLM().stream(buildPrompt(context, question, history));
  for await (const chunk of stream) {
    const text = chunk.content?.toString() ?? '';
    if (text) onChunk(text);
  }

  return [...new Set(chunks.map(c => c.metadata?.source).filter(Boolean))];
}