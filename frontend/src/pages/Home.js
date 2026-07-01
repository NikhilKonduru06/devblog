import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getPosts } from "../api";
import useWebSocket from "../hooks/useWebSocket";
import toast from "react-hot-toast";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [wsConnected, setWsConnected] = useState(false);

  const fetchPosts = async (q = "") => {
    try {
      setLoading(true);
      const res = await getPosts({ search: q });
      setPosts(res.data.posts);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  // Real-time WebSocket updates
  const handleWsMessage = useCallback((data) => {
    if (data.type === "CONNECTED") {
      setWsConnected(true);
    } else if (data.type === "NEW_POST") {
      setPosts((prev) => [data.post, ...prev]);
      toast.success("New post published!", { icon: "📝" });
    } else if (data.type === "VIEW_UPDATE") {
      setPosts((prev) =>
        prev.map((p) => (p._id === data.postId ? { ...p, views: data.views } : p))
      );
    }
  }, []);

  useWebSocket(handleWsMessage);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts(search);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h1 className="page-title" style={{ margin: 0 }}>DevBlog</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {wsConnected && (
            <span className="live-badge">
              <span className="live-dot" />
              Live Updates
            </span>
          )}
          <Link to="/create"><button className="btn btn-primary">+ Write Post</button></Link>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          className="form-input"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-secondary" type="submit">Search</button>
        {search && <button className="btn btn-secondary" type="button" onClick={() => { setSearch(""); fetchPosts(); }}>Clear</button>}
      </form>

      {/* Posts */}
      {loading ? (
        <p style={{ color: "#64748b", textAlign: "center", padding: 40 }}>Loading posts...</p>
      ) : posts.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 60 }}>
          <p style={{ color: "#64748b", fontSize: 16 }}>No posts yet.</p>
          <Link to="/create"><button className="btn btn-primary" style={{ marginTop: 16 }}>Write the first post</button></Link>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post._id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Link to={`/post/${post._id}`} style={{ textDecoration: "none" }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginBottom: 8, cursor: "pointer" }}
                    onMouseEnter={(e) => e.target.style.color = "#38bdf8"}
                    onMouseLeave={(e) => e.target.style.color = "#f1f5f9"}>
                    {post.title}
                  </h2>
                </Link>
                {post.summary && <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{post.summary}</p>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {post.tags?.map((tag) => <span key={tag} className="tag">{tag}</span>)}
                </div>
                <div style={{ display: "flex", gap: 16, color: "#64748b", fontSize: 13 }}>
                  <span>✍️ {post.author}</span>
                  <span>👁 {post.views} views</span>
                  <span>❤️ {post.likes} likes</span>
                  <span>🕐 {new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
