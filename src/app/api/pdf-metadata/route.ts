import { NextRequest, NextResponse } from "next/server";
import {
  getPdfMetadata,
  getProcessingInfo,
  processPdfToVectorStore,
  setProcessingStatus,
} from "@/utils/langchainPdf";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pdfId = searchParams.get("pdfId");
    const pdfUrl = decodeURIComponent(searchParams.get("pdfUrl") || "");

    if (!pdfId || !pdfUrl) {
      return NextResponse.json(
        { error: "Missing pdfId or pdfUrl parameter" },
        { status: 400 }
      );
    }

    let processingInfo = getProcessingInfo(pdfId);

    // If the file doesn't exist yet (new upload), trigger processing
    if (!processingInfo.fileExists && !processingInfo.processing) {
      try {
        console.log(`Starting processing for new PDF: ${pdfId}`);

        // Set processing status to true before starting
        setProcessingStatus(pdfId, true);

        // Process the PDF
        await processPdfToVectorStore(pdfUrl, pdfId);

        // Get updated processing info after completion
        processingInfo = getProcessingInfo(pdfId);

        console.log(`Processing completed for PDF: ${pdfId}`);
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
    // If file exists but hasn't been processed yet and isn't currently processing
    else if (
      processingInfo.fileExists &&
      !processingInfo.processed &&
      !processingInfo.processing
    ) {
      try {
        console.log(`Re-processing existing PDF: ${pdfId}`);

        // Set processing status to true before starting
        setProcessingStatus(pdfId, true);

        // Process the PDF
        await processPdfToVectorStore(pdfUrl, pdfId);

        // Get updated processing info after completion
        processingInfo = getProcessingInfo(pdfId);

        console.log(`Re-processing completed for PDF: ${pdfId}`);
      } catch (error) {
        console.error(`Re-processing failed for ${pdfId}:`, error);
        setProcessingStatus(pdfId, false); // Reset on error

        return NextResponse.json(
          {
            error: "Failed to re-process PDF",
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
      {
        error: "Failed to fetch PDF metadata",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { pdfId, pdfUrl } = await req.json();

    if (!pdfId) {
      return NextResponse.json(
        { error: "Missing pdfId in request body" },
        { status: 400 }
      );
    }

    let processingInfo = getProcessingInfo(pdfId);

    // If we have a pdfUrl and the file hasn't been processed, trigger processing
    if (pdfUrl && !processingInfo.processed && !processingInfo.processing) {
      try {
        console.log(`POST: Starting processing for PDF: ${pdfId}`);

        // Set processing status to true before starting
        setProcessingStatus(pdfId, true);

        // Process the PDF
        await processPdfToVectorStore(pdfUrl, pdfId);

        // Get updated processing info after completion
        processingInfo = getProcessingInfo(pdfId);

        console.log(`POST: Processing completed for PDF: ${pdfId}`);
      } catch (error) {
        console.error(`POST: Processing failed for ${pdfId}:`, error);
        setProcessingStatus(pdfId, false);
      }
    }

    const metadata = getPdfMetadata(pdfId);

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
