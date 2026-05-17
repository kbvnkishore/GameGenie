#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Parse command line arguments
const environment = process.argv[2] || 'dev';
const agentName = process.argv[3] || 'customer-support';

console.log(`Deploying agent: ${agentName} to environment: ${environment}`);

// Load agent configuration
const agentConfigPath = path.join(__dirname, '..', 'agents', agentName, 'agent-config.json');
if (!fs.existsSync(agentConfigPath)) {
  console.error(`Agent configuration not found: ${agentConfigPath}`);
  process.exit(1);
}

const agentConfig = JSON.parse(fs.readFileSync(agentConfigPath, 'utf8'));

// Update environment in config
agentConfig.environment = environment;

// Choose deployment method based on infrastructure
const infraMethod = process.env.INFRA_METHOD || 'cloudformation';

async function deploy() {
  try {
    switch (infraMethod) {
      case 'cloudformation':
        await deployWithCloudFormation(agentConfig, environment, agentName);
        break;
      case 'terraform':
        await deployWithTerraform(agentConfig, environment, agentName);
        break;
      case 'cdk':
        await deployWithCDK(agentConfig, environment, agentName);
        break;
      default:
        console.error(`Unknown infrastructure method: ${infraMethod}`);
        process.exit(1);
    }
    
    console.log('Deployment completed successfully!');
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

async function deployWithCloudFormation(config, env, name) {
  console.log('Deploying with CloudFormation...');
  
  const stackName = `${name}-agent-${env}`;
  const templatePath = path.join(__dirname, '..', 'infrastructure', 'cloudformation', 'bedrock-agent.yaml');
  
  // Update template with agent-specific values
  let template = fs.readFileSync(templatePath, 'utf8');
  template = template.replace(/CustomerSupportAgent/g, config.agentName);
  
  // Write updated template
  const tempTemplatePath = path.join(__dirname, 'temp-template.yaml');
  fs.writeFileSync(tempTemplatePath, template);
  
  // Deploy CloudFormation stack
  const command = `aws cloudformation deploy \
    --stack-name ${stackName} \
    --template-file ${tempTemplatePath} \
    --parameter-overrides \
        Environment=${env} \
        AgentName=${config.agentName} \
        FoundationModel=${config.foundationModel} \
    --capabilities CAPABILITY_IAM`;
  
  console.log(`Executing: ${command}`);
  execSync(command, { stdio: 'inherit' });
  
  // Clean up
  fs.unlinkSync(tempTemplatePath);
}

async function deployWithTerraform(config, env, name) {
  console.log('Terraform deployment not yet implemented');
  // TODO: Implement Terraform deployment
}

async function deployWithCDK(config, env, name) {
  console.log('CDK deployment not yet implemented');
  // TODO: Implement CDK deployment
}

// Export agent configuration to S3 for versioning
async function exportConfiguration(config, env, name) {
  console.log('Exporting configuration for version control...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportKey = `agents/${name}/config-${timestamp}.json`;
  
  const exportCommand = `aws s3 cp ${agentConfigPath} s3://${process.env.CONFIG_BUCKET}/${exportKey}`;
  
  if (process.env.CONFIG_BUCKET) {
    console.log(`Exporting config to S3: ${exportCommand}`);
    execSync(exportCommand, { stdio: 'inherit' });
  } else {
    console.log('CONFIG_BUCKET not set, skipping S3 export');
  }
}

// Main execution
deploy().then(() => {
  return exportConfiguration(agentConfig, environment, agentName);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
