const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connectDB } = require("./config/db");
const initializeFirebase = require("./config/firebase");

const app = express();

// Initialize Firebase
initializeFirebase();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// Routes
const usersRoutes = require("./routes/users");
const lessonsRoutes = require("./routes/lessons");
const favoritesRoutes = require("./routes/favorites");
const reportsRoutes = require("./routes/reports");
const paymentsRoutes = require("./routes/payments");
const commentsRoutes = require("./routes/comments");

app.use("/api/users", usersRoutes);
app.use("/api/lessons", lessonsRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/comments", commentsRoutes);

// Basic route
app.get("/", (req, res) => {
  res.send("Digital Life Lessons Server is running");
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Server is healthy" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("✓ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
