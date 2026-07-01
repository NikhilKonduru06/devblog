import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPost, suggestTitles, improveContent, summarizeContent, generateTags } from "../api";
import toast from "react-hot-toast";

export default function CreatePost() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", content: "", author: "", summary: "", tags: "" });
  const [aiLoading, setAiLoading] = useState({});
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [aiTopic, setAiTopic] = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setAiLoad = (key, val) => setAiLoading((l) => ({ ...l, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) };
      await createPost(data);
      toast.success("Post published!");
      navigate("/");
    } catch {
      toast.error("Failed to publish post");
    }
  };

  const handleSuggestTitles = async () => {
    if (!aiTopic) return toast.error("Enter a topic first");
    setAiLoad("titles", true);
    try {
      const res = await suggestTitles(aiTopic);
      setTitleSuggestions(res.data.titles);
    } catch { toast.error("AI service error"); }
    finally { setAiLoad("titles", false); }
  };

  const handleImprove = async () => {
    if (!form.content) return toast.error("Write some content first");
    setAiLoad("improve", true);
    try {
      const res = await improveContent(form.content);
      set("content", res.data.improved);
      toast.success("Content improved by AI!");
    } catch { toast.error("AI service error"); }
    finally { setAiLoad("improve", false); }
  };

  const handleSummarize = async () => {
    if (!form.content) return toast.error("Write some content first");
    setAiLoad("summary", true);
    try {
      const res = await summarizeContent(form.content);
      set("summary", res.data.summary);
      toast.success("Summary generated!");
    } catch { toast.error("AI service error"); }
    finally { setAiLoad("summary", false); }
  };

  const handleGenerateTags = async () => {
    if (!form.title || !form.content) return toast.error("Add title and content first");
    setAiLoad("tags", true);
    try {
      const res = await generateTags(form.title, form.content);
      set("tags", res.data.tags.join(", "));
      toast.success("Tags generated!");
    } catch { toast.error("AI service error"); }
    finally { setAiLoad("tags", false); }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 className="page-title">Write a New Post</h1>

      {/* AI Title Suggester */}
      <div className="ai-box" style={{ marginBottom: 24 }}>
        <div className="ai-title">🤖 AI Title Suggester</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input className="form-input" placeholder="Enter your topic (e.g. 'Kubernetes best practices')" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} />
          <button className="btn btn-ai" onClick={handleSuggestTitles} disabled={aiLoading.titles}>
            {aiLoading.titles ? "Thinking..." : "Suggest"}
          </button>
        </div>
        {titleSuggestions.length > 0 && (
          <div>
            <p style={{ color: "#a78bfa", fontSize: 12, marginBottom: 8 }}>Click a title to use it:</p>
            {titleSuggestions.map((t, i) => (
              <div key={i} onClick={() => set("title", t.replace(/^\d+\.\s*/, ""))}
                style={{ padding: "8px 12px", background: "#0f172a", borderRadius: 6, marginBottom: 4, cursor: "pointer", fontSize: 13, color: "#e2e8f0", border: "1px solid #334155" }}
                onMouseEnter={(e) => e.target.style.borderColor = "#7c3aed"}
                onMouseLeave={(e) => e.target.style.borderColor = "#334155"}>
                {t}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title *</label>
          <input className="form-input" value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="Your blog post title" />
        </div>

        <div className="form-group">
          <label>Author *</label>
          <input className="form-input" value={form.author} onChange={(e) => set("author", e.target.value)} required placeholder="Your name" />
        </div>

        <div className="form-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ margin: 0 }}>Content *</label>
            <button type="button" className="btn btn-ai" style={{ padding: "4px 12px", fontSize: 12 }} onClick={handleImprove} disabled={aiLoading.improve}>
              {aiLoading.improve ? "Improving..." : "🤖 Improve with AI"}
            </button>
          </div>
          <textarea className="form-textarea" value={form.content} onChange={(e) => set("content", e.target.value)} required placeholder="Write your blog post here..." style={{ minHeight: 300 }} />
        </div>

        <div className="form-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ margin: 0 }}>Summary</label>
            <button type="button" className="btn btn-ai" style={{ padding: "4px 12px", fontSize: 12 }} onClick={handleSummarize} disabled={aiLoading.summary}>
              {aiLoading.summary ? "Summarizing..." : "🤖 Generate Summary"}
            </button>
          </div>
          <textarea className="form-textarea" value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Brief description of your post..." style={{ minHeight: 80 }} />
        </div>

        <div className="form-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ margin: 0 }}>Tags (comma separated)</label>
            <button type="button" className="btn btn-ai" style={{ padding: "4px 12px", fontSize: 12 }} onClick={handleGenerateTags} disabled={aiLoading.tags}>
              {aiLoading.tags ? "Generating..." : "🤖 Generate Tags"}
            </button>
          </div>
          <input className="form-input" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="devops, kubernetes, aws" />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-primary" type="submit">Publish Post</button>
          <button className="btn btn-secondary" type="button" onClick={() => navigate("/")}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
