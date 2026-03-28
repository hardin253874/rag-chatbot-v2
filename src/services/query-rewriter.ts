const SYSTEM_PROMPT = `You are a query rewriter for a document search system.
Your job is to take a user's natural language question and rewrite it into a clear, search-optimized query.

Rules:
- Extract the core intent and topic
- Expand abbreviations and acronyms
- Replace slang or informal terms with precise equivalents (e.g. "robot" → "chatbot/system")
- Remove conversational filler ("what's the", "can you tell me about", "hey")
- Output ONLY the rewritten query, nothing else — no quotes, no explanation`;

export async function rewriteQuery(question: string): Promise<string> {
  const baseUrl = process.env.REWRITE_LLM_BASE_URL;
  const model = process.env.REWRITE_LLM_MODEL;
  const apiKey = process.env.REWRITE_LLM_API_KEY;

  if (!baseUrl || !model || !apiKey) {
    console.warn('Query rewrite config missing, using raw query');
    return question;
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: question },
      ],
      temperature: 0,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    console.warn(`Query rewrite failed (${response.status}), using raw query`);
    return question;
  }

  const data = await response.json() as any;
  const rewritten = data.choices?.[0]?.message?.content?.trim();

  if (!rewritten) {
    console.warn('Query rewrite returned empty, using raw query');
    return question;
  }

  console.log(`Query rewrite: "${question}" → "${rewritten}"`);
  return rewritten;
}

export async function processQuery(question: string, queryMode?: string): Promise<string> {
  const mode = queryMode || process.env.QUERY_MODE || 'raw';
  if (mode === 'rewrite') {
    return rewriteQuery(question);
  }
  return question;
}
