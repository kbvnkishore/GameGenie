# GameGenie

AI-powered gaming platform for kids that brings their game ideas to life instantly.

## Overview

GameGenie is an interactive AI platform where kids can:
- **Solve Problems**: Engage with fun challenges and puzzles
- **Play Games**: Access a library of pre-selected games
- **Create Games**: Turn their creative ideas into playable games with AI assistance
- **Share & Discover**: Add their creations to the game library

## How It Works

1. **Problem Mode**: Kids encounter a challenge or puzzle
2. **Game Selection**: Choose from pre-selected games to play
3. **Idea Generation**: Write cool game ideas in the problem
4. **AI Creation**: GameGenie processes the idea and creates the game
5. **Instant Play**: Get a link to play the newly created game
6. **Library Update**: New game gets added to the game library

## Project Structure

```
├── agents/                 # AI agent configurations
│   └── game-genie/        # Main GameGenie agent
├── infrastructure/        # Infrastructure as Code
├── scripts/               # Deployment and utility scripts
├── tests/                 # Test configurations
└── docs/                  # Documentation
```

## Getting Started

### Prerequisites
- AWS CLI configured with Bedrock permissions
- Node.js 18+
- Git

### Quick Start

1. Clone the repository
2. Configure your AWS credentials
3. Deploy the agent:
   ```bash
   npm install
   npm run deploy:dev
   ```

## Features

- **AI-Powered Game Creation**: Turn text ideas into playable games
- **Kid-Friendly Interface**: Safe, intuitive design
- **Instant Feedback**: Real-time game generation
- **Growing Library**: Games created by kids get added to the library
- **Problem-Based Learning**: Educational challenges with gaming rewards

## Tech Stack

- **Backend**: AWS Bedrock (Claude models)
- **Infrastructure**: CloudFormation
- **Deployment**: Node.js scripts
- **Version Control**: Git + GitHub Actions

## License

MIT License
