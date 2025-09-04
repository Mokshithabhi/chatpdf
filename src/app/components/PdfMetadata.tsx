"use client";
import { useState } from "react";
import { usePdfMetadata } from "@/hook/usePdfMetadata";

interface PdfMetadataPanelProps {
  pdfId: string | null;
}

export default function PdfMetadataPanel({ pdfId }: PdfMetadataPanelProps) {
  const {
    metadata,
    quickAnswers,
    loading,
    error,
    processingInfo,
    fetchQuickAnswers,
  } = usePdfMetadata(pdfId);
  const [showFullMetadata, setShowFullMetadata] = useState(false);

  if (!pdfId) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No PDF loaded</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Loading metadata...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!processingInfo.processed) {
    return (
      <div className="p-4 bg-yellow-50 rounded-lg">
        <p className="text-yellow-700">
          {processingInfo.processing
            ? "Processing PDF..."
            : "PDF not processed yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Document Information</h3>
        <button
          onClick={() => fetchQuickAnswers()}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Get Quick Info
        </button>
      </div>

      {/* Quick Answers Section */}
      {Object.keys(quickAnswers).length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Quick Answers</h4>
          <div className="space-y-2">
            {quickAnswers.title && (
              <div>
                <span className="font-medium">Title:</span> {quickAnswers.title}
              </div>
            )}
            {quickAnswers.author && (
              <div>
                <span className="font-medium">Author:</span>{" "}
                {quickAnswers.author}
              </div>
            )}
            {quickAnswers.pageCount && (
              <div>
                <span className="font-medium">Pages:</span>{" "}
                {quickAnswers.pageCount}
              </div>
            )}
            {quickAnswers.summary && (
              <div>
                <span className="font-medium">Summary:</span>{" "}
                {quickAnswers.summary}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Basic Metadata */}
      {metadata && (
        <div className="space-y-2">
          {metadata.title && (
            <div className="flex justify-between">
              <span className="font-medium">Title:</span>
              <span className="text-right flex-1 ml-2">{metadata.title}</span>
            </div>
          )}
          {metadata.author && (
            <div className="flex justify-between">
              <span className="font-medium">Author:</span>
              <span className="text-right flex-1 ml-2">{metadata.author}</span>
            </div>
          )}
          {metadata.pageCount && (
            <div className="flex justify-between">
              <span className="font-medium">Pages:</span>
              <span className="text-right flex-1 ml-2">
                {metadata.pageCount}
              </span>
            </div>
          )}
          {metadata.creationDate && (
            <div className="flex justify-between">
              <span className="font-medium">Created:</span>
              <span className="text-right flex-1 ml-2">
                {new Date(metadata.creationDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Extracted Information */}
          {metadata.extractedInfo && (
            <div className="mt-4 pt-4 border-t">
              {metadata.extractedInfo.documentSummary && (
                <div className="mb-2">
                  <span className="font-medium">Summary:</span>
                  <p className="text-sm text-gray-600 mt-1">
                    {metadata.extractedInfo.documentSummary}
                  </p>
                </div>
              )}

              {metadata.extractedInfo.possibleTitles.length > 0 &&
                !metadata.title && (
                  <div className="mb-2">
                    <span className="font-medium">Possible Titles:</span>
                    <ul className="text-sm text-gray-600 ml-4">
                      {metadata.extractedInfo.possibleTitles.map(
                        (title, idx) => (
                          <li key={idx}>• {title}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              {metadata.extractedInfo.possibleAuthors.length > 0 &&
                !metadata.author && (
                  <div className="mb-2">
                    <span className="font-medium">Possible Authors:</span>
                    <ul className="text-sm text-gray-600 ml-4">
                      {metadata.extractedInfo.possibleAuthors.map(
                        (author, idx) => (
                          <li key={idx}>• {author}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {/* Toggle for full metadata */}
          <button
            onClick={() => setShowFullMetadata(!showFullMetadata)}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800"
          >
            {showFullMetadata ? "Hide" : "Show"} technical details
          </button>

          {/* Full Metadata (collapsed by default) */}
          {showFullMetadata && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
              <h4 className="font-medium mb-2">Technical Details</h4>
              <div className="space-y-1">
                {metadata.creator && (
                  <div>
                    <span className="font-medium">Creator:</span>{" "}
                    {metadata.creator}
                  </div>
                )}
                {metadata.producer && (
                  <div>
                    <span className="font-medium">Producer:</span>{" "}
                    {metadata.producer}
                  </div>
                )}
                {metadata.subject && (
                  <div>
                    <span className="font-medium">Subject:</span>{" "}
                    {metadata.subject}
                  </div>
                )}
                {metadata.keywords && (
                  <div>
                    <span className="font-medium">Keywords:</span>{" "}
                    {metadata.keywords}
                  </div>
                )}
                {metadata.modificationDate && (
                  <div>
                    <span className="font-medium">Modified:</span>{" "}
                    {new Date(metadata.modificationDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Processing Status */}
      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
        Status: {processingInfo.processed ? "✅ Processed" : "⏳ Processing"} |
        Metadata:{" "}
        {processingInfo.hasMetadata ? "✅ Available" : "❌ Not available"}
      </div>
    </div>
  );
}
