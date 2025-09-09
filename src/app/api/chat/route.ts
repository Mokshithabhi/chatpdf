import { NextRequest, NextResponse } from "next/server";
import { askPdfQuestion } from "@/utils/langchainPdf";

export async function POST(req: NextRequest) {
  try {
    const { question, pdfId, pdfUrl } = await req.json();
    if (!question || !pdfId || !pdfUrl) {
      return NextResponse.json(
        {
          answer: "Missing question, pdfId or pdfUrl",
          citations: [],
        },
        { status: 400 }
      );
    }

    const { answer, citations, res } = await askPdfQuestion(
      pdfId,
      question,
      pdfUrl
    );

    return NextResponse.json({
      res,
      answer,
      citations,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        error: "Chat failed",
        answer: String((err as { message: unknown }).message),
        details:
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : String(err),
      },
      { status: 500 }
    );
  }
}
