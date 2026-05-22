# GameGenie Game Agent

**Code Location**: `agents/game-genie/`

**Description**: AI agent that helps kids generate and play games, manage the game library, and keep interactions safe and age-appropriate.

**Configuration Files**:
- `agent-config.json` - Agent name, model, instructions, TTL
- `actions/action-group.json` - Action definitions (GenerateGame, AddGameToLibrary, GetGameLibrary, GetGameById)
- `prompts/system-prompt.md` - System prompt and response guidelines

**Key Actions**:
1. `GenerateGame` - Create a playable game from a child's idea
2. `AddGameToLibrary` - Store newly created games
3. `GetGameLibrary` - Retrieve available games by category
4. `GetGameById` - Fetch details and play link for a specific game

**Testing**: Run `npm test` to validate this agent's configuration.
