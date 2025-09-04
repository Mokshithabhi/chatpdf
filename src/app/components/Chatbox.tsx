"use client";
import { useState, useRef, useEffect } from "react";
import { useContextPdf } from "../context/page.context";
import { usePdfMetadata } from "@/hook/usePdfMetadata";
import Loading from "./Loading";

interface Message {
  role: "user" | "system";
  text: string;
  citations?: number[];
  source?: "metadata" | "vectorsearch";
}

interface ChatboxProps {
  pdfId: string;
}

export default function Chatbox({ pdfId }: ChatboxProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { setPageNumber } = useContextPdf();
  const {
    quickAnswers,
    processingInfo,
    loading: metadataLoading,
  } = usePdfMetadata(pdfId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const quickQuestions = [
    "What is the title of this document?",
    "Who is the author?",
    "what is the summary of the document",
    "How many pages does this document have?",
    "What is this document about?",
    "When was this document created?",
  ];

  const sendMessage = async (messageText?: string) => {
    const questionText = messageText || input;
    if (!questionText.trim()) return;

    const userMsg: Message = { role: "user", text: questionText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setShowSuggestions(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText, pdfId }),
      });
      const data = await res.json();
      const botMsg: Message = {
        role: "system",
        text: data.answer,
        citations: data.citations,
        source: data.source || "vectorsearch",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "system", text: "Error contacting server." },
      ]);
    }
    setLoading(false);
  };
  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };
  return (
    <div className="flex flex-col h-full max-h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {metadataLoading && <Loading />}
        {messages.length === 0 &&
          showSuggestions &&
          processingInfo.processed && (
            <div className="mb-4">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-blue-900 mb-2">
                  Ask me anything about your PDF!
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Try these quick questions or ask anything specific:
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              {/* Show quick answers if available */}
              {Object.keys(quickAnswers).length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-green-900 mb-2">
                    Quick Facts
                  </h4>
                  <div className="text-sm space-y-1">
                    {quickAnswers.title && (
                      <div>
                        <span className="font-medium">Title:</span>{" "}
                        {quickAnswers.title}
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
            </div>
          )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-4 flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[75%] ${
                msg.role === "user"
                  ? "bg-purple-100 text-right"
                  : "bg-gray-100 text-left"
              }`}
            >
              <div>{msg.text}</div>
              {msg.source && (
                <div className="mt-1 text-xs text-gray-500">
                  {msg.source === "metadata"
                    ? "⚡ Instant answer"
                    : "🔍 From document search"}
                </div>
              )}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.citations.map((page, i) => (
                    <button
                      key={i}
                      className="text-xs px-2 py-1 bg-purple-200 rounded hover:bg-purple-300"
                      onClick={() => setPageNumber(page)}
                    >
                      Page {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <Loading />}
        <div ref={messagesEndRef} />
      </div>
      <form
        className="flex p-4 border-t bg-white"
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading) sendMessage();
        }}
      >
        <input
          className="flex-1 border rounded-l px-3 py-2 focus:outline-none"
          placeholder={
            processingInfo.processed
              ? "Ask a question about the PDF..."
              : "Please wait for PDF processing to complete..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || !processingInfo.processed}
        />
        <button
          type="submit"
          className="bg-purple-600 text-white px-4 py-2 rounded-r hover:bg-purple-700 disabled:opacity-50"
          disabled={loading || !input.trim()}
        >
          {loading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
