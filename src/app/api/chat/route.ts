import { config } from "dotenv";
import { NextRequest, NextResponse } from "next/server";
config();

export const pdfStore: Record<string, { pages: string[] }> = {};

console.log("key", process.env.OPENAI_API_KEY);

async function callOpenAI(question: string, context: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log("API Key:", apiKey, question, context);
  if (!apiKey) throw new Error("Missing OpenAI API key");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "bot",
          content:
            "You are a helpful assistant that answers questions about a PDF. Cite the page number(s) in your answer.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
      max_tokens: 512,
      temperature: 0.2,
    }),
  });
  const data = await res.json();
  console.log(
    "OpenAI API response:",
    data,
    data.choices?.[0]?.message?.content
  );

  return data.choices?.[0]?.message?.content || "No answer.";
}

export async function POST(req: NextRequest) {
  const { question, pdfId } = await req.json();
  if (!pdfId || !pdfStore[pdfId]) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }
  const pages = pdfStore[pdfId].pages;

  // Simple keyword search: score each page by keyword frequency
  const keywords = question.toLowerCase().split(/\W+/).filter(Boolean);
  const scoredPages = pages.map((text, idx) => {
    const lower = text.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      score += (lower.match(new RegExp(`\\b${kw}\\b`, "g")) || []).length;
    }
    return { idx, score, text };
  });
  // Sort by score descending, take top 1-2 pages with score > 0
  const topPages = scoredPages
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  // If no relevant page found, fallback to first page
  const contextPages = topPages.length > 0 ? topPages : [scoredPages[0]];
  const context = contextPages
    .map((p) => `Page ${p.idx + 1}:\n${p.text}`)
    .join("\n---\n");
  const contextPageNumbers = contextPages.map((p) => p.idx + 1);

  try {
    const answer = await callOpenAI(question, context);
    const citationMatches = answer.match(/page[s]?\s*(\d+)/gi) || [];
    const citations = citationMatches
      .map((m) => parseInt(m.replace(/\D/g, ""), 10))
      .filter(Boolean);
    // Always include the context page numbers as fallback citations
    const uniqueCitations = Array.from(
      new Set([...citations, ...contextPageNumbers])
    );
    return NextResponse.json({ answer, citations: uniqueCitations });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to get answer", details: String(err) },
      { status: 500 }
    );
  }
}

// For demo: add a GET endpoint to list loaded PDFs
export async function GET() {
  return NextResponse.json({ pdfs: Object.keys(pdfStore) });
}
