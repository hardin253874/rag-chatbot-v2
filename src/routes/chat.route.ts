import { Router, Request, Response } from 'express';
import { ragQueryWithSources, Message } from '../services/rag';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { question, history = [], vectorStore, queryMode } = req.body;

  if (!question) {
    res.status(400).json({ error: 'question is required' });
    return;
  }

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sources: string[] = await ragQueryWithSources(
      question,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
      },
      history as Message[],
      { vectorStore, queryMode }
    );

    res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat failed', detail: String(err) });
  }
});

export default router;