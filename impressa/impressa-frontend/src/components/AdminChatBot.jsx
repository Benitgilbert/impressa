import { useState } from "react";
import api from "../utils/axiosInstance";

function AdminChatbot() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = { role: "user", text: question };
    setMessages((prev) => [userMessage, ...prev]);
    setLoading(true);

    try {
      const res = await api.post("/dashboard/chatbot", { question });
      const botMessage = { role: "assistant", text: res.data.answer };
      setMessages((prev) => [botMessage, ...prev]);
    } catch (err) {
      const errorMessage = { role: "assistant", text: "Failed to get response. Please try again." };
      setMessages((prev) => [errorMessage, ...prev]);
    } finally {
      setQuestion("");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 z-50"
      >
        💬
      </button>

      {/* Chat Panel */}
      {showChat && (
  <div className="fixed bottom-0 left-1/2 translate-x-[-50%] w-[500px] h-[500px] bg-white rounded-t-lg shadow-lg flex flex-col z-40">
    {/* Header */}
    <div className="p-4 border-b font-semibold text-gray-700 flex justify-between items-center">
      🧠 impressa Assistant
      <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-red-500 text-sm">✖</button>
    </div>

    {/* Messages */}
    <div className="flex-1 overflow-y-auto flex flex-col-reverse p-4 space-y-2 space-y-reverse">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`p-2 rounded max-w-[85%] ${
            msg.role === "user"
              ? "bg-blue-100 self-end text-right"
              : "bg-gray-100 self-start text-left"
          }`}
        >
          <div className="max-h-[200px] overflow-y-auto whitespace-pre-line text-sm text-gray-800">
            {msg.text}
          </div>
        </div>
      ))}
    </div>

    {/* Input */}
    <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask impressa anything..."
        className="flex-1 border rounded px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading || !question.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
      >
        {loading ? "Thinking..." : "Ask"}
      </button>
    </form>
  </div>
)}
    </>
  );
}

export default AdminChatbot;