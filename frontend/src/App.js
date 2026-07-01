import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import CreatePost from "./pages/CreatePost";
import AIAssistant from "./pages/AIAssistant";
import "./App.css";

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <nav className="navbar">
        <div className="nav-brand">
          <span className="nav-logo">⚡</span>
          <Link to="/" className="nav-title">DevBlog</Link>
          <span className="nav-badge">AI-Powered</span>
        </div>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/create">Write Post</Link>
          <Link to="/ai-assistant">AI Assistant</Link>
        </div>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
