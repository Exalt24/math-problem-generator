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

### 🤖 **AI-Powered**
- Google Gemini AI generates unique problems
- Personalized feedback for every answer
- Singapore Math syllabus aligned

</td>
<td width="50%">

### 📱 **User Experience**
- Mobile-first responsive design
- Confetti celebrations 🎉
- Smooth animations throughout

</td>
</tr>
<tr>
<td width="50%">

### ✅ **Smart Features**
- Instant answer validation
- Decimal tolerance handling
- Clear error messages

</td>
<td width="50%">

### ♿ **Accessible**
- ARIA labels & keyboard navigation
- Screen reader support
- Focus management

</td>
</tr>
</table>

### 📚 **Syllabus Coverage**

Primary 5 topics include: **Fractions** • **Decimals** • **Percentages** • **Rate** • **Ratio** • **Volume** • **Area**

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
<td>Next.js API Routes • Google Gemini AI (<code>gemini-2.0-flash</code>)</td>
</tr>
<tr>
<td><strong>Database</strong></td>
<td>Supabase (PostgreSQL with Row Level Security)</td>
</tr>
<tr>
<td><strong>Deployment</strong></td>
<td>Vercel</td>
</tr>
</tbody>
</table>

---

## 🧪 Testing Credentials

> **For assessment and testing purposes only**

```plaintext
Supabase Project URL: https://jrqncyjyykychdjitvxy.supabase.co

Supabase Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpycW5jeWp5eWt5Y2hkaml0dnh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MjM1MzIsImV4cCI6MjA3NjI5OTUzMn0.4xVeUS2zq-08Z-I9qWCV1YXORa-iZXSW97YUjA4J1X4
```

⚠️ **Note:** These credentials enable read/write access to the demo database. In production, more restrictive policies would be implemented.

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

- Create a project at [supabase.com](https://supabase.com)
- Run `database.sql` in SQL Editor
- Copy Project URL and Anon Key from **Settings → API**

#### 4️⃣ Get Google Gemini API Key

- Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
- Create and copy API key

#### 5️⃣ Configure Environment Variables

```bash
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

**.env.local** should contain:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_API_KEY=your_google_api_key
```

#### 6️⃣ Run Development Server

```bash
npm run dev
```

#### 7️⃣ Open Browser

Navigate to: **http://localhost:3000**

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
│
├── app/
│   ├── api/
│   │   └── math-problem/
│   │       ├── generate/
│   │       │   └── route.ts          # 🤖 Problem generation
│   │       └── submit/
│   │           └── route.ts          # ✅ Answer validation
│   ├── page.tsx                      # 🎨 Main UI
│   └── globals.css                   # 💅 Styles + animations
│
├── lib/
│   ├── gemini.ts                     # 🧠 AI client
│   └── supabaseClient.ts             # 💾 Database client
│
├── database.sql                      # 📊 Schema (initial setup)
├── cleanup-database.sql              # 🧹 Data cleanup script
├── test-*.js                         # 🧪 API test scripts
└── .env.local.example                # 🔐 Environment template
```

---

## 🚀 Deployment to Vercel

### Quick Deploy

1. **Push to GitHub**
2. **Import repository** in Vercel
3. **Configure environment variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GOOGLE_API_KEY`
4. **Deploy**
5. **Update demo URL** in README

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

### 💼 Experience Highlights

| Project | Description |
|---------|-------------|
| **RataTutor** | AI-powered study assistant with context management |
| **Blockchain Explorer** | Real-time analytics, 42+ tests, 8-10x optimization |
| **ChatGenie** | Rapid full-stack development (3-day cycles) |

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📝 Assessment Notes

<details>
<summary><strong>🎯 Built for: Ottodot Full Stack Developer Assessment</strong></summary>

<br>

**Timeline:** ~15 hours over 3 days  
**Date:** October 2025

### Requirements Met ✅

- ✅ Next.js 14 + TypeScript + Tailwind CSS
- ✅ Google Gemini AI integration (generation + feedback)
- ✅ Supabase database with proper schema
- ✅ Mobile-responsive UI
- ✅ Complete user flow tested
- ✅ Production-ready error handling
- ✅ Public GitHub repository
- ✅ Vercel deployment

</details>

---

<div align="center">

**Built with ❤️ for Singapore Primary 5 students**

⭐ Star this repo if you found it helpful!

</div>