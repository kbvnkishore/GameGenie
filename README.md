# AWS Bedrock Agent Version Control

This project provides a structured approach to version controlling AWS Bedrock agents using Infrastructure as Code (IaC) and Git.

## Project Structure

```
├── infrastructure/          # Infrastructure as Code definitions
│   ├── cdk/                # AWS CDK implementation
│   ├── terraform/          # Terraform modules
│   └── cloudformation/     # CloudFormation templates
├── agents/                 # Agent configurations
│   ├── customer-support/   # Example agent
│   ├── data-analyst/       # Another example agent
│   └── shared/            # Shared resources
├── scripts/               # Deployment and utility scripts
├── tests/                 # Test configurations
├── docs/                  # Documentation
└── .github/              # GitHub workflows
```

## Getting Started

### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js (for CDK) or Terraform (depending on your IaC choice)
- Git

### Quick Start
1. Choose your IaC tool (CDK, Terraform, or CloudFormation)
2. Configure your agent in `agents/your-agent-name/`
3. Deploy using the provided scripts

## Features
- Version controlled agent configurations
- Environment separation (dev, staging, prod)
- Automated testing and deployment
- Prompt template management
- Knowledge base versioning

## License
MIT