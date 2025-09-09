import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const vectorStores: Record<string, MemoryVectorStore> = {};
const processingStatus: Record<string, boolean> = {};
const pdfMetadata: Record<string, PdfMetadata> = {};
export const pdfUrls: Record<string, string> = {};

interface PdfMetadata {
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  subject?: string;
  keywords?: string;
  creationDate?: string;
  modificationDate?: string;
  pageCount?: number;
  extractedInfo?: {
    possibleTitles: string[];
    possibleAuthors: string[];
    firstPageText: string;
    documentSummary?: string;
  };
}

// Extract metadata from PDF document
async function extractPdfMetadata(
  docs: any[],
  pdfId: string
): Promise<PdfMetadata> {
  const metadata: PdfMetadata = {};

  if (docs.length > 0) {
    const firstDoc = docs[0];

    // Extract built-in PDF metadata
    if (firstDoc.metadata?.pdf) {
      const pdfMeta = firstDoc.metadata.pdf;
      metadata.title = pdfMeta.info?.Title;
      metadata.author = pdfMeta.info?.Author;
      metadata.creator = pdfMeta.info?.Creator;
      metadata.producer = pdfMeta.info?.Producer;
      metadata.subject = pdfMeta.info?.Subject;
      metadata.keywords = pdfMeta.info?.Keywords;
      metadata.creationDate = pdfMeta.info?.CreationDate;
      metadata.modificationDate = pdfMeta.info?.ModDate;
      metadata.pageCount = pdfMeta.totalPages;
    }

    const extractedInfo = await extractContentMetadata(docs);
    metadata.extractedInfo = extractedInfo;
  }

  console.log(`Extracted metadata for ${pdfId}:`, metadata);
  return metadata;
}

async function extractContentMetadata(docs: any[]): Promise<{
  possibleTitles: string[];
  possibleAuthors: string[];
  firstPageText: string;
  documentSummary?: string;
}> {
  const firstPageText = docs[0]?.pageContent?.substring(0, 2000) || "";
  const firstFewPages = docs
    .slice(0, 3)
    .map((doc) => doc.pageContent)
    .join("\n")
    .substring(0, 4000);

  try {
    const model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0,
    });

    const metadataPrompt = ChatPromptTemplate.fromTemplate(`
Extract the following information from this PDF content:

1. Document title (look for title, heading, or document name)
2. Author name(s) (look for "by", "author", "written by", etc.)
3. Brief summary (1-2 sentences about what this document is about)

Content:
{content}

Respond in JSON format:
{{
  "titles": ["possible title 1", "possible title 2"],
  "authors": ["possible author 1", "possible author 2"],
  "summary": "brief document summary"
}}
`);

    const response = await model.invoke(
      await metadataPrompt.format({ content: firstFewPages })
    );

    try {
      const parsed = JSON.parse(response.content as string);
      return {
        possibleTitles: parsed.titles || [],
        possibleAuthors: parsed.authors || [],
        firstPageText,
        documentSummary: parsed.summary,
      };
    } catch (parseError) {
      console.error(
        "Failed to parse metadata extraction response:",
        parseError
      );
    }
  } catch (error) {
    console.error("Failed to extract content metadata:", error);
  }

  return {
    possibleTitles: [],
    possibleAuthors: [],
    firstPageText,
  };
}

export async function processPdfToVectorStore(
  pdfUrl: string,
  pdfId: string
): Promise<MemoryVectorStore> {
  try {
    console.log(`Starting PDF processing for pdfId: ${pdfId}`);
    processingStatus[pdfId] = true;
    console.log(`Fetching PDF from URL: ${pdfUrl}`, pdfId);
    pdfUrls[pdfId] = pdfUrl;

    const resp = await fetch(pdfUrl);
    const blob = await resp.blob();
    const file = new File([blob], pdfId, { type: "application/pdf" });

    // Load PDF
    const loader = new WebPDFLoader(file);
    const docs = await loader.load();
    console.log(`Loaded ${docs.length} documents for pdfId: ${pdfId}`);

    // Extract and store metadata
    const metadata = await extractPdfMetadata(docs, pdfId);
    pdfMetadata[pdfId] = metadata;

    // Split documents into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await splitter.splitDocuments(docs);
    console.log(`Split into ${splitDocs.length} chunks for pdfId: ${pdfId}`);

    // Create embeddings and vector store
    const embeddings = new OpenAIEmbeddings();
    const vectorStore = await MemoryVectorStore.fromDocuments(
      splitDocs,
      embeddings
    );

    // Cache the vector store
    vectorStores[pdfId] = vectorStore;
    processingStatus[pdfId] = false;

    return vectorStore;
  } catch (error) {
    processingStatus[pdfId] = false;
    console.error(`Failed to process PDF for pdfId: ${pdfId}`, error);
    throw error;
  }
}

