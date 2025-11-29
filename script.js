const gridEl = document.getElementById("grid");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const livesEl = document.getElementById("lives");
const timerEl = document.getElementById("timer");
const targetPreview = document.getElementById("targetPreview");
const targetCode = document.getElementById("targetCode");
const roundInfo = document.getElementById("roundInfo");
const statusText = document.getElementById("statusText");
const startBtn = document.getElementById("startBtn");
const hintBtn = document.getElementById("hintBtn");

const INITIAL_LIVES = 3;
const INITIAL_TIME = 60;
const LEVEL_UP_THRESHOLD = 3;
const MAX_TIME = 90;

const state = {
  level: 1,
  score: 0,
  streak: 0,
  round: 0,
  lives: INITIAL_LIVES,
  time: INITIAL_TIME,
  correctThisLevel: 0,
  targetColor: "#ffffff",
  running: false,
  timerId: null,
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const formatScore = (score) => score.toString().padStart(3, "0");

const randomChannel = () => Math.floor(Math.random() * 140) + 80; // 80-219 for vivid tones

const randomColor = () => {
  const r = randomChannel();
  const g = randomChannel();
  const b = randomChannel();
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
};

const updateHud = () => {
  scoreEl.textContent = formatScore(state.score);
  levelEl.textContent = state.level;
  livesEl.textContent = state.lives;
  timerEl.textContent = `${state.time}s`;
  roundInfo.textContent = `Round ${state.round} · ${state.streak} correct streak`;
};

const setStatus = (message, tone = "neutral") => {
  statusText.textContent = message;
  statusText.dataset.tone = tone;
};

const gridSizeForLevel = (level) => {
  if (level < 3) return 3;
  if (level < 5) return 4;
  if (level < 8) return 5;
  return 6;
};

const buildGrid = () => {
  const size = gridSizeForLevel(state.level);
  gridEl.style.setProperty("grid-template-columns", `repeat(${size}, 1fr)`);
  gridEl.innerHTML = "";

  const totalCells = size * size;
  const targetIndex = Math.floor(Math.random() * totalCells);
  const colors = Array.from({ length: totalCells }, (_, idx) =>
    idx === targetIndex ? state.targetColor : randomColor()
  );

  colors.forEach((color, idx) => {
    const block = document.createElement("button");
    block.type = "button";
    block.className = "block";
    block.style.background = color;
    block.setAttribute("aria-label", `Color block ${idx + 1}`);
    block.dataset.color = color;
    block.addEventListener("click", () => handlePick(color, block));
    gridEl.appendChild(block);
  });
};

const nextRound = (isLevelUp = false) => {
  state.round += 1;
  state.targetColor = randomColor();
  targetPreview.style.background = state.targetColor;
  targetPreview.classList.add("is-pulsing");
  setTimeout(() => targetPreview.classList.remove("is-pulsing"), 500);
  targetCode.textContent = state.targetColor.toUpperCase();
  if (isLevelUp) {
    setStatus(`Level ${state.level}! Grid just got denser.`, "success");
  } else {
    setStatus("New color locked in. Find it!", "info");
  }
  buildGrid();
  updateHud();
};

const awardPoints = () => {
  const base = 10;
  const bonus = state.level * 2 + state.streak;
  state.score += base + bonus;
  state.time = clamp(state.time + 3, 0, MAX_TIME);
};

const deductLife = () => {
  state.lives = clamp(state.lives - 1, 0, INITIAL_LIVES);
  state.streak = 0;
  setStatus("Oops! Wrong block. Lose a life.", "warn");
  if (state.lives === 0) {
    endGame("No lives remaining.");
  }
  updateHud();
};

const levelUpIfNeeded = () => {
  if (state.correctThisLevel >= LEVEL_UP_THRESHOLD) {
    state.level += 1;
    state.correctThisLevel = 0;
    nextRound(true);
    return true;
  }
  return false;
};

const handlePick = (color, blockEl) => {
  if (!state.running) return;
  if (color === state.targetColor) {
    blockEl.classList.add("is-hint");
    state.streak += 1;
    state.correctThisLevel += 1;
    awardPoints();
    const didLevelUp = levelUpIfNeeded();
    if (!didLevelUp) {
      nextRound();
    }
  } else {
    deductLife();
  }
  updateHud();
};

const tick = () => {
  if (!state.running) return;
  state.time -= 1;
  timerEl.textContent = `${state.time}s`;
  if (state.time <= 0) {
    endGame("Time's up!");
  }
};

const resetState = () => {
  state.level = 1;
  state.score = 0;
  state.streak = 0;
  state.round = 0;
  state.lives = INITIAL_LIVES;
  state.time = INITIAL_TIME;
  state.correctThisLevel = 0;
};

const endGame = (message) => {
  clearInterval(state.timerId);
  state.running = false;
  gridEl.querySelectorAll(".block").forEach((block) => (block.disabled = true));
  setStatus(`${message} Final score: ${state.score}. Press start to try again.`, "warn");
};

const startGame = () => {
  resetState();
  state.running = true;
  setStatus("Go! Match the exact color.", "success");
  nextRound();
  clearInterval(state.timerId);
  state.timerId = setInterval(tick, 1000);
};

const requestHint = () => {
  if (!state.running) {
    setStatus("Hit start before asking for hints.", "warn");
    return;
  }
  if (state.score < 5) {
    setStatus("Earn at least 5 points to use a hint.", "warn");
    return;
  }
  const targetBlock = [...gridEl.querySelectorAll(".block")].find(
    (block) => block.dataset.color === state.targetColor
  );
  if (!targetBlock) return;
  state.score = Math.max(0, state.score - 5);
  targetBlock.classList.add("is-hint");
  setTimeout(() => targetBlock.classList.remove("is-hint"), 900);
  setStatus("Hint used. -5 points.", "info");
  updateHud();
};

const attachEvents = () => {
  startBtn.addEventListener("click", startGame);
  hintBtn.addEventListener("click", requestHint);
};

document.addEventListener("DOMContentLoaded", () => {
  attachEvents();
  updateHud();
  setStatus("Click start to play.");
});


