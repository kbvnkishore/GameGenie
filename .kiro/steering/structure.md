# Project Structure

agents/            Bedrock agent configs (game-genie, kids-game-portal)
server/            Express backend
  routes/          API route handlers
  services/        mockAgentService + bedrockAgentService
public/            Static frontend (HTML/CSS/JS)
infrastructure/    CloudFormation templates
scripts/           test-agent.js, deploy.js, agent-utils.js
tests/             Jest tests
docs/              ARCHITECTURE.md, LOCAL_DEVELOPMENT.md
.env.local         local mock mode
.env.dev           dev AWS
.env.prod          prod AWS

## Conventions
- Agent dirs: kebab-case
- JS files: camelCase
- Env files: .env.{environment}