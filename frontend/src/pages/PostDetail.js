import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { getPost, deletePost, likePost } from "../api";
import useWebSocket from "../hooks/useWebSocket";
import toast from "react-hot-toast";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getPost(id);
        setPost(res.data);
      } catch { toast.error("Post not found"); navigate("/"); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id, navigate]);

  const handleWsMessage = useCallback((data) => {
    if (data.type === "VIEW_UPDATE" && data.postId === id) {
      setPost((p) => p ? { ...p, views: data.views } : p);
    }
  }, [id]);

  useWebSocket(handleWsMessage);

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deletePost(id);
      toast.success("Post deleted");
      navigate("/");
    } catch { toast.error("Failed to delete"); }
  };

  const handleLike = async () => {
    if (liked) return;
    try {
      const res = await likePost(id);
      setPost((p) => ({ ...p, likes: res.data.likes }));
      setLiked(true);
    } catch { toast.error("Failed to like"); }
  };

  if (loading) return <p style={{ color: "#64748b", textAlign: "center", padding: 60 }}>Loading...</p>;
  if (!post) return null;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Link to="/" style={{ color: "#38bdf8", textDecoration: "none", fontSize: 14 }}>← Back to posts</Link>

      <div className="card" style={{ marginTop: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", marginBottom: 12, lineHeight: 1.3 }}>{post.title}</h1>

        <div style={{ display: "flex", gap: 16, color: "#64748b", fontSize: 13, marginBottom: 16, flexWrap: "wrap" }}>
          <span>✍️ {post.author}</span>
          <span>👁 {post.views} views</span>
          <span>❤️ {post.likes} likes</span>
          <span>🕐 {new Date(post.createdAt).toLocaleDateString()}</span>
          <span className="live-badge" style={{ fontSize: 11 }}><span className="live-dot" />Live views</span>
        </div>

        {post.summary && (
          <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, fontStyle: "italic" }}>{post.summary}</p>
          </div>
        )}

        <div style={{ color: "#e2e8f0", lineHeight: 1.8, fontSize: 15, marginBottom: 24 }}>
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {post.tags?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {post.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-secondary" onClick={handleLike} disabled={liked}>
            {liked ? "❤️ Liked!" : "🤍 Like"}
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>
    </div>
  );
}
