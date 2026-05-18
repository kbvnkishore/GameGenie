const { BedrockAgentClient } = require("@aws-sdk/client-bedrock-agent");
const fs = require("fs");
const path = require("path");

jest.mock("@aws-sdk/client-bedrock-agent");

// ─── GameGenie Agent ───────────────────────────────────────────────────────────

describe("GameGenie Agent Configuration", () => {
  const configPath = path.join(__dirname, "../agents/game-genie/agent-config.json");
  const actionsPath = path.join(__dirname, "../agents/game-genie/actions/action-group.json");
  const promptPath  = path.join(__dirname, "../agents/game-genie/prompts/system-prompt.md");

  test("agent-config.json is valid and has required fields", () => {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(config).toHaveProperty("agentName", "GameGenie");
    expect(config).toHaveProperty("foundationModel");
    expect(config).toHaveProperty("instruction");
    expect(config).toHaveProperty("idleSessionTTLInSeconds");
  });

  test("action-group.json is valid and has no CustomerSupport references", () => {
    const actions = JSON.parse(fs.readFileSync(actionsPath, "utf8"));
    expect(actions).toHaveProperty("actionGroupName", "GameGenieActions");
    expect(actions).toHaveProperty("actions");
    expect(Array.isArray(actions.actions)).toBe(true);
    expect(actions.actionGroupName).not.toMatch(/CustomerSupport/i);
    const raw = fs.readFileSync(actionsPath, "utf8");
    expect(raw).not.toMatch(/CustomerSupport/i);
    expect(raw).not.toMatch(/customer-support/i);
  });

  test("action-group.json contains GameGenie-specific actions", () => {
    const actions = JSON.parse(fs.readFileSync(actionsPath, "utf8"));
    const actionNames = actions.actions.map(a => a.actionName);
    expect(actionNames).toContain("GenerateGame");
    expect(actionNames).toContain("AddGameToLibrary");
    expect(actionNames).toContain("GetGameLibrary");
  });

  test("system-prompt.md exists and is non-empty", () => {
    expect(fs.existsSync(promptPath)).toBe(true);
    const content = fs.readFileSync(promptPath, "utf8");
    expect(content.length).toBeGreaterThan(0);
    expect(content).not.toMatch(/CustomerSupport/i);
  });
});

// ─── KidsGamePortal Agent ──────────────────────────────────────────────────────

describe("KidsGamePortal Agent Configuration", () => {
  const configPath  = path.join(__dirname, "../agents/kids-game-portal/agent-config.json");
  const actionsPath = path.join(__dirname, "../agents/kids-game-portal/actions/action-group.json");
  const promptPath  = path.join(__dirname, "../agents/kids-game-portal/prompts/system-prompt.md");

  test("agent-config.json is valid and has required fields", () => {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(config).toHaveProperty("agentName", "KidsGamePortal");
    expect(config).toHaveProperty("foundationModel");
    expect(config).toHaveProperty("instruction");
    expect(config).toHaveProperty("idleSessionTTLInSeconds");
  });

  test("action-group.json is valid and has no CustomerSupport references", () => {
    const actions = JSON.parse(fs.readFileSync(actionsPath, "utf8"));
    expect(actions).toHaveProperty("actionGroupName", "KidsGamePortalActions");
    expect(actions).toHaveProperty("actions");
    expect(Array.isArray(actions.actions)).toBe(true);
    const raw = fs.readFileSync(actionsPath, "utf8");
    expect(raw).not.toMatch(/CustomerSupport/i);
  });

  test("action-group.json contains portal-specific actions", () => {
    const actions = JSON.parse(fs.readFileSync(actionsPath, "utf8"));
    const actionNames = actions.actions.map(a => a.actionName);
    expect(actionNames).toContain("GetProblemOfTheDay");
    expect(actionNames).toContain("GetFeaturedGames");
    expect(actionNames).toContain("SubmitGameIdea");
  });

  test("system-prompt.md exists and is non-empty", () => {
    expect(fs.existsSync(promptPath)).toBe(true);
    const content = fs.readFileSync(promptPath, "utf8");
    expect(content.length).toBeGreaterThan(0);
  });
});

// ─── Deployment Script ─────────────────────────────────────────────────────────

describe("Deployment Script", () => {
  test("deploy.js exists and references game-genie as default agent", () => {
    const deployScript = fs.readFileSync(path.join(__dirname, "../scripts/deploy.js"), "utf8");
    expect(deployScript).toContain("game-genie");
    expect(deployScript).not.toMatch(/customer-support/i);
    expect(deployScript).not.toMatch(/CustomerSupport/i);
  });
});