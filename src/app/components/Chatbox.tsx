"use client";
import { useState, useId } from "react";

interface Message {
  role: "user" | "bot";
  text: string;
  citations?: number[]; // page numbers
}

export default function Chatbox() {
  const id = useId();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
    console.log("id", id);
    const newMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    try {
      // You may want to get the current PDF id from props or context
      const pdfId = id || ""; // Replace with actual pdfId logic
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input, pdfId }),
      });
      const data = await res.json();
      const reply: Message = {
        role: "bot",
        text: data.answer || "Sorry, I couldn't find an answer.",
        citations: data.citations,
      };
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Error contacting server.", citations: [] },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-gray-200">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg max-w-xs ${
              m.role === "user"
                ? "bg-purple-500 text-white self-end"
                : "bg-gray-100 text-gray-800 self-start"
            }`}
          >
            {m.text}
            {m.citations && (
              <div className="mt-2 space-x-2">
                {m.citations.map((page, i) => (
                  <button
                    key={i}
                    className="text-xs text-blue-600 underline"
                    onClick={() =>
                      document
                        .getElementById(`page_${page}`)
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Page {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-3 border-t flex">
        <input
          type="text"
          className="flex-1 border rounded-l-lg px-3 py-2"
          placeholder="Ask about the document..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={sendMessage}
          className="bg-purple-500 text-white px-4 rounded-r-lg"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
