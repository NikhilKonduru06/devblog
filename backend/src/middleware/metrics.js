const express = require("express");
const router = express.Router();
const client = require("prom-client");

// Collect default Node.js metrics (CPU, memory, event loop)
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const activeConnections = new client.Gauge({
  name: "active_websocket_connections",
  help: "Number of active WebSocket connections",
  registers: [register],
});

const blogPostsTotal = new client.Gauge({
  name: "blog_posts_total",
  help: "Total number of blog posts",
  registers: [register],
});

// Middleware to track request duration
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });
  next();
};

// Expose metrics endpoint for Prometheus scraping
router.get("/", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

module.exports = { router, metricsMiddleware, activeConnections, blogPostsTotal };
