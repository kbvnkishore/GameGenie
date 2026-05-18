/**
 * server/services/mockAgentService.js
 * Purpose  : Local mock for both Bedrock agents. No AWS calls made.
 * Framework: Node.js (no framework)
 * Used when: USE_MOCK_AGENTS=true (set in .env.local)
 * Note     : Game library is in-memory and resets on server restart.
 */

const { v4: uuidv4 } = require("uuid");

const gameLibrary = [
  { id: "g001", title: "Space Blaster",   url: "https://scratch.mit.edu/projects/example1", category: "featured", createdBy: "GameGenie", emoji: "rocket" },
  { id: "g002", title: "Dino Jump",       url: "https://scratch.mit.edu/projects/example2", category: "featured", createdBy: "GameGenie", emoji: "dino" },
  { id: "g003", title: "Color Puzzle",    url: "https://scratch.mit.edu/projects/example3", category: "featured", createdBy: "GameGenie", emoji: "art" },
  { id: "g004", title: "Math Quest",      url: "https://scratch.mit.edu/projects/example4", category: "featured", createdBy: "GameGenie", emoji: "numbers" },
  { id: "g005", title: "Underwater Race", url: "https://scratch.mit.edu/projects/example5", category: "featured", createdBy: "GameGenie", emoji: "fish" },
  { id: "g006", title: "Ninja Dodge",     url: "https://scratch.mit.edu/projects/example6", category: "featured", createdBy: "GameGenie", emoji: "ninja" }
];

const problems = [
  { id: "p001", title: "The Lost Robot",  description: "A little robot is lost in a maze! Can you think of a game where kids help the robot find its way home?", emoji: "robot" },
  { id: "p002", title: "Ocean Explorer",  description: "Imagine you are deep under the sea! What kind of game would you make about exploring the ocean?", emoji: "wave" },
  { id: "p003", title: "Space Garden",    description: "Astronauts need food in space! Design a game where kids grow vegetables on the moon.", emoji: "plant" },
  { id: "p004", title: "Dragon Bakery",   description: "A friendly dragon wants to open a bakery but keeps burning the cakes! What game could you make?", emoji: "dragon" },
  { id: "p005", title: "Time Traveler",   description: "You found a time machine! Design a game where kids visit different time periods and solve puzzles.", emoji: "clock" }
];

function getTodaysProblem() {
  return problems[new Date().getDay() % problems.length];
}

async function generateGame(ideaText, sessionId) {
  await new Promise(r => setTimeout(r, 1500)); // simulate AI processing delay
  const prefixes = ["Super", "Mega", "Turbo", "Epic", "Magic", "Cosmic"];
  const nouns    = ["Quest", "Adventure", "Runner", "Blaster", "Puzzle", "World"];
  const title    = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
  const gameId   = uuidv4();
  const gameUrl  = `https://scratch.mit.edu/projects/mock-${gameId.slice(0, 8)}`;
  gameLibrary.push({
    id: gameId, title, url: gameUrl,
    category: "created-by-kids", createdBy: sessionId || "anonymous",
    emoji: "game", idea: ideaText, createdAt: new Date().toISOString()
  });
  return {
    success: true, gameId, title, url: gameUrl, emoji: "game",
    message: `Wow! Your idea has been turned into a game! Click the link to play!`
  };
}

module.exports = {
  getFeaturedGames : (limit = 6)  => gameLibrary.filter(g => g.category === "featured").slice(0, limit),
  getAllGames      : (limit = 20) => [...gameLibrary].reverse().slice(0, limit),
  getKidsGames     : ()           => gameLibrary.filter(g => g.category === "created-by-kids"),
  getTodaysProblem,
  generateGame
};