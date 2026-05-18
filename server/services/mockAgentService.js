/**
 * Mock agent service for local development.
 * Simulates both GameGenie and KidsGamePortal agent responses
 * without making real AWS Bedrock calls.
 * Set USE_MOCK_AGENTS=true in .env.local to use this.
 */

const { v4: uuidv4 } = require("uuid");

// In-memory game library — starts with pre-selected games
const gameLibrary = [
  { id: "g001", title: "Space Blaster",   url: "https://scratch.mit.edu/projects/example1", category: "featured", createdBy: "GameGenie", emoji: "🚀" },
  { id: "g002", title: "Dino Jump",       url: "https://scratch.mit.edu/projects/example2", category: "featured", createdBy: "GameGenie", emoji: "🦕" },
  { id: "g003", title: "Color Puzzle",    url: "https://scratch.mit.edu/projects/example3", category: "featured", createdBy: "GameGenie", emoji: "🎨" },
  { id: "g004", title: "Math Quest",      url: "https://scratch.mit.edu/projects/example4", category: "featured", createdBy: "GameGenie", emoji: "🔢" },
  { id: "g005", title: "Underwater Race", url: "https://scratch.mit.edu/projects/example5", category: "featured", createdBy: "GameGenie", emoji: "🐠" },
  { id: "g006", title: "Ninja Dodge",     url: "https://scratch.mit.edu/projects/example6", category: "featured", createdBy: "GameGenie", emoji: "🥷" }
];

// Daily problems / challenges
const problems = [
  { id: "p001", title: "The Lost Robot",    description: "A little robot is lost in a maze! Can you think of a game where kids help the robot find its way home? What obstacles would you add?", emoji: "🤖" },
  { id: "p002", title: "Ocean Explorer",   description: "Imagine you are deep under the sea! What kind of game would you make about exploring the ocean and finding hidden treasure?", emoji: "🌊" },
  { id: "p003", title: "Space Garden",     description: "Astronauts need food in space! Design a game where kids grow vegetables on the moon. What challenges would make it fun?", emoji: "🌱" },
  { id: "p004", title: "Dragon Bakery",    description: "A friendly dragon wants to open a bakery but keeps accidentally burning the cakes! What game could you make about this?", emoji: "🐉" },
  { id: "p005", title: "Time Traveler",    description: "You found a time machine! Design a game where kids visit different time periods and solve puzzles to get back home.", emoji: "⏰" }
];

function getTodaysProblem() {
  const dayIndex = new Date().getDay() % problems.length;
  return problems[dayIndex];
}

// Simulate game generation (in production this calls the GameGenie Bedrock agent)
async function generateGame(ideaText, sessionId) {
  // Simulate processing delay
  await new Promise(r => setTimeout(r, 1500));

  const gameId   = uuidv4();
  const titles   = ["Super", "Mega", "Turbo", "Epic", "Magic", "Cosmic"];
  const nouns    = ["Quest", "Adventure", "Runner", "Blaster", "Puzzle", "World"];
  const emojis   = ["🎮", "⭐", "🌟", "🎯", "🏆", "🎪", "🎠", "��"];
  const title    = `${titles[Math.floor(Math.random() * titles.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
  const emoji    = emojis[Math.floor(Math.random() * emojis.length)];

  // Mock game URL — in production this would be a real generated game link
  const gameUrl  = `https://scratch.mit.edu/projects/mock-${gameId.slice(0, 8)}`;

  const newGame = {
    id:        gameId,
    title,
    url:       gameUrl,
    category:  "created-by-kids",
    createdBy: sessionId || "anonymous",
    emoji,
    idea:      ideaText,
    createdAt: new Date().toISOString()
  };

  // Add to library
  gameLibrary.push(newGame);

  return {
    success:  true,
    gameId,
    title,
    url:      gameUrl,
    emoji,
    message:  `�� Wow! Your idea "${ideaText.slice(0, 40)}..." has been turned into a game! Click the link to play!`
  };
}

module.exports = {
  getFeaturedGames: (limit = 6) => gameLibrary.filter(g => g.category === "featured").slice(0, limit),
  getAllGames:      (limit = 20) => [...gameLibrary].reverse().slice(0, limit),
  getKidsGames:    ()           => gameLibrary.filter(g => g.category === "created-by-kids"),
  getTodaysProblem,
  generateGame
};