async function getOrCreateVectorStore(
  pdfId: string,
  pdfUrl: string
): Promise<MemoryVectorStore> {
  if (vectorStores[pdfId]) {
    console.log(`Using cached vector store for pdfId: ${pdfId}`);
    return vectorStores[pdfId];
  }

  if (processingStatus[pdfId]) {
    throw new Error(
      "PDF is currently being processed. Please wait a moment and try again."
    );
  }

  if (!pdfUrl) {
    throw new Error("Blob URL not found for this PDF. Please re-upload.");
  }

  return await processPdfToVectorStore(pdfUrl, pdfId);
}

function canAnswerFromMetadata(
  question: string,
  metadata: PdfMetadata
): string | null {
  const lowerQuestion = question.toLowerCase();

  if (
    lowerQuestion.includes("title") ||
    lowerQuestion.includes("name of") ||
    lowerQuestion.includes("what is this document") ||
    lowerQuestion.includes("document name")
  ) {
    if (metadata.title) return `The title is: ${metadata.title}`;
    if (metadata.extractedInfo?.possibleTitles?.length) {
      return `Possible title(s): ${metadata.extractedInfo.possibleTitles.join(
        ", "
      )}`;
    }
  }

  if (
    lowerQuestion.includes("author") ||
    lowerQuestion.includes("written by") ||
    lowerQuestion.includes("who wrote") ||
    lowerQuestion.includes("creator")
  ) {
    if (metadata.author) return `The author is: ${metadata.author}`;
    if (metadata.creator && metadata.creator !== metadata.author) {
      return `Created by: ${metadata.creator}${
        metadata.author ? `, Author: ${metadata.author}` : ""
      }`;
    }
    if (metadata.extractedInfo?.possibleAuthors?.length) {
      return `Possible author(s): ${metadata.extractedInfo.possibleAuthors.join(
        ", "
      )}`;
    }
  }

  if (
    lowerQuestion.includes("how many pages") ||
    lowerQuestion.includes("page count") ||
    lowerQuestion.includes("number of pages")
  ) {
    if (metadata.pageCount)
      return `This document has ${metadata.pageCount} pages.`;
  }

  if (
    lowerQuestion.includes("what is this about") ||
    lowerQuestion.includes("summary") ||
    lowerQuestion.includes("describe this document")
  ) {
    if (metadata.extractedInfo?.documentSummary) {
      return metadata.extractedInfo.documentSummary;
    }
  }

  if (
    lowerQuestion.includes("when was this created") ||
    lowerQuestion.includes("creation date") ||
    lowerQuestion.includes("when was this written")
  ) {
    if (metadata.creationDate) return `Created on: ${metadata.creationDate}`;
  }

  if (
    lowerQuestion.includes("keywords") ||
    lowerQuestion.includes("subject") ||
    lowerQuestion.includes("topics")
  ) {
    if (metadata.keywords) return `Keywords: ${metadata.keywords}`;
    if (metadata.subject) return `Subject: ${metadata.subject}`;
  }

  return null;
}

