A Next.js application that lets users upload any PDF and instantly start chatting with it.
Ask questions, get summaries, extract metadata (title, author, keywords, etc.) and jump to cited pages in the original document – all in a clean, responsive interface.
## Getting Started

First, run the development server:

npm install
npm run dev

```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This is the project structure

pdf-chat-assistant/
├─ app/
│  ├─ api/
│  │  ├─ chat/route.ts        # POST /api/chat – ask questions
│  │  ├─ pdf/[pdfId]/route.ts # GET / POST PDF metadata & processing
│  │  └─ upload/route.ts      # POST /api/upload – file upload endpoint
│  ├─ components/
│  │  ├─ Chatbox.tsx          # Main chat UI with suggestions
│  │  ├─ PdfViewer.tsx        # React-PDF viewer + page navigator
│  │  ├─ UploadArea.tsx       # Drag-and-drop upload card
│  │  └─ ...
│  ├─ context/page.context.tsx# Global state (pdfId, pageNumber, etc.)
│  └─ page.tsx                # Entry point – handles upload / chat layout
├─ utils/
│  └─ langchainPdf.ts         # LangChain logic (split, embed, answer)
├─ public/uploads/            # Uploaded PDFs (auto-created)
└─ ...



## Features

Upload PDFs and extract metadata (title, author, summary, etc.)

Semantic search across the document with vector embeddings

Natural chat interface with sources + citations

Interactive viewer: citations link to the right page in the PDF

Built with Next.js App Router (frontend + backend in one)

⚙️ How it Works

📝 Processing

PDF is loaded with PDFLoader

Split into 1000-token chunks (200 overlap)

Embedded via OpenAI text-embedding-ada-002

Stored in an in-memory vector store (MemoryVectorStore)

Metadata (title, author, summary, etc.) extracted using GPT-3.5 prompt

💬 Chat

Metadata questions (e.g. “title?”, “author?”) → answered instantly without search

Content questions → vector similarity search → retrieval chain → GPT generates an answer with page citations

📖 Viewer

react-pdf renders the document

Citations and buttons sync the viewer to the correct page via global context

## ⚡ Optimizations
🔹 Performance

Smarter chunking → adaptive splitting by semantic paragraphs (500–1500 tokens depending on PDF type).

Caching embeddings → hash PDFs and skip re-embedding if already stored.

Streaming answers → show tokens as they arrive for faster perceived response.

🔹 Cost

Cheaper models for metadata → gpt-3.5-turbo for title/author, higher models only for deep Q&A.

Token-efficient retrieval → limit context to top 3–5 relevant chunks (MMR to avoid redundancy).

Batch embedding requests → embed multiple chunks per API call to reduce request overhead.

🔹 User Experience

Prefetch metadata → show title, author, and summary instantly while embeddings process in the background.

Citation highlighting → highlight exact answer sentences in PDF viewer, not just page numbers.

Progressive loading → process first N pages immediately, allow questions on them while rest of PDF embeds.