import { NextRequest, NextResponse } from "next/server";
import {
  getPdfMetadata,
  getProcessingInfo,
  processPdfToVectorStore,
} from "@/utils/langchainPdf";
import fs from "fs";
import path from "path";
import { setProcessingStatus } from "@/utils/langchainPdf";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pdfId = searchParams.get("pdfId");

    if (!pdfId) {
      return NextResponse.json(
        { error: "Missing pdfId parameter" },
        { status: 400 }
      );
    }

    let processingInfo = getProcessingInfo(pdfId);

    if (
      processingInfo.fileExists &&
      !processingInfo.processed &&
      !processingInfo.processing
    ) {
      const pdfPath = path.join(process.cwd(), "public", "uploads", pdfId);

      try {
        await processPdfToVectorStore(pdfPath, pdfId);

        processingInfo = getProcessingInfo(pdfId);
      } catch (error) {
        console.error(`Processing failed for ${pdfId}:`, error);
        setProcessingStatus(pdfId, false); // Reset on error

        return NextResponse.json(
          {
            error: "Failed to process PDF",
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 500 }
        );
      }
    }

    const metadata = getPdfMetadata(pdfId);

    return NextResponse.json({
      pdfId,
      ...processingInfo,
      metadata,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching PDF metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch PDF metadata" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { pdfId } = await req.json();

    if (!pdfId) {
      return NextResponse.json(
        { error: "Missing pdfId in request body" },
        { status: 400 }
      );
    }

    const processingInfo = getProcessingInfo(pdfId);
    const metadata = getPdfMetadata(pdfId);

    // Return quick info about common questions that can be answered from metadata
    const quickAnswers: Record<string, string> = {};

    if (metadata) {
      if (metadata.title || metadata.extractedInfo?.possibleTitles?.length) {
        quickAnswers.title =
          metadata.title ||
          metadata.extractedInfo?.possibleTitles?.[0] ||
          "Unknown";
      }

      if (metadata.author || metadata.extractedInfo?.possibleAuthors?.length) {
        quickAnswers.author =
          metadata.author ||
          metadata.extractedInfo?.possibleAuthors?.[0] ||
          "Unknown";
      }

      if (metadata.pageCount) {
        quickAnswers.pageCount = metadata.pageCount.toString();
      }

      if (metadata.extractedInfo?.documentSummary) {
        quickAnswers.summary = metadata.extractedInfo.documentSummary;
      }

      if (metadata.creationDate) {
        quickAnswers.creationDate = metadata.creationDate;
      }
    }

    return NextResponse.json({
      pdfId,
      ...processingInfo,
      metadata,
      quickAnswers,
      success: true,
    });
  } catch (error) {
    console.error("Error processing PDF metadata request:", error);
    return NextResponse.json(
      {
        error: "Failed to process PDF metadata request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
