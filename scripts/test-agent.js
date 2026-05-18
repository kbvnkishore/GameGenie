const fs = require("fs");
const path = require("path");

const AGENTS = [
  {
    name: "game-genie",
    dir:  "agents/game-genie",
    expectedActionGroup: "GameGenieActions",
    expectedActions: ["GenerateGame", "AddGameToLibrary", "GetGameLibrary"]
  },
  {
    name: "kids-game-portal",
    dir:  "agents/kids-game-portal",
    expectedActionGroup: "KidsGamePortalActions",
    expectedActions: ["GetProblemOfTheDay", "GetFeaturedGames", "SubmitGameIdea"]
  }
];

let allPassed = true;

function check(label, passed, detail) {
  const icon = passed ? "PASS" : "FAIL";
  console.log(`  [${icon}] ${label}${detail ? " - " + detail : ""}`);
  if (!passed) allPassed = false;
  return passed;
}

function testAgent(agent) {
  console.log(`\nTesting: ${agent.name}`);
  console.log("-".repeat(40));

  const configPath  = path.join(agent.dir, "agent-config.json");
  const actionsPath = path.join(agent.dir, "actions/action-group.json");
  const promptPath  = path.join(agent.dir, "prompts/system-prompt.md");

  // agent-config.json
  if (!fs.existsSync(configPath)) {
    check("agent-config.json exists", false, configPath);
    return;
  }
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (e) {
    check("agent-config.json is valid JSON", false, e.message);
    return;
  }
  check("agent-config.json is valid JSON", true);
  check("agentName is set",        !!config.agentName,        config.agentName);
  check("foundationModel is set",  !!config.foundationModel,  config.foundationModel);
  check("instruction is set",      !!config.instruction);
  check("no CustomerSupport refs", !JSON.stringify(config).match(/CustomerSupport/i));

  // action-group.json
  if (!fs.existsSync(actionsPath)) {
    check("action-group.json exists", false, actionsPath);
  } else {
    let actions;
    try {
      actions = JSON.parse(fs.readFileSync(actionsPath, "utf8"));
    } catch (e) {
      check("action-group.json is valid JSON", false, e.message);
      return;
    }
    check("action-group.json is valid JSON", true);
    check("actionGroupName is correct", actions.actionGroupName === agent.expectedActionGroup, actions.actionGroupName);
    check("no CustomerSupport refs", !JSON.stringify(actions).match(/CustomerSupport/i));
    const actionNames = (actions.actions || []).map(a => a.actionName);
    agent.expectedActions.forEach(expected => {
      check(`action "${expected}" exists`, actionNames.includes(expected));
    });
  }

  // system-prompt.md
  if (!fs.existsSync(promptPath)) {
    check("system-prompt.md exists", false, promptPath);
  } else {
    const content = fs.readFileSync(promptPath, "utf8");
    check("system-prompt.md is non-empty", content.length > 0);
    check("no CustomerSupport refs in prompt", !content.match(/CustomerSupport/i));
  }
}

// CloudFormation template check
function testCloudFormation() {
  console.log("\nTesting: CloudFormation Template");
  console.log("-".repeat(40));
  const templatePath = "infrastructure/cloudformation/bedrock-agent.yaml";
  if (!fs.existsSync(templatePath)) {
    check("bedrock-agent.yaml exists", false);
    return;
  }
  const template = fs.readFileSync(templatePath, "utf8");
  check("template exists",                  true);
  check("contains GameGenieAgent resource", template.includes("GameGenieAgent"));
  check("contains AgentResourceRoleArn",    template.includes("AgentResourceRoleArn"));
  check("contains AutoPrepare",             template.includes("AutoPrepare"));
  check("contains AgentAlias resource",     template.includes("AgentAlias"));
  check("contains ConfigBucket parameter",  template.includes("ConfigBucket"));
  check("no CustomerSupport refs",          !template.match(/CustomerSupport/i));
}

// deploy.js check
function testDeployScript() {
  console.log("\nTesting: deploy.js");
  console.log("-".repeat(40));
  const scriptPath = "scripts/deploy.js";
  if (!fs.existsSync(scriptPath)) {
    check("deploy.js exists", false);
    return;
  }
  const script = fs.readFileSync(scriptPath, "utf8");
  check("deploy.js exists",                    true);
  check("default agent is game-genie",         script.includes("game-genie"));
  check("no customer-support default",         !script.match(/customer-support/i));
  check("no CustomerSupportAgent refs",        !script.match(/CustomerSupportAgent/i));
  check("CAPABILITY_NAMED_IAM present",        script.includes("CAPABILITY_NAMED_IAM"));
}

// Run all
console.log("=".repeat(50));
console.log("GameGenie - Full Agent Test Suite");
console.log("=".repeat(50));

AGENTS.forEach(testAgent);
testCloudFormation();
testDeployScript();

console.log("\n" + "=".repeat(50));
if (allPassed) {
  console.log("All tests passed! Ready to deploy.");
  console.log("\nTo update your AWS Bedrock agent:");
  console.log("  node scripts/agent-utils.js update <AGENT_ID> game-genie");
  console.log("  node scripts/agent-utils.js update <AGENT_ID> kids-game-portal");
  process.exit(0);
} else {
  console.log("Some tests FAILED. Fix the issues above before deploying.");
  process.exit(1);
}