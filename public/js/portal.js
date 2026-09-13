/* ── State ────────────────────────────────────────────────────────────────── */
const CONVERSATION_STORAGE_KEY = "gamegenie-conversation";
let sessionId   = "session-" + Math.random().toString(36).slice(2, 10);
let currentTab  = "featured";
let allGames    = [];
let conversation = [];
let isVoiceListening = false;
let musicEnabled = true;
let ambientAudioCtx = null;
let ambientTimer = null;
let activeMusicPreset = "happy-horizon";
let musicVolume = 0.45;
let currentTheme = "day";

const musicPresets = {
  "happy-horizon": { notes: [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23], wave: "triangle", accent: "sine", delay: 620 },
  "calm-ocean": { notes: [220.0, 246.94, 293.66, 329.63, 293.66, 246.94, 220.0, 261.63], wave: "sine", accent: "triangle", delay: 780 },
  "forest-glow": { notes: [196.0, 246.94, 293.66, 349.23, 293.66, 246.94, 220.0, 293.66], wave: "sawtooth", accent: "triangle", delay: 680 },
  "starry-night": { notes: [293.66, 329.63, 392.0, 440.0, 392.0, 349.23, 329.63, 293.66], wave: "sine", accent: "sawtooth", delay: 760 }
};

function playSmoothNote(frequency, duration = 0.7, volume = 0.04, type = "sine") {
  if (!ambientAudioCtx || !musicEnabled) return;

  const oscillator = ambientAudioCtx.createOscillator();
  const gainNode = ambientAudioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = 0.0001;

  oscillator.connect(gainNode);
  gainNode.connect(ambientAudioCtx.destination);

  const now = ambientAudioCtx.currentTime;
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(volume * musicVolume, now + 0.18);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.start(now);
  oscillator.stop(now + duration + 0.08);
}

function startAmbientMusic() {
  if (!musicEnabled) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!ambientAudioCtx) {
    ambientAudioCtx = new AudioContextClass();
  }

  if (ambientAudioCtx.state === "suspended") {
    ambientAudioCtx.resume().catch(() => {});
  }

  if (ambientTimer) clearInterval(ambientTimer);

  const preset = musicPresets[activeMusicPreset] || musicPresets["dreamy-piano"];
  const notes = preset.notes || musicPresets["dreamy-piano"].notes;
  let noteIndex = 0;

  ambientTimer = setInterval(() => {
    const base = notes[noteIndex % notes.length];
    playSmoothNote(base, 0.95, 0.045, preset.wave || "sine");
    playSmoothNote(base / 2, 1.2, 0.018, preset.accent || "triangle");
    if (noteIndex % 2 === 0) {
      playSmoothNote(base * 1.5, 0.7, 0.014, "triangle");
    }
    noteIndex += 1;
  }, preset.delay || 700);
}

function toggleMusic() {
  const button = document.getElementById("muteButton");
  musicEnabled = !musicEnabled;

  if (!button) return;
  button.textContent = musicEnabled ? "🔊" : "🔇";
  button.setAttribute("aria-label", musicEnabled ? "Mute background music" : "Unmute background music");

  if (!musicEnabled) {
    if (ambientTimer) clearInterval(ambientTimer);
    ambientTimer = null;
    return;
  }

  startAmbientMusic();
}

function setMusicPreset(value) {
  activeMusicPreset = value;
  if (musicEnabled) {
    startAmbientMusic();
  }
}

function loadPersistedConversation() {
  try {
    const saved = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (!saved) return;

    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length) {
      conversation = parsed.filter(item => item && typeof item === "object" && typeof item.text === "string");
    }
  } catch (err) {
    console.warn("Could not restore chat history.", err);
  }
}

function resetConversation() {
  conversation = [];
  persistConversation();
  const input = document.getElementById("ideaInput");
  if (input) {
    input.value = "";
    updateCharCount(0);
  }
  const result = document.getElementById("ideaResult");
  if (result) {
    result.className = "idea-result hidden";
    result.textContent = "";
  }
  renderChatLog();
}

function persistConversation() {
  try {
    localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(conversation));
  } catch (err) {
    console.warn("Could not persist chat history.", err);
  }
}

