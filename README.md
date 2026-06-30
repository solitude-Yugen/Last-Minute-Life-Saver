# ⚡ Last-Minute Life Saver

> **An AI-powered productivity agent that doesn't just remind you — it plans, schedules, and re-plans your work so you never miss a deadline again.**

[![Deployed on Cloud Run](https://img.shields.io/badge/Google%20Cloud%20Run-Deployed-4285F4?logo=google-cloud&logoColor=white)](https://last-minute-life-saver-152362690904.us-central1.run.app)
[![Built with Gemini](https://img.shields.io/badge/Google%20Gemini-2.0--flash-886FBF?logo=google&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](#)
[![Hackathon](https://img.shields.io/badge/Vibe2Ship-Hackathon%202026-FF6B6B)](#)

<br>

## 🎯 The Problem

Students, professionals, and entrepreneurs frequently miss deadlines, assignments, meetings, and important commitments. Existing productivity tools rely on **passive reminders** that are easy to ignore and do nothing to help users actually *complete* their tasks.

## 💡 The Solution

Last-Minute Life Saver is an **AI productivity agent** — not a to-do list. It uses Google Gemini to:

1. **Decompose** complex tasks into 2–5 concrete, actionable subtasks
2. **Estimate** effort for each subtask in minutes
3. **Schedule** subtasks into your real free time slots, prioritized by deadline urgency
4. **Nudge** you with a single "Do This Now" action card — not a passive list
5. **Re-plan autonomously** when you miss a slot — reshuffling your entire schedule and explaining what changed and why

<br>

## 🧠 Agentic Loop — How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User adds   │────▶│  Gemini Agent    │────▶│  Scheduled      │
│  task +      │     │  decomposes,     │     │  subtasks in    │
│  deadline    │     │  estimates,      │     │  free time      │
│              │     │  schedules       │     │  slots          │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                       │
                           ┌───────────────────────────┘
                           ▼
                    ┌──────────────┐     ┌──────────────────────┐
                    │  "Do This    │     │  User marks slot     │
                    │   Now" card  │────▶│  as missed           │
                    │  (nudge)     │     │                      │
                    └──────────────┘     └──────────┬───────────┘
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │  Agent re-plans  │
                                          │  autonomously,   │
                                          │  explains what   │
                                          │  changed & why   │
                                          └──────────────────┘
```

<br>

## 🚀 Live Demo

**👉 [last-minute-life-saver-152362690904.us-central1.run.app](https://last-minute-life-saver-152362690904.us-central1.run.app)**

### Try the demo loop:

1. **Add free time slots** (e.g., 2:00–3:00 PM, 4:00–5:30 PM)
2. **Add a task** with a deadline (e.g., "Prepare presentation" due tonight)
3. Watch the **🧠 AI agent** decompose it into subtasks and schedule them
4. See the **"Do This Now"** nudge card with urgency score
5. Click **"I Missed This"** → watch the agent **re-plan and explain** what it changed

<br>

## 🏗️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **AI Agent** | Google Gemini 2.0 Flash | Structured JSON responses with schema enforcement for reliable UI rendering |
| **Frontend** | React 19 + Vite | Fast, modern SPA with hooks and context |
| **Styling** | Vanilla CSS | Dark glassmorphism theme, micro-animations, responsive |
| **Server** | Express.js | Lightweight static file server for Cloud Run |
| **Deployment** | Google Cloud Run | Serverless, auto-scaling, publicly accessible |

<br>

## 📁 Project Structure

```
src/
├── services/
│   └── gemini.js            # 🧠 AI agent — planTask() & replanAfterMiss()
│                            #    Multi-model fallback chain + local planner
├── context/
│   └── AppContext.jsx       # Global state (useReducer)
├── components/
│   ├── NudgeCard.jsx        # 🔥 Hero "Do This Now" action card
│   ├── TaskForm.jsx         # Task intake (title + deadline)
│   ├── FreeTimeForm.jsx     # Free time slot management
│   ├── TaskList.jsx         # Expandable task cards with subtasks
│   ├── SubtaskTimeline.jsx  # Visual schedule timeline
│   ├── ReplanReport.jsx     # Agent re-plan explanation modal
│   └── AgentThinking.jsx    # AI thinking animation overlay
├── utils/
│   └── helpers.js           # Time formatting, urgency colors
├── App.jsx                  # Dashboard orchestration
├── index.css                # Design system (dark theme, glassmorphism)
└── main.jsx                 # Entry point
```

<br>

## ✨ Key Features

### 🤖 Agentic Task Planning
Gemini doesn't just list subtasks — it **reasons about your schedule**. It considers deadline proximity, total effort vs. available time, and existing commitments to compute an urgency score (0–100) and assign subtasks to your soonest fitting free slot.

### 🔥 Proactive Nudge Card
Not a passive list. A single, prominent card tells you **exactly what to do right now** — with the urgency score, scheduled time, and a direct, action-oriented message from the AI.

### 🔄 Autonomous Re-Planning
When you miss a scheduled slot, the agent **reshuffles all remaining subtasks** across all tasks, re-prioritizes by deadline urgency, updates urgency scores, and explains in plain language what it changed and why:

> *"Moved 'Draft email' to your 4:00 PM slot since 'Prepare slides' has a tighter deadline and needs the 2:00 PM window. Your urgency for the email task increased to 75 since you lost the earlier slot."*

### 🛡️ Resilient AI Architecture
- **Multi-model fallback**: `gemini-2.0-flash` → `gemini-2.0-flash-lite` → `gemini-1.5-flash`
- **Rate-limit-aware retry** with exponential backoff
- **Local fallback planner** generates context-aware plans client-side when API quota is exhausted — the demo always works

### 🎨 Premium Dark UI
Glassmorphism cards, animated urgency glow, pulsing brain animation during planning, slide-in transitions, and a curated color palette — all in vanilla CSS.

<br>

## 🛠️ Run Locally

```bash
# Clone
git clone https://github.com/solitude-Yugen/Last-Minute-Life-Saver.git
cd Last-Minute-Life-Saver

# Install
npm install

# Add your Gemini API key
echo "VITE_GEMINI_API_KEY=your_key_here" > .env

# Run
npm run dev
```

Get a Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

<br>

## ☁️ Deploy to Google Cloud Run

```bash
# Build locally (bakes in the API key from .env)
npm run build

# Deploy (requires gcloud CLI)
gcloud run deploy last-minute-life-saver \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

<br>

## 🏆 Hackathon Alignment (Vibe2Ship 2026)

| Judging Criteria | Weight | How We Address It |
|-----------------|--------|-------------------|
| Problem Solving & Impact | 20% | Directly solves the stated problem — proactive agent, not passive reminders |
| Agentic Depth | 20% | Full agentic loop: decompose → schedule → nudge → re-plan with reasoning |
| Innovation & Creativity | 20% | Urgency-aware scheduling, autonomous re-planning with explanations, resilient fallback architecture |
| Google Technologies | 15% | Gemini 2.0 Flash (structured JSON) + Google Cloud Run |
| Product Experience & Design | 10% | Dark glassmorphism UI, micro-animations, single-page dashboard |
| Technical Implementation | 10% | React Context, structured schemas, multi-model fallback chain |
| Completeness & Usability | 5% | Working end-to-end loop, deployed and publicly accessible |

<br>

---

<p align="center">
  Built with ♥ using Google Gemini AI
  <br>
  <strong>Vibe2Ship Hackathon 2026</strong>
</p>
