"use client";
import { useState } from "react";
import UploadArea from "@/app/components/UploadArea";
import Chatbox from "@/app/components/Chatbox";
import dynamic from "next/dynamic";
const PdfViewer = dynamic(() => import("./components/PdfViewer"), {
  ssr: false,
});

export default function HomePage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-purple-100 flex flex-col">
      <header className="px-8 py-4 bg-white shadow flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-700 tracking-tight">
          PDF Chat Demo
        </h1>
        <span className="text-xs text-gray-400">
          Powered by Next.js, OpenAI, and React-PDF
        </span>
      </header>
      <main className="flex flex-1 overflow-hidden">
        {/* Chat section: fixed width, input always visible */}
        <section
          className="w-full md:w-1/3 flex flex-col border-r border-gray-200 bg-white/80 backdrop-blur-md"
          style={{ height: "90vh" }}
        >
          <div className="flex-1 flex flex-col p-4 h-full max-h-full">
            {pdfFile ? <Chatbox /> : <UploadArea onUpload={setPdfFile} />}
          </div>
        </section>
        {/* PDF section: scrollable */}
        <section className="hidden md:flex w-2/3 bg-gray-50 overflow-y-auto h-full">
          <div className="h-full w-full p-6 overflow-y-auto">
            <PdfViewer file={pdfFile} />
          </div>
        </section>
      </main>
    </div>
  );
}
