# 🔵 BlueMind — Browser Extension

A research-grade browser extension that tracks academic vs. distraction browsing behaviour, built for a 14-day study on blue light exposure and academic productivity among Indian undergraduate students.

---

## 📌 Table of Contents
* [About the Project](#-about-the-project)
* [Features](#-features)
* [Installation](#%EF%B8%8F-installation)
* [How It Works](#%EF%B8%8F-how-it-works)
* [Data Collected](#-data-collected)
* [Exporting Data](#-exporting-data)
* [Site Categories](#-site-categories)
* [Research Protocol](#-research-protocol)
* [Tech Stack](#-tech-stack)
* [File Structure](#-file-structure)
* [For Participants](#-for-participants)

---

## 📖 About the Project

**BlueMind** is a Chrome/Edge browser extension developed as part of a research study investigating how blue light exposure from screens affects the academic productivity of Indian undergraduate students.

The extension runs quietly in the background, tracking how often students switch from academic websites to distraction websites throughout the day—specifically comparing daytime vs. late-night browsing patterns over a 14-day study period.

The collected data is used to compute the **Attention Fragmentation Index (AFI)**:

$$\text{AFI} = \frac{\text{Distraction Switches}}{\text{Academic Time (Hours)}}$$

> 💡 **Note:** A higher AFI indicates a greater frequency of distraction interruptions per hour of academic work.

---

## ✨ Features

| Feature | Description |
| :--- | :--- |
| **🔍 Tab Switch Tracking** | Counts every time a user switches from an academic site to a distraction site. |
| **⏱️ Time on Tab** | Records exact seconds spent on each website before switching. |
| **🏷️ Auto Site Categorisation** | Automatically classifies sites as *Academic*, *Distraction*, or *Other*. |
| **🕐 Hour of Day Tracking** | Records which hour each session occurred (0–23) for day vs. night analysis. |
| **📅 14-Day Study Period** | Tracks which day of the study period each session belongs to. |
| **📊 Live Stats Popup** | Shows today's switches, academic time, distraction time, and an hourly bar chart. |
| **🍅 Pomodoro Timer** | Built-in 25/5/15 min Pomodoro study timer with session tracking. |
| **💧 Hydration Reminder** | Desktop notification every 60 minutes reminding users to drink water. |
| **👁️ 20-20-20 Eye Rule** | Desktop notification every 20 minutes reminding users to rest their eyes. |
| **📥 CSV Export** | One-click export of all research data in a clean, analysis-ready format. |

---

## 🛠️ Installation

### Supported Browsers
* ✅ Google Chrome
* ✅ Microsoft Edge
* ✅ Any Chromium-based browser

### Step 1 — Generate Icons
1. Open the `icons/generate-icons.html` file in your browser.
2. Click **"Download All Icons"**.
3. Move the downloaded `icon16.png`, `icon48.png`, and `icon128.png` files directly into your project's `icons/` folder.

### Step 2 — Load the Extension

#### For Google Chrome:
1. Navigate to `chrome://extensions/` in your address bar.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **"Load unpacked"** button.
4. Select your root `chrome-extension/` project folder.

#### For Microsoft Edge:
1. Navigate to `edge://extensions/` in your address bar.
2. Enable **Developer mode** using the toggle switch in the bottom-left corner.
3. Click the **"Load unpacked"** button.
4. Select your root `chrome-extension/` project folder.

### Step 3 — Pin the Extension
Click the puzzle piece icon (🧩) in your browser's toolbar and pin **BlueMind** for easy, one-click access.

---

## ⚙️ How It Works

### Tab Tracking
* Listens to the `chrome.tabs.onActivated` API event, which fires every time the user changes tabs.
* Records the URL, domain, category, timestamp, and duration for every tab visit.
* Specifically flags academic $\rightarrow$ distraction context switches and logs them cleanly for running AFI statistical models.

### Reminders
* Leverages the `chrome.alarms` API to ensure background tasks survive browser minimization and system idle states.
* **Water reminder:** Fires every 60 minutes.
* **Eye rest reminder:** Fires every 20 minutes.

### Pomodoro Timer
* **Focus session:** 25 minutes.
* **Short break:** 5 minutes (after each focus session).
* **Long break:** 15 minutes (after completing 4 consecutive focus sessions).
* Desktop native push alerts fire automatically when each milestone phase completes.

### Data Storage
* All data is saved on device storage locally via `chrome.storage.local`.
* **Zero telemetry:** No data is transmitted to an external web server.
* Data persists securely across system reboots and browser closures until browser caches are cleared.

---

## 📊 Data Collected

Every tab visit is recorded with the following data fields:

| Column | Description | Example Row Value |
| :--- | :--- | :--- |
| **Timestamp** | ISO 8601 datetime when tab was opened | `2026-06-09T14:32:11.000Z` |
| **HourOfDay** | Hour (0–23) when the session occurred | `14` |
| **Website** | Full URL of the visited page | `https://en.wikipedia.org/wiki/...` |
| **Category** | Classification bucket | `Academic` |
| **DurationSeconds** | Seconds spent on the tab before switching away | `47` |

---

## 📥 Exporting Data

1. Click the **BlueMind** icon in your browser toolbar to open the popup dashboard.
2. Scroll to the bottom of the popup interface.
3. Click the **"⬇ Download CSV"** button.
4. A file named `blst_data_YYYY-MM-DD.csv` will download automatically to your system.

> ⚠️ **Important:** Participants should export this file exactly at the end of the 14-day study period. Do not clear browser data during the active tracking period.

---

## 🏷️ Site Categories

### 🎓 Academic Sites
`scholar.google.com` · `wikipedia.org` · `github.com` · `stackoverflow.com` · `coursera.org` · `edx.org` · `khanacademy.org` · `nptel.ac.in` · `swayam.gov.in` · `geeksforgeeks.org` · `hackerrank.com` · `leetcode.com` · `codechef.com` · `arxiv.org` · `researchgate.net` · `pubmed.ncbi.nlm.nih.gov` · `jstor.org` · `springer.com` · `sciencedirect.com` · `ieee.org` · `docs.google.com` · `classroom.google.com` · `overleaf.com` · `zoom.us` · `desmos.com` · `notion.so` · `quizlet.com` · **All domains ending in `.edu` and `.ac.in`**

### 🍿 Distraction Sites
`instagram.com` · `youtube.com` · `netflix.com` · `twitter.com` · `x.com` · `facebook.com` · `snapchat.com` · `tiktok.com` · `reddit.com` · `discord.com` · `web.whatsapp.com` · `web.telegram.org` · `twitch.tv` · `hotstar.com` · `primevideo.com` · `flipkart.com` · `amazon.in` · `myntra.com` · `ajio.com` · `meesho.com` · `timesofindia.com` · `ndtv.com` · `9gag.com` · `buzzfeed.com` · `pinterest.com`

> ⚙️ **Customization:** To supplement or modify this target list, edit the `ACADEMIC_DOMAINS` and `DISTRACTION_DOMAINS` array elements declared inside `background.js`.

---

## 📋 Research Protocol

| Parameter | Research Detail Specification |
| :--- | :--- |
| **Study Duration** | 14 consecutive tracking days |
| **Target Group** | Indian undergraduate university students |
| **Data Collection** | Passive logging — runs automatically, no manual log sheets required |
| **Export Routine** | One single dataset download action requested on Day 14 |
| **Privacy Safeguards** | All metrics remain local — no central server data access, no accounts required |
| **Distribution** | Direct package deployment $\rightarrow$ Loaded locally via Developer Mode |

### Attention Fragmentation Index Calculation
$$\text{AFI} = \frac{\text{Total Distraction Switches}}{\text{Total Academic Seconds} / 3600}$$

* Compute values individually per participant per day across your study using the exported CSV log rows.
* Map and compare daytime focus cycles (**9:00 AM – 6:00 PM**) directly against late-night trends (**10:00 PM – 2:00 AM**) using the logged `HourOfDay` indices.

---

## 🧰 Tech Stack

* **JavaScript (ES2020):** Powers the core extension operational logic without external framework bulk.
* **Chrome Extensions API (Manifest V3):** Drives background service workflows, sandboxed local storage configurations, structural notifications, and background alarms.
* **HTML5 + CSS3:** Powers a clean, responsive popup UI designed with custom dark-themed elements, dynamic SVG assets, and a fluid Pomodoro circle animation loop.
* **Blob & URL APIs:** Natively packs raw user event records into standalone CSV sheets completely in-browser.

---

## 📁 File Structure

```text
chrome-extension/
│
├── manifest.json            # Extension configuration (Manifest V3 metadata & permissions)
├── background.js            # Service worker handling tab loops, site scoring, and alarms
├── popup.html               # Extension UI interface layout window
├── popup.css                # Polished stylesheet for popup UI styling layout
├── popup.js                 # UI companion scripting (timers, live canvas updates, and data building)
│
└── icons/
    ├── generate-icons.html  # Helper to generate base image resolutions
    ├── icon16.png           # Extension tab asset
    ├── icon48.png           # Settings panel dashboard icon asset
    └── icon128.png          # Main marketplace listing graphic asset
