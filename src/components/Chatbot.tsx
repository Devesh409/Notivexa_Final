import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export const Chatbot = ({ fileUri, mimeType, isDarkMode, embedded = false }: { fileUri?: string; mimeType?: string; isDarkMode: boolean; embedded?: boolean }) => {
  const [isOpen, setIsOpen] = useState(embedded);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, fileUri, mimeType }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.result }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Error: Could not get response." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const chatContent = (
    <div className={`w-full h-[500px] rounded-2xl shadow-xl flex flex-col overflow-hidden ${isDarkMode ? "bg-[#22221F] border border-[#383832]" : "bg-white border border-slate-200"}`}>
      <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-[#383832]" : "border-slate-100"}`}>
        <h3 className={`font-semibold ${isDarkMode ? "text-[#E0E0D5]" : "text-slate-800"}`}>AI Tutor Chat</h3>
        {!embedded && <button onClick={() => setIsOpen(false)}><X size={18} /></button>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(messages || []).map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && <Bot size={20} className="mt-1 flex-shrink-0" />}
            <div className={`p-3 px-4 rounded-2xl max-w-[85%] shadow-sm whitespace-pre-wrap ${
              m.role === 'user' 
                ? 'bg-sky-600 text-white rounded-br-none' 
                : isDarkMode 
                  ? 'bg-[#383832] text-[#E0E0D5] rounded-bl-none' 
                  : 'bg-slate-100 text-slate-800 rounded-bl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-sm italic">Tutor is thinking...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className={`p-4 border-t flex gap-2 ${isDarkMode ? "border-[#383832]" : "border-slate-100"}`}>
        <input 
          className={`flex-1 p-2 rounded-lg ${isDarkMode ? "bg-[#22221F] text-[#E0E0D5]" : "bg-slate-50"}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask a question..."
        />
        <button onClick={sendMessage} className="p-2 bg-sky-600 text-white rounded-lg"><Send size={18}/></button>
      </div>
    </div>
  );

  if (embedded) return chatContent;

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg ${isDarkMode ? "bg-[#383832] text-[#E0E0D5]" : "bg-sky-600 text-white"}`}
      >
        <Bot size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-20 right-6 w-96 h-[500px] z-50`}
          >
            {chatContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
