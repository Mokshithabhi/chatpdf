"use client";
import { useState } from "react";

interface UploadAreaProps {
  onUpload: (file: File) => void;
}

export default function UploadArea({ onUpload }: UploadAreaProps) {
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    console.log(file, formData);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",

        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      // Optionally, you can show progress bar animation here
      setProgress(100);
      setTimeout(() => {
        setUploading(false);
        onUpload(file);
      }, 300);
    } catch (err) {
      console.error(err);
      setUploading(false);
      setProgress(0);
      alert("Failed to upload PDF.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-400 rounded-xl p-6 text-center">
      {!uploading && progress === 0 && (
        <>
          <p className="text-gray-500">Upload PDF to start chatting</p>
          <input
            type="file"
            accept="application/pdf"
            className="mt-4"
            onChange={handleFileChange}
          />
        </>
      )}

      {uploading && (
        <div className="w-full">
          <p className="text-sm text-gray-500">Uploading PDF...</p>
          <div className="w-full bg-gray-200 h-2 rounded mt-2">
            <div
              className="bg-purple-500 h-2 rounded"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{progress}%</p>
        </div>
      )}
    </div>
  );
}
