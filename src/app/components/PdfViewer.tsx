"use client";
import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

interface PdfViewerProps {
  file: File | null;
}

export default function PdfViewer({ file }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {file ? (
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div key={`page_${index + 1}`} id={`page_${index + 1}`}>
              <Page pageNumber={index + 1} />
            </div>
          ))}
        </Document>
      ) : (
        <p className="text-black text-center">Upload a PDF to preview here.</p>
      )}
    </div>
  );
}
