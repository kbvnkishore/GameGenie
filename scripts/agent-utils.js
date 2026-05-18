const { BedrockAgentClient, UpdateAgentCommand, PrepareAgentCommand, CreateAgentAliasCommand, ListAgentVersionsCommand } = require("@aws-sdk/client-bedrock-agent");
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

const AGENTS = {
  "game-genie":       "agents/game-genie/agent-config.json",
  "kids-game-portal": "agents/kids-game-portal/agent-config.json"
};

class AgentVersionManager {
  constructor(environment = "dev") {
    this.environment = environment;
    this.region = process.env.AWS_REGION || "us-east-1";
    this.bedrockClient = new BedrockAgentClient({ region: this.region });
    this.s3Client = new S3Client({ region: this.region });
    this.configBucket = process.env.CONFIG_BUCKET || `gamegenie-configs-${environment}`;
  }

  // ── Update an existing AWS Bedrock agent from local config ──────────────────
  async updateAgent(agentId, agentName) {
    const configPath = AGENTS[agentName];
    if (!configPath || !fs.existsSync(configPath)) {
      throw new Error(`Config not found for agent: ${agentName}. Valid agents: ${Object.keys(AGENTS).join(", ")}`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    console.log(`Updating AWS Bedrock agent ${agentId} (${config.agentName})...`);

    const updateCommand = new UpdateAgentCommand({
      agentId,
      agentName: config.agentName,
      foundationModel: config.foundationModel,
      instruction: config.instruction,
      idleSessionTTLInSeconds: config.idleSessionTTLInSeconds || 900,
      agentResourceRoleArn: process.env.AGENT_ROLE_ARN
    });

    const result = await this.bedrockClient.send(updateCommand);
    console.log("Agent updated. Status:", result.agent.agentStatus);

    // Prepare the agent so changes take effect
    await this.prepareAgent(agentId);
    return result;
  }

  // ── Prepare (compile) the agent after updates ───────────────────────────────
  async prepareAgent(agentId) {
    console.log(`Preparing agent ${agentId}...`);
    const prepareCommand = new PrepareAgentCommand({ agentId });
    const result = await this.bedrockClient.send(prepareCommand);
    console.log("Agent prepared. Status:", result.agentStatus);
    return result;
  }

  // ── Create a new alias (version snapshot) ───────────────────────────────────
  async createAlias(agentId, aliasName, description) {
    console.log(`Creating alias "${aliasName}" for agent ${agentId}...`);
    const command = new CreateAgentAliasCommand({
      agentId,
      agentAliasName: aliasName,
      description: description || `${aliasName} - ${new Date().toISOString()}`
    });
    const result = await this.bedrockClient.send(command);
    console.log("Alias created:", result.agentAlias.agentAliasId);
    return result;
  }

  // ── List all versions of an agent ───────────────────────────────────────────
  async listVersions(agentId) {
    console.log(`Listing versions for agent ${agentId}...`);
    const command = new ListAgentVersionsCommand({ agentId });
    const result = await this.bedrockClient.send(command);
    console.table(result.agentVersionSummaries.map(v => ({
      version: v.agentVersion,
      status:  v.agentStatus,
      created: v.creationDateTime
    })));
    return result.agentVersionSummaries;
  }

  // ── Save local config snapshot to S3 for version history ────────────────────
  async backupConfigToS3(agentName) {
    const configPath = AGENTS[agentName];
    if (!configPath || !fs.existsSync(configPath)) {
      throw new Error(`Config not found for agent: ${agentName}`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const s3Key = `agents/${agentName}/config-${this.environment}-${timestamp}.json`;
    const content = fs.readFileSync(configPath);

    const command = new PutObjectCommand({
      Bucket: this.configBucket,
      Key: s3Key,
      Body: content,
      ContentType: "application/json",
      Metadata: { environment: this.environment, agentName, timestamp }
    });

    await this.s3Client.send(command);
    console.log(`Config backed up to s3://${this.configBucket}/${s3Key}`);
    return s3Key;
  }

  // ── List S3 config backups for an agent ─────────────────────────────────────
  async listBackups(agentName) {
    const command = new ListObjectsV2Command({
      Bucket: this.configBucket,
      Prefix: `agents/${agentName}/`
    });
    const result = await this.s3Client.send(command);
    const backups = (result.Contents || []).map(o => ({
      key:          o.Key,
      lastModified: o.LastModified,
      size:         o.Size
    }));
    console.table(backups);
    return backups;
  }
}

// ── CLI ────────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const [command, ...args] = process.argv.slice(2);
  const manager = new AgentVersionManager(process.env.ENVIRONMENT || "dev");

  const usage = `
Usage: node agent-utils.js <command> [args]

Commands:
  update  <agentId> <agentName>   Update AWS agent from local config and prepare it
  prepare <agentId>               Prepare (compile) an agent after manual changes
  alias   <agentId> <aliasName>   Create a new alias/version snapshot
  versions <agentId>              List all versions of an agent
  backup  <agentName>             Backup local config to S3
  backups <agentName>             List S3 config backups

Agent names: ${Object.keys(AGENTS).join(", ")}

Examples:
  node scripts/agent-utils.js update  ABCDEF1234 game-genie
  node scripts/agent-utils.js update  ABCDEF5678 kids-game-portal
  node scripts/agent-utils.js prepare ABCDEF1234
  node scripts/agent-utils.js alias   ABCDEF1234 v1.1-release
  node scripts/agent-utils.js versions ABCDEF1234
  node scripts/agent-utils.js backup  game-genie
  node scripts/agent-utils.js backups game-genie
`;

  switch (command) {
    case "update":
      manager.updateAgent(args[0], args[1]).catch(console.error);
      break;
    case "prepare":
      manager.prepareAgent(args[0]).catch(console.error);
      break;
    case "alias":
      manager.createAlias(args[0], args[1], args[2]).catch(console.error);
      break;
    case "versions":
      manager.listVersions(args[0]).catch(console.error);
      break;
    case "backup":
      manager.backupConfigToS3(args[0]).catch(console.error);
      break;
    case "backups":
      manager.listBackups(args[0]).catch(console.error);
      break;
    default:
      console.log(usage);
  }
}

module.exports = AgentVersionManager;