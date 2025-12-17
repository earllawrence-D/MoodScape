
import express from "express";
import cors from "cors";
import helmet from "helmet";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import sequelize, { testConnection } from "./config/database.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { sanitizeInput } from "./middleware/sanitizer.js";

// Routes
import authRoutes from "./routes/auth.js";
import journalRoutes from "./routes/journal.js";
import aiRoutes from "./routes/ai.js";
import communityRoutes from "./routes/community.js";
import moodRoutes from "./routes/moodRoutes.js";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import harmfulWordRoutes from "./routes/harmfulWords.js";

// Models
import "./models/User.js";
import "./models/CommunityPost.js";
import "./models/CommunityComment.js";
import "./models/CommunityVote.js";
import "./models/Feedback.js";


const app = express();
const PORT = process.env.PORT || 5000;

// Trust first proxy (for rate limiting behind reverse proxy like Nginx)
app.set('trust proxy', 1);

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// MIDDLEWARES
// ===============================

// Serve static files
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// Serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Security
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',            // local dev
  'https://mood-scape.netlify.app',   // production frontend
  'https://moodscape-production.up.railway.app'  // production backend
];

// Enable pre-flight requests for all routes
app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Apply CORS to all other routes
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Custom middlewares
app.use(sanitizeInput);
app.use(generalLimiter);

// ===============================
// ROUTES
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/journals", journalRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/harmful-words", harmfulWordRoutes);


// ===============================
// HEALTHCHECK & SPA FALLBACK
// ===============================

// ===============================
// HEALTHCHECK
// ===============================

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "MoodScape API is running",
    timestamp: new Date().toISOString(),
  });
});

// ===============================
// SPA FALLBACK (SAFE)
// ===============================

const frontendIndex = path.join(__dirname, "../../frontend/dist/index.html");

app.get("*", (req, res, next) => {
  // 🚨 NEVER hijack API routes
  if (req.path.startsWith("/api")) return next();

  if (fs.existsSync(frontendIndex)) {
    res.sendFile(frontendIndex);
  } else {
    res.status(404).json({
      error: "Frontend not built in this deployment",
    });
  }
});



// ===============================
// 404 HANDLER
// ===============================

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ===============================
// GLOBAL ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ===============================
// START SERVER
// ===============================

const startServer = async () => {
  try {
    console.log("🔗 Testing database connection...");
    const ok = await testConnection();
    if (!ok) throw new Error("Database connection failed");

    console.log("🛠️ Synchronizing database models...");
    await sequelize.sync();
    console.log("✅ Database models synchronized");

    app.listen(PORT, () => {
      console.log(`🚀 MoodScape API running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Healthcheck: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
