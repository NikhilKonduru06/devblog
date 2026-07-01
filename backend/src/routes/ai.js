const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to call Gemini
const callGemini = async (prompt) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// Generate blog title suggestions
router.post("/suggest-titles", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: "Topic is required" });

    const prompt = `Generate 5 catchy, SEO-friendly blog post titles about "${topic}". 
    Return only the titles as a numbered list, nothing else.`;

    const text = await callGemini(prompt);
    const titles = text.split("\n").filter((line) => line.trim()).slice(0, 5);
    res.json({ titles });
  } catch (err) {
    res.status(500).json({ error: "AI service error: " + err.message });
  }
});

// Improve blog content
router.post("/improve-content", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    const prompt = `Improve the following blog post content. Make it more engaging, 
    fix grammar, improve flow, and add better structure. Keep the same meaning:
    
    ${content}
    
    Return only the improved content, no extra comments.`;

    const improved = await callGemini(prompt);
    res.json({ improved });
  } catch (err) {
    res.status(500).json({ error: "AI service error: " + err.message });
  }
});

// Generate summary
router.post("/summarize", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    const prompt = `Summarize the following blog post in 2-3 sentences. 
    Make it compelling enough to make readers want to read the full post:
    
    ${content}
    
    Return only the summary.`;

    const summary = await callGemini(prompt);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: "AI service error: " + err.message });
  }
});

// Generate tags
router.post("/generate-tags", async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Title and content required" });

    const prompt = `Generate 5-8 relevant tags for a blog post with this title: "${title}".
    Content preview: ${content.substring(0, 300)}...
    
    Return only comma-separated tags in lowercase, no # symbol.`;

    const text = await callGemini(prompt);
    const tags = text.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    res.json({ tags });
  } catch (err) {
    res.status(500).json({ error: "AI service error: " + err.message });
  }
});

// General AI chat assistant
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const prompt = `You are a helpful AI writing assistant for a blog platform called DevBlog. 
    Help users with writing tips, content ideas, SEO advice, and blogging best practices.
    Keep responses concise and practical.
    
    User: ${message}`;

    const reply = await callGemini(prompt);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: "AI service error: " + err.message });
  }
});

module.exports = router;
