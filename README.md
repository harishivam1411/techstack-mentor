# 🧠 TechStack Mentor - AI Mock Interviewer

AI-powered mock interview platform that conducts technical interviews, evaluates answers in real-time, and provides personalized feedback to help developers improve their skills.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [API Documentation](#-api-documentation)
- [Configuration](#-configuration)

---

## 🎯 Overview

TechStack Mentor is a full-stack web application that simulates technical interviews using AI. It helps developers:

- **Practice** technical interviews in a stress-free environment
- **Get evaluated** by AI with detailed feedback and scoring
- **Track progress** with historical results and analytics
- **Improve skills** with personalized topic recommendations

### Key Capabilities

- 🤖 **AI-Powered**: Uses OpenAI GPT-4 for dynamic question generation and evaluation
- 💬 **Interactive Chat**: Real-time Q&A interface with markdown support
- 📊 **Smart Evaluation**: Comprehensive scoring with feedback and improvement suggestions
- 💾 **Session Management**: Redis-based caching maintains interview context
- 📈 **Progress Tracking**: PostgreSQL stores all results for historical analysis
- 🎨 **Modern UI**: Beautiful, responsive React interface with TailwindCSS

---

## ✨ Features

### Interview Management

- **5 Tech Stacks**: React.js, Node.js, Python, Database (SQL/PostgreSQL), DevOps (Docker, CI/CD)
- **8 Questions per Interview**: AI generates contextual questions based on your answers
- **Real-time Feedback**: Instant AI responses in a chat-style interface
- **Session Persistence**: Resume interviews even after page refresh (30-min timeout)

### AI Intelligence

- **Dynamic Questions**: AI adapts questions based on previous answers
- **Comprehensive Evaluation**: Scores answers on technical accuracy, depth, and clarity
- **Detailed Feedback**: Paragraph-style feedback highlighting strengths and weaknesses
- **Topic Analysis**: Identifies missed topics and improvement areas

### Analytics & Tracking

- **Results Dashboard**: View all past interview scores and performance
- **Statistics**: Average score, best score, total interviews
- **Suggestions Page**: Personalized learning recommendations
- **Historical Data**: Track improvement over time

---

## 🛠️ Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11+ | Programming language |
| **FastAPI** | 0.115.5 | High-performance web framework |
| **PostgreSQL** | 14+ | Primary database |
| **Redis** | 6+ | Session cache |
| **SQLAlchemy** | 2.0.36 | ORM for database operations |
| **LangChain** | 0.3.13 | LLM framework |
| **OpenAI** | 1.58.1 | GPT-4 API integration |
| **Pydantic** | 2.10.3 | Data validation |
| **uv** | Latest | Ultra-fast package installer |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI library |
| **TypeScript** | 5.7.2 | Type-safe JavaScript |
| **Vite** | 6.0.1 | Build tool & dev server |
| **TailwindCSS** | 3.4.15 | Utility-first CSS framework |
| **Zustand** | 5.0.2 | State management |
| **Axios** | 1.7.9 | HTTP client |
| **React Markdown** | 9.0.1 | Markdown rendering |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- OpenAI API Key

### Installation

**1. Install PostgreSQL and Redis**

Install PostgreSQL and Redis on your local machine and ensure they're running.

**2. Create Database**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE techstack_mentor;
\q
```

**3. Clone and Configure Backend**

```bash
# Navigate to backend
cd techstack-mentor-backend

# Copy environment file
cp .env.example .env

# Edit .env and add:
# - Your OPENAI_API_KEY
# - Your PostgreSQL password in DATABASE_URL
```

**4. Install Backend Dependencies**

```bash
# Install uv (faster than pip)
pip install uv

# Install dependencies
uv pip install --system -r requirements.txt
```

**5. Configure Frontend**

```bash
# Navigate to frontend
cd techstack-mentor-frontend

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:8000" > .env

# Install dependencies
npm install
```

**6. Start Services**

```bash
# Terminal 1: Start backend
cd techstack-mentor-backend
python -m app.main

# Terminal 2: Start frontend
cd techstack-mentor-frontend
npm run dev
```

**7. Access Application**

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📁 Project Structure

```
techstack-mentor/
├── techstack-mentor-backend/       # FastAPI Backend
│   ├── app/
│   │   ├── models/                # SQLAlchemy database models
│   │   ├── routers/               # API endpoints
│   │   ├── schemas/               # Pydantic schemas
│   │   ├── utils/                 # Utilities
│   │   ├── config.py              # Application settings
│   │   ├── database.py            # Database connection
│   │   └── main.py                # FastAPI application
│   ├── requirements.txt           # Python dependencies
│   └── .env.example               # Environment template
│
├── techstack-mentor-frontend/     # React Frontend
│   ├── src/
│   │   ├── components/            # UI components
│   │   ├── pages/                 # Main pages
│   │   ├── services/              # API client
│   │   ├── store/                 # State management
│   │   ├── types/                 # TypeScript types
│   │   └── App.tsx                # Root component
│   ├── package.json               # Node dependencies
│   └── .env.example               # Environment template
│
├── README.md                      # This file
└── QUICKSTART.md                  # Quick setup guide
```

---

## 🔄 How It Works

### Interview Flow

```
1. User starts interview
   ↓
2. Selects tech stack (React, Node, Python, etc.)
   ↓
3. AI generates first question using GPT-4
   ↓
4. User types answer in chat interface
   ↓
5. AI generates next contextual question
   ↓
6. Repeat for 8 questions
   ↓
7. AI evaluates all answers
   ↓
8. Display score, feedback, and suggestions
   ↓
9. Save results to database
```

### Technical Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browser   │──────│   FastAPI   │──────│  OpenAI API │
│  (React)    │ HTTP │  (Backend)  │ HTTP │   (GPT-4)   │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
              ┌─────▼─────┐   ┌────▼────┐
              │   Redis   │   │Postgres │
              │  (Cache)  │   │  (DB)   │
              └───────────┘   └─────────┘
```

### Session Management

- **Redis Cache**: Stores active interview sessions (questions, answers, state)
- **30-min TTL**: Sessions auto-expire after 30 minutes of inactivity
- **Session Recovery**: Page refresh doesn't lose interview progress
- **Context Window**: Last 10 messages passed to LLM for context

---

## 📚 API Documentation

### Base URL

- Development: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs` (Swagger UI)
- ReDoc: `http://localhost:8000/redoc`

### Key Endpoints

#### Start Interview
```http
POST /api/interview/start
Content-Type: application/json

{
  "user_id": "user_123",
  "tech_stack": "React.js"
}
```

#### Send Answer
```http
POST /api/interview/message
Content-Type: application/json

{
  "session_id": "uuid",
  "user_message": "User's answer"
}
```

#### End Interview
```http
POST /api/interview/end/{session_id}

Response: {
  "session_id": "uuid",
  "score": 7.5,
  "feedback": "Detailed feedback...",
  "missed_topics": ["hooks", "context"],
  "improvement_areas": "Focus on..."
}
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create `techstack-mentor-backend/.env`:

```env
# Required
OPENAI_API_KEY=sk-your-openai-api-key-here

# Database (Local PostgreSQL)
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/techstack_mentor

# Redis (Local)
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional Settings
SESSION_TTL=1800                    # Session timeout (seconds)
MAX_QUESTIONS_PER_INTERVIEW=8       # Questions per interview
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
```

### Frontend Environment Variables

Create `techstack-mentor-frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🎓 Learning Outcomes

By studying this project, you'll learn:
- ✅ Building REST APIs with FastAPI
- ✅ LLM integration with LangChain
- ✅ Database design with PostgreSQL
- ✅ Caching strategies with Redis
- ✅ React with TypeScript
- ✅ State management with Zustand
- ✅ Full-stack application architecture

---

## 📞 Support

- **Quick Start**: [QUICKSTART.md](QUICKSTART.md)
- **API Docs**: Visit `/docs` endpoint
- **Issues**: Create an issue on GitHub

---

**Built with ❤️ for developers by developers**

**🚀 Ready to start? Check out [QUICKSTART.md](QUICKSTART.md)**
