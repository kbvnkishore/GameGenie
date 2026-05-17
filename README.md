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

## GitHub Setup

### 1. Create a New Repository
Go to [GitHub](https://github.com/new) and create a new repository.

### 2. Connect to Remote
```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Set Up GitHub Secrets
In your GitHub repository settings, add these secrets:
- `AWS_ACCESS_KEY_ID_DEV`
- `AWS_SECRET_ACCESS_KEY_DEV`
- `AWS_ACCESS_KEY_ID_PROD`
- `AWS_SECRET_ACCESS_KEY_PROD`
- `CONFIG_BUCKET_DEV`
- `CONFIG_BUCKET_PROD`

## Environment Configuration

### Development
```bash
cp .env.dev .env
# Edit .env with your values
```

### Production
```bash
cp .env.prod .env
# Edit .env with your values
```

## Deployment

### Manual Deployment
```bash
npm run deploy:dev      # Deploy to development
npm run deploy:staging  # Deploy to staging
npm run deploy:prod     # Deploy to production
```

### CI/CD
Changes to `main` branch automatically deploy to production.
Changes to `develop` branch automatically deploy to staging.

## License
MIT
