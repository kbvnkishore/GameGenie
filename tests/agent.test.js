const { BedrockAgentClient } = require('@aws-sdk/client-bedrock-agent');

// Mock AWS SDK for testing
jest.mock('@aws-sdk/client-bedrock-agent');

describe('Bedrock Agent Configuration', () => {
  test('agent configuration is valid JSON', () => {
    const config = require('../agents/customer-support/agent-config.json');
    expect(config).toHaveProperty('agentName');
    expect(config).toHaveProperty('foundationModel');
    expect(config).toHaveProperty('instruction');
  });

  test('action group configuration is valid', () => {
    const actions = require('../agents/customer-support/actions/action-group.json');
    expect(actions).toHaveProperty('actionGroupName');
    expect(actions).toHaveProperty('actions');
    expect(Array.isArray(actions.actions)).toBe(true);
  });

  test('prompt files exist', () => {
    const fs = require('fs');
    const path = require('path');
    
    const promptPath = path.join(__dirname, '../agents/customer-support/prompts/system-prompt.md');
    expect(fs.existsSync(promptPath)).toBe(true);
    
    const promptContent = fs.readFileSync(promptPath, 'utf8');
    expect(promptContent.length).toBeGreaterThan(0);
  });
});

describe('Deployment Script', () => {
  test('deploy script loads configuration', () => {
    // This would test the deploy.js script
    // For now, just verify the file exists
    const fs = require('fs');
    const deployScript = fs.readFileSync(__dirname + '/../scripts/deploy.js', 'utf8');
    expect(deployScript).toContain('deploy');
  });
});
