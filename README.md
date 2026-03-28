# RAG Chatbot v2

A Retrieval-Augmented Generation (RAG) chatbot built with TypeScript, OpenAI, and dual vector store support (ChromaDB local or Pinecone cloud). Ask questions grounded in your own documents — PDFs, text files, markdown, and web pages.

![RAG Chatbot](https://img.shields.io/badge/status-active-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![Node.js](https://img.shields.io/badge/Node.js-v24-green)

---

## What It Does

- **Ingest** documents from PDFs, text/markdown files, or any URL
- **Embed** content into vectors (OpenAI for local, Pinecone integrated for cloud)
- **Store** vectors in ChromaDB (local) or Pinecone (cloud) — configurable
- **Rewrite** user queries via LLM for better retrieval accuracy (optional)
- **Retrieve** the most relevant chunks when you ask a question
- **List** ingested resources per knowledge base
- **Stream** a grounded answer from `gpt-4o-mini` in real time
- **Cite** the source documents used in every answer
- **Remember** conversation history for multi-turn dialogue

---

## How It Works

**Ingestion (one-time per document):**
```
Document → Extract Text → Split into Chunks → Vector Store (ChromaDB or Pinecone)
```
Uploaded files store the original filename as the source identifier for readable resource listings.

**Chat (every question):**
```
Question → [Query Rewrite (optional)] → Vector Search → Build Prompt → GPT → Stream Answer
```

---

## Tech Stack

| Layer | Tool |
|---|---|
| Language | TypeScript (Node.js v24) |
| LLM | OpenAI `gpt-4o-mini` |
| Embeddings (local) | OpenAI `text-embedding-3-small` |
| Embeddings (cloud) | Pinecone `llama-text-embed-v2` (integrated) |
| RAG Framework | LangChain.js |
| Vector Store (local) | ChromaDB `0.5.20` (Docker) |
| Vector Store (cloud) | Pinecone Serverless (AWS us-east-1) |
| Query Rewrite | Configurable LLM (any OpenAI-compatible API) |
| Backend | Express.js 5 |
| Frontend | Vanilla HTML/CSS/JS |

---

## Prerequisites

- Node.js v18+
- Docker Desktop (for local mode only)
- OpenAI API key
- Pinecone API key (for cloud mode only)

---

## Getting Started

### 1. Install dependencies

```bash
cd rag-chatbot-v2
npm install --legacy-peer-deps
```

### 2. Configure environment

Create a `.env` file:
```env
# Core
OPENAI_API_KEY=your-openai-api-key
PORT=3010

# Vector store: "local" (ChromaDB) or "cloud" (Pinecone)
VECTOR_STORE=local

# Local mode (ChromaDB)
CHROMA_URL=http://localhost:8000
CHROMA_SERVER_VERSION=0.5.20

# Cloud mode (Pinecone)
PINECONE_API_KEY=your-pinecone-api-key

# Query mode: "raw" (no rewrite) or "rewrite" (LLM rewrites query before search)
QUERY_MODE=raw

# Query rewrite LLM config (used when QUERY_MODE=rewrite)
REWRITE_LLM_BASE_URL=https://api.openai.com/v1
REWRITE_LLM_MODEL=gpt-4o-mini
REWRITE_LLM_API_KEY=your-api-key
```

### 3. Start vector store

**Local mode** — start ChromaDB:
```bash
docker run -d --name chromadb -p 8000:8000 chromadb/chroma:0.5.20
```

**Cloud mode** — no Docker needed, just set `VECTOR_STORE=cloud` and `PINECONE_API_KEY`.

### 4. Start the dev server

```bash
npm run dev
```

### 5. Open the UI

```
http://localhost:3010
```

---

## Frontend UI

The sidebar provides runtime controls and per-store knowledge base management:

**Settings (top):**
- **Store** dropdown — switch between Local (ChromaDB) and Cloud (Pinecone) at runtime
- **Query** dropdown — switch between Raw and Enhancement (LLM query rewrite); shows configured LLM model info when Enhancement is selected

**Knowledge Base (per store):**
Each store has its own independent panel with:
- URL ingestion input + Add URL button
- File upload input + Upload File button
- Activity log (tracks ingestion events per store)
- **List Resources** button — displays all ingested sources (filenames and URLs) in that store
- Clear KB button — resets only that store's knowledge base

Switching the Store dropdown toggles between the Local and Cloud panels. All operations (ingest, list, clear, chat) respect the selected store.

---

## Dual Vector Store

The vector store backend is configurable via the `VECTOR_STORE` environment variable or the frontend Store dropdown (per-request override):

| Value | Backend | Embeddings | Requires |
|---|---|---|---|
| `local` (default) | ChromaDB | OpenAI `text-embedding-3-small` | Docker running ChromaDB |
| `cloud` | Pinecone | Pinecone `llama-text-embed-v2` (integrated) | `PINECONE_API_KEY` |

The vector store layer uses an interface pattern:
- `vectorstore.ts` — factory that delegates to the active backend
- `vectorstore-interface.ts` — shared interface (`storeDocuments`, `similaritySearch`, `resetCollection`, `listSources`)
- `vectorstore-chroma.ts` — ChromaDB implementation
- `vectorstore-pinecone.ts` — Pinecone implementation (index: `rag-chatbot-v2`, namespace: `rag-chatbot`)

Switching backends requires no code changes — update `.env` or use the frontend dropdown.

---

## Query Rewrite Service

An optional LLM-powered query rewriting step that transforms user questions into search-optimized queries before vector search.

**Why?** Raw user queries like `"what's the RAG robot"` may not match well against stored content like `"RAG chatbot architecture"`. The rewriter translates `"what's the RAG robot"` → `"RAG chatbot"` for better retrieval.

Controlled by `QUERY_MODE` in `.env` or the frontend Query dropdown (per-request override):

| Value | Behavior |
|---|---|
| `raw` (default) | User's question is sent directly to vector search |
| `rewrite` | LLM rewrites the question first, then searches |

The rewrite LLM is fully configurable — works with any OpenAI-compatible API:

```env
REWRITE_LLM_BASE_URL=https://api.openai.com/v1    # or any compatible endpoint
REWRITE_LLM_MODEL=gpt-4o-mini                      # or any model
REWRITE_LLM_API_KEY=your-api-key
```

---

## Project Structure

```
rag-chatbot-v2/
├── public/
│   └── index.html                    # Chat UI with store/query controls
├── src/
│   ├── routes/
│   │   ├── ingest.route.ts           # POST /ingest, GET /ingest/sources, DELETE /ingest/reset
│   │   └── chat.route.ts             # POST /chat (SSE streaming)
│   ├── services/
│   │   ├── vectorstore.ts            # Vector store factory
│   │   ├── vectorstore-interface.ts  # Shared VectorStore interface
│   │   ├── vectorstore-chroma.ts     # ChromaDB implementation
│   │   ├── vectorstore-pinecone.ts   # Pinecone implementation
│   │   ├── query-rewriter.ts         # LLM query rewrite service
│   │   ├── loaders.ts                # PDF, text/md, web page loaders
│   │   ├── splitter.ts               # Chunk documents into pieces
│   │   ├── ingest.ts                 # Ingestion pipeline orchestrator
│   │   ├── retriever.ts              # Similarity search wrapper
│   │   └── rag.ts                    # Prompt builder + GPT streaming
│   ├── tests/
│   │   ├── setup-env.ts              # Test environment configuration
│   │   ├── test-ingest-local.ts      # Test ingestion with ChromaDB
│   │   ├── test-ingest-cloud.ts      # Test ingestion with Pinecone
│   │   ├── test-rag-local.ts         # Test RAG query with ChromaDB
│   │   ├── test-rag-cloud.ts         # Test RAG query with Pinecone
│   │   └── test-list-sources.ts      # Test listing ingested resources
│   ├── types/
│   │   └── pdf-parse.d.ts            # Type declaration for pdf-parse
│   └── index.ts                      # Express app entry point
├── documents/                        # Your source documents
├── uploads/                          # Temporary file upload storage
├── .env                              # Environment variables (never commit)
├── .gitignore
├── tsconfig.json
└── package.json
```

---

## Testing

### Ingest Tests

Test document ingestion for each vector store backend. Files are resolved from the `documents/` folder.

```bash
# Local (ChromaDB)
npx ts-node src/tests/test-ingest-local.ts test-sample.md
npx ts-node src/tests/test-ingest-local.ts report.pdf
npx ts-node src/tests/test-ingest-local.ts https://example.com/article

# Cloud (Pinecone)
npx ts-node src/tests/test-ingest-cloud.ts test-sample.md
npx ts-node src/tests/test-ingest-cloud.ts report.pdf
npx ts-node src/tests/test-ingest-cloud.ts https://example.com/article
```

### RAG Query Tests

Test retrieval + answer generation. Supports optional query mode as the third argument.

```bash
# Local + raw query (default)
npx ts-node src/tests/test-rag-local.ts "what is RAG"
npx ts-node src/tests/test-rag-local.ts "what is RAG" raw

# Local + query rewrite
npx ts-node src/tests/test-rag-local.ts "what's the RAG robot" rewrite

# Cloud + raw query (default)
npx ts-node src/tests/test-rag-cloud.ts "what is RAG"
npx ts-node src/tests/test-rag-cloud.ts "what is RAG" raw

# Cloud + query rewrite
npx ts-node src/tests/test-rag-cloud.ts "what's the RAG robot" rewrite
```

### List Sources Test

List all ingested resources in a knowledge base.

```bash
# Local (ChromaDB)
npx ts-node src/tests/test-list-sources.ts local

# Cloud (Pinecone)
npx ts-node src/tests/test-list-sources.ts cloud
```

### All Scenarios Matrix

| Command | Vector Store | Query Mode |
|---|---|---|
| `test-ingest-local.ts <file>` | ChromaDB | — |
| `test-ingest-cloud.ts <file>` | Pinecone | — |
| `test-rag-local.ts "question"` | ChromaDB | raw |
| `test-rag-local.ts "question" rewrite` | ChromaDB | rewrite |
| `test-rag-cloud.ts "question"` | Pinecone | raw |
| `test-rag-cloud.ts "question" rewrite` | Pinecone | rewrite |
| `test-list-sources.ts local` | ChromaDB | — |
| `test-list-sources.ts cloud` | Pinecone | — |

---

## API Endpoints

### `POST /ingest`

Ingest a URL:
```bash
Invoke-WebRequest -Method POST http://localhost:3010/ingest `
  -ContentType "application/json" `
  -Body '{"url": "https://example.com/article", "vectorStore": "local"}'
```

Upload a file (original filename is preserved as the source identifier):
```bash
Invoke-WebRequest -Method POST http://localhost:3010/ingest `
  -Body (New-Object System.Net.Http.MultipartFormDataContent)
```

Optional `vectorStore` param (`local` or `cloud`) overrides the `.env` default.

### `GET /ingest/sources`

List all ingested resources in a knowledge base:
```bash
curl "http://localhost:3010/ingest/sources?vectorStore=local"
# {"success":true,"sources":["test-sample.md","https://example.com/article"]}
```

### `POST /chat`

Send a question (returns Server-Sent Events stream):
```bash
Invoke-WebRequest -Method POST http://localhost:3010/chat `
  -ContentType "application/json" `
  -Body '{"question": "What is RAG?", "history": [], "vectorStore": "local", "queryMode": "raw"}'
```

Optional `vectorStore` and `queryMode` params override `.env` defaults per-request.

SSE response format:
```
data: {"type":"chunk","text":"Retrieval"}
data: {"type":"chunk","text":"-augmented"}
...
data: {"type":"sources","sources":["https://..."]}
data: {"type":"done"}
```

### `DELETE /ingest/reset`

Clear a specific knowledge base:
```bash
Invoke-WebRequest -Method DELETE "http://localhost:3010/ingest/reset?vectorStore=local"
```

### `GET /config`

Get current server configuration (used by frontend):
```bash
curl http://localhost:3010/config
# {"vectorStore":"local","queryMode":"raw","rewriteLlm":{"baseUrl":"...","model":"..."}}
```

### `GET /health`

```bash
curl http://localhost:3010/health
# {"status":"ok"}
```

---

## Supported Document Types

| Type | Extensions | Notes |
|---|---|---|
| PDF | `.pdf` | Text extracted via `pdf-parse` directly |
| Text | `.txt`, `.md` | Loaded via LangChain TextLoader |
| Web Page | Any URL | Scraped via Cheerio |

Uploaded files store the original filename (not the temp multer path) as the source metadata, so resource listings display readable names.

---

## Key Dependency Versions

> These versions are pinned intentionally. Do not upgrade without testing.

```json
"chromadb": "1.9.2",
"@pinecone-database/pinecone": "7.1.0",
"langchain": "0.3.6",
"@langchain/core": "0.3.26",
"@langchain/community": "0.3.20",
"@langchain/openai": "0.3.16",
"dotenv": "16.4.5",
"pdf-parse": "1.1.1"
```

ChromaDB Docker image: `chromadb/chroma:0.5.20`

Always install with:
```bash
npm install --legacy-peer-deps
```

---

## Scripts

```bash
npm run dev      # Start dev server with hot reload (ts-node + nodemon)
npm run build    # Compile TypeScript to dist/
npm run start    # Run compiled output
```

---

## Notes

- Local mode: ChromaDB must be running before starting the server (`docker start chromadb`)
- Cloud mode: No Docker needed, just `PINECONE_API_KEY` in `.env`
- Frontend Store and Query dropdowns override `.env` defaults per-request without server restart
- Query rewrite adds ~200-400ms latency per query but improves retrieval for informal questions
- Uploaded files store original filenames as source metadata for readable resource listings
- On Windows, use `Invoke-WebRequest` instead of `curl` for API testing
- The `uploads/` folder stores temporary files during ingestion and is auto-cleaned
- Chat history is stored in browser memory only — it resets on page refresh
