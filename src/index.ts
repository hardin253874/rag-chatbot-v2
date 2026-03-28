import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import ingestRoute from './routes/ingest.route';
import chatRoute from './routes/chat.route';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3010;

app.use(cors());
app.use(express.json());

// Serve static UI
app.use(express.static(path.join(__dirname, '../public')));

app.use('/ingest', ingestRoute);
app.use('/chat', chatRoute);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/config', (req, res) => {
  res.json({
    vectorStore: process.env.VECTOR_STORE || 'local',
    queryMode: process.env.QUERY_MODE || 'raw',
    rewriteLlm: {
      baseUrl: process.env.REWRITE_LLM_BASE_URL || '',
      model: process.env.REWRITE_LLM_MODEL || '',
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});