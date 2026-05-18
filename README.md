# GameGenie

> AI-powered gaming portal for kids - think it, create it, play it!

[![GitHub](https://img.shields.io/github/last-commit/kbvnkishore/GameGenie)](https://github.com/kbvnkishore/GameGenie)
[![Node](https://img.shields.io/badge/node-v24-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## What is GameGenie?

GameGenie is a kids gaming portal powered by two AWS Bedrock AI agents.
Kids visit the website, see a daily problem/challenge, browse pre-selected games,
and submit their own game ideas. The AI turns their idea into a playable game
and adds it to the library in real time.

---

## Architecture

```
Browser (localhost:3000)
  public/index.html + portal.js
         |
         | HTTP
         v
  Express Server  (server/index.js)
    GET  /api/portal/problem   problem of the day
    GET  /api/portal/games     game library
    POST /api/portal/idea      submit game idea
    GET  /api/health           health check
         |                          |
    USE_MOCK=true            USE_MOCK=false
         |                          |
   mockAgentService      bedrockAgentService
   (no AWS needed)            |          |
                       KidsGamePortal  GameGenie
                       Bedrock Agent   Bedrock Agent
                       (portal UX)     (game brain)
```

---

## Project Structure

```
GameGenie/
├── agents/
│   ├── game-genie/                   GameGenie AI brain
│   │   ├── agent-config.json         Agent definition and instructions
│   │   ├── actions/action-group.json GenerateGame, AddGameToLibrary, GetGameLibrary
│   │   └── prompts/system-prompt.md  Prompt templates
│   └── kids-game-portal/             KidsGamePortal frontend agent
│       ├── agent-config.json         Agent definition and instructions
│       ├── actions/action-group.json GetProblemOfTheDay, GetFeaturedGames, SubmitGameIdea
│       └── prompts/system-prompt.md  Kid-friendly prompt templates
├── server/
│   ├── index.js                      Express entry point, port 3000
│   ├── routes/portal.js              /api/portal/* route handlers
│   └── services/
│       ├── mockAgentService.js       Local mock, no AWS needed
│       └── bedrockAgentService.js    Real AWS Bedrock agent calls
├── public/
│   ├── index.html                    Kids portal UI
│   ├── css/portal.css                Space-themed dark design
│   └── js/portal.js                  Frontend logic
├── infrastructure/
│   └── cloudformation/
│       └── bedrock-agent.yaml        CloudFormation for both agents
├── scripts/
│   ├── test-agent.js                 Config validation (npm test)
│   ├── deploy.js                     CloudFormation deploy
│   └── agent-utils.js                update/prepare/alias/backup agents
├── tests/agent.test.js               Jest tests
├── docs/                             Documentation
├── .github/workflows/deploy.yml      CI/CD pipeline
├── .env.local                        Local dev - USE_MOCK_AGENTS=true
├── .env.dev                          Dev AWS environment
└── .env.prod                         Prod AWS environment
```

---

## Quick Start - Run Locally

### Prerequisites
- Node.js 18+ (tested on v24)
- npm

### Steps

```bash
git clone https://github.com/kbvnkishore/GameGenie.git
cd GameGenie
npm install
npm start
```

Open **http://localhost:3000**

No AWS account needed. Runs in mock mode by default (`USE_MOCK_AGENTS=true` in `.env.local`).

```bash
npm run dev   # auto-restart on file changes
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check and current mode |
| GET | `/api/portal/problem` | Problem of the day |
| GET | `/api/portal/games?limit=6` | Featured game library |
| GET | `/api/portal/games?all=true` | All games including kid-created |
| POST | `/api/portal/idea` | Submit idea, returns game link |

### POST `/api/portal/idea`

Request:
```json
{ "ideaText": "A game where a cat collects fish", "sessionId": "session-abc123" }
```

Response:
```json
{
  "success": true,
  "gameId": "uuid",
  "title": "Turbo Quest",
  "url": "https://...",
  "emoji": "game",
  "message": "Wow! Your idea has been turned into a game!"
}
```

---

## Environment Variables

| File | Purpose |
|------|---------|
| `.env.local` | Local dev, mock agents, no AWS |
| `.env.dev` | Dev AWS environment |
| `.env.staging` | Staging AWS environment |
| `.env.prod` | Production AWS environment |

```bash
NODE_ENV=local
PORT=3000
USE_MOCK_AGENTS=true          # true = local mock, false = real AWS Bedrock

AWS_REGION=us-east-1
GAME_GENIE_AGENT_ID=          # from AWS Bedrock console
GAME_GENIE_AGENT_ALIAS_ID=    # from CloudFormation output
KIDS_PORTAL_AGENT_ID=         # from AWS Bedrock console
KIDS_PORTAL_AGENT_ALIAS_ID=   # from CloudFormation output
AGENT_ROLE_ARN=               # from CloudFormation output
CONFIG_BUCKET=                # S3 bucket for config backups
```

> **Security**: Never commit credentials or agent IDs to Git.
> Always inject them as runtime environment variables.

---

## AWS Bedrock Agents

### Agent 1 - GameGenie (AI brain)
- **Purpose**: Processes game ideas, generates playable games, manages the library
- **Config**: `agents/game-genie/agent-config.json`
- **Actions**: `GenerateGame`, `AddGameToLibrary`, `GetGameLibrary`, `GetGameById`
- **Model**: Claude 3 Sonnet

### Agent 2 - KidsGamePortal (website face)
- **Purpose**: Kid interaction, daily problems, game list, safe chat
- **Config**: `agents/kids-game-portal/agent-config.json`
- **Actions**: `GetProblemOfTheDay`, `GetFeaturedGames`, `SubmitGameIdea`, `GetCreatedGameLink`
- **Model**: Claude 3 Sonnet

---

## Deploy to AWS

```bash
# 1. Validate configs
npm test

# 2. Deploy CloudFormation stack
npm run deploy:dev

# 3. Get Agent IDs from AWS console
aws cloudformation describe-stacks --stack-name gamegenie-agent-dev --query "Stacks[0].Outputs"

# 4. Test against real AWS (inject IDs at runtime - never in files)
$env:USE_MOCK_AGENTS="false"
$env:GAME_GENIE_AGENT_ID="YOUR_ID"
$env:GAME_GENIE_AGENT_ALIAS_ID="YOUR_ALIAS"
$env:AWS_ACCESS_KEY_ID="YOUR_KEY"
$env:AWS_SECRET_ACCESS_KEY="YOUR_SECRET"
NODE_ENV=dev node server/index.js

# 5. Update agent after config changes
node scripts/agent-utils.js update AGENT_ID game-genie
```

---

## Version Control Workflow

```bash
npm test && npm start                              # test locally
git add . && git commit -m "describe change"
git push origin main                               # triggers CI/CD
node scripts/agent-utils.js update AGENT_ID game-genie  # sync AWS agent
```

---

## Scripts

```bash
npm test                                    # validate all agent configs
npm start                                   # start server (mock mode)
npm run dev                                 # start with nodemon
npm run deploy:dev                          # deploy to dev
npm run deploy:prod                         # deploy to prod

node scripts/agent-utils.js update  ID name  # update AWS agent from local config
node scripts/agent-utils.js prepare ID        # prepare agent after changes
node scripts/agent-utils.js alias   ID name   # create version alias
node scripts/agent-utils.js versions ID       # list versions
node scripts/agent-utils.js backup  name      # backup config to S3
```

---

## CI/CD

`.github/workflows/deploy.yml` runs on every push:
- `npm test` on all PRs
- Auto-deploy to dev on push to `develop` branch
- Auto-deploy to prod on push to `main` branch

**GitHub Secrets required:**
`AWS_ACCESS_KEY_ID_DEV`, `AWS_SECRET_ACCESS_KEY_DEV`,
`AWS_ACCESS_KEY_ID_PROD`, `AWS_SECRET_ACCESS_KEY_PROD`

---

## License

MIT