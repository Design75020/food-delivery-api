import "dotenv/config";
import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import apiRouter from "./routes/index";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";

const app: Express = express();

// ─────────────────────────────────────────────
// Security Middlewares
// ─────────────────────────────────────────────

app.use(helmet());

const corsOptions: cors.CorsOptions = {
  origin: process.env["CORS_ORIGIN"] ?? "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  exposedHeaders: ["X-Total-Count"],
  credentials: process.env["CORS_ORIGIN"] ? true : false,
  optionsSuccessStatus: 204,
};

// Handle preflight requests for all routes (Express 5 requires explicit wildcard syntax)
app.options("/{*path}", cors(corsOptions));
app.use(cors(corsOptions));

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});
app.use(limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env["NODE_ENV"] === "production" ? 20 : 500,
  message: { success: false, message: "Too many auth attempts, please try again later" },
});
app.use("/api/v1/auth", authLimiter);

// ─────────────────────────────────────────────
// Body Parsing
// ─────────────────────────────────────────────

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────

if (process.env["NODE_ENV"] !== "test") {
  app.use(morgan(process.env["NODE_ENV"] === "production" ? "combined" : "dev"));
}

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env["NODE_ENV"],
  });
});

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────

app.use("/api/v1", apiRouter);

// ─────────────────────────────────────────────
// Error Handling
// ─────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

export default app;
