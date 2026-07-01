import React, { useState, useRef, useEffect } from "react";
import { chatWithAI, suggestTitles, improveContent } from "../api";
import toast from "react-hot-toast";

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I'm your AI writing assistant powered by Google Gemini. I can help you with blog ideas, improve your writing, suggest titles, and more. What would you like help with today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [titles, setTitles] = useState([]);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await chatWithAI(userMsg);
      setMessages((m) => [...m, { role: "ai", text: res.data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestTitles = async () => {
    if (!topic) return toast.error("Enter a topic first");
    setLoading(true);
    try {
      const res = await suggestTitles(topic);
      setTitles(res.data.titles);
    } catch { toast.error("AI error"); }
    finally { setLoading(false); }
  };

  const quickPrompts = [
    "Give me 5 DevOps blog ideas",
    "How do I write a good blog introduction?",
    "What makes a blog post go viral?",
    "How to improve my technical writing?",
  ];

  return (
    <div>
      <h1 className="page-title">🤖 AI Writing Assistant</h1>
      <p style={{ color: "#64748b", marginBottom: 24, fontSize: 14 }}>Powered by Google Gemini — your intelligent blog writing companion</p>

      <div className="grid-2">
        {/* Chat */}
        <div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg, #1e1b4b, #1e293b)", padding: "12px 16px", borderBottom: "1px solid #334155" }}>
              <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: 14 }}>💬 Chat with Gemini AI</span>
            </div>
            <div ref={chatRef} className="chat-box">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-msg ${msg.role}`}>
                  {msg.role === "ai" && <div className="ai-label">✨ Gemini AI</div>}
                  {msg.text}
                </div>
              ))}
              {loading && (
                <div className="chat-msg ai">
                  <div className="ai-label">✨ Gemini AI</div>
                  <span style={{ color: "#64748b" }}>Thinking...</span>
                </div>
              )}
            </div>
            <form onSubmit={sendMessage} style={{ padding: 12, borderTop: "1px solid #334155", display: "flex", gap: 8 }}>
              <input className="form-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything about writing..." disabled={loading} />
              <button className="btn btn-ai" type="submit" disabled={loading || !input.trim()}>Send</button>
            </form>
          </div>

          {/* Quick prompts */}
          <div style={{ marginTop: 12 }}>
            <p style={{ color: "#64748b", fontSize: 12, marginBottom: 8 }}>Quick prompts:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {quickPrompts.map((p, i) => (
                <button key={i} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}
                  onClick={() => setInput(p)}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Title Suggester */}
        <div>
          <div className="ai-box">
            <div className="ai-title">💡 Blog Title Suggester</div>
            <div className="form-group">
              <input className="form-input" placeholder="Enter a topic..." value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <button className="btn btn-ai" onClick={handleSuggestTitles} disabled={loading} style={{ width: "100%" }}>
              {loading ? "Generating..." : "Generate Titles"}
            </button>
            {titles.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {titles.map((t, i) => (
                  <div key={i} style={{ padding: "10px 12px", background: "#0f172a", borderRadius: 6, marginBottom: 6, fontSize: 13, color: "#e2e8f0", border: "1px solid #334155", lineHeight: 1.4 }}>
                    {t}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Capabilities */}
          <div className="card">
            <p className="section-title">What I can do</p>
            {[
              { icon: "💡", text: "Suggest catchy blog titles for any topic" },
              { icon: "✨", text: "Improve and polish your content" },
              { icon: "📝", text: "Generate summaries for your posts" },
              { icon: "🏷️", text: "Auto-generate SEO-friendly tags" },
              { icon: "💬", text: "Answer writing and blogging questions" },
              { icon: "🚀", text: "Give content strategy advice" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
