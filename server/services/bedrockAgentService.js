/**
 * server/services/bedrockAgentService.js
 * Purpose  : Real AWS Bedrock agent service. Invokes GameGenie and
 *            KidsGamePortal agents using AWS SDK v3 streaming API.
 * Framework: AWS SDK v3 (@aws-sdk/client-bedrock-agent-runtime)
 * Used when: USE_MOCK_AGENTS=false
 *
 * Runtime parameters (ALL required - inject via env vars, NEVER hardcode):
 *   AWS_REGION                 - AWS region (default: us-east-1)
 *   GAME_GENIE_AGENT_ID        - GameGenie Bedrock agent ID
 *   GAME_GENIE_AGENT_ALIAS_ID  - GameGenie agent alias ID
 *   KIDS_PORTAL_AGENT_ID       - KidsGamePortal Bedrock agent ID
 *   KIDS_PORTAL_AGENT_ALIAS_ID - KidsGamePortal agent alias ID
 *   AWS_ACCESS_KEY_ID          - AWS credentials (or use IAM role)
 *   AWS_SECRET_ACCESS_KEY      - AWS credentials (or use IAM role)
 *
 * PowerShell runtime injection (nothing written to files):
 *   $env:USE_MOCK_AGENTS="false"
 *   $env:AWS_REGION="us-east-1"
 *   $env:GAME_GENIE_AGENT_ID="YOUR_AGENT_ID"
 *   $env:GAME_GENIE_AGENT_ALIAS_ID="YOUR_ALIAS_ID"
 *   $env:AWS_ACCESS_KEY_ID="YOUR_KEY"
 *   $env:AWS_SECRET_ACCESS_KEY="YOUR_SECRET"
 *   node server/index.js
 */

const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require("@aws-sdk/client-bedrock-agent-runtime");
const { v4: uuidv4 } = require("uuid");

// All config from environment - zero hardcoded values
const config = {
  region            : process.env.AWS_REGION                 || "us-east-1",
  gameGenieAgentId  : process.env.GAME_GENIE_AGENT_ID,
  gameGenieAliasId  : process.env.GAME_GENIE_AGENT_ALIAS_ID,
  kidsPortalAgentId : process.env.KIDS_PORTAL_AGENT_ID,
  kidsPortalAliasId : process.env.KIDS_PORTAL_AGENT_ALIAS_ID
};

// Warn at startup if required config is missing
const missing = Object.entries(config).filter(([, v]) => !v).map(([k]) => k);
if (missing.length > 0) console.warn("[bedrockAgentService] Missing env vars:", missing.join(", "));

const client = new BedrockAgentRuntimeClient({ region: config.region });

async function invokeAgent(agentId, agentAliasId, sessionId, inputText) {
  if (!agentId || !agentAliasId)
    throw new Error("Agent not configured. Set GAME_GENIE_AGENT_ID and GAME_GENIE_AGENT_ALIAS_ID env vars.");
  const command  = new InvokeAgentCommand({ agentId, agentAliasId, sessionId, inputText });
  const response = await client.send(command);
  let   output   = "";
  for await (const chunk of response.completion) {
    if (chunk.chunk?.bytes) output += Buffer.from(chunk.chunk.bytes).toString("utf-8");
  }
  return output;
}

async function getTodaysProblem() {
  const text = await invokeAgent(
    config.kidsPortalAgentId, config.kidsPortalAliasId, uuidv4(),
    "Give me the problem of the day for kids as JSON: { id, title, description, emoji }"
  );
  try   { return JSON.parse(text); }
  catch { return { title: "Daily Challenge", description: text, emoji: "star" }; }
}

async function getFeaturedGames(limit = 6) {
  const text = await invokeAgent(
    config.kidsPortalAgentId, config.kidsPortalAliasId, uuidv4(),
    `List ${limit} featured games as JSON array: [{ id, title, url, emoji, category }]`
  );
  try   { return JSON.parse(text); }
  catch { return [{ title: "Games loading...", url: "#", emoji: "game" }]; }
}

async function getAllGames(limit = 20) { return getFeaturedGames(limit); }

async function generateGame(ideaText, sessionId) {
  const text = await invokeAgent(
    config.gameGenieAgentId, config.gameGenieAliasId, sessionId || uuidv4(),
    `Create a game from this idea: ${ideaText}. Return JSON: { gameId, title, url, emoji, message }`
  );
  try {
    const parsed = JSON.parse(text);
    return { success: true, ...parsed };
  } catch {
    return { success: true, message: text, title: "Your Game", url: "#", emoji: "game" };
  }
}

module.exports = { getTodaysProblem, getFeaturedGames, getAllGames, generateGame };