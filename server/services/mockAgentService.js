/**
 * server/services/mockAgentService.js
 * Purpose  : Local mock for both Bedrock agents. No AWS calls made.
 * Framework: Node.js (no framework)
 * Used when: USE_MOCK_AGENTS=true (set in .env.local)
 * Note     : Game library is in-memory and resets on server restart.
 */

const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

function sanitizeFileName(name) {
  return String(name || "game")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "game";
}

function buildGameHtml(title, description) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #1d113b, #0f172a 55%, #111827);
      color: #f8fafc;
      font-family: Arial, sans-serif;
    }
    .game-shell {
      max-width: 760px;
      width: min(92vw, 760px);
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(168, 85, 247, 0.4);
      border-radius: 22px;
      padding: 2rem;
      box-shadow: 0 20px 50px rgba(0,0,0,0.35);
    }
    h1 {
      margin: 0 0 0.8rem;
      font-size: clamp(2rem, 4vw, 3rem);
      color: #facc15;
    }
    p {
      font-size: 1.05rem;
      line-height: 1.7;
      color: #e2e8f0;
      margin-bottom: 1.2rem;
    }
    .box {
      background: rgba(59,130,246,0.08);
      border: 1px solid rgba(59,130,246,0.3);
      border-radius: 16px;
      padding: 1rem 1.1rem;
      margin-top: 1rem;
    }
    .play-btn {
      display: inline-block;
      margin-top: 1rem;
      text-decoration: none;
      background: linear-gradient(135deg, #8b5cf6, #ec4899);
      color: white;
      padding: 0.9rem 1.5rem;
      border-radius: 999px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="game-shell">
    <h1>${title}</h1>
    <p>${description}</p>
    <div class="box">
      <strong>How to play:</strong>
      <p>Tap the button below to start the game. Keep going, collect points, and enjoy the challenge.</p>
      <button class="play-btn" onclick="alert('Game started! This generated game is ready to be customized further.')">Play Now</button>
    </div>
  </div>
</body>
</html>`;
}

const localGameLibrary = [
  { id: "g001", title: "ABCD Interactive Quiz", url: "/games/ABCD_IntractiveQuiz_Game.html", category: "featured", createdBy: "GameGenie", emoji: "🧠" },
  { id: "g002", title: "Animal Runner", url: "/games/Animal_Runner_Game.html", category: "featured", createdBy: "GameGenie", emoji: "🐾" },
  { id: "g003", title: "Birthday Greeting Card Generator", url: "/games/Birthday_Greeting_Card_Generator.html", category: "featured", createdBy: "GameGenie", emoji: "🎉" },
  { id: "g004", title: "Rainbow Balloon Pop", url: "/games/Rainbow_Ballon_pop_Game.html", category: "featured", createdBy: "GameGenie", emoji: "🎈" }
];

let gameLibrary = [...localGameLibrary];

function getCurrentLibraryFromEnv() {
  const localPath = (process.env.GAME_LIBRARY_LOCAL_PATH || "").trim();
  if (localPath) {
    const sourcePath = localPath.replace(/\//g, "\\");
    if (fs.existsSync(sourcePath)) {
      const files = fs.readdirSync(sourcePath)
        .filter(file => file.toLowerCase().endsWith(".html"))
        .sort();

      if (files.length > 0) {
        return files.map((file, index) => ({
          id: `local-${index + 1}`,
          title: normaliseTitle(file),
          url: `/local-games/${encodeURIComponent(file)}`,
          category: "featured",
          createdBy: "Local",
          emoji: "🎮"
        }));
      }
    }
  }

  const s3BaseUrl = (process.env.GAME_LIBRARY_S3_BASE_URL || "").trim();
  if (!s3BaseUrl) return localGameLibrary;

  const s3GamesValue = (process.env.GAME_LIBRARY_S3_GAMES || "").trim();
  const directS3Games = parseJsonArray(s3GamesValue);
  if (Array.isArray(directS3Games) && directS3Games.length > 0) {
    return directS3Games.map((entry, index) => normalizeGameEntry(entry, index, s3BaseUrl, "S3"));
  }

  return null;
}

function parseJsonArray(value) {
  if (!value || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normaliseTitle(fileName) {
  return (fileName || "Game")
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

function normalizeGameEntry(entry, index, baseUrl, sourceLabel) {
  if (typeof entry === "string") {
    const fileName = entry.trim();
    const title = normaliseTitle(fileName);
    const url = baseUrl
      ? new URL(fileName.replace(/^\/+/, ""), `${baseUrl.replace(/\/$/, "")}/`).toString()
      : `/games/${fileName}`;

    return {
      id: `${sourceLabel}-${index + 1}`,
      title,
      url,
      category: "featured",
      createdBy: sourceLabel,
      emoji: "🎮"
    };
  }

  const fileName = entry.fileName || entry.name || entry.url?.split("/").pop();
  const title = entry.title || normaliseTitle(fileName || `Game ${index + 1}`);
  const url = entry.url || (baseUrl && fileName ? new URL(fileName.replace(/^\/+/, ""), `${baseUrl.replace(/\/$/, "")}/`).toString() : `/games/${fileName || index + 1}`);

  return {
    id: entry.id || `${sourceLabel}-${index + 1}`,
    title,
    url,
    category: entry.category || "featured",
    createdBy: entry.createdBy || sourceLabel,
    emoji: entry.emoji || "🎮"
  };
}

function createS3GameEntriesFromKeys(keys, baseUrl) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return keys
    .filter(key => key && !key.endsWith("/") && !key.startsWith("?") && !key.includes("index.json"))
    .map((key, index) => {
      const fileName = key.split("/").pop();
      return {
        id: `s3-${index + 1}`,
        title: normaliseTitle(fileName),
        url: new URL(fileName, normalizedBase).toString(),
        category: "featured",
        createdBy: "S3",
        emoji: "🎮"
      };
    });
}

function parseS3ListXml(xml) {
  if (!xml || typeof xml !== "string") return [];
  const matches = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)];
  return matches.map(match => match[1].trim()).filter(Boolean);
}

async function loadS3GameLibrary() {
  const localPath = (process.env.GAME_LIBRARY_LOCAL_PATH || "").trim();
  const s3BaseUrl = (process.env.GAME_LIBRARY_S3_BASE_URL || "").trim();

  const directS3Games = getCurrentLibraryFromEnv();
  if (Array.isArray(directS3Games) && directS3Games.length > 0) {
    return directS3Games;
  }

  if (!s3BaseUrl && !localPath) return localGameLibrary;

  if (!s3BaseUrl) return localGameLibrary;

  let listingUrl = s3BaseUrl;
  if (!/[?&]/.test(listingUrl) && !/\.[a-z0-9]+$/i.test(listingUrl.split("/").pop())) {
    listingUrl = `${listingUrl}${listingUrl.includes("?") ? "&" : "?"}list-type=2`;
  }

  try {
    const response = await fetch(listingUrl, {
      headers: { Accept: "application/xml,text/xml,application/json" }
    });

    if (!response.ok) {
      throw new Error(`S3 request failed: ${response.status} ${response.statusText}`);
    }

    const rawText = await response.text();
    const trimmed = rawText.trim();

    if (trimmed.startsWith("<")) {
      const keys = parseS3ListXml(rawText);
      if (keys.length > 0) return createS3GameEntriesFromKeys(keys, s3BaseUrl);
    }

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      const entries = Array.isArray(parsed) ? parsed : parsed.games || parsed.items || [];
      if (Array.isArray(entries) && entries.length > 0) {
        return entries.map((entry, index) => normalizeGameEntry(entry, index, s3BaseUrl, "S3"));
      }
    }
  } catch (err) {
    console.warn("[mockAgentService] Could not load games from S3, using local fallback.", err.message);
  }

  return localGameLibrary;
}

function getTodaysProblem() {
  const problems = [
    { id: "p001", title: "The Lost Robot", description: "A little robot is lost in a maze! Can you think of a game where kids help the robot find its way home?", emoji: "robot" },
    { id: "p002", title: "Ocean Explorer", description: "Imagine you are deep under the sea! What kind of game would you make about exploring the ocean?", emoji: "wave" },
    { id: "p003", title: "Space Garden", description: "Astronauts need food in space! Design a game where kids grow vegetables on the moon.", emoji: "plant" },
    { id: "p004", title: "Dragon Bakery", description: "A friendly dragon wants to open a bakery but keeps burning the cakes! What game could you make?", emoji: "dragon" },
    { id: "p005", title: "Time Traveler", description: "You found a time machine! Design a game where kids visit different time periods and solve puzzles.", emoji: "clock" }
  ];
  return problems[new Date().getDay() % problems.length];
}

async function pickRandomAvailableGame() {
  const games = await loadS3GameLibrary();
  const pool = Array.isArray(games) && games.length > 0 ? games : localGameLibrary;
  if (!pool.length) {
    return {
      title: "ABCD IntractiveQuiz Game",
      url: "/games/ABCD_IntractiveQuiz_Game.html"
    };
  }

  const selected = pool[Math.floor(Math.random() * pool.length)];
  return {
    title: selected && selected.title ? selected.title : "ABCD IntractiveQuiz Game",
    url: selected && selected.url ? selected.url : "/games/ABCD_IntractiveQuiz_Game.html"
  };
}

async function generateGame(ideaText, sessionId, conversation = []) {
  await new Promise(r => setTimeout(r, 1800));

  const selectedGame = await pickRandomAvailableGame();
  const baseTitle = selectedGame.title || "My Game";
  const conversationText = Array.isArray(conversation) && conversation.length
    ? conversation.filter(item => item && typeof item.text === "string").map(item => item.text).join(" ")
    : ideaText || "";
  const mergedPrompt = `${ideaText || ""} ${conversationText}`.trim();

  const title = baseTitle;
  const safeTitle = sanitizeFileName(title || "game");
  const gameDir = path.join(__dirname, "..", "..", "public", "generated-games");
  fs.mkdirSync(gameDir, { recursive: true });

  const fileName = `${safeTitle}-${Date.now()}.html`;
  const finalPath = path.join(gameDir, fileName);
  const description = mergedPrompt
    ? mergedPrompt.replace(/\s+/g, " ").trim().slice(0, 220)
    : "A fun game designed for kids with a creative and playful theme.";

  fs.writeFileSync(finalPath, buildGameHtml(title, description), "utf8");

  const gameUrl = `/generated-games/${fileName}`;
  const gameId = uuidv4();

  gameLibrary.push({
    id: gameId,
    title,
    url: gameUrl,
    category: "created-by-kids",
    createdBy: sessionId || "anonymous",
    emoji: "game",
    idea: mergedPrompt,
    createdAt: new Date().toISOString()
  });

  return {
    success: true,
    gameId,
    title,
    url: gameUrl,
    emoji: "game",
    message: "Game is generating and ready to play! Click the link to open it."
  };
}

async function getFeaturedGames(limit = 6) {
  const games = await loadS3GameLibrary();
  return games.filter(g => g.category === "featured").slice(0, limit);
}

async function getAllGames(limit = 20) {
  const games = await loadS3GameLibrary();
  return [...games].slice(0, limit);
}

async function getKidsGames() {
  const games = await loadS3GameLibrary();
  return games.filter(g => g.category === "created-by-kids");
}

module.exports = {
  getFeaturedGames,
  getAllGames,
  getKidsGames,
  getTodaysProblem,
  generateGame
};