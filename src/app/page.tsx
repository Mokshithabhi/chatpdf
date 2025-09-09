"use client";
import UploadArea from "@/app/components/UploadArea";
import Chatbox from "@/app/components/Chatbox";
import dynamic from "next/dynamic";
import { useContextPdf } from "./context/page.context";
import PdfMetadataPanel from "./components/PdfMetadata";
const PdfViewer = dynamic(() => import("./components/PdfViewer"), {
  ssr: false,
});

export default function Home() {
  const { stage, setStage, pdfId, setPdfId, pdfFile, setPdfFile, setPdfUrl } =
    useContextPdf();
  const handleUpload = async (file: File) => {
    setStage("uploading");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          console.log("Upload response data:", data.filename);
          setPdfFile(file);
          setPdfId(data.filename);
          setPdfUrl(data.url);
          setStage("ready");
        }
      } else {
        alert("Failed to upload PDF.");
        setStage("idle");
      }
    } catch (err) {
      alert(`Error uploading PDF: ${err}`);
      setStage("idle");
    }
  };

  // 1. Initial state: show upload card
  if (stage === "idle") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow p-8 flex flex-col items-center">
          <UploadArea onUpload={handleUpload} />
        </div>
      </div>
    );
  }

  if (stage === "uploading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow p-8 flex flex-col items-center">
          <span className="mb-4 text-lg font-medium">Uploading PDF</span>
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 animate-pulse"
              style={{ width: "100%" }}
            />
          </div>
          <span className="mt-2 text-purple-700 font-semibold">100%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-full md:w-1/2 flex flex-col border-r bg-white">
        <Chatbox pdfId={pdfId!} />
      </div>

      <div className="hidden md:flex w-1/2 items-center justify-center bg-gray-100">
        {pdfFile && <PdfViewer file={pdfFile} />}
      </div>
    </div>
  );
}
