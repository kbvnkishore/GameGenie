/**
 * Real AWS Bedrock agent service.
 * Used when USE_MOCK_AGENTS=false and real agent IDs are configured.
 */

const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require("@aws-sdk/client-bedrock-agent-runtime");
const { v4: uuidv4 } = require("uuid");

const client = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });

/**
 * Invoke a Bedrock agent and collect the full streamed response.
 */
async function invokeAgent(agentId, agentAliasId, sessionId, inputText) {
  const command = new InvokeAgentCommand({
    agentId,
    agentAliasId,
    sessionId,
    inputText
  });

  const response = await client.send(command);
  let fullResponse = "";

  for await (const chunk of response.completion) {
    if (chunk.chunk?.bytes) {
      fullResponse += Buffer.from(chunk.chunk.bytes).toString("utf-8");
    }
  }

  return fullResponse;
}

/**
 * Ask the KidsGamePortal agent for the problem of the day.
 */
async function getTodaysProblem() {
  const sessionId = uuidv4();
  const response  = await invokeAgent(
    process.env.KIDS_PORTAL_AGENT_ID,
    process.env.KIDS_PORTAL_AGENT_ALIAS_ID,
    sessionId,
    "Give me the problem of the day for kids."
  );
  return { description: response, sessionId };
}

/**
 * Ask the KidsGamePortal agent for the featured game list.
 */
async function getFeaturedGames(limit = 6) {
  const sessionId = uuidv4();
  const response  = await invokeAgent(
    process.env.KIDS_PORTAL_AGENT_ID,
    process.env.KIDS_PORTAL_AGENT_ALIAS_ID,
    sessionId,
    `List ${limit} featured games with their play links as JSON.`
  );
  try {
    return JSON.parse(response);
  } catch {
    return [{ title: "Games loading...", url: "#", emoji: "🎮" }];
  }
}

/**
 * Send a game idea to the GameGenie agent and get back a game link.
 */
async function generateGame(ideaText, sessionId) {
  const response = await invokeAgent(
    process.env.GAME_GENIE_AGENT_ID,
    process.env.GAME_GENIE_AGENT_ALIAS_ID,
    sessionId || uuidv4(),
    `Create a game based on this idea: ${ideaText}`
  );
  return { success: true, message: response };
}

module.exports = { getTodaysProblem, getFeaturedGames, generateGame };