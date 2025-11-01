# 🚀 Quick Start Guide - TechStack Mentor

Get your TechStack Mentor application running locally!

---

## ✅ Prerequisites

- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
- **Redis 6+** - [Download](https://redis.io/download)
- **OpenAI API Key** - [Get Key](https://platform.openai.com/api-keys)

---

## 📝 Setup Instructions

### 1. Install PostgreSQL and Redis

Install and start PostgreSQL and Redis on your local machine.

**Create Database:**
```bash
psql -U postgres
CREATE DATABASE techstack_mentor;
\q
```

### 2. Configure Backend

```bash
cd techstack-mentor-backend
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY and PostgreSQL password
```

### 3. Install Backend Dependencies

```bash
pip install uv
uv pip install --system -r requirements.txt
```

### 4. Configure Frontend

```bash
cd techstack-mentor-frontend
echo "VITE_API_BASE_URL=http://localhost:8000" > .env
npm install
```

### 5. Start Services

**Terminal 1 - Backend:**
```bash
cd techstack-mentor-backend
python -m app.main
```

**Terminal 2 - Frontend:**
```bash
cd techstack-mentor-frontend
npm run dev
```

### 6. Access Application

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🐛 Troubleshooting

### Backend Issues

- **Can't connect to PostgreSQL**: Check PostgreSQL is running
- **Can't connect to Redis**: Check Redis is running with `redis-cli ping`
- **Missing modules**: Run `uv pip install --system -r requirements.txt` again

### Frontend Issues

- **API calls failing**: Ensure backend is running on port 8000
- **CORS errors**: Backend CORS is already configured for localhost:5173

---

**🎉 Ready! Visit http://localhost:5173 to start your first interview!**
