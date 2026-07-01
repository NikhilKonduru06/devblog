import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

// Posts
export const getPosts = (params) => API.get("/posts", { params });
export const getPost = (id) => API.get(`/posts/${id}`);
export const createPost = (data) => API.post("/posts", data);
export const updatePost = (id, data) => API.put(`/posts/${id}`, data);
export const deletePost = (id) => API.delete(`/posts/${id}`);
export const likePost = (id) => API.patch(`/posts/${id}/like`);

// AI
export const suggestTitles = (topic) => API.post("/ai/suggest-titles", { topic });
export const improveContent = (content) => API.post("/ai/improve-content", { content });
export const summarizeContent = (content) => API.post("/ai/summarize", { content });
export const generateTags = (title, content) => API.post("/ai/generate-tags", { title, content });
export const chatWithAI = (message) => API.post("/ai/chat", { message });
