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

const fs = require("fs");
const path = require("path");

function refreshRuntimeEnv() {
  const envFile = `.env.${process.env.NODE_ENV || "local"}`;
  const envPath = path.join(__dirname, "..", envFile);

  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=").trim();
    if (!key) continue;

    process.env[key.trim()] = value.replace(/^['"]|['"]$/g, "");
  }
}

refreshRuntimeEnv();
setInterval(refreshRuntimeEnv, 15000);

const express = require("express");
const cors    = require("cors");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});
app.use(express.static(path.join(__dirname, "../public")));

app.use("/local-games", (req, res, next) => {
  const localPath = (process.env.GAME_LIBRARY_LOCAL_PATH || "").trim();
  if (!localPath) {
    return res.status(404).json({ success: false, error: "No local game source configured." });
  }

  const basePath = localPath.replace(/\//g, path.sep);
  const requested = req.path.replace(/^\/+/, "");
  const safePath = path.normalize(path.join(basePath, requested));

  if (!safePath.startsWith(path.normalize(basePath))) {
    return res.status(403).json({ success: false, error: "Invalid local game path." });
  }

  if (!fs.existsSync(safePath)) {
    return res.status(404).json({ success: false, error: "Game file not found." });
  }

  if (fs.statSync(safePath).isDirectory()) {
    return res.status(404).json({ success: false, error: "Directory listing is not allowed." });
  }

  return res.sendFile(safePath);
});

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