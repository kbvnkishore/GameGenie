# Local Development

## Run
`ash
npm install && npm start   # http://localhost:3000
npm run dev                # with auto-restart
`

## Mock Mode (default)
USE_MOCK_AGENTS=true in .env.local - no AWS needed.
Game library is in-memory and resets on restart.

## Switch to Real AWS
1. npm run deploy:dev
2. Copy Agent IDs into .env.dev
3. Set USE_MOCK_AGENTS=false
4. NODE_ENV=dev npm start

## Files You Edit Most
| File | Purpose |
|------|---------|
| agents/game-genie/agent-config.json | GameGenie instructions |
| agents/kids-game-portal/agent-config.json | Portal instructions |
| server/services/mockAgentService.js | Mock games and problems |
| public/js/portal.js | Frontend behaviour |