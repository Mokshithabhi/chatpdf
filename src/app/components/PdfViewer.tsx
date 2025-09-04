"use client";
import { Document, Page, pdfjs } from "react-pdf";
import { useEffect, useRef, useState } from "react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useContextPdf } from "../context/page.context";
// import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// pdfjs.GlobalWorkerOptions.workerSrc =
//   "//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js";
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  file: File;
}

export default function PdfViewer({ file }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const { pageNumber, setPageNumber } = useContextPdf();
  console.log("Current page number:", pageNumber);
  const viewerRef = useRef<HTMLDivElement>(null);

  /* scroll to top of the viewer whenever pageNumber changes */
  useEffect(() => {
    viewerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [pageNumber]);
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  return (
    <div
      className="flex flex-col items-center w-full h-full p-4 overflow-auto"
      ref={viewerRef}
    >
      {/* <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<div>Loading PDF...</div>}
        className="w-full flex-1"
      >
        <Page pageNumber={pageNumber} width={400} />
      </Document> */}
      <div className="flex-1 overflow-auto w-full">
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            setPageNumber(1);
          }}
          loading={<div>Loading PDF…</div>}
        >
          <Page pageNumber={pageNumber} width={500} />
        </Document>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button
          className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
        >
          Prev
        </button>
        <span>
          Page {pageNumber} of {numPages}
        </span>
        <button
          className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
          onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
          disabled={pageNumber >= numPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
