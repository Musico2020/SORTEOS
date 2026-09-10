const TOTAL_NUMBERS = 100;
const STORAGE_KEY = "sorteo-numeros-state";

const display = document.getElementById("display");
const displayNumber = document.getElementById("displayNumber");
const drawBtn = document.getElementById("drawBtn");
const drawBtnText = document.getElementById("drawBtnText");
const resetBtn = document.getElementById("resetBtn");
const noRepeatToggle = document.getElementById("noRepeatToggle");
const status = document.getElementById("status");
const remainingCount = document.getElementById("remainingCount");
const historyList = document.getElementById("historyList");
const historyCount = document.getElementById("historyCount");
const confettiLayer = document.getElementById("confettiLayer");

const drawOverlay = document.getElementById("drawOverlay");
const overlayNumber = document.getElementById("overlayNumber");
const overlayLabel = document.getElementById("overlayLabel");
const overlayHint = document.getElementById("overlayHint");
const overlayFlash = document.getElementById("overlayFlash");

const CONFETTI_COLORS = ["#e11d2e", "#f4b942", "#1e9e5a", "#ffffff", "#b3121f"];
const SUSPENSE_HINTS = [
  "Que no se detenga la suerte…",
  "El destino ya está decidido…",
  "Falta muy poco…",
  "No mires para otro lado…",
  "Ya casi sale el número…"
];

let drawnNumbers = [];
let isRolling = false;
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioCtx = new AudioCtx();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTick(frequency) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

function playRevealChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const startAt = ctx.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.08, startAt + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + 0.55);
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.drawnNumbers)) {
        drawnNumbers = parsed.drawnNumbers;
      }
    }
  } catch (e) {
    drawnNumbers = [];
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ drawnNumbers }));
}

function formatNumber(n) {
  return String(n).padStart(2, "0");
}

function getAvailableNumbers() {
  if (!noRepeatToggle.checked) {
    return Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
  }
  const drawnSet = new Set(drawnNumbers);
  const available = [];
  for (let i = 1; i <= TOTAL_NUMBERS; i++) {
    if (!drawnSet.has(i)) available.push(i);
  }
  return available;
}

function renderHistory() {
  historyList.innerHTML = "";
  for (let i = drawnNumbers.length - 1; i >= 0; i--) {
    const li = document.createElement("li");
    li.textContent = formatNumber(drawnNumbers[i]);
    historyList.appendChild(li);
  }
  historyCount.textContent = drawnNumbers.length;
}

function renderStatus() {
  const available = getAvailableNumbers();
  remainingCount.textContent = available.length;
  status.classList.toggle("is-empty", available.length === 0);

  const allDrawn = noRepeatToggle.checked && available.length === 0;
  drawBtn.disabled = allDrawn;
  drawBtnText.textContent = allDrawn ? "¡Se agotaron los números!" : "Sortear";
}

function render() {
  renderHistory();
  renderStatus();
}

function launchConfetti() {
  const pieceCount = 60;
  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.animationDuration = 1.8 + Math.random() * 1.4 + "s";
    piece.style.animationDelay = Math.random() * 0.3 + "s";
    piece.style.opacity = String(0.7 + Math.random() * 0.3);
    confettiLayer.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove());
  }
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function setControlsEnabled(enabled) {
  drawBtn.disabled = !enabled || (getAvailableNumbers().length === 0 && noRepeatToggle.checked);
  resetBtn.disabled = !enabled;
  noRepeatToggle.disabled = !enabled;
}

function drawNumber() {
  if (isRolling) return;

  const available = getAvailableNumbers();
  if (available.length === 0) {
    render();
    return;
  }

  getAudioContext();

  isRolling = true;
  setControlsEnabled(false);
  display.classList.remove("is-winner");
  display.classList.add("is-rolling");

  const finalNumber = available[Math.floor(Math.random() * available.length)];

  overlayNumber.classList.remove("is-winner");
  overlayHint.textContent = SUSPENSE_HINTS[0];
  overlayLabel.textContent = "Sorteando…";
  drawOverlay.classList.remove("is-closing");
  drawOverlay.classList.add("is-active");

  const totalDurationMs = 6500;
  const minIntervalMs = 45;
  const maxIntervalMs = 260;
  const startTime = Date.now();
  let hintIndex = 0;

  function scheduleTick() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / totalDurationMs, 1);

    if (progress >= 1) {
      overlayNumber.textContent = formatNumber(finalNumber);
      overlayNumber.classList.add("is-winner");
      overlayLabel.textContent = "¡Salió el número!";
      overlayHint.textContent = "Felicidades a quien lo tenga";
      overlayFlash.classList.remove("is-flashing");
      void overlayFlash.offsetWidth;
      overlayFlash.classList.add("is-flashing");
      drawOverlay.querySelector(".draw-overlay__content").style.transform = "none";

      displayNumber.textContent = formatNumber(finalNumber);
      display.classList.remove("is-rolling");
      display.classList.add("is-winner");

      drawnNumbers.push(finalNumber);
      saveState();
      render();
      launchConfetti();
      playRevealChime();

      setTimeout(() => {
        drawOverlay.classList.add("is-closing");
        setTimeout(() => drawOverlay.classList.remove("is-active", "is-closing"), 400);
      }, 2200);

      isRolling = false;
      setControlsEnabled(true);
      return;
    }

    const randomDisplay = Math.floor(Math.random() * TOTAL_NUMBERS) + 1;
    const formatted = formatNumber(randomDisplay);
    displayNumber.textContent = formatted;
    overlayNumber.textContent = formatted;

    const shakeAmount = 6 * (1 - progress);
    const offsetX = (Math.random() - 0.5) * shakeAmount;
    const offsetY = (Math.random() - 0.5) * shakeAmount;
    drawOverlay.querySelector(".draw-overlay__content").style.transform =
      `translate(${offsetX}px, ${offsetY}px)`;

    playTick(160 + progress * 260);

    const nextHintIndex = Math.min(
      SUSPENSE_HINTS.length - 1,
      Math.floor(progress * SUSPENSE_HINTS.length)
    );
    if (nextHintIndex !== hintIndex) {
      hintIndex = nextHintIndex;
      overlayHint.textContent = SUSPENSE_HINTS[hintIndex];
    }

    const delay = minIntervalMs + (maxIntervalMs - minIntervalMs) * easeOutCubic(progress);
    setTimeout(scheduleTick, delay);
  }

  scheduleTick();
}

function resetAll() {
  if (isRolling) return;
  drawnNumbers = [];
  saveState();
  displayNumber.textContent = "00";
  display.classList.remove("is-winner", "is-rolling");
  render();
}

drawBtn.addEventListener("click", drawNumber);
resetBtn.addEventListener("click", resetAll);
noRepeatToggle.addEventListener("change", renderStatus);

loadState();
render();