export async function askPdfQuestion(
  pdfId: string,
  question: string,
  pdfUrl: string
) {
  console.log(`Querying pdfId: ${pdfId}`);
  console.log(
    `Available pdfIds in cache: ${
      Object.keys(vectorStores).join(", ") || "none"
    }`
  );

  try {
    // Get or create vector store (this also loads metadata)
    await getOrCreateVectorStore(pdfId, pdfUrl);

    // Check if we can answer from metadata first
    const metadata = pdfMetadata[pdfId];
    if (metadata) {
      const metadataAnswer = canAnswerFromMetadata(question, metadata);
      if (metadataAnswer) {
        console.log(`Answered from metadata for pdfId: ${pdfId}`);
        return {
          res: { answer: metadataAnswer, context: [] },
          answer: metadataAnswer,
          citations: [], // No specific page citations for metadata
          source: "metadata",
        };
      }
    }

    // If can't answer from metadata, use vector search
    const vectorStore = vectorStores[pdfId];

    // Initialize ChatOpenAI model
    const model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0,
    });

    let systemPrompt = `You are a helpful AI assistant that answers questions based on the provided PDF context. 
Use the context below to answer the user's question accurately and concisely.`;

    if (metadata) {
      systemPrompt += `

Document Information:
- Title: ${
        metadata.title ||
        metadata.extractedInfo?.possibleTitles?.[0] ||
        "Unknown"
      }
- Author: ${
        metadata.author ||
        metadata.extractedInfo?.possibleAuthors?.[0] ||
        "Unknown"
      }
- Pages: ${metadata.pageCount || "Unknown"}
${
  metadata.extractedInfo?.documentSummary
    ? `- Summary: ${metadata.extractedInfo.documentSummary}`
    : ""
}

Context from PDF:
{context}`;
    } else {
      systemPrompt += `

Context:
{context}`;
    }

    const qaPrompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["human", "{input}"],
    ]);

    // Create document chain
    const combineDocsChain = await createStuffDocumentsChain({
      llm: model,
      prompt: qaPrompt,
    });

    // Create retrieval chain
    const retrievalChain = await createRetrievalChain({
      combineDocsChain,
      retriever: vectorStore.asRetriever({
        k: 4, // Retrieve top 4 most relevant chunks
      }),
    });

    // Get answer
    const res = await retrievalChain.invoke({
      input: question,
    });

    // Extract citations (page numbers) from context documents
    const citations = (res.context || [])
      .map((doc: any) => {
        return (
          doc.metadata?.loc?.pageNumber ||
          doc.metadata?.page ||
          doc.metadata?.pageNumber
        );
      })
      .filter((page: number) => page !== undefined && page !== null)
      .filter(
        (page: number, index: number, array: number[]) =>
          array.indexOf(page) === index // Remove duplicates
      )
      .sort((a: number, b: number) => a - b); // Sort page numbers

    console.log(
      `Generated answer for pdfId: ${pdfId}, citations: [${citations.join(
        ", "
      )}]`
    );

    return {
      res,
      answer:
        res.answer ||
        res.output ||
        "I couldn't generate an answer based on the PDF content.",
      citations,
      source: "vectorsearch",
    };
  } catch (error) {
    console.error(`Error in askPdfQuestion for ${pdfId}:`, error);

    if (error instanceof Error) {
      if (error.message.includes("PDF file not found")) {
        throw new Error("PDF file not found. Please re-upload the PDF.");
      } else if (error.message.includes("currently being processed")) {
        throw error;
      } else if (error.message.includes("API key")) {
        throw new Error(
          "OpenAI API configuration error. Please check your API key."
        );
      } else {
        throw new Error(`Failed to process your question: ${error.message}`);
      }
    }

    throw new Error(
      "An unexpected error occurred while processing your question."
    );
  }
}

export function getPdfMetadata(pdfId: string): PdfMetadata | null {
  return pdfMetadata[pdfId] || null;
}

export function isPdfProcessed(pdfId: string): boolean {
  return !!vectorStores[pdfId];
}

export function isPdfProcessing(pdfId: string): boolean {
  return !!processingStatus[pdfId];
}

export function getProcessingInfo(pdfId: string): {
  processed: boolean;
  processing: boolean;
  fileExists: boolean;
  hasMetadata: boolean;
} {
  return {
    processed: isPdfProcessed(pdfId),
    processing: isPdfProcessing(pdfId),
    fileExists: !!pdfUrls[pdfId],
    hasMetadata: !!pdfMetadata[pdfId],
  };
}

export function setProcessingStatus(pdfId: string, status: boolean) {
  processingStatus[pdfId] = status;
}
