const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Parse command line arguments
const environment = process.argv[2] || "dev";
const agentName = process.argv[3] || "game-genie";  

console.log(`Deploying agent: ${agentName} to environment: ${environment}`);

// Load agent configuration
const agentConfigPath = path.join(__dirname, "..", "agents", agentName, "agent-config.json");
if (!fs.existsSync(agentConfigPath)) {
  console.error(`Agent configuration not found: ${agentConfigPath}`);
  process.exit(1);
}

const agentConfig = JSON.parse(fs.readFileSync(agentConfigPath, "utf8"));
agentConfig.environment = environment;

const infraMethod = process.env.INFRA_METHOD || "cloudformation";

async function deploy() {
  try {
    switch (infraMethod) {
      case "cloudformation":
        await deployWithCloudFormation(agentConfig, environment, agentName);
        break;
      case "terraform":
        console.log("Terraform deployment not yet implemented");
        break;
      case "cdk":
        console.log("CDK deployment not yet implemented");
        break;
      default:
        console.error(`Unknown infrastructure method: ${infraMethod}`);
        process.exit(1);
    }
    console.log("Deployment completed successfully!");
  } catch (error) {
    console.error("Deployment failed:", error.message);
    process.exit(1);
  }
}

async function deployWithCloudFormation(config, env, name) {
  console.log("Deploying with CloudFormation...");

  const stackName = `gamegenie-agent-${env}`;
  const templatePath = path.join(__dirname, "..", "infrastructure", "cloudformation", "bedrock-agent.yaml");

  if (!fs.existsSync(templatePath)) {
    throw new Error(`CloudFormation template not found: ${templatePath}`);
  }

  // Build parameter overrides
  const params = [
    `Environment=${env}`,
    `AgentName=${config.agentName}`,
    `FoundationModel=${config.foundationModel}`,
  ];

  if (process.env.CONFIG_BUCKET) {
    params.push(`ConfigBucket=${process.env.CONFIG_BUCKET}`);
  }

  const paramString = params.join(" ");

  const command = [
    "aws cloudformation deploy",
    `--stack-name ${stackName}`,
    `--template-file "${templatePath}"`,
    `--parameter-overrides ${paramString}`,
    "--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM",
    "--no-fail-on-empty-changeset"
  ].join(" ");

  console.log(`Executing: ${command}`);
  execSync(command, { stdio: "inherit" });

  // Retrieve and display stack outputs
  try {
    const describeCmd = `aws cloudformation describe-stacks --stack-name ${stackName} --query "Stacks[0].Outputs"`;
    const outputs = JSON.parse(execSync(describeCmd).toString());
    console.log("\nStack Outputs:");
    outputs.forEach(o => console.log(`  ${o.OutputKey}: ${o.OutputValue}`));
  } catch (e) {
    console.warn("Could not retrieve stack outputs:", e.message);
  }
}

// Export agent configuration to S3 for version history
async function exportConfiguration(config, env, name) {
  if (!process.env.CONFIG_BUCKET) {
    console.log("CONFIG_BUCKET not set, skipping S3 export");
    return;
  }

  console.log("Exporting configuration for version control...");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const exportKey = `agents/${name}/config-${env}-${timestamp}.json`;
  const exportCommand = `aws s3 cp "${agentConfigPath}" s3://${process.env.CONFIG_BUCKET}/${exportKey}`;

  console.log(`Exporting config to S3: ${exportKey}`);
  execSync(exportCommand, { stdio: "inherit" });
}

// Main
deploy()
  .then(() => exportConfiguration(agentConfig, environment, agentName))
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });
