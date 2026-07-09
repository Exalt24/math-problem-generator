# 🎓 AI Math Problem Generator

> An AI-powered math word problem generator for Primary 5 students (ages 10-11) aligned with Singapore's Mathematics syllabus.

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.18-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

### **[🚀 View Live Application →](https://math-problem-generator-one.vercel.app/)**

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🤖 **AI-Powered Generation**
- Google Gemini 2.0 Flash generates unique problems
- Personalized, encouraging feedback
- Singapore Math syllabus aligned
- Context-aware problem generation

</td>
<td width="50%">

### 🎯 **Three Difficulty Levels**
- **🌱 Easy:** Basic operations (fractions, decimals)
- **⭐ Medium:** Multi-step problems (rate, ratio)  
- **🔥 Hard:** Complex word problems (volume, speed)

</td>
</tr>
<tr>
<td width="50%">

### 💡 **Progressive Hints System**
- 3 AI-generated hints per problem
- Guides without revealing the answer
- Tracks hint usage in database
- Helps students learn problem-solving

</td>
<td width="50%">

### 📊 **Answer History**
- View all previous attempts
- Track correctness over time
- See hints used per submission
- Visual indicators for correct/incorrect

</td>
</tr>
<tr>
<td width="50%">

### 📱 **Exceptional UX**
- Mobile-first responsive design
- Confetti celebrations 🎉 for correct answers
- Smooth animations & transitions
- Loading states & error handling

</td>
<td width="50%">

### ♿ **Accessibility First**
- ARIA labels & semantic HTML
- Keyboard navigation support
- Screen reader compatible
- Focus management

</td>
</tr>
</table>

### 📚 **Syllabus Coverage**

**Primary 5 topics:** Fractions • Decimals • Percentages • Rate • Ratio • Volume • Area • Perimeter • Speed • Distance • Time

---

## 🛠️ Technology Stack

<table>
<thead>
<tr>
<th>Category</th>
<th>Technologies</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Frontend</strong></td>
<td>Next.js 14 (App Router) • TypeScript • Tailwind CSS • Canvas Confetti</td>
</tr>
<tr>
<td><strong>Backend</strong></td>
<td>Next.js API Routes • Google Gemini AI (<code>gemini-2.0-flash-exp</code>)</td>
</tr>
<tr>
<td><strong>Database</strong></td>
<td>Supabase (PostgreSQL) • Row Level Security</td>
</tr>
<tr>
<td><strong>Deployment</strong></td>
<td>Vercel (Edge Runtime)</td>
</tr>
<tr>
<td><strong>Testing</strong></td>
<td>Node.js Test Scripts • Manual QA</td>
</tr>
</tbody>
</table>

---

## 🧪 Testing Setup

> **For assessment and testing purposes**

