"use client";
import { useRef } from "react";

interface UploadAreaProps {
  onUpload: (file: File) => void;
}

export default function UploadArea({ onUpload }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div
      className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-purple-400 transition"
      onClick={() => inputRef.current?.click()}
      style={{ minWidth: 300, minHeight: 180 }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="text-4xl mb-2">⬆️</div>
      <div className="font-semibold mb-1">Upload PDF to start chatting</div>
      <div className="text-gray-500 text-sm">
        Click or drag and drop your file here
      </div>
    </div>
  );
}