/* ── Init ─────────────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  conversation = [];
  try {
    localStorage.removeItem(CONVERSATION_STORAGE_KEY);
  } catch (err) {
    console.warn("Could not clear persisted chat history on startup.", err);
  }

  const muteButton = document.getElementById("muteButton");
  const musicSelect = document.getElementById("musicSelect");
  const musicVolumeEl = document.getElementById("musicVolume");
  const themeButton = document.getElementById("themeModeButton");

  applyTheme(localStorage.getItem("gamegenie-theme") || "day");

  if (muteButton) {
    muteButton.addEventListener("click", toggleMusic);
  }
  if (musicSelect) {
    musicSelect.addEventListener("change", (event) => {
      setMusicPreset(event.target.value);
    });
  }
  if (musicVolumeEl) {
    musicVolumeEl.addEventListener("input", (event) => {
      musicVolume = Number(event.target.value) / 100;
      if (musicEnabled) {
        startAmbientMusic();
      }
    });
  }
  if (themeButton) {
    themeButton.addEventListener("click", () => {
      const nextTheme = currentTheme === "day" ? "night" : "day";
      applyTheme(nextTheme);
    });
  }
  startAmbientMusic();
  await loadCurrentGameSource();
  loadGames("featured");
  setupCharCounter();
  setupVoiceIdeaInput();
  setupAboutModal();
  renderChatLog();
});

function applyTheme(mode) {
  currentTheme = mode === "night" ? "night" : "day";
  document.body.setAttribute("data-theme", currentTheme);
  document.body.classList.toggle("theme-night", currentTheme === "night");
  document.body.classList.toggle("theme-day", currentTheme === "day");
  localStorage.setItem("gamegenie-theme", currentTheme);

  const themeButton = document.getElementById("themeModeButton");
  if (themeButton) {
    themeButton.textContent = currentTheme === "night" ? "☀️" : "🌙";
    themeButton.setAttribute("aria-label", currentTheme === "night" ? "Switch to day mode" : "Switch to night mode");
    themeButton.title = currentTheme === "night" ? "Switch to day mode" : "Switch to night mode";
  }
}

function setupAboutModal() {
  const aboutButton = document.getElementById("aboutButton");
  const aboutModal = document.getElementById("aboutModal");

  if (!aboutButton || !aboutModal) return;

  aboutButton.addEventListener("click", () => {
    aboutModal.classList.remove("hidden");
    aboutModal.setAttribute("aria-hidden", "false");
  });

  aboutModal.addEventListener("click", (event) => {
    if (event.target && event.target.dataset && event.target.dataset.close === "true") {
      closeAboutModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !aboutModal.classList.contains("hidden")) {
      closeAboutModal();
    }
  });
}

function closeAboutModal() {
  const aboutModal = document.getElementById("aboutModal");
  if (!aboutModal) return;
  aboutModal.classList.add("hidden");
  aboutModal.setAttribute("aria-hidden", "true");
}

async function loadCurrentGameSource() {
  try {
    const res = await fetch("/api/portal/game-source");
    const data = await res.json();
    const input = document.getElementById("gameSourceInput");

    if (!input || !data || !data.success) return;

    const value = (data.source || "").trim();
    if (value) {
      input.value = value;
    }
  } catch (err) {
    console.warn("Could not load current game source.", err);
  }
}

/* ── Game Library ─────────────────────────────────────────────────────────── */
async function loadGames(tab) {
  const grid = document.getElementById("gamesGrid");
  grid.innerHTML = '<div class="loading-dots">Loading games<span>.</span><span>.</span><span>.</span></div>';

  try {
    const url  = tab === "all" ? "/api/portal/games?all=true" : "/api/portal/games?limit=12";
    const res  = await fetch(url);
    const data = await res.json();

    if (!data.success || !data.games.length) {
      grid.innerHTML = '<div class="empty-state">No games yet — be the first to create one! ��</div>';
      return;
    }

    let games = data.games;
    if (tab === "kids") games = games.filter(g => g.category === "created-by-kids");

    allGames = games;
    renderGames(games);
  } catch (err) {
    grid.innerHTML = '<div class="empty-state">Could not load games. Is the server running?</div>';
    console.error(err);
  }
}

function renderGames(games) {
  const grid = document.getElementById("gamesGrid");

  if (!games.length) {
    grid.innerHTML = '<div class="empty-state">No games in this category yet. Create one! 🌟</div>';
    return;
  }

  grid.innerHTML = games.map(g => `
    <a class="game-tile" href="${g.url}" target="_blank" rel="noopener noreferrer">
      <span class="tile-emoji">${g.emoji || "🎮"}</span>
      <div class="tile-title">${escapeHtml(g.title)}</div>
      <span class="tile-badge ${g.category === "featured" ? "featured" : ""}">
        ${g.category === "created-by-kids" ? "🌟 Kid Made" : "⭐ Featured"}
      </span>
    </a>
  `).join("");
}

function switchTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  loadGames(tab);
}

async function applyGameSource() {
  const input = document.getElementById("gameSourceInput");
  const value = (input.value || "").trim();

  if (!value) {
    showToast("Enter an S3 URL or local folder path first.");
    return;
  }

  try {
    const res = await fetch("/api/portal/game-source", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: value })
    });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || "Unable to update game source.");
    }

    document.getElementById("gameSourceInput").value = value;
    showToast(data.message || "Game source updated.");
    await loadGames(currentTab);
  } catch (err) {
    showToast(err.message || "Could not update game source.");
    console.error(err);
  }
}

