require("dotenv").config();
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/database");
const postRoutes = require("./routes/posts");
const aiRoutes = require("./routes/ai");
const { router: metricsRouter, metricsMiddleware, activeConnections } = require("./middleware/metrics");

const app = express();
const server = http.createServer(app);

// ── WebSocket Server ──────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ server });
app.locals.wss = wss;

wss.on("connection", (ws) => {
  activeConnections.inc();
  console.log("WebSocket client connected");

  ws.on("close", () => {
    activeConnections.dec();
    console.log("WebSocket client disconnected");
  });

  ws.send(JSON.stringify({ type: "CONNECTED", message: "Real-time updates enabled" }));
});

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("combined"));
app.use(metricsMiddleware);

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/", limiter);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/posts", postRoutes);
app.use("/api/ai", aiRoutes);
app.use("/metrics", metricsRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    websocket_clients: wss.clients.size,
  });
});

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`DevBlog Backend running on port ${PORT}`);
    console.log(`WebSocket server ready`);
    console.log(`Metrics available at /metrics`);
  });
};

start();

module.exports = { app, server };
