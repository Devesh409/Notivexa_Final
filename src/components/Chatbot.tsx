import { useState, useRef, useEffect } from "react";
import { Send, Bot, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export const Chatbot = ({ fileUri, mimeType, isDarkMode, embedded = false, onOpenChange }: { fileUri?: string; mimeType?: string; isDarkMode: boolean; embedded?: boolean; onOpenChange?: (open: boolean) => void }) => {
  const [isOpen, setIsOpen] = useState(embedded);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { role: "user", text: input };
    const historyToSend = [...messages]; // capture current history
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, fileUri, mimeType, history: historyToSend }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.result }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Error: Could not get response." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const chatContent = (
    <div className={`w-full ${embedded ? 'h-full min-h-[500px]' : 'h-[500px]'} rounded-2xl shadow-2xl flex flex-col overflow-hidden ${isDarkMode ? "bg-[#1E1E1C] border border-[#383832]" : "bg-white border border-slate-200"}`}>
      <div className={`p-4 border-b flex justify-between items-center bg-gradient-to-r ${isDarkMode ? "from-[#2A2A26] to-[#22221F] border-[#383832]" : "from-sky-50 to-white border-slate-100"}`}>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-600 text-white rounded-lg">
            <Bot size={18} />
          </div>
              <h3 className={`font-semibold ${isDarkMode ? "text-[#E0E0D5]" : "text-slate-800"}`}>AI Chatbot</h3>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button onClick={clearChat} title="Clear Chat" className={`p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              <Trash2 size={16} />
            </button>
          )}
          {!embedded && (
                <button onClick={() => { setIsOpen(false); onOpenChange?.(false); }} className={`p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      
      <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${isDarkMode ? "bg-[#1E1E1C]" : "bg-slate-50/50"}`}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
            <Bot size={40} className={isDarkMode ? "text-slate-500" : "text-slate-400"} />
            <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Hi! I'm your AI Chatbot. Ask me anything about your study materials!
            </p>
          </div>
        )}
        {(messages || []).map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Bot size={16} />
              </div>
            )}
            <div className={`p-3.5 px-4 rounded-2xl max-w-[85%] shadow-sm text-[13px] leading-relaxed ${
              m.role === 'user' 
                ? 'bg-sky-600 text-white rounded-tr-sm' 
                : isDarkMode 
                  ? 'bg-[#2A2A26] text-[#E0E0D5] rounded-tl-sm border border-[#383832]' 
                  : 'bg-white text-slate-800 rounded-tl-sm border border-slate-100'
            }`}>
              {m.role === 'user' ? (
                <div className="whitespace-pre-wrap">{m.text}</div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/10 dark:prose-pre:bg-white/5 prose-pre:border prose-pre:border-black/5 dark:prose-pre:border-white/10 prose-pre:rounded-lg">
                  <Markdown>{m.text}</Markdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Bot size={16} />
            </div>
            <div className={`p-4 rounded-2xl rounded-tl-sm ${isDarkMode ? 'bg-[#2A2A26] border-[#383832]' : 'bg-white border-slate-100'} border flex items-center gap-1.5`}>
              <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className={`p-4 border-t ${isDarkMode ? "border-[#383832] bg-[#22221F]" : "border-slate-100 bg-white"}`}>
        <div className={`flex gap-2 p-1.5 rounded-xl border focus-within:ring-2 focus-within:ring-sky-500/20 transition-all ${isDarkMode ? "bg-[#1A1A18] border-[#383832]" : "bg-slate-50 border-slate-200"}`}>
          <input 
            className="flex-1 bg-transparent p-2 outline-none text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask a question..."
          />
          <button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:hover:bg-sky-600 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            <Send size={16} className={input.trim() && !isLoading ? "translate-x-0.5" : ""} />
          </button>
        </div>
      </div>
    </div>
  );

  if (embedded) return chatContent;

  return (
    <>
      <button 
        onClick={() => { const nextIsOpen = !isOpen; setIsOpen(nextIsOpen); onOpenChange?.(nextIsOpen); }}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl hover:scale-105 transition-transform z-40 ${isDarkMode ? "bg-[#383832] text-[#E0E0D5]" : "bg-sky-600 text-white"}`}
      >
        <Bot size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
                className="relative z-50 w-full max-w-full xl:fixed xl:bottom-24 xl:right-6 xl:w-[400px] xl:max-w-[calc(100vw-3rem)]"
          >
            {chatContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
