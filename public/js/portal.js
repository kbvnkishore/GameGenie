/* ── State ────────────────────────────────────────────────────────────────── */
let sessionId   = "session-" + Math.random().toString(36).slice(2, 10);
let currentTab  = "featured";
let allGames    = [];

/* ── Init ─────────────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  loadProblem();
  loadGames("featured");
  setupCharCounter();
});

/* ── Problem of the Day ───────────────────────────────────────────────────── */
async function loadProblem() {
  try {
    const res  = await fetch("/api/portal/problem");
    const data = await res.json();
    const el   = document.getElementById("problemContent");
    const emo  = document.getElementById("problemEmoji");

    if (data.success && data.problem) {
      emo.textContent = data.problem.emoji || "🤔";
      el.innerHTML = `
        <strong style="font-size:1.15rem; color:#fbbf24;">${data.problem.title}</strong>
        <br/><br/>
        ${data.problem.description}
        <br/><br/>
        <span style="color:#a855f7; font-weight:700;">💡 Got an idea? Write it in the box below!</span>
      `;
    } else {
      el.textContent = "Could not load today's challenge. Try refreshing!";
    }
  } catch (err) {
    document.getElementById("problemContent").textContent = "Could not connect to GameGenie. Is the server running?";
    console.error(err);
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

/* ── Idea Submission ──────────────────────────────────────────────────────── */
async function submitIdea() {
  const input  = document.getElementById("ideaInput");
  const btn    = document.getElementById("submitIdea");
  const result = document.getElementById("ideaResult");
  const idea   = input.value.trim();

  if (idea.length < 5) {
    showToast("Write a bit more about your idea! 💭");
    return;
  }

  // Loading state
  btn.disabled    = true;
  btn.textContent = "🪄 GameGenie is working...";
  result.className = "idea-result hidden";

  try {
    const res  = await fetch("/api/portal/idea", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ideaText: idea, sessionId })
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
      input.value = "";
      updateCharCount(0);
      showToast("Your game is live! 🎮🌟");
      // Refresh the games list to show the new game
      setTimeout(() => loadGames("kids"), 1000);
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
  input.addEventListener("input", () => updateCharCount(input.value.length));
}
function updateCharCount(n) {
  const el = document.getElementById("charCount");
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