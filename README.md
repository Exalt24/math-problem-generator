# 🎓 AI Math Problem Generator

An AI-powered math word problem generator for Primary 5 students (ages 10-11) aligned with Singapore's Mathematics syllabus. Built for Ottodot's Full Stack Developer Assessment.

[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.18-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Live Demo

**[View Live Application →](#)** *(Will be updated after Vercel deployment)*

---

## ✨ Features

- **🤖 AI-Powered Generation** - Google Gemini AI creates unique, age-appropriate math word problems
- **📝 Instant Feedback** - Personalized, encouraging feedback for every answer
- **✅ Smart Validation** - Accurate answer checking with decimal tolerance
- **💾 Database Persistence** - All problems and submissions saved to Supabase
- **🎯 Singapore Math Aligned** - Covers Primary 5 syllabus topics (fractions, decimals, percentages, rate, ratio, volume, area)
- **🎉 Engaging UX** - Confetti celebrations, smooth animations, kid-friendly design
- **📱 Mobile-First** - Fully responsive across all devices
- **♿ Accessible** - ARIA labels, keyboard navigation, screen reader support

---

## 🛠️ Technology Stack

**Frontend:** Next.js 14 (App Router) • TypeScript • Tailwind CSS • Canvas Confetti  
**Backend:** Next.js API Routes • Google Gemini AI (`gemini-2.0-flash`)  
**Database:** Supabase (PostgreSQL with Row Level Security)  
**Deployment:** Vercel

---

## 🧪 Testing Credentials

**For assessment and testing purposes only:**

```
Supabase Project URL: https://jrqncyjyykychdjitvxy.supabase.co
Supabase Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpycW5jeWp5eWt5Y2hkaml0dnh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MjM1MzIsImV4cCI6MjA3NjI5OTUzMn0.4xVeUS2zq-08Z-I9qWCV1YXORa-iZXSW97YUjA4J1X4
```

> **Note:** These credentials enable read/write access to the demo database. In production, more restrictive policies would be implemented.

---

## 📦 Local Setup

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- A Supabase account (free tier)
- A Google AI Studio API key (free tier)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Exalt24/math-problem-generator.git
   cd math-problem-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Run `database.sql` in SQL Editor
   - Copy Project URL and Anon Key from Settings → API

4. **Get Google Gemini API key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create and copy API key

5. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your credentials
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

7. **Open browser**
   ```
   http://localhost:3000
   ```

---

## 🧪 Testing

### Manual Testing
```bash
npm run dev
# Test in browser: http://localhost:3000
```

### API Testing
```bash
# Test problem generation
node test-generate.js

# Test complete flow
node test-submit.js

# Test single submission
node test-submit-simple.js <sessionId> <answer>
```

### Database Cleanup
Run `cleanup-database.sql` in Supabase SQL Editor to reset all data while preserving table structure.

---

## 📁 Project Structure

```
math-problem-generator/
├── app/
│   ├── api/math-problem/
│   │   ├── generate/route.ts     # Problem generation
│   │   └── submit/route.ts       # Answer validation
│   ├── page.tsx                  # Main UI
│   └── globals.css               # Styles + animations
├── lib/
│   ├── gemini.ts                 # AI client
│   └── supabaseClient.ts         # Database client
├── database.sql                  # Schema (initial setup)
├── cleanup-database.sql          # Data cleanup script
├── test-*.js                     # API test scripts
└── .env.local.example            # Environment template
```

---

## 🚀 Deployment to Vercel

1. Push to GitHub
2. Import repository in Vercel
3. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GOOGLE_API_KEY`
4. Deploy
5. Update demo URL in README

---

## 👨‍💻 Developer

**Daniel Alexis Cruz**  
Full Stack Developer

[![GitHub](https://img.shields.io/badge/GitHub-Exalt24-181717?style=flat&logo=github)](https://github.com/Exalt24)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-dacruz24-0077B5?style=flat&logo=linkedin)](https://linkedin.com/in/dacruz24)

### Experience Highlights
- **RataTutor** - AI-powered study assistant with context management
- **Blockchain Explorer** - Real-time analytics, 42+ tests, 8-10x optimization
- **ChatGenie** - Rapid full-stack development (3-day cycles)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 📝 Assessment Notes

**Built for:** Ottodot Full Stack Developer Assessment  
**Timeline:** ~15 hours over 3 days  
**Date:** October 2025

**Requirements Met:**
- ✅ Next.js 14 + TypeScript + Tailwind CSS
- ✅ Google Gemini AI integration (generation + feedback)
- ✅ Supabase database with proper schema
- ✅ Mobile-responsive UI
- ✅ Complete user flow tested
- ✅ Production-ready error handling
- ✅ Public GitHub repository
- ✅ Vercel deployment (pending)

---

**Built with ❤️ for Singapore Primary 5 students**