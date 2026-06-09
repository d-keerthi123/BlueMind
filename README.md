# BlueMind
🔵 BlueMind — Browser Extension
A research-grade browser extension that tracks academic vs. distraction browsing behaviour, built for a 14-day study on blue light exposure and academic productivity among Indian undergraduate students.

📌 Table of Contents
About the Project
Features
Installation
How It Works
Data Collected
Exporting Data
Site Categories
Research Protocol
Tech Stack
File Structure
For Participants
📖 About the Project
BlueMind is a Chrome/Edge browser extension developed as part of a research study on how blue light exposure from screens affects the academic productivity of Indian undergraduate students.

The extension silently runs in the background, tracking how often students switch from academic websites to distraction websites throughout the day — particularly comparing daytime vs. late-night browsing patterns over a 14-day study period.

The collected data is used to compute the Attention Fragmentation Index (AFI):

AFI = Distraction Switches / (Academic Time in Hours)

A higher AFI means more distraction interruptions per hour of academic work.

✨ Features
Feature	Description
🔍 Tab Switch Tracking	Counts every time a user switches from an academic site to a distraction site
⏱️ Time on Tab	Records exact seconds spent on each website before switching
🏷️ Auto Site Categorisation	Automatically classifies sites as Academic, Distraction, or Other
🕐 Hour of Day Tracking	Records which hour each session occurred (0–23) for day vs. night analysis
📅 14-Day Study Period	Tracks which day of the study period each session belongs to
📊 Live Stats Popup	Shows today's switches, academic time, distraction time, and an hourly bar chart
🍅 Pomodoro Timer	Built-in 25/5/15 min Pomodoro study timer with session tracking
💧 Hydration Reminder	Notification every 60 minutes to drink water
👁️ 20-20-20 Eye Rule	Notification every 20 minutes to rest eyes
📥 CSV Export	One-click export of all research data in a clean, analysis-ready format

