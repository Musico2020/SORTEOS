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

const CONFETTI_COLORS = ["#e11d2e", "#f4b942", "#1e9e5a", "#ffffff", "#b3121f"];

let drawnNumbers = [];
let isRolling = false;

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

function drawNumber() {
  if (isRolling) return;

  const available = getAvailableNumbers();
  if (available.length === 0) {
    render();
    return;
  }

  isRolling = true;
  drawBtn.disabled = true;
  display.classList.remove("is-winner");
  display.classList.add("is-rolling");

  const finalNumber = available[Math.floor(Math.random() * available.length)];

  const rollDurationMs = 1200;
  const rollIntervalMs = 60;
  const startTime = Date.now();

  const rollTimer = setInterval(() => {
    const randomDisplay = Math.floor(Math.random() * TOTAL_NUMBERS) + 1;
    displayNumber.textContent = formatNumber(randomDisplay);

    if (Date.now() - startTime >= rollDurationMs) {
      clearInterval(rollTimer);
      displayNumber.textContent = formatNumber(finalNumber);
      display.classList.remove("is-rolling");
      display.classList.add("is-winner");

      drawnNumbers.push(finalNumber);
      saveState();
      render();
      launchConfetti();

      isRolling = false;
      drawBtn.disabled = getAvailableNumbers().length === 0 && noRepeatToggle.checked;
    }
  }, rollIntervalMs);
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
