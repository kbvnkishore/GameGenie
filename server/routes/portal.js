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
    const games = all ? agentSvc.getAllGames(20) : agentSvc.getFeaturedGames(limit);
    res.json({ success: true, games });
  } catch (err) {
    console.error("[portal/games]", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/portal/idea  body: { ideaText: string, sessionId?: string }
router.post("/idea", async (req, res) => {
  const { ideaText, sessionId } = req.body;
  if (!ideaText || ideaText.trim().length < 5)
    return res.status(400).json({ success: false, error: "Please write a longer idea!" });
  if (ideaText.length > 500)
    return res.status(400).json({ success: false, error: "Idea is too long. Keep it under 500 characters." });
  try {
    const sid    = sessionId || uuidv4();
    const result = await agentSvc.generateGame(ideaText.trim(), sid);
    res.json({ success: true, ...result, sessionId: sid });
  } catch (err) {
    console.error("[portal/idea]", err.message);
    res.status(500).json({ success: false, error: "GameGenie is thinking... try again in a moment!" });
  }
});

module.exports = router;