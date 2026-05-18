# Architecture

## Two-Agent Design
| Agent | Role |
|-------|------|
| KidsGamePortal | Website face - problems, game list, idea collection |
| GameGenie | AI brain - idea processing, game generation, library management |

## Service Layer
- mockAgentService.js - in-memory, no AWS, USE_MOCK_AGENTS=true
- bedrockAgentService.js - real Bedrock via InvokeAgentCommand streaming

## Adding a Feature
1. Add action to agents/*/actions/action-group.json
2. Implement in both service files
3. Add route in server/routes/portal.js if needed
4. Update public/js/portal.js
5. npm test -> npm start -> commit -> push