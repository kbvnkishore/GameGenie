/**
 * server/index.js
 * Purpose  : Express HTTP server entry point for the GameGenie Kids Portal.
 * Framework: Express 4 (Node.js v24)
 * All config injected at runtime via environment variables - no hardcoded values.
 *
 * Runtime parameters:
 *   NODE_ENV        - local | dev | staging | prod  (default: local)
 *   PORT            - HTTP port                     (default: 3000)
 *   USE_MOCK_AGENTS - true = local mock, no AWS     (default: true)
 *
 * Commands:
 *   npm start              Local mock mode
 *   NODE_ENV=dev npm start Real AWS Bedrock
 *   npm run dev            Auto-reload with nodemon
 */

require("dotenv").config({ path: `.env.${process.env.NODE_ENV || "local"}` });

const express = require("express");
const cors    = require("cors");
const path    = require("path");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/portal", require("./routes/portal"));

app.get("/api/health", (req, res) => {
  res.json({
    status    : "ok",
    mode      : process.env.USE_MOCK_AGENTS === "true" ? "mock" : "aws-bedrock",
    env       : process.env.NODE_ENV || "local",
    port      : PORT,
    timestamp : new Date().toISOString()
  });
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log("");
  console.log("  GameGenie Kids Portal is running!");
  console.log(`  Open http://localhost:${PORT}`);
  console.log(`  Mode: ${process.env.USE_MOCK_AGENTS === "true" ? "LOCAL MOCK (no AWS needed)" : "AWS Bedrock"}`);
  console.log("");
});