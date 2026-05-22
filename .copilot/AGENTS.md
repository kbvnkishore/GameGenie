# Game Agents Overview

This repository contains two primary **game agents** (AI systems that run on AWS Bedrock):

## 1. GameGenie Agent
- **Path**: `agents/game-genie/`
- **Role**: Generates games from kids' ideas and manages the game library
- **Model**: Anthropic Claude 3 Sonnet
- **Actions**: GenerateGame, AddGameToLibrary, GetGameLibrary, GetGameById
- **Config**: `agent-config.json`, `actions/action-group.json`, `prompts/system-prompt.md`

## 2. KidsGamePortal Agent
- **Path**: `agents/kids-game-portal/`
- **Role**: Portal-facing agent for featured games and idea submissions
- **Model**: Anthropic Claude 3 Sonnet
- **Actions**: GetProblemOfTheDay, GetFeaturedGames, SubmitGameIdea
- **Config**: `agent-config.json`, `actions/action-group.json`, `prompts/system-prompt.md`

## Adding New Agents
When adding a new game agent, follow this structure:
```
agents/new-agent/
├── agent-config.json
├── actions/
│   └── action-group.json
└── prompts/
    └── system-prompt.md
```

Then update `scripts/test-agent.js` to validate the new agent during CI/CD.
