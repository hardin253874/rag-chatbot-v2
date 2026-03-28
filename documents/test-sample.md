# RAG Chatbot Architecture

## Overview

The RAG (Retrieval-Augmented Generation) chatbot is a system that combines document retrieval with language model generation to provide grounded answers.

## Key Components

### Document Ingestion
Documents are loaded, split into chunks, embedded using OpenAI's text-embedding-3-small model, and stored in ChromaDB.

### Retrieval
When a user asks a question, the system embeds the query and performs a cosine similarity search against stored vectors to find the top 5 most relevant chunks.

### Generation
The retrieved chunks are injected as context into a prompt sent to GPT-4o-mini, which generates a grounded answer streamed back to the user via Server-Sent Events.

## Supported Formats

- PDF files (.pdf)
- Text files (.txt)
- Markdown files (.md)
- Web pages (any URL)
