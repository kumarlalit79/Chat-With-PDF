# Chat With PDF

> A RAG-powered CLI tool that lets you have a multi-turn conversation with any PDF using Google Gemini and Pinecone.

---



<!-- Add a screen recording or live link here -->
<!-- Add screenshots here -->

---

## 📋 Description

Chat With PDF is a Retrieval-Augmented Generation (RAG) pipeline that ingests a PDF document, stores it as vector embeddings in Pinecone, and lets you ask questions about it through an interactive terminal chat. It uses Google Gemini to both embed content and generate answers, ensuring responses are grounded strictly in the document. The project currently ships with a Data Structures & Algorithms PDF as a demonstration, but the pipeline works with any PDF.

---

## ⚙️ Tech Stack

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-000000?style=for-the-badge&logo=langchain&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Pinecone](https://img.shields.io/badge/Pinecone-000000?style=for-the-badge&logo=pinecone&logoColor=white)
![dotenv](https://img.shields.io/badge/dotenv-ECD53F?style=for-the-badge&logo=dotenv&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## ✨ Features

- **PDF Ingestion Pipeline** — Loads any PDF, splits it into overlapping chunks, and indexes it automatically.
- **Google Gemini Embeddings** — Uses the `gemini-embedding-001` model to generate high-quality semantic vectors.
- **Pinecone Vector Store** — Stores and retrieves document chunks via fast similarity search (top-10 matches per query).
- **Query Rewriting** — Follow-up questions are automatically rewritten into standalone queries using `gemini-2.5-flash-lite` so conversation history is always understood correctly.
- **Multi-turn Conversation Memory** — Maintains the full chat history throughout the session for coherent, context-aware replies.
- **Grounded Answers Only** — The model is instructed to answer strictly from retrieved document context and explicitly says so when it cannot find an answer.
- **Rate Limit Handling** — The ingestion script batches embedding requests (10 at a time) and auto-pauses for 60 seconds when the free-tier Gemini API limit is reached.

---

## 🔄 How It Works

### Ingestion (run once — `index.js`)

1. The PDF file is loaded from disk using `PDFLoader`.
2. The text is split into chunks of **1,000 characters** with a **200-character overlap** using `RecursiveCharacterTextSplitter`.
3. Each chunk is embedded using **Google Gemini** (`gemini-embedding-001`).
4. All vectors are upserted into a **Pinecone** index in batches of 100.

### Query Loop (run to chat — `query.js`)

1. You type a question in the terminal.
2. Gemini (`gemini-2.5-flash-lite`) rewrites the question into a standalone query using prior chat history.
3. The rewritten query is embedded and sent to Pinecone for a **similarity search** (top-10 chunks).
4. The retrieved chunks are assembled into a context block.
5. Gemini generates an answer **strictly from that context** and prints it to the terminal.
6. The answer is added to history — enabling natural follow-up questions.

### AI Flow Diagram

```
Your Question
     │
     ▼
Query Rewriter (Gemini) ──── Chat History ──▶ Standalone Query
     │
     ▼
Gemini Embedding Model ──▶ Query Vector
     │
     ▼
Pinecone Similarity Search ──▶ Top-10 Matching Chunks
     │
     ▼
Gemini Answer Generator ──── Context Chunks ──▶ Final Answer
     │
     ▼
Terminal Output + History Updated
```

---

## 📁 Project Structure

```
Chat_With_Pdf/
├── index.js          # PDF ingestion pipeline: load → chunk → embed → store in Pinecone
├── query.js          # Interactive CLI chat loop with RAG and conversation history
├── dsa.pdf           # Sample PDF document (Data Structures & Algorithms)
├── package.json      # Project metadata and npm dependencies
├── .env              # API keys (not committed to git)
└── .gitignore        # Ignores node_modules and .env
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [Google AI Studio](https://aistudio.google.com/) account (for the Gemini API key)
- A [Pinecone](https://www.pinecone.io/) account with an index created

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/kumarlalit79/Chat_With_Pdf.git
cd Chat_With_Pdf

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# Fill in your API keys (see Environment Variables below)

# 4. Ingest your PDF (only needs to run once)
node index.js

# 5. Start chatting
node query.js
```

> **Tip:** Replace `dsa.pdf` with any PDF of your choice before running `index.js`. Update the `PDF_Path` variable in `index.js` if you rename the file.

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `GOOGLE_API_KEY` | Your Google Gemini API key from AI Studio | `AIzaSy...` |
| `PINECONE_API_KEY` | Your Pinecone API key | `pcsk_...` |
| `PINECONE_INDEX` | Name of your Pinecone index | `pdf-chat-index` |

Create a `.env` file in the project root with these values:

```env
GOOGLE_API_KEY=your_google_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=your_pinecone_index_name
```

---

## 👤 Author

**Lalit Kumar**
GitHub: [@kumarlalit79](https://github.com/kumarlalit79)
