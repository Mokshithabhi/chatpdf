"use client";
import React, { createContext, useState, useContext } from "react";

interface PageContextProps {
  stage: "idle" | "uploading" | "ready";
  setStage: (stage: "idle" | "uploading" | "ready") => void;
  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;
  pdfId: string | null;
  setPdfId: (id: string | null) => void;
  pageNumber: number;
  setPageNumber: (page: number | ((prevPage: number) => number)) => void;
  pdfUrl: string | null;
  setPdfUrl: (url: string | null) => void;
}

const PageContext = createContext<PageContextProps | null>(null);

export const useContextPdf = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("useContextPdf must be used within a ContextProvider");
  }
  return context;
};

export const ContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [stage, setStage] = useState<"idle" | "uploading" | "ready">("idle");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfId, setPdfId] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const contextValue: PageContextProps = {
    stage,
    setStage,
    pdfFile,
    setPdfFile,
    pdfId,
    setPdfId,
    pageNumber,
    setPageNumber,
    pdfUrl,
    setPdfUrl,
  };

  return (
    <PageContext.Provider value={contextValue}>{children}</PageContext.Provider>
  );
};