To run the app or the automated test scripts, copy `.env.local.example` to `.env.local` and fill in your own Supabase and Google Gemini credentials. The full walkthrough is in [Local Setup](#-local-setup) below.

---

## 📦 Local Setup

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **Supabase account** (free tier)
- **Google AI Studio API key** (free tier)

### Installation Steps

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Exalt24/math-problem-generator.git
cd math-problem-generator
```

#### 2️⃣ Install Dependencies

```bash
npm install
```

#### 3️⃣ Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Navigate to **SQL Editor**
3. Run `database.sql` to create tables
4. Copy **Project URL** and **Anon Key** from **Settings → API**

#### 4️⃣ Get Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Get API Key**
3. Create and copy your key

#### 5️⃣ Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_API_KEY=your_google_gemini_api_key
```

#### 6️⃣ Run Development Server

```bash
npm run dev
```

#### 7️⃣ Open Browser

Navigate to: **http://localhost:3000**

---

## 🧪 Testing

### Manual Testing (Browser)

```bash
npm run dev
# Open http://localhost:3000
```

**Test checklist:**
- ✅ Generate problems across all difficulty levels
- ✅ Submit correct and incorrect answers
- ✅ Use hint system (3 hints per problem)
- ✅ View answer history
- ✅ Test mobile responsiveness
- ✅ Verify confetti animation on correct answers

### Automated API Testing

Five comprehensive test scripts are provided in the `/tests` folder:

#### **Quick Test: All Difficulties**
```bash
node tests/test-all-difficulties.js
```
Generates one problem per difficulty level.

#### **Test Generate API**
```bash
node tests/test-generate.js [difficulty]
# Examples:
node tests/test-generate.js easy
node tests/test-generate.js medium
node tests/test-generate.js hard
```

#### **Test Complete Flow**
```bash
node tests/test-submit.js
```
Tests generate + submit flow with retry logic for all difficulty levels.

#### **Test Sequential (Reliable)**
```bash
node tests/test-submit-sequential.js
```
Slower but more reliable testing with 5-second delays (avoids rate limiting).

#### **Test Single Submission**
```bash
node tests/test-submit-simple.js <sessionId> <answer>
# Example:
node tests/test-submit-simple.js "abc-123-def-456" 42
```

#### **Test Hints & History**
Test these features manually in the browser UI.

### Database Verification

**View data in Supabase:**
1. Open Supabase Dashboard → Table Editor
2. Check `math_problem_sessions` for generated problems
3. Check `math_problem_submissions` for answer submissions
4. Verify `difficulty` and `hints_used` columns are populated

**Clean database (reset data):**
```bash
# Run cleanup-database.sql in Supabase SQL Editor
```
This removes all data while preserving table structure.

---

## 📁 Project Structure

```
math-problem-generator/
│
├── app/
│   ├── api/
│   │   └── math-problem/
│   │       ├── generate/
│   │       │   └── route.ts          # 🤖 Problem generation + hints
│   │       └── submit/
│   │           └── route.ts          # ✅ Answer validation + feedback
│   ├── page.tsx                      # 🎨 Main UI (difficulty, hints, history)
│   ├── layout.tsx                    # 📐 Root layout
│   └── globals.css                   # 💅 Styles + animations
│
├── lib/
│   ├── gemini.ts                     # 🧠 AI client configuration
│   └── supabaseClient.ts             # 💾 Database client
│
├── migrations/                       # 🔄 Database migrations
│
├── tests/                            # 🧪 API test scripts (5 files)
│   ├── test-all-difficulties.js
│   ├── test-generate.js
│   ├── test-submit.js
│   ├── test-submit-sequential.js
│   └── test-submit-simple.js
│
├── database.sql                      # 📊 Initial schema setup
├── cleanup-database.sql              # 🧹 Data cleanup script
├── .env.local.example                # 🔐 Environment template
├── LICENSE                           # 📄 MIT License
└── README.md                         # 📖 This file
```

---

## 🚀 Deployment to Vercel

### Quick Deploy

1. **Push to GitHub** (ensure `.env.local` is gitignored)
2. **Import repository** at [vercel.com](https://vercel.com)
3. **Configure environment variables:**
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   GOOGLE_API_KEY
   ```
4. **Deploy** (Vercel auto-detects Next.js)
5. **Test production** deployment

### Deployment URL

**Production:** https://math-problem-generator-one.vercel.app/

---

## 👨‍💻 Developer

<div align="center">

### **Daniel Alexis Cruz**
*Full Stack Developer*

[![GitHub](https://img.shields.io/badge/GitHub-Exalt24-181717?style=for-the-badge&logo=github)](https://github.com/Exalt24)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-dacruz24-0077B5?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/dacruz24)

</div>

### 💼 Relevant Experience

| Project | Key Achievements | Relevance to This Project |
|---------|------------------|---------------------------|
| **RataTutor** | AI-powered study assistant with context management, multi-format file processing, flashcard/quiz generation | Direct AI integration experience, educational technology focus |
| **Blockchain Explorer** | Real-time analytics dashboard, 42+ automated tests, 8-10x cache optimization | Production-quality error handling, comprehensive testing, performance optimization |
| **ChatGenie** | Built complete full-stack applications in 3-day cycles (Vue.js + Ruby on Rails) | Rapid full-stack delivery under time pressure while maintaining quality |

**Skills Demonstrated in This Project:**
- ✅ Next.js 14 App Router with TypeScript
- ✅ AI integration (Google Gemini API) with prompt engineering
- ✅ Database design (PostgreSQL via Supabase)
- ✅ RESTful API development
- ✅ Mobile-first responsive design
- ✅ Production-ready error handling
- ✅ Systematic testing approach

---

## 💡 Implementation Highlights

### AI Prompt Engineering
- **Problem Generation:** Structured prompts ensure Singapore Math alignment and age-appropriate language
- **Hints System:** Progressive hints that guide without revealing answers
- **Feedback Generation:** Context-aware, encouraging feedback tailored to student's answer

### Database Design
- **Sessions Table:** Stores problems with difficulty and hints
- **Submissions Table:** Tracks answers with correctness and hints used
- **Foreign Key Relationships:** Ensures data integrity

### Error Handling
- **Retry Logic:** Automatic retries for transient API failures
- **User Feedback:** Clear error messages for all failure scenarios
- **Graceful Degradation:** Application remains functional during partial failures

### Performance Optimizations
- **Lazy Loading:** Components load on-demand
- **Optimistic UI:** Instant feedback before API confirmation
- **Edge Runtime:** Fast response times via Vercel Edge

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📝 Assessment Notes

<details>
<summary><strong>🎯 Built for: Ottodot Full Stack Developer Assessment</strong></summary>

<br>

**Date:** October 2025

### Core Requirements ✅

- ✅ Next.js 14 with App Router
- ✅ TypeScript (strict mode)
- ✅ Tailwind CSS styling
- ✅ Google Gemini AI integration
- ✅ Supabase database with RLS
- ✅ Mobile-responsive design
- ✅ Complete user flow tested
- ✅ Production-ready error handling
- ✅ Public GitHub repository
- ✅ Vercel deployment

### Optional Enhancements Implemented ✅

- ✅ **Difficulty Levels:** Three tiers (easy/medium/hard)
- ✅ **Hints System:** Progressive AI-generated hints
- ✅ **Answer History:** Track all submissions
- ✅ **Enhanced UX:** Confetti, animations, accessibility
- ✅ **Comprehensive Testing:** 5 test scripts + manual QA
- ✅ **Database Migrations:** Systematic schema management

</details>

---

<div align="center">

**Built with ❤️ for Singapore Primary 5 students**

⭐ **Star this repo if you found it helpful!**

</div>