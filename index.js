const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", require("./routes/ytRoutes"));

// Root route
app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "Rakib YTV API Running 🚀"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: "Route not found"
  });
});

// Global error handler (optional but pro)
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({
    status: false,
    message: "Internal Server Error"
  });
});

// Server listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
