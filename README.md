# GameGenie
> AI-powered gaming portal for kids - think it, create it, play it!

## Quick Start
`ash
git clone https://github.com/kbvnkishore/GameGenie.git
cd GameGenie
npm install
npm start   # http://localhost:3000  (no AWS needed)
`

## How It Works
1. Kid opens http://localhost:3000
2. Sees Problem of the Day and pre-selected game library
3. Types a game idea in the idea box
4. GameGenie AI generates the game and returns a play link
5. New game is added to the library

## Architecture
`
Browser -> Express (server/) -> mockAgentService   (local, USE_MOCK=true)
                             -> bedrockAgentService (AWS,   USE_MOCK=false)
                                   |-- KidsGamePortal Bedrock Agent (portal UX)
                                   +-- GameGenie Bedrock Agent     (game brain)
`

## Project Structure
`
agents/
  game-genie/            AI brain - generates games from ideas
    agent-config.json
    actions/action-group.json   GenerateGame, AddGameToLibrary, GetGameLibrary
    prompts/system-prompt.md
  kids-game-portal/      Website face - kid interaction
    agent-config.json
    actions/action-group.json   GetProblemOfTheDay, GetFeaturedGames, SubmitGameIdea
    prompts/system-prompt.md
server/
  index.js               Express entry point, port 3000
  routes/portal.js       API routes
  services/
    mockAgentService.js      local dev, no AWS
    bedrockAgentService.js   real AWS Bedrock
public/
  index.html             Kids portal UI
  css/portal.css         Space-themed dark design
  js/portal.js           Frontend logic
infrastructure/cloudformation/bedrock-agent.yaml
scripts/
  test-agent.js          npm test
  deploy.js              CloudFormation deploy
  agent-utils.js         update/prepare/alias/backup AWS agents
.env.local               USE_MOCK_AGENTS=true (default)
.env.dev                 dev AWS config
.env.prod                prod AWS config
`

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check + current mode |
| GET | /api/portal/problem | Problem of the day |
| GET | /api/portal/games | Game library |
| POST | /api/portal/idea | Submit idea, returns game link |

## Environment Variables
`ash
USE_MOCK_AGENTS=true          # true=local mock, false=real AWS Bedrock
AWS_REGION=us-east-1
GAME_GENIE_AGENT_ID=          # from AWS Bedrock console
GAME_GENIE_AGENT_ALIAS_ID=    # from CloudFormation output
KIDS_PORTAL_AGENT_ID=         # from AWS Bedrock console
KIDS_PORTAL_AGENT_ALIAS_ID=   # from CloudFormation output
`

## Deploy to AWS
`ash
npm test                                              # validate configs
npm run deploy:dev                                    # deploy CloudFormation
# copy Agent IDs from AWS console into .env.dev
node scripts/agent-utils.js update AGENT_ID game-genie
node scripts/agent-utils.js update AGENT_ID kids-game-portal
NODE_ENV=dev npm start                                # test against real AWS
`

## Version Control Workflow
`ash
npm test && npm start                                 # test locally
git add . && git commit -m "message"
git push origin main                                  # triggers CI/CD
node scripts/agent-utils.js update AGENT_ID game-genie  # sync AWS agent
`

## Scripts
`ash
npm test                                    # validate all agent configs
npm start                                   # start server (mock mode)
npm run dev                                 # start with nodemon
npm run deploy:dev / deploy:prod            # CloudFormation deploy
node scripts/agent-utils.js update  ID name # update AWS agent
node scripts/agent-utils.js prepare ID      # prepare agent
node scripts/agent-utils.js alias   ID name # create version alias
node scripts/agent-utils.js versions ID     # list versions
node scripts/agent-utils.js backup  name    # backup config to S3
`

## CI/CD
Push to main triggers GitHub Actions: npm test then deploy.
Required secrets: AWS_ACCESS_KEY_ID_DEV, AWS_SECRET_ACCESS_KEY_DEV,
AWS_ACCESS_KEY_ID_PROD, AWS_SECRET_ACCESS_KEY_PROD

## License
MIT