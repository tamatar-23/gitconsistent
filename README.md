# GitConsistent 

> Transform your habits into visual progress with GitHub-style tracking and AI-powered insights

##  Overview

GitConsistent is a modern habit tracking web application that gamifies your daily routines using GitHub's iconic contribution graph visualization. More than just tracking, it provides AI-powered insights, coaching, and journaling features to help you build lasting habits and understand your progress patterns.

##  Features

###  GitHub-Style Habit Tracking
- **Visual Progress**: Track your habits with an intuitive GitHub contributions-style heatmap
- **Streak Tracking**: Monitor your consistency streaks and celebrate milestones
- **Multiple Habits**: Track unlimited habits simultaneously with individual progress visualization

###  AI-Powered Insights
- **Weekly AI Reports**: Get personalized insights about your habit patterns and performance
- **Intelligent Analysis**: Understand your consistency trends, peak performance days, and areas for improvement
- **Data-Driven Recommendations**: Receive actionable suggestions based on your tracking history

###  ️ AI Coach & Therapist
- **Personal Coaching**: Get motivational support and guidance tailored to your habit-building journey
- **Therapeutic Conversations**: Access AI-powered emotional support and habit-related stress management
- **Personalized Strategies**: Receive custom advice for overcoming obstacles and maintaining consistency

###  Smart Journaling System
- **Daily Reflections**: Write and store personal journal entries about your habit journey
- **AI Summaries**: Get intelligent summaries of your journal entries to track emotional and mental progress
- **Progress Correlation**: Connect your journal insights with habit tracking data for deeper self-understanding

###  Dynamic Landing Page
- **Engaging UI**: Modern, responsive design that adapts to all devices
- **Interactive Elements**: Dynamic components that showcase the app's capabilities
- **Smooth User Experience**: Seamless navigation and intuitive user interface

##   Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Firebase Authentication & Firestore Database
- **Deployment**: Vercel (recommended)
- **AI Integration**: Google Gemini API for insights and coaching features

##  Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project set up
- Gemini API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tamatar-23/gitconsistent.git
   cd gitconsistent
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Gemini Configuration (for AI features)
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📱 Usage

### Getting Started
1. **Sign Up**: Create an account using email or Google authentication
2. **Add Habits**: Define the habits you want to track
3. **Daily Check-ins**: Mark your habits as complete each day
4. **View Progress**: Watch your GitHub-style contribution graph fill up
5. **AI Insights**: Check your weekly AI-generated reports and coaching sessions

### Key Features Walkthrough
- **Dashboard**: Your main hub showing all habits and overall progress
- **Habit Tracker**: GitHub-style grid showing your consistency over time
- **AI Coach**: Chat with your personal AI coach for motivation and advice
- **Analytics**: Detailed insights and patterns in your habit data
- **Journal**: Write daily reflections and get AI-powered summaries

##  Acknowledgments

- GitHub for the inspiration behind the contribution graph visualization
- The open-source community for the amazing tools and libraries
- shadcn/ui for the beautiful component library
- Firebase for providing robust backend services

##  Contact

**Developer**: tamatar-23  
**Project Link**: [https://github.com/tamatar-23/gitconsistent](https://github.com/tamatar-23/gitconsistent)

---

 Star this repository if you found it helpful!

*Building consistent habits, one day at a time* 🌱