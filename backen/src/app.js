const express = require("express");
const cors = require("cors");
const cookies = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const endpointRoutes = require("./routes/endpointRoutes");
const mockRoutes = require("./routes/mockRoutes");

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow same-origin/non-browser tools and explicitly configured frontend URLs.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookies());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", endpointRoutes);
app.use("/api/mock", mockRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({
        message: "MockForge Backend is Running."
    });
});

module.exports = app;