/* ── Conversation Flow ───────────────────────────────────────────────────── */
function renderChatLog() {
  const logEl = document.getElementById("ideaChatLog");
  if (!logEl) return;

  persistConversation();

  if (!conversation.length) {
    logEl.innerHTML = '<div class="chat-message assistant">Tell me about the game you want. You can speak or type a few ideas, then create the game when you are ready.</div>';
    return;
  }

  logEl.innerHTML = conversation.map(item => `
    <div class="chat-message ${item.role === "user" ? "user" : "assistant"}">
      ${escapeHtml(item.text)}
    </div>
  `).join("");
}

function sendMessage() {
  const input = document.getElementById("ideaInput");
  const idea = (input.value || "").trim();

  if (!idea) {
    showToast("Type or speak a game idea first.");
    return;
  }

  conversation.push({ role: "user", text: idea });
  conversation.push({ role: "assistant", text: "I like that idea! Tell me a bit more, or click Create My Game when you are ready." });
  persistConversation();
  renderChatLog();
  input.value = "";
  updateCharCount(0);
  showToast("Message sent.");
}

function addIdeaToChat() {
  sendMessage();
}

/* ── Voice Input for Ideas ───────────────────────────────────────────────── */
function setupVoiceIdeaInput() {
  const button = document.getElementById("voiceIdeaButton");
  const input = document.getElementById("ideaInput");

  if (!button || !input) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    button.title = "Voice input is not supported in this browser";
    button.disabled = true;
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onstart = () => {
    isVoiceListening = true;
    button.classList.add("listening");
    button.title = "Listening for your game idea...";
  };

  recognition.onend = () => {
    isVoiceListening = false;
    button.classList.remove("listening");
    button.title = "Speak your game idea";
  };

  recognition.onerror = (event) => {
    isVoiceListening = false;
    const msg = event.error === "not-allowed" ? "Microphone permission was denied." : "Voice input could not be completed.";
    showToast(msg);
  };

  recognition.onresult = (event) => {
    let transcript = "";

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const text = (result[0]?.transcript || "").trim();
      if (text) {
        transcript = transcript ? `${transcript} ${text}` : text;
      }
    }

    if (!transcript) return;

    const currentValue = (input.value || "").trim();
    const nextValue = currentValue ? `${currentValue} ${transcript}` : transcript;
    input.value = nextValue.slice(0, 500);
    updateCharCount(input.value.length);
    showToast("Voice idea captured. Add it to chat or create the game.");
  };

  recognition.onspeechend = () => {
    if (!recognition.continuous) {
      recognition.stop();
    }
  };

  button.addEventListener("click", () => {
    if (isVoiceListening) {
      recognition.stop();
      return;
    }

    input.focus();
    recognition.start();
  });
}

/* ── Idea Submission ──────────────────────────────────────────────────────── */
async function submitIdea() {
  const input  = document.getElementById("ideaInput");
  const btn    = document.getElementById("submitIdea");
  const result = document.getElementById("ideaResult");
  const idea   = (input.value || "").trim();

  if (idea) {
    conversation.push({ role: "user", text: idea });
    persistConversation();
  }

  const combinedIdea = conversation
    .filter(item => item && item.role === "user" && typeof item.text === "string")
    .map(item => item.text.trim())
    .filter(Boolean)
    .join("\n");

  if (!combinedIdea.trim()) {
    showToast("Write a bit more about your idea! 💭");
    return;
  }

  // Loading state
  btn.disabled    = true;
  btn.textContent = "🪄 GameGenie is generating...";
  result.className = "idea-result hidden";

  try {
    const res  = await fetch("/api/portal/idea", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ideaText: combinedIdea, conversation, sessionId })
    });
    const data = await res.json();

    result.classList.remove("hidden");

    if (data.success) {
      result.className = "idea-result success";
      result.innerHTML = `
        <div style="font-size:1.5rem; margin-bottom:0.5rem;">${data.emoji || "🎉"}</div>
        <div>${escapeHtml(data.message)}</div>
        <a class="game-link" href="${data.url}" target="_blank" rel="noopener noreferrer">
          ▶ Play ${escapeHtml(data.title)} Now!
        </a>
      `;
      window.open(data.url, "_blank", "noopener,noreferrer");
      input.value = "";
      updateCharCount(0);
      persistConversation();
      renderChatLog();
      showToast("Your game is live! 🎮🌟");
      loadGames("kids");
    } else {
      result.className = "idea-result error";
      result.textContent = data.error || "Something went wrong. Try again!";
    }
  } catch (err) {
    result.className = "idea-result error";
    result.textContent = "Could not reach GameGenie. Is the server running?";
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = "🪄 Create My Game!";
  }
}

// Allow Ctrl+Enter to submit
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submitIdea();
});

/* ── Char Counter ─────────────────────────────────────────────────────────── */
function setupCharCounter() {
  const input = document.getElementById("ideaInput");
  if (!input) return;

  input.addEventListener("input", () => updateCharCount(input.value.length));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
}
function updateCharCount(n) {
  const el = document.getElementById("charCount");
  if (!el) return;
  el.textContent = `${n} / 500`;
  el.style.color = n > 450 ? "#ef4444" : "var(--muted)";
}

/* ── Toast ────────────────────────────────────────────────────────────────── */
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}