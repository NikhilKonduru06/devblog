const request = require("supertest");
const { app, server } = require("../src/server");

// Mock mongoose to avoid real DB connection in tests
jest.mock("../src/config/database", () => jest.fn().mockResolvedValue(true));
jest.mock("../src/models/Post");

const Post = require("../src/models/Post");

afterAll(async () => {
  server.close();
});

describe("Health Check", () => {
  it("GET /health should return healthy status", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("healthy");
  });
});

describe("Posts API", () => {
  it("GET /api/posts should return posts array", async () => {
    Post.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });
    Post.countDocuments = jest.fn().mockResolvedValue(0);

    const res = await request(app).get("/api/posts");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("posts");
  });
});

describe("Metrics", () => {
  it("GET /metrics should return prometheus metrics", async () => {
    const res = await request(app).get("/metrics");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("http_requests_total");
  });
});
