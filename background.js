// ─── Site Category Definitions ───────────────────────────────────────────────

const ACADEMIC_DOMAINS = new Set([
  // Search & Reference
  "scholar.google.com", "wikipedia.org", "wolframalpha.com",
  // MOOCs & Courses
  "coursera.org", "edx.org", "khanacademy.org", "udemy.com", "udacity.com",
  "nptel.ac.in", "swayam.gov.in", "skillshare.com", "brilliant.org",
  // Coding & Tech
  "github.com", "stackoverflow.com", "stackexchange.com", "geeksforgeeks.org",
  "hackerrank.com", "leetcode.com", "codechef.com", "codeforces.com",
  "replit.com", "developer.mozilla.org", "w3schools.com",
  // Research & Journals
  "researchgate.net", "academia.edu", "pubmed.ncbi.nlm.nih.gov", "arxiv.org",
  "jstor.org", "springer.com", "sciencedirect.com", "ieee.org", "acm.org",
  "semanticscholar.org", "ncbi.nlm.nih.gov",
  // Productivity & Study Tools
  "docs.google.com", "drive.google.com", "classroom.google.com",
  "overleaf.com", "desmos.com", "geogebra.org", "zoom.us",
  "notion.so", "evernote.com", "quizlet.com", "anki",
  // Indian Education
  "diksha.gov.in", "epathshala.nic.in", "vidyamitra.inflibnet.ac.in",
]);

const DISTRACTION_DOMAINS = new Set([
  // Social Media
  "instagram.com", "facebook.com", "twitter.com", "x.com",
  "snapchat.com", "tiktok.com", "pinterest.com",
  // Video Entertainment
  "netflix.com", "primevideo.com", "hotstar.com", "disneyplus.com",
  "youtube.com", "twitch.tv", "dailymotion.com", "voot.com", "zee5.com",
  // Messaging (non-academic use)
  "web.whatsapp.com", "web.telegram.org", "discord.com",
  // News & Clickbait
  "buzzfeed.com", "reddit.com", "9gag.com",
  // Shopping
  "amazon.in", "amazon.com", "flipkart.com", "myntra.com", "ajio.com",
  "meesho.com", "nykaa.com", "snapdeal.com",
  // Gaming
  "miniclip.com", "poki.com", "friv.com",
  // Indian News (timewasters)
  "timesofindia.com", "ndtv.com", "indiatimes.com", "aajtak.in",
]);

function classifyDomain(url) {
  if (!url || url.startsWith("chrome://") || url.startsWith("chrome-extension://") || url === "about:blank") {
    return "system";
  }
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    for (const domain of ACADEMIC_DOMAINS) {
      if (hostname === domain || hostname.endsWith("." + domain)) return "academic";
    }
    for (const domain of DISTRACTION_DOMAINS) {
      if (hostname === domain || hostname.endsWith("." + domain)) return "distraction";
    }
    // .edu and .ac.in are academic
    if (hostname.endsWith(".edu") || hostname.endsWith(".ac.in") || hostname.endsWith(".edu.in")) {
      return "academic";
    }
    return "other";
  } catch {
    return "other";
  }
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

// ─── State Management ─────────────────────────────────────────────────────────

let activeTabId = null;
let activeTabUrl = null;
let activeTabStart = null; // timestamp ms when tab became active

// ─── Session Recording ────────────────────────────────────────────────────────

async function recordSession(url, startMs, endMs) {
  if (!url || !startMs || !endMs) return;
  const duration = Math.round((endMs - startMs) / 1000);
  if (duration < 1) return; // ignore sub-second blips

  const category = classifyDomain(url);
  if (category === "system") return;

  const domain = getDomain(url);
  const now = new Date(startMs);
  const dateKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const hour = now.getHours();
  const timestamp = now.toISOString();

  const session = { timestamp, date: dateKey, hour, domain, url, category, duration_seconds: duration };

  const result = await chrome.storage.local.get(["sessions", "studyStartDate", "dayNumber"]);
  const sessions = result.sessions || [];

  // Track study start date
  let studyStartDate = result.studyStartDate;
  if (!studyStartDate) {
    studyStartDate = dateKey;
    await chrome.storage.local.set({ studyStartDate });
  }

  const start = new Date(studyStartDate);
  const current = new Date(dateKey);
  const dayNumber = Math.floor((current - start) / 86400000) + 1;
  session.day_number = dayNumber;

  sessions.push(session);
  await chrome.storage.local.set({ sessions });

  // Track tab switch: was previous category academic and new is distraction?
  await updateSwitchCount(url, startMs);
}

async function updateSwitchCount(newUrl, nowMs) {
  const newCategory = classifyDomain(newUrl);
  const result = await chrome.storage.local.get(["lastCategory", "switchLog"]);
  const lastCategory = result.lastCategory;
  const switchLog = result.switchLog || [];

  if (lastCategory === "academic" && newCategory === "distraction") {
    const now = new Date(nowMs);
    switchLog.push({
      timestamp: now.toISOString(),
      date: now.toISOString().slice(0, 10),
      hour: now.getHours(),
      to_domain: getDomain(newUrl),
    });
    await chrome.storage.local.set({ switchLog });
  }

  await chrome.storage.local.set({ lastCategory: newCategory });
}

