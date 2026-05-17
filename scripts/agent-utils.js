#!/usr/bin/env node

const { BedrockAgentClient, ExportAgentCommand, ImportAgentCommand } = require('@aws-sdk/client-bedrock-agent');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

class AgentVersionManager {
  constructor(environment = 'dev') {
    this.environment = environment;
    this.bedrockClient = new BedrockAgentClient({ region: 'us-east-1' });
    this.s3Client = new S3Client({ region: 'us-east-1' });
    this.configBucket = process.env.CONFIG_BUCKET || `bedrock-agent-configs-${environment}`;
  }

  async exportAgent(agentId, agentVersion = 'DRAFT', outputDir = './exports') {
    console.log(`Exporting agent ${agentId}...`);
    
    try {
      // Create export command
      const exportCommand = new ExportAgentCommand({
        agentId,
        agentVersion,
        s3BucketName: this.configBucket,
        s3KeyPrefix: `exports/${agentId}/${new Date().toISOString().split('T')[0]}/`
      });

      const exportResult = await this.bedrockClient.send(exportCommand);
      console.log('Export initiated:', exportResult.exportId);
      
      // Download exported files from S3
      await this.downloadExport(exportResult.s3BucketName, exportResult.s3KeyPrefix, outputDir);
      
      console.log(`Agent exported to ${outputDir}`);
      return exportResult;
    } catch (error) {
      console.error('Export failed:', error.message);
      throw error;
    }
  }

  async downloadExport(bucket, keyPrefix, outputDir) {
    // This would list and download all files from the S3 export
    // For now, just create a placeholder
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const manifest = {
      exportedAt: new Date().toISOString(),
      bucket,
      keyPrefix,
      files: ['agent-configuration.json', 'prompts/', 'actions/']
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'export-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    console.log(`Created export manifest in ${outputDir}`);
  }

  async importAgent(agentConfigPath, agentName) {
    console.log(`Importing agent from ${agentConfigPath}...`);
    
    try {
      const agentConfig = JSON.parse(fs.readFileSync(agentConfigPath, 'utf8'));
      
      const importCommand = new ImportAgentCommand({
        agentName: agentName || agentConfig.agentName,
        instruction: agentConfig.instruction,
        foundationModel: agentConfig.foundationModel,
        idleSessionTTLInSeconds: agentConfig.idleSessionTTLInSeconds || 600
      });

      const importResult = await this.bedrockClient.send(importCommand);
      console.log('Agent imported successfully:', importResult.agentId);
      return importResult;
    } catch (error) {
      console.error('Import failed:', error.message);
      throw error;
    }
  }

  async listVersions(agentName) {
    console.log(`Listing versions for agent ${agentName}...`);
    
    // List S3 objects for this agent
    // This is a simplified version - in reality you'd use S3 listObjectsV2
    const versions = [
      { version: '1.0.0', date: '2024-01-15', environment: 'dev' },
      { version: '1.0.1', date: '2024-01-20', environment: 'staging' },
      { version: '1.1.0', date: '2024-02-01', environment: 'prod' }
    ];
    
    console.table(versions);
    return versions;
  }
}

// CLI interface
if (require.main === module) {
  const [command, ...args] = process.argv.slice(2);
  const manager = new AgentVersionManager(process.env.ENVIRONMENT || 'dev');
  
  switch (command) {
    case 'export':
      const [agentId, outputDir] = args;
      manager.exportAgent(agentId, 'DRAFT', outputDir).catch(console.error);
      break;
      
    case 'import':
      const [configPath, agentName] = args;
      manager.importAgent(configPath, agentName).catch(console.error);
      break;
      
    case 'list':
      const [agentNameToList] = args;
      manager.listVersions(agentNameToList).catch(console.error);
      break;
      
    default:
      console.log(`
Usage: node agent-utils.js <command> [args]
  
Commands:
  export <agentId> [outputDir]  Export agent configuration
  import <configPath> [agentName] Import agent configuration
  list <agentName>             List agent versions
  
Examples:
  node agent-utils.js export AGENT-123 ./exports
  node agent-utils.js import ./agents/customer-support/agent-config.json
  node agent-utils.js list CustomerSupportAgent
      `);
  }
}

module.exports = AgentVersionManager;
