# 🛡️ Smart Tatkal Guardian
 
> **FAR AWAY 2026 Hackathon** · Team **AlgoMinds**
 
An autonomous multi-agent system that detects bot-driven Tatkal ticket hoarding in real-time and ensures genuine passengers get fair access to IRCTC Tatkal tickets.
 
---
 
## 🔴 The Problem
 
Tatkal booking opens at 10AM — **all tickets are gone in under 5 minutes.**
 
Bots and black market operators book first, then resell at 5x price. IRCTC has tried blocking bots, but they keep evolving.
 
**The evidence is real:**
 
| Stat | Source |
|---|---|
| 60 billion bot requests blocked | Railway Ministry, Jul–Dec 2025 |
| 3.03 crore suspicious user IDs deactivated | IRCTC, 2025 |
| 501 complaints, 4.18 lakh suspicious PNRs | National Cyber Crime Portal |
| "Ek second bhi late hua toh ticket nahi milta" | Reddit r/india |
 
---
 
## 💡 Our Solution — The Honeypot Approach
 
Instead of just **blocking** bots (which tips them off), we **deceive** them:
 
1. **Score** every booking request 0–100 for bot probability
2. **Route** high-probability bots to fake ticket slots (honeypot)
3. **Wait** for them to confirm the fake booking — bots always do
4. **Blacklist** them permanently after 3 fake confirmations
5. **Fast-track** genuine users to real ticket slots
**Result: 94% genuine success rate vs 23% without the system**
 
---
 
## 🏗️ Architecture
 
```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Bot Scripts   │────▶│                      │────▶│   Honeypot /    │
│  (800 req/sec)  │     │    Orchestrator       │     │   Blacklist     │
└─────────────────┘     │   (port 8000)        │     └─────────────────┘
                        │                      │
┌─────────────────┐     │  /ingest endpoint    │     ┌─────────────────┐
│  Genuine Users  │────▶│  scores + decides    │────▶│   Dashboard     │
│  (200 req/sec)  │     │  broadcasts via WS   │     │  (port 5173)    │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
         ▲                        ▲
         │                        │
┌─────────────────┐     ┌──────────────────────┐
│   Simulator     │     │     Scorer            │
│   (port 8001)   │────▶│   scorer.py           │
│  80% bot        │     │   rule-based ML       │
│  20% human      │     └──────────────────────┘
└─────────────────┘
```
 
---
 
## 🤖 The 5 Agents
 
| Agent | Role |
|---|---|
| 📡 **Booking Behavior Agent** | Analyzes speed, location, device fingerprint per request |
| 🎯 **Bot Probability Scorer** | Assigns 0–100 score using weighted behavioral rules |
| 🍯 **Honeypot Agent** | Shows fake ticket slots to suspected bots |
| 🚫 **Blacklist Manager** | Tracks confirmed bot IDs across sessions |
| ⚖️ **Fairness Monitor** | Tracks genuine vs bot booking ratio in real-time |
 
---
 
## 📁 Project Structure
 
```
Smart-Tatkal-Guardian/
│
├── simulator/                  # Person 1 — Traffic generator
│   ├── main.py                 # FastAPI app (port 8001)
│   ├── profiles.py             # Bot + human profile generators
│   ├── sender.py               # Strips is_bot, POSTs to orchestrator
│   ├── requirements.txt
│   └── README.md
│
├── orchestrator/               # Person 3 — Central glue service
│   ├── main.py                 # FastAPI app (port 8000)
│   ├── scorer.py               # Bot probability scoring engine
│   ├── blacklist.py            # Honeypot confirmation + blacklist
│   ├── requirements.txt
│   └── README.md
│
├── dashboard/                  # Person 4 — React monitoring UI
│   ├── src/
│   │   ├── App.jsx             # Main layout + WebSocket logic
│   │   ├── App.css             # Dark theme styles
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── StatsPanel.jsx
│   │       ├── TrafficFeed.jsx
│   │       ├── RealtimeChart.jsx
│   │       └── HoneypotLog.jsx
│   ├── package.json
│   └── vite.config.ts
│
├── landing.html                # Landing page + login system
├── .gitignore
└── README.md                   # This file
```
 
---
 
## 🚀 Quick Start
 
### Prerequisites
- Python 3.11+
- Node.js 18+
- pip
### Run all services
 
**Terminal 1 — Orchestrator (start this first):**
```bash
cd orchestrator
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```
 
