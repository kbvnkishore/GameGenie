require("dotenv").config({ path: `.env.${process.env.NODE_ENV || "local"}` });

const express = require("express");
const cors    = require("cors");
const path    = require("path");

const app  = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// API routes
app.use("/api/portal", require("./routes/portal"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status:    "ok",
    mode:      process.env.USE_MOCK_AGENTS === "true" ? "mock" : "aws-bedrock",
    env:       process.env.NODE_ENV || "local",
    timestamp: new Date().toISOString()
  });
});

// Serve the kids portal for all non-API routes (SPA fallback)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log("");
  console.log("  🎮 GameGenie Kids Portal is running!");
  console.log(`  👉 Open http://localhost:${PORT} in your browser`);
  console.log(`  🔧 Mode: ${process.env.USE_MOCK_AGENTS === "true" ? "LOCAL MOCK (no AWS needed)" : "AWS Bedrock"}`);
  console.log("");
});