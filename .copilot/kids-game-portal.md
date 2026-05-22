# KidsGamePortal Game Agent

**Code Location**: `agents/kids-game-portal/`

**Description**: Portal-facing agent that helps kids find featured games, solve daily problems, and submit their own game ideas.

**Configuration Files**:
- `agent-config.json` - Agent name, model, instructions, TTL
- `actions/action-group.json` - Action definitions (GetProblemOfTheDay, GetFeaturedGames, SubmitGameIdea)
- `prompts/system-prompt.md` - System prompt and response guidelines

**Key Actions**:
1. `GetProblemOfTheDay` - Daily challenge or puzzle for kids
2. `GetFeaturedGames` - Recommended games from the library
3. `SubmitGameIdea` - Process kids' game ideas for submission

**Testing**: Run `npm test` to validate this agent's configuration.
