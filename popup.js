// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDuration(seconds) {
  if (seconds < 60) return seconds + "s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
function fmtMins(seconds) { return Math.floor(seconds / 60) + "m"; }
function formatTime(seconds) {
  return Math.floor(seconds / 60).toString().padStart(2, "0") + ":" + (seconds % 60).toString().padStart(2, "0");
}
function todayKey() { return new Date().toISOString().slice(0, 10); }

// ─── Stats ────────────────────────────────────────────────────────────────────

async function loadStats() {
  const result = await chrome.storage.local.get(["sessions", "switchLog", "studyStartDate"]);
  const allSessions = result.sessions || [];
  const allSwitches = result.switchLog || [];
  const studyStartDate = result.studyStartDate || todayKey();

  const today = todayKey();
  const todaySessions = allSessions.filter(s => s.date === today);
  const todaySwitches = allSwitches.filter(s => s.date === today);

  const dayNum = Math.min(14, Math.floor((new Date() - new Date(studyStartDate)) / 86400000) + 1);
  document.getElementById("studyDay").textContent = `Day ${dayNum} of 14`;
  document.getElementById("currentDate").textContent = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  let academicSec = 0, distractionSec = 0;
  todaySessions.forEach(s => {
    if (s.category === "academic")    academicSec    += s.duration_seconds;
    if (s.category === "distraction") distractionSec += s.duration_seconds;
  });

  document.getElementById("statSwitches").textContent    = todaySwitches.length;
  document.getElementById("statAcademic").textContent    = fmtMins(academicSec);
  document.getElementById("statDistraction").textContent = fmtMins(distractionSec);
  document.getElementById("statTotal").textContent       = todaySessions.length;

  // Hour bar (0–23)
  const hourData = {};
  todaySessions.forEach(s => {
    if (!hourData[s.hour]) hourData[s.hour] = { academic: 0, distraction: 0, other: 0 };
    if (["academic","distraction","other"].includes(s.category)) hourData[s.hour][s.category] += s.duration_seconds;
  });
  const maxVal = Math.max(1, ...Object.values(hourData).map(h => h.academic + h.distraction + h.other));
  const container = document.getElementById("hourBar");
  container.innerHTML = "";
  for (let h = 0; h < 24; h++) {
    const d = hourData[h];
    const slot = document.createElement("div");
    if (!d) {
      slot.className = "hour-bar-slot empty";
    } else {
      const total = d.academic + d.distraction + d.other;
      const pct = Math.round((total / maxVal) * 36);
      let cat = d.academic >= d.distraction && d.academic >= d.other ? "academic"
              : d.distraction >= d.other ? "distraction" : "other";
      slot.className = `hour-bar-slot ${cat}`;
      slot.style.height = Math.max(4, pct) + "px";
      slot.title = `${h}:00 — Academic: ${fmtDuration(d.academic)}, Distraction: ${fmtDuration(d.distraction)}`;
    }
    container.appendChild(slot);
  }

  document.getElementById("exportMeta").textContent =
    `${allSessions.length} sessions recorded over ${dayNum} day${dayNum !== 1 ? "s" : ""}`;
}

// ─── Current Tab ──────────────────────────────────────────────────────────────

function updateCurrentTab() {
  chrome.runtime.sendMessage({ type: "GET_CURRENT_TAB_INFO" }, (info) => {
    if (!info) return;
    document.getElementById("currentDomain").textContent   = info.domain || "—";
    document.getElementById("currentCategory").textContent = info.category || "—";
    document.getElementById("currentCategory").className   = `category-badge badge-${info.category || "other"}`;
    if (info.startedAt) {
      const sec = Math.round((Date.now() - info.startedAt) / 1000);
      document.getElementById("currentTabTime").textContent = `${fmtDuration(sec)} on this tab`;
    }
  });
}

// ─── Pomodoro ─────────────────────────────────────────────────────────────────

const CIRCUMFERENCE = 2 * Math.PI * 42;
let pomodoroInterval = null;