// ─── Tab Event Handlers ───────────────────────────────────────────────────────

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const now = Date.now();

  // Record time on previous tab
  if (activeTabUrl && activeTabStart) {
    await recordSession(activeTabUrl, activeTabStart, now);
  }

  // Start tracking new tab
  activeTabId = activeInfo.tabId;
  activeTabStart = now;
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    activeTabUrl = tab.url || "";
  } catch {
    activeTabUrl = "";
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId !== activeTabId) return;
  if (changeInfo.status !== "complete" || !changeInfo.url) return;

  const now = Date.now();
  // Record time on previous URL within same tab (navigation)
  if (activeTabUrl && activeTabStart && activeTabUrl !== changeInfo.url) {
    await recordSession(activeTabUrl, activeTabStart, now);
    activeTabStart = now;
    activeTabUrl = changeInfo.url;
  } else if (!activeTabUrl) {
    activeTabUrl = changeInfo.url;
    activeTabStart = now;
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (tabId !== activeTabId) return;
  const now = Date.now();
  if (activeTabUrl && activeTabStart) {
    await recordSession(activeTabUrl, activeTabStart, now);
  }
  activeTabId = null;
  activeTabUrl = null;
  activeTabStart = null;
});

// ─── Alarms: Wellness Reminders ───────────────────────────────────────────────

async function setupAlarms() {
  const result = await chrome.storage.local.get("remindersEnabled");
  const enabled = result.remindersEnabled !== false; // default true

  if (enabled) {
    await chrome.alarms.create("waterReminder", { periodInMinutes: 60 });
    await chrome.alarms.create("eyeRestReminder", { periodInMinutes: 20 });
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const result = await chrome.storage.local.get("remindersEnabled");
  const enabled = result.remindersEnabled !== false;
  if (!enabled) return;

  if (alarm.name === "waterReminder") {
    chrome.notifications.create("water_" + Date.now(), {
      type: "basic",
      iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      title: "💧 Hydration Reminder",
      message: "Time to drink a glass of water! Staying hydrated improves focus and reduces blue-light fatigue.",
      priority: 1,
    });
  }

  if (alarm.name === "eyeRestReminder") {
    chrome.notifications.create("eye_" + Date.now(), {
      type: "basic",
      iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      title: "👁️ 20-20-20 Eye Rest",
      message: "Look at something 20 feet away for 20 seconds. Give your eyes a break from the screen!",
      priority: 2,
    });
  }

  if (alarm.name === "pomodoroEnd") {
    const pomo = await chrome.storage.local.get("pomodoro");
    const state = pomo.pomodoro || {};
    if (state.phase === "work") {
      state.completedSessions = (state.completedSessions || 0) + 1;
      const isLongBreak = state.completedSessions % 4 === 0;
      state.phase = isLongBreak ? "longBreak" : "shortBreak";
      state.minutesLeft = isLongBreak ? 15 : 5;
      chrome.notifications.create("pomo_" + Date.now(), {
        type: "basic",
        iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        title: "🍅 Pomodoro Complete!",
        message: isLongBreak ? "Great work! Take a 15-minute long break." : "Nice focus session! Take a 5-minute break.",
        priority: 2,
      });
    } else {
      state.phase = "work";
      state.minutesLeft = 25;
      chrome.notifications.create("pomo_" + Date.now(), {
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "🍅 Break Over — Back to Work!",
        message: "Your break is done. Start your next 25-minute focus session.",
        priority: 2,
      });
    }
    state.running = false;
    state.endTime = null;
    await chrome.storage.local.set({ pomodoro: state });
  }
});

// ─── Messages from Popup ──────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_CURRENT_TAB_INFO") {
    sendResponse({
      url: activeTabUrl,
      category: classifyDomain(activeTabUrl),
      domain: getDomain(activeTabUrl),
      startedAt: activeTabStart,
    });
    return true;
  }

  if (msg.type === "TOGGLE_REMINDERS") {
    chrome.storage.local.set({ remindersEnabled: msg.value }).then(async () => {
      if (msg.value) {
        await chrome.alarms.create("waterReminder", { periodInMinutes: 60 });
        await chrome.alarms.create("eyeRestReminder", { periodInMinutes: 20 });
      } else {
        await chrome.alarms.clear("waterReminder");
        await chrome.alarms.clear("eyeRestReminder");
      }
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === "START_POMODORO") {
    const endTime = Date.now() + 25 * 60 * 1000;
    chrome.storage.local.set({
      pomodoro: { phase: "work", running: true, endTime, minutesLeft: 25, completedSessions: msg.completedSessions || 0 }
    }).then(() => {
      chrome.alarms.create("pomodoroEnd", { delayInMinutes: 25 });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === "STOP_POMODORO") {
    chrome.alarms.clear("pomodoroEnd").then(async () => {
      const res = await chrome.storage.local.get("pomodoro");
      const state = res.pomodoro || {};
      state.running = false;
      state.endTime = null;
      await chrome.storage.local.set({ pomodoro: state });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === "START_BREAK") {
    const minutes = msg.minutes || 5;
    const endTime = Date.now() + minutes * 60 * 1000;
    chrome.storage.local.get("pomodoro").then((res) => {
      const state = res.pomodoro || {};
      state.running = true;
      state.endTime = endTime;
      state.minutesLeft = minutes;
      chrome.storage.local.set({ pomodoro: state }).then(() => {
        chrome.alarms.create("pomodoroEnd", { delayInMinutes: minutes });
        sendResponse({ ok: true });
      });
    });
    return true;
  }
});

// ─── Startup ──────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({ remindersEnabled: true });
  await setupAlarms();
});

chrome.runtime.onStartup.addListener(async () => {
  await setupAlarms();
});
