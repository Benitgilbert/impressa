import { useEffect, useRef, useState } from "react";
import api from "../utils/axiosInstance";
import { FaPaperPlane, FaTimes, FaTrashAlt, FaCommentDots, FaSparkles } from "react-icons/fa";

function AdminChatbot({ storageKey = "adminChatMessages", title = "AI Assistant", endpoint = "/dashboard/chatbot" }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const listRef = useRef(null);

  // Load persisted chat
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setMessages(parsed);
      } catch { }
    }
  }, [storageKey]);

  // Persist chat and autoscroll to bottom
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, showChat, storageKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = { role: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await api.post(endpoint, {
        question,
        messages: [...messages, userMessage],
      });
      const botMessage = { role: "assistant", text: res.data.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errText = err?.response?.data?.message || "Failed to get response. Please try again.";
      const errorMessage = { role: "assistant", text: errText };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setQuestion("");
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(storageKey);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      {/* Expanding Chat Panel */}
      <div
        className={`
          absolute bottom-20 right-0 w-[360px] sm:w-[400px] 
          bg-white/80 dark:bg-charcoal-800/90 backdrop-blur-xl 
          rounded-[2rem] shadow-2xl border border-white/20 dark:border-charcoal-700 
          overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] origin-bottom-right
          ${showChat ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-12 pointer-events-none'}
        `}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-terracotta-500 to-terracotta-600 dark:from-charcoal-700 dark:to-charcoal-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 text-white">
                <FaSparkles size={18} />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-terracotta-500 rounded-full"></span>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">{title}</h3>
              <p className="text-terracotta-100 text-xs font-medium">Always here to help</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Clear Chat"
          >
            <FaTrashAlt size={14} />
          </button>
        </div>

        {/* Messages Information */}
        <div
          ref={listRef}
          className="h-[450px] overflow-y-auto p-6 space-y-6 bg-cream-50/50 dark:bg-charcoal-900/50 scrollbar-thin scrollbar-thumb-terracotta-200 dark:scrollbar-thumb-charcoal-600"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-50 space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-terracotta-100 to-white dark:from-charcoal-700 dark:to-charcoal-800 rounded-full flex items-center justify-center shadow-inner">
                <FaCommentDots className="text-terracotta-300 dark:text-charcoal-500 text-3xl" />
              </div>
              <div>
                <p className="text-charcoal-800 dark:text-white font-semibold">Start a conversation</p>
                <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
                  Ask me anything about products, orders, or support.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`
                  relative max-w-[85%] px-5 py-3.5 text-sm leading-relaxed shadow-sm
                  ${msg.role === "user"
                    ? "bg-gradient-to-br from-terracotta-500 to-terracotta-600 text-white rounded-[1.5rem] rounded-br-sm"
                    : "bg-white dark:bg-charcoal-700 text-charcoal-800 dark:text-gray-100 rounded-[1.5rem] rounded-bl-sm border border-black/5 dark:border-white/10"
                  }
                `}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-charcoal-700 px-5 py-4 rounded-[1.5rem] rounded-bl-sm shadow-sm border border-black/5 dark:border-white/10 flex items-center gap-1.5">
                <div className="w-2 h-2 bg-terracotta-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-terracotta-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-terracotta-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-charcoal-800 border-t border-black/5 dark:border-white/10">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 bg-cream-100 dark:bg-charcoal-900 rounded-3xl p-1.5 border border-transparent focus-within:border-terracotta-300 transition-colors"
          >
            <textarea
              rows={1}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="w-full pl-4 py-2.5 max-h-32 text-sm bg-transparent border-none focus:ring-0 resize-none text-charcoal-800 dark:text-white placeholder-charcoal-400 dark:placeholder-charcoal-500"
              style={{ minHeight: '44px' }}
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="p-3 bg-terracotta-500 text-white rounded-full hover:bg-terracotta-600 disabled:opacity-50 disabled:hover:bg-terracotta-500 transition-colors shadow-md flex-shrink-0"
            >
              <FaPaperPlane size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setShowChat(!showChat)}
        className={`
          relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl transition-all duration-300 z-10
          ${showChat
            ? 'bg-charcoal-800 text-white rotate-90 hover:bg-charcoal-700'
            : 'bg-gradient-to-br from-terracotta-500 to-terracotta-600 text-white hover:scale-110 hover:shadow-terracotta-500/50'
          }
        `}
      >
        {showChat ? <FaTimes size={24} /> : <FaCommentDots size={28} />}

        {/* Pulsing ring when idle */}
        {!showChat && (
          <span className="absolute inset-0 rounded-full w-full h-full border-2 border-terracotta-500 animate-ping opacity-20 hover:opacity-0 delay-1000"></span>
        )}
      </button>
    </div>
  );
}

export default AdminChatbot;