async function renderPomodoro() {
  const result = await chrome.storage.local.get("pomodoro");
  const state  = result.pomodoro || { phase: "work", running: false, endTime: null, minutesLeft: 25, completedSessions: 0 };

  const isBreak  = state.phase !== "work";
  const totalSec = (state.phase === "work" ? 25 : state.phase === "shortBreak" ? 5 : 15) * 60;
  const progressEl = document.getElementById("pomoProgress");
  progressEl.classList.toggle("break", isBreak);

  function tick() {
    if (!state.running || !state.endTime) {
      document.getElementById("pomoTime").textContent = formatTime((state.minutesLeft || (isBreak ? 5 : 25)) * 60);
      progressEl.style.strokeDashoffset = 0;
      return;
    }
    const remaining = Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000));
    document.getElementById("pomoTime").textContent = formatTime(remaining);
    progressEl.style.strokeDashoffset = CIRCUMFERENCE * (1 - remaining / totalSec);
    if (remaining === 0 && pomodoroInterval) { clearInterval(pomodoroInterval); pomodoroInterval = null; }
  }
  tick();
  if (state.running && state.endTime) {
    if (pomodoroInterval) clearInterval(pomodoroInterval);
    pomodoroInterval = setInterval(tick, 1000);
  }

  document.getElementById("pomoPhase").textContent = state.phase === "work" ? "Focus" : state.phase === "shortBreak" ? "Short Break" : "Long Break";

  const startBtn = document.getElementById("btnPomoStart");
  const stopBtn  = document.getElementById("btnPomoStop");
  const breakBtns = document.getElementById("pomoBreakButtons");
  if (state.running) {
    startBtn.style.display = "none"; stopBtn.style.display = ""; breakBtns.style.display = "none";
  } else if (isBreak) {
    startBtn.style.display = ""; startBtn.textContent = "Start Break"; stopBtn.style.display = "none"; breakBtns.style.display = "none";
  } else {
    startBtn.style.display = ""; startBtn.textContent = "Start Focus"; stopBtn.style.display = "none";
    breakBtns.style.display = state.completedSessions > 0 ? "" : "none";
  }

  const dotsEl = document.getElementById("pomoSessionDots");
  dotsEl.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const dot = document.createElement("div");
    dot.className = "pomo-dot" + (i < (state.completedSessions % 4) ? " filled" : "");
    dotsEl.appendChild(dot);
  }
  document.getElementById("pomoCompleted").textContent = `${state.completedSessions || 0} sessions completed`;
}

document.getElementById("btnPomoStart").addEventListener("click", async () => {
  const r = await chrome.storage.local.get("pomodoro");
  const state = r.pomodoro || { completedSessions: 0, phase: "work" };
  if (state.phase !== "work") {
    chrome.runtime.sendMessage({ type: "START_BREAK", minutes: state.phase === "longBreak" ? 15 : 5 }, () => setTimeout(renderPomodoro, 100));
  } else {
    chrome.runtime.sendMessage({ type: "START_POMODORO", completedSessions: state.completedSessions || 0 }, () => setTimeout(renderPomodoro, 100));
  }
});
document.getElementById("btnPomoStop").addEventListener("click", () => {
  if (pomodoroInterval) { clearInterval(pomodoroInterval); pomodoroInterval = null; }
  chrome.runtime.sendMessage({ type: "STOP_POMODORO" }, () => setTimeout(renderPomodoro, 100));
});
document.getElementById("btnShortBreak").addEventListener("click", async () => {
  const r = await chrome.storage.local.get("pomodoro");
  await chrome.storage.local.set({ pomodoro: { ...(r.pomodoro||{}), phase: "shortBreak", running: false } });
  chrome.runtime.sendMessage({ type: "START_BREAK", minutes: 5 }, () => setTimeout(renderPomodoro, 100));
});
document.getElementById("btnLongBreak").addEventListener("click", async () => {
  const r = await chrome.storage.local.get("pomodoro");
  await chrome.storage.local.set({ pomodoro: { ...(r.pomodoro||{}), phase: "longBreak", running: false } });
  chrome.runtime.sendMessage({ type: "START_BREAK", minutes: 15 }, () => setTimeout(renderPomodoro, 100));
});

// ─── Reminders Toggle ─────────────────────────────────────────────────────────

async function loadReminderState() {
  const result = await chrome.storage.local.get("remindersEnabled");
  const enabled = result.remindersEnabled !== false;
  document.getElementById("reminderToggle").checked = enabled;
  document.getElementById("eyeRestStatus").textContent = enabled ? "Active" : "Off";
}
document.getElementById("reminderToggle").addEventListener("change", (e) => {
  chrome.runtime.sendMessage({ type: "TOGGLE_REMINDERS", value: e.target.checked }, () => {
    document.getElementById("eyeRestStatus").textContent = e.target.checked ? "Active" : "Off";
  });
});

// ─── CSV Export ───────────────────────────────────────────────────────────────


document.getElementById("btnDownloadCSV").addEventListener("click", async () => {
  const result = await chrome.storage.local.get(["sessions", "studyStartDate"]);
  const sessions = result.sessions || [];

  if (sessions.length === 0) {
    alert("No data recorded yet. Browse normally for a few minutes and try again.");
    return;
  }

  function cap(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
  }

  function esc(val) {
    const s = String(val ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const headers = ["Timestamp", "HourOfDay", "Website", "Category", "DurationSeconds", "IdleSeconds", "ActiveSeconds"];
  const rows = sessions.map(s =>
    [s.timestamp, s.hour, s.url, cap(s.category), s.duration_seconds, s.idle_seconds ?? 0, s.active_seconds ?? s.duration_seconds].map(esc).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: `blst_data_${dateStr}.csv` });
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  await loadStats();
  await loadReminderState();
  await renderPomodoro();
  updateCurrentTab();
  setInterval(updateCurrentTab, 3000);
  setInterval(loadStats, 10000);
}
init();