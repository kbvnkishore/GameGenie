# AWS Bedrock Agent Version Control Documentation

## Overview
This project provides a structured approach to version controlling AWS Bedrock agents using Infrastructure as Code (IaC) principles.

## Directory Structure

### `agents/`
Contains configuration for individual Bedrock agents. Each agent has:
- `agent-config.json`: Main agent configuration
- `prompts/`: Prompt templates and instructions
- `actions/`: Action group definitions
- `knowledge-base/`: Knowledge base configurations

### `infrastructure/`
Infrastructure as Code definitions:
- `cloudformation/`: AWS CloudFormation templates
- `terraform/`: Terraform modules (future)
- `cdk/`: AWS CDK code (future)

### `scripts/`
Deployment and utility scripts:
- `deploy.js`: Main deployment script

### `tests/`
Test configurations and scripts

### `docs/`
Documentation (this directory)

## Workflow

### 1. Development
1. Create or modify agent configuration in `agents/<agent-name>/`
2. Test locally using mock AWS services
3. Commit changes to feature branch

### 2. Testing
1. Create pull request
2. Automated tests run via GitHub Actions
3. Manual review of configuration changes

### 3. Deployment
1. Merge to `develop` branch → auto-deploy to dev environment
2. Merge to `main` branch → auto-deploy to prod environment
3. Configuration exported to S3 for version history

## Configuration Management

### Environment Variables
- `.env.dev`: Development environment
- `.env.staging`: Staging environment  
- `.env.prod`: Production environment

### Agent Configuration
Each agent has a JSON configuration file with:
- Agent name and description
- Foundation model selection
- Instruction prompts
- Session timeout settings
- Environment-specific settings

## Deployment Methods

### CloudFormation (Current)
- Uses AWS CloudFormation templates
- Supports parameter overrides for different environments
- Provides rollback capabilities

### Terraform (Planned)
- State management
- Module reuse
- Plan/apply workflow

### CDK (Planned)
- TypeScript/JavaScript based
- Higher-level abstractions
- Integrated testing

## Version Control Strategy

### Git
- Configuration files stored in Git repository
- Branch strategy: feature → develop → main
- Pull request reviews for configuration changes

### S3 Backup
- Agent configurations automatically exported to S3
- Timestamped versions for rollback capability
- Configuration history tracking

## Best Practices

1. **Never store AWS credentials in version control**
2. **Use environment variables for sensitive data**
3. **Test configurations in dev before promoting**
4. **Maintain backward compatibility when possible**
5. **Document all configuration changes**
6. **Regularly review and update prompts**
7. **Monitor agent performance and usage**

## Troubleshooting

### Common Issues
1. **Permission errors**: Check IAM roles and policies
2. **Deployment failures**: Review CloudFormation events
3. **Agent not responding**: Check Bedrock service status
4. **Configuration errors**: Validate JSON syntax

### Debugging
- Enable debug logging: `LOG_LEVEL=debug`
- Check CloudWatch logs for Lambda functions
- Review Bedrock agent invocation logs
- Test with sample inputs before deployment

## Security Considerations

- Use least privilege IAM roles
- Encrypt sensitive data at rest
- Implement proper access controls
- Regular security audits
- Monitor for unusual activity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Submit a pull request
5. Address review comments
6. Merge after approval

## License
MIT License - see LICENSE file for details
