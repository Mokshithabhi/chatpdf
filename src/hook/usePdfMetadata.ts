// hooks/usePdfMetadata.ts
import { useState, useEffect } from "react";

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

  const fetchMetadata = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Use GET request with query parameter
      const response = await fetch(
        `/api/pdf-metadata?pdfId=${encodeURIComponent(id)}`
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
    } catch (err) {
      console.error("Error fetching metadata:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuickAnswers = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Use POST request for quick answers
      const response = await fetch("/api/pdf-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfId: id }),
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
    } catch (err) {
      console.error("Error fetching quick answers:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pdfId) {
      fetchMetadata(pdfId);
    }
  }, [pdfId]);

  return {
    metadata,
    quickAnswers,
    loading,
    error,
    processingInfo,
    refetchMetadata: () => pdfId && fetchMetadata(pdfId),
    fetchQuickAnswers: () => pdfId && fetchQuickAnswers(pdfId),
  };
};