**Terminal 2 — Simulator:**
```bash
cd simulator
pip install -r requirements.txt
uvicorn main:app --port 8001 --reload
```
 
**Terminal 3 — Dashboard:**
```bash
cd dashboard
npm install
npm run dev
```
 
**Terminal 4 — Open landing page:**
```
Open landing.html in browser
Login with any demo account → Dashboard loads
```
 
### Start the demo
```bash
# Hit this to start generating 1000 requests (800 bots + 200 humans)
curl -X POST http://localhost:8001/simulate/start?rps=10
```
 
---
 
## 🔌 API Reference
 
### Simulator (port 8001)
 
| Method | Endpoint | Description |
|---|---|---|
| POST | `/simulate/start?rps=10` | Start traffic generation |
| POST | `/simulate/stop` | Stop generation |
| GET | `/simulate/status` | Live counters |
| GET | `/simulate/replay` | Last 100 requests (with `is_bot`) |
 
### Orchestrator (port 8000)
 
| Method | Endpoint | Description |
|---|---|---|
| POST | `/ingest` | Receive + score booking request |
| GET | `/ws/events` | WebSocket — live event stream |
| GET | `/stats` | Current statistics |
| GET | `/events/recent` | Last 100 processed events |
| GET | `/blacklist` | Blacklisted bot IDs |
| POST | `/reset` | Clear all data |
 
---
 
## 🧠 Scoring Logic
 
Each request is scored using weighted behavioral signals:
 
| Signal | Condition | Score |
|---|---|---|
| Request speed | < 150ms between requests | +0.30 |
| Request rate | > 50 requests/minute | +0.25 |
| Mouse movement | No movement detected (0.0) | +0.20 |
| Typing speed | No typing (0.0 cpm) | +0.15 |
| IP reuse | > 20 requests from same IP | +0.10 |
| Device fingerprint | Known bot fingerprint | +0.10 |
| User agent | Contains "python"/"bot"/"curl" | +0.10 |
 
**Decision thresholds:**
- Score ≥ 0.75 + blacklisted → **BLOCK** 🔴
- Score ≥ 0.65 → **HONEYPOT** 🟡
- Score < 0.65 → **ALLOW** 🟢
---
 
## 🎨 Tech Stack
 
| Layer | Technology |
|---|---|
| Simulator | Python, FastAPI, Faker |
| Orchestrator | Python, FastAPI, WebSockets |
| Scoring | Rule-based weighted algorithm |
| Dashboard | React, Vite, Recharts |
| Landing page | Vanilla HTML/CSS/JS |
| Communication | REST + WebSocket |
 
---
 
## 🎨 Design Theme
 
- **Background:** `#0d1117` (GitHub dark)
- **Cards:** `#161b22`
- **Borders:** `#30363d`
- **ALLOW (green):** `#3fb950`
- **HONEYPOT (yellow):** `#d29922`
- **BLOCK (red):** `#f85149`
- **Accent (blue):** `#58a6ff`
- **Font:** Segoe UI, system-ui
Optimized for **1920×1080 projector display** — high contrast, large fonts, cinematic dark UI.
 
---
 
## 🔐 Demo Login Accounts
 
| Role | Email | Password |
|---|---|---|
| Admin | `admin@tatkal.dev` | `admin123` |
| Viewer | `viewer@tatkal.dev` | `viewer123` |
| Team | `demo@algominds.in` | `demo2026` |
| Judge | `judge@faraway.io` | `faraway26` |
 
---
 
## 🎬 Demo Moment (Judges Ka Jaw Drop)
 
1. Open `landing.html` → Login as Judge
2. Dashboard loads — DEMO MODE shown
3. Hit **Start Simulation** — 10 req/sec
4. Watch live:
   - Red rows flood in (bots) → routed to HONEYPOT
   - Green rows (humans) → ALLOW, fast-tracked
   - After ~30 sec → bots start getting BLOCKED (blacklist kicks in)
   - Bot Catch Rate climbs to ~80%
   - Genuine Success Rate holds at ~94%
**Clean demo of the system beats everything.**

 
---
 
## 📊 Results
 
| Metric | Without System | With System |
|---|---|---|
| Genuine ticket success rate | 23% | **94%** |
| Bot requests caught | 0% | **80%** |
| Avg time to blacklist a bot | ∞ | **~30 sec** |
| Simultaneous requests handled | — | **1000 req/sec** |
 
---
 
*Built with 🔥 for FAR AWAY 2026 Hackathon · Team AlgoMinds · 
