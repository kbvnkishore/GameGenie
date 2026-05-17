const fs = require("fs");
const path = require("path");

console.log("Testing GameGenie Agent Configuration...\n");

// Test 1: Check agent configuration file exists
function testAgentConfig() {
  const configPath = path.join(__dirname, "..", "agents", "game-genie", "agent-config.json");
  
  if (!fs.existsSync(configPath)) {
    console.error("Agent configuration file not found:", configPath);
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    
    const requiredFields = ["agentName", "description", "foundationModel", "instruction"];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields.join(", "));
      return false;
    }
    
    console.log("Agent configuration file is valid");
    console.log("   Agent Name:", config.agentName);
    console.log("   Foundation Model:", config.foundationModel);
    console.log("   Description:", config.description.substring(0, 50) + "...");
    
    return true;
  } catch (error) {
    console.error("Error reading agent configuration:", error.message);
    return false;
  }
}

// Test 2: Check prompt files exist
function testPrompts() {
  const promptsDir = path.join(__dirname, "..", "agents", "game-genie", "prompts");
  
  if (!fs.existsSync(promptsDir)) {
    console.error("Prompts directory not found:", promptsDir);
    return false;
  }
  
  const promptFiles = fs.readdirSync(promptsDir).filter(f => f.endsWith(".md"));
  
  if (promptFiles.length === 0) {
    console.error("No prompt files found in:", promptsDir);
    return false;
  }
  
  console.log("Prompt files found:", promptFiles.join(", "));
  return true;
}

// Test 3: Check action files exist
function testActions() {
  const actionsDir = path.join(__dirname, "..", "agents", "game-genie", "actions");
  
  if (!fs.existsSync(actionsDir)) {
    console.error("Actions directory not found:", actionsDir);
    return false;
  }
  
  const actionFiles = fs.readdirSync(actionsDir).filter(f => f.endsWith(".json"));
  
  if (actionFiles.length === 0) {
    console.warn("No action files found in:", actionsDir);
  } else {
    console.log("Action files found:", actionFiles.join(", "));
  }
  
  return true;
}

// Test 4: Validate CloudFormation template
function testCloudFormation() {
  const templatePath = path.join(__dirname, "..", "infrastructure", "cloudformation", "bedrock-agent.yaml");
  
  if (!fs.existsSync(templatePath)) {
    console.error("CloudFormation template not found:", templatePath);
    return false;
  }
  
  const template = fs.readFileSync(templatePath, "utf8");
  
  if (template.includes("GameGenie") || template.includes("GameGenieAgent")) {
    console.log("CloudFormation template contains GameGenie references");
    return true;
  }
  
  console.warn("CloudFormation template may not be configured for GameGenie");
  return true;
}

// Run all tests
function runTests() {
  console.log("Running GameGenie Agent Tests...\n");
  
  const results = {
    config: testAgentConfig(),
    prompts: testPrompts(),
    actions: testActions(),
    cloudformation: testCloudFormation()
  };
  
  console.log("\n" + "=".repeat(50));
  console.log("Test Results Summary:");
  console.log("=".repeat(50));
  
  const allPassed = Object.values(results).every(r => r === true);
  
  Object.entries(results).forEach(([name, passed]) => {
    const status = passed ? "PASS" : "FAIL";
    console.log("   " + name + ": " + status);
  });
  
  console.log("=".repeat(50));
  
  if (allPassed) {
    console.log("\nAll tests passed! Ready to deploy.");
    console.log("\nNext steps:");
    console.log("  1. Review agent configuration in agents/game-genie/agent-config.json");
    console.log("  2. Update prompts in agents/game-genie/prompts/");
    console.log("  3. Deploy: npm run deploy:dev");
    process.exit(0);
  } else {
    console.log("\nSome tests failed. Please fix the issues above.");
    process.exit(1);
  }
}

runTests();
