/**
 * server/routes/portal.js
 * Purpose  : API route handlers for the GameGenie Kids Portal.
 * Framework: Express 4 Router
 *
 * Routes:
 *   GET  /api/portal/problem         - Problem of the day
 *   GET  /api/portal/games?limit=6   - Featured game library
 *   GET  /api/portal/games?all=true  - All games including kid-created
 *   POST /api/portal/idea            - Submit idea, returns game link
 *
 * Runtime parameters:
 *   USE_MOCK_AGENTS - Switches between mockAgentService and bedrockAgentService
 */

const fs             = require("fs");
const path           = require("path");
const express        = require("express");
const router         = express.Router();
const { v4: uuidv4 } = require("uuid");

const useMock  = process.env.USE_MOCK_AGENTS === "true";
const agentSvc = useMock
  ? require("../services/mockAgentService")
  : require("../services/bedrockAgentService");

console.log(`[portal] Agent service: ${useMock ? "MOCK" : "AWS Bedrock"}`);

// GET /api/portal/problem
router.get("/problem", async (req, res) => {
  try {
    const problem = await agentSvc.getTodaysProblem();
    res.json({ success: true, problem });
  } catch (err) {
    console.error("[portal/problem]", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/portal/games
router.get("/games", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const all   = req.query.all === "true";
    const games = all ? await agentSvc.getAllGames(20) : await agentSvc.getFeaturedGames(limit);
    res.json({ success: true, games });
  } catch (err) {
    console.error("[portal/games]", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/portal/game-source
router.get("/game-source", (req, res) => {
  const source = (process.env.GAME_LIBRARY_SOURCE || process.env.GAME_LIBRARY_LOCAL_PATH || process.env.GAME_LIBRARY_S3_BASE_URL || "").trim();
  const localPath = (process.env.GAME_LIBRARY_LOCAL_PATH || "").trim();
  const s3BaseUrl = (process.env.GAME_LIBRARY_S3_BASE_URL || "").trim();

  return res.json({
    success: true,
    source,
    localPath,
    s3BaseUrl,
    type: localPath ? "local" : s3BaseUrl ? "s3" : "fallback"
  });
});

// POST /api/portal/game-source
router.post("/game-source", (req, res) => {
  const source = String(req.body?.source || "").trim();

  if (!source) {
    delete process.env.GAME_LIBRARY_S3_BASE_URL;
    delete process.env.GAME_LIBRARY_LOCAL_PATH;
    delete process.env.GAME_LIBRARY_SOURCE;

    try {
      const envPath = path.join(__dirname, "..", "..", ".env.local");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf8");
        const lines = content.split(/\r?\n/).filter(line => !line.startsWith("GAME_LIBRARY_S3_BASE_URL=") && !line.startsWith("GAME_LIBRARY_LOCAL_PATH=") && !line.startsWith("GAME_LIBRARY_SOURCE="));
        lines.push("GAME_LIBRARY_S3_BASE_URL=");
        lines.push("GAME_LIBRARY_LOCAL_PATH=");
        lines.push("GAME_LIBRARY_SOURCE=");
        fs.writeFileSync(envPath, lines.join("\n") + "\n");
      }
    } catch (err) {
      console.warn("[portal/game-source] Unable to reset env file.", err.message);
    }

    return res.json({ success: true, message: "Game source reset to local fallback." });
  }

  const normalized = source.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(normalized)) {
    process.env.GAME_LIBRARY_S3_BASE_URL = normalized;
    process.env.GAME_LIBRARY_LOCAL_PATH = "";
    process.env.GAME_LIBRARY_SOURCE = normalized;

    try {
      const envPath = path.join(__dirname, "..", "..", ".env.local");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf8");
        const lines = content.split(/\r?\n/).filter(line => !line.startsWith("GAME_LIBRARY_S3_BASE_URL=") && !line.startsWith("GAME_LIBRARY_LOCAL_PATH=") && !line.startsWith("GAME_LIBRARY_SOURCE="));
        lines.push(`GAME_LIBRARY_S3_BASE_URL=${normalized}`);
        lines.push("GAME_LIBRARY_LOCAL_PATH=");
        lines.push(`GAME_LIBRARY_SOURCE=${normalized}`);
        fs.writeFileSync(envPath, lines.join("\n") + "\n");
      }
    } catch (err) {
      console.warn("[portal/game-source] Unable to update env file.", err.message);
    }

    return res.json({ success: true, message: "S3 game source updated.", source: normalized, type: "s3" });
  }

  process.env.GAME_LIBRARY_LOCAL_PATH = normalized;
  process.env.GAME_LIBRARY_S3_BASE_URL = "";
  process.env.GAME_LIBRARY_SOURCE = normalized;

  try {
    const envPath = path.join(__dirname, "..", "..", ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const lines = content.split(/\r?\n/).filter(line => !line.startsWith("GAME_LIBRARY_S3_BASE_URL=") && !line.startsWith("GAME_LIBRARY_LOCAL_PATH=") && !line.startsWith("GAME_LIBRARY_SOURCE="));
      lines.push("GAME_LIBRARY_S3_BASE_URL=");
      lines.push(`GAME_LIBRARY_LOCAL_PATH=${normalized}`);
      lines.push(`GAME_LIBRARY_SOURCE=${normalized}`);
      fs.writeFileSync(envPath, lines.join("\n") + "\n");
    }
  } catch (err) {
    console.warn("[portal/game-source] Unable to update env file.", err.message);
  }

  return res.json({ success: true, message: "Local game source updated.", source: normalized, type: "local" });
});

// POST /api/portal/idea  body: { ideaText: string, sessionId?: string }
router.post("/idea", async (req, res) => {
  const { ideaText, sessionId, conversation } = req.body;
  const combinedIdea = typeof ideaText === "string" ? ideaText.trim() : "";
  const parsedConversation = Array.isArray(conversation) ? conversation : [];
  const summary = combinedIdea || parsedConversation.filter(item => item && item.role === "user").map(item => item.text).join(" \n ").trim();

  if (!summary || summary.length < 5)
    return res.status(400).json({ success: false, error: "Please write a longer idea!" });
  if (summary.length > 2000)
    return res.status(400).json({ success: false, error: "Idea is too long. Keep it under 2000 characters." });

  try {
    const sid = sessionId || uuidv4();
    const result = await agentSvc.generateGame(summary, sid, parsedConversation);
    res.json({ success: true, ...result, sessionId: sid });
  } catch (err) {
    console.error("[portal/idea]", err.message);
    res.status(500).json({ success: false, error: "Game is generating... please wait a moment." });
  }
});

module.exports = router;