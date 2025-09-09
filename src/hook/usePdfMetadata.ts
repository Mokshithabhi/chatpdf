import { useContextPdf } from "@/app/context/page.context";
import { useState, useEffect, useRef } from "react";

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

interface MetadataResponse {
  pdfId: string;
  processed: boolean;
  processing: boolean;
  fileExists: boolean;
  hasMetadata: boolean;
  metadata: PdfMetadata | null;
  quickAnswers?: Record<string, string>;
  success: boolean;
  error?: string;
}

export const usePdfMetadata = (pdfId: string | null) => {
  const [metadata, setMetadata] = useState<PdfMetadata | null>(null);
  const [quickAnswers, setQuickAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingInfo, setProcessingInfo] = useState({
    processed: false,
    processing: false,
    fileExists: false,
    hasMetadata: false,
  });
  const { pdfUrl } = useContextPdf();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  if (!pdfUrl) {
    throw new Error("pdfUrl is required in context for usePdfMetadata");
  }

  const fetchMetadata = async (id: string, shouldPoll = true) => {
    try {
      setLoading(true);
      setError(null);

      // Use GET request with query parameters
      const response = await fetch(
        `/api/pdf-metadata?pdfId=${encodeURIComponent(
          id
        )}&pdfUrl=${encodeURIComponent(pdfUrl)}`
      );
      const data: MetadataResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch metadata");
      }

      setMetadata(data.metadata);
      setProcessingInfo({
        processed: data.processed,
        processing: data.processing,
        fileExists: data.fileExists,
        hasMetadata: data.hasMetadata || false,
      });

      // If processing is in progress and shouldPoll is true, poll for updates
      if (data.processing && shouldPoll) {
        // Clear any existing polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }

        // Set up polling every 2 seconds
        pollingIntervalRef.current = setInterval(async () => {
          try {
            const pollResponse = await fetch(
              `/api/pdf-metadata?pdfId=${encodeURIComponent(
                id
              )}&pdfUrl=${encodeURIComponent(pdfUrl)}`
            );
            const pollData: MetadataResponse = await pollResponse.json();

            if (pollResponse.ok) {
              setMetadata(pollData.metadata);
              setProcessingInfo({
                processed: pollData.processed,
                processing: pollData.processing,
                fileExists: pollData.fileExists,
                hasMetadata: pollData.hasMetadata || false,
              });

              // Stop polling if processing is complete
              if (pollData.processed || !pollData.processing) {
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
                setLoading(false);
              }
            }
          } catch (err) {
            console.error("Error during polling:", err);
            // Continue polling even if there's an error
          }
        }, 2000);
      } else {
        // Processing is complete or not started
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching metadata:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  const fetchQuickAnswers = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/pdf-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfId: id, pdfUrl }),
      });

      const data: MetadataResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch quick answers");
      }

      setMetadata(data.metadata);
      setQuickAnswers(data.quickAnswers || {});
      setProcessingInfo({
        processed: data.processed,
        processing: data.processing,
        fileExists: data.fileExists,
        hasMetadata: data.hasMetadata || false,
      });

      // If still processing, start polling
      if (data.processing) {
        fetchMetadata(id, true);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching quick answers:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pdfId && pdfUrl) {
      fetchMetadata(pdfId);
    }

    // Cleanup polling on unmount or when dependencies change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [pdfId, pdfUrl]);

  return {
    metadata,
    quickAnswers,
    loading,
    error,
    processingInfo,
    refetchMetadata: () => pdfId && fetchMetadata(pdfId, false),
    fetchQuickAnswers: () => pdfId && fetchQuickAnswers(pdfId),
  };
};
