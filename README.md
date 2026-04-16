<div align="center">

# GitConsistent

**A premium habit tracking system—built like a developer tool.**

Track your habits with the same visual language you use to track your code. GitHub-style contribution graphs, an AI coach, weekly insights, and a daily journal—all in one hyper-minimal, dark-first interface.

[Live Demo](#) · [Report Bug](https://github.com/tamatar-23/gitconsistent/issues) · [Request Feature](https://github.com/tamatar-23/gitconsistent/issues)

</div>

---

## ✦ Overview

GitConsistent reframes habit tracking as a discipline metric rather than a to-do list. Instead of checkboxes and streaks hidden behind a gamified UI, it surfaces your consistency data as a **contribution graph**—the same visual system developers already associate with meaningful daily output.

The result is a productivity tool that feels native to how builders think: data-first, minimal, and honest.

---

## ✦ Features

### Global Activity Heatmap
A GitHub-inspired contribution graph spanning your full yearly or last-12-month habit history. Each cell represents a day; color intensity maps to your total completions. Hover any cell for an exact breakdown.

- **Year in Review** side panel: Total Completions, Daily Average, Most Active Day, Busiest Month—all computed live from your log data.
- Period selector: toggle between *Last 12 Months* and the current calendar year.
- 1px-gapped dense grid with smooth tooltips.

### Habit Management
- Create habits with daily or weekly frequency and custom target days.
- Apple-style circular checkmark buttons with completion animations.
- Per-habit streak tracking visible directly in the sidebar.
- Archive habits you want to pause without deleting your history.

### AI Habit Coach
A conversational AI coach powered by **Groq (Llama 3.3 70B)**. Ask anything about habit formation, procrastination, focus, or your consistency patterns. Responses are kept intentionally short and actionable.

- Floating glassmorphic "Omnibar" input.
- Spring-physics animated chat bubbles (Framer Motion).
- Suggestion cards on the empty state for quick entry.
- Full conversation history maintained per session.

### Insights
An AI-generated periodic analysis of your habit data—summarized in a concise, scannable Markdown report. Covers: Overall Summary, Key Strengths, Actionable Advice.

- Choose between weekly and monthly analysis windows.
- Rendered with rich Markdown typography.

### Journal
A daily free-write journal with AI-powered reflection analysis. Each entry is stored in Firestore and can be analyzed on demand.

### Sidebar
A collapsible left-panel with:
- Real-time today's habit checklist (toggle completions without leaving any page).
- **Weekly Progress** micro-chart: 7 slim pill-bars, one per day, filling proportionally to your completion rate.
- A daily rotating Stoic quote.
- Quick access to Archived Habits.

### Theme
Full light/dark mode support via `next-themes`, with a carefully tuned HSL color system for both modes.

---

## ✦ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v3 + `tailwindcss-animate` |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Auth** | Firebase Authentication (Google OAuth) |
| **Database** | Firebase Firestore (real-time listeners) |
| **AI / LLM** | [Groq SDK](https://groq.com/) — `llama-3.3-70b-versatile` |
| **Forms** | React Hook Form + Zod validation |
| **Date Handling** | date-fns |
| **Icons** | Lucide React |
| **Markdown** | react-markdown |
| **Theming** | next-themes |
| **Font** | Plus Jakarta Sans (CDN) |

---

## ✦ Project Structure

```
src/
├── app/
│   ├── (auth)/          # Sign-in page
│   ├── (main)/
│   │   ├── dashboard/   # Main habit dashboard + contribution graph
│   │   ├── coach/       # AI Chat Interface
│   │   ├── insights/    # AI-generated habit analysis
│   │   ├── journal/     # Daily journaling
│   │   ├── archive/     # Archived habits
│   │   ├── actions.ts   # All Next.js Server Actions
│   │   └── layout.tsx   # Main app shell with sidebar
│   ├── globals.css      # Design tokens, CSS variables
│   └── layout.tsx       # Root layout with font + theme provider
│
├── ai/
│   └── flows/
│       ├── habit-coach-tips.ts      # AI Coach Groq flow
│       ├── habit-insights-flow.ts   # AI Insights Groq flow
│       └── journal-analysis-flow.ts # Journal AI flow
│
├── components/
│   ├── coach/           # ChatInterface component
│   ├── habits/          # HabitContributionGraph, HabitListItem, etc.
│   ├── layout/          # Sidebar, WeeklyProgressChart, HabitSidebarItem
│   ├── icons/           # GitConsistentLogo
│   └── ui/              # shadcn/ui base components
│
├── hooks/               # useAuth, useToast
├── lib/                 # Firebase init, utils (cn)
└── types/               # Habit, HabitLog, ContributionDay types
```

---

## ✦ Getting Started

### Prerequisites

- Node.js 20+
- A Firebase project with **Authentication** and **Firestore** enabled
- A [Groq API key](https://console.groq.com/)

### 1. Clone the repo

```bash
git clone https://github.com/tamatar-23/gitconsistent.git
cd gitconsistent
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Groq AI
GROQ_API_KEY=your_groq_api_key
```

### 4. Set up Firestore

Enable Firestore in your Firebase console and set up the following security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /habits/{habitId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /habitLogs/{logId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /journals/{journalId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## ✦ Design Philosophy

GitConsistent is built around **"Calm Discipline"**—a design language that treats screen space as precious and visual noise as a failure state.

- **Dark-first**: The default experience is a near-black `hsl(220, 12%, 7%)` background. Light mode is available but secondary.
- **Flat over decorative**: No heavy gradients, no glow effects on non-interactive elements. Depth is communicated through transparency and subtle borders.
- **Glass over solid**: Cards use `bg-card/50 backdrop-blur-sm` to feel part of the background rather than stacked on top of it.
- **Typography over decoration**: Hierarchy is established through size, weight, and letter-spacing—not color alone.
- **Motion with purpose**: Framer Motion is used for spring-physics interactions (chat bubbles, page transitions) not cosmetic flair.

---

## ✦ License

MIT © [tamatar-23](https://github.com/tamatar-23)