# GameGenie

> AI-powered kids gaming portal that turns ideas into playable games.

GameGenie is a kid-friendly portal where children can browse games, respond to a daily challenge, and turn their ideas into playable web games. The experience is designed around a warm, encouraging chat flow with a clean interface, multi-turn idea building, theme switching, and a more polished ambient music system.

---

## Highlights

- Child-friendly portal UI with a modern, playful layout
- Multi-turn conversation flow before creating a game
- Enter-to-send behavior in the idea box
- Clear/reset chat action for a fresh start
- Day and night mode with consistent full-page styling
- Soft, selectable ambient background music with mute and volume controls
- Local and S3-backed game library loading without app restart
- Mock mode support for local development without AWS dependencies

---

## Local app flow

Players can:

1. Open the portal at http://localhost:3000
2. See a daily problem or challenge
3. Browse featured, all, and kid-made games
4. Add a few ideas in the chat
5. Press Create My Game when ready
6. Play the generated game in a new browser tab

The app supports both a lightweight mock flow and a real Bedrock-backed deployment flow.

---

## Architecture

```
Browser
  public/index.html + public/js/portal.js + public/css/portal.css
       |
       | HTTP
       v
Express server (server/index.js)
  - serves the portal UI
  - exposes /api/portal routes
  - serves local game files and S3-backed game libraries
  - refreshes runtime config without restarting the app
       |
       +--> mockAgentService (local mock mode)
       +--> bedrockAgentService (AWS Bedrock mode)
```

---

## Key feature updates

### Kid chat experience
- The main chat box accepts multiple idea entries before final game creation.
- Enter sends the message while Shift+Enter allows a newline.
- A Clear action resets the chat and restores a clean page state.
- Startup now clears stale persisted conversation data so the page opens fresh.

### Theme and UI polish
- Day and night mode are available from the header controls.
- All major page surfaces follow the selected theme consistently.
- The UI uses a modern, soft-panel aesthetic inspired by a WhatsApp-style chat layout.

### Music and sound
- Background music uses a richer set of smooth, encouraging preset loops.
- Music can be changed, muted, and volume-adjusted from the header.
- Controls are placed in the header instead of as a floating panel, keeping the layout cleaner and more intentional.

### Game library configuration
- The app can load games from a configured local folder or an S3 URL.
- The configured source can be updated and reloaded without restarting the app.
- Browser cache headers help the app refresh the latest front-end changes.

---

## Project structure

```
GameGenie/
├── agents/
│   ├── game-genie/
│   │   ├── agent-config.json
│   │   ├── .agent.md
│   │   ├── .instructions.md
│   │   ├── actions/
│   │   └── prompts/
│   └── kids-game-portal/
│       ├── agent-config.json
│       ├── .agent.md
│       ├── .instructions.md
│       ├── actions/
│       └── prompts/
├── public/
│   ├── index.html
│   ├── css/portal.css
│   ├── js/portal.js
│   └── games/
├── server/
│   ├── index.js
│   ├── routes/
│   └── services/
├── infrastructure/
│   └── cloudformation/
├── scripts/
│   ├── test-agent.js
│   ├── deploy.js
│   └── agent-utils.js
├── tests/
├── docs/
├── AGENTS.md
├── copilot-instructions.md
├── package.json
├── .env.local
├── .env.dev
├── .env.staging
├── .env.prod
├── README.md
└── LICENSE
```

---

## Quick start

### Prerequisites
- Node.js 18 or later
- npm

### Install and run

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

For local mock mode, the app uses the configured local environment file and does not need AWS access.

```bash
npm run dev
```

---

## Environment variables

The project reads environment-specific files dynamically:

- .env.local
- .env.dev
- .env.staging
- .env.prod

Example values:

```bash
NODE_ENV=local
PORT=3000
USE_MOCK_AGENTS=true
GAME_LIBRARY_LOCAL_PATH=C:/GameGenie/public/games
```

For AWS-backed mode, additional Bedrock settings can be supplied at runtime.

---

## Validation

```bash
npm test
```

This validates the agent configuration, prompt files, and deployment metadata before running in AWS or local mock mode.

---

## Notes

This project is designed for kids and learning experiences. It keeps content age-appropriate, playful, and encouraging while still supporting real agent-based game generation workflows.


## CI/CD

`.github/workflows/deploy.yml` runs on every push:
- `npm test` on all PRs
- Auto-deploy to dev on push to `develop` branch
- Auto-deploy to prod on push to `main` branch

**GitHub Secrets required:**
`AWS_ACCESS_KEY_ID_DEV`, `AWS_SECRET_ACCESS_KEY_DEV`,
`AWS_ACCESS_KEY_ID_PROD`, `AWS_SECRET_ACCESS_KEY_PROD`