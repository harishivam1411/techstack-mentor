from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.database import init_db
from app.routers import interview_router, results_router, suggestions_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database
    print("Initializing database...")
    init_db()
    print("Database initialized successfully!")
    yield
    # Shutdown: cleanup if needed
    print("Shutting down...")


app = FastAPI(
    title="TechStack Mentor API",
    description="AI-powered mock interview platform for technical assessments",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - Must be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(interview_router)
app.include_router(results_router)
app.include_router(suggestions_router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to TechStack Mentor API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/interview/health"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "TechStack Mentor API"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.backend_port,
        reload=True if settings.environment == "development" else False
    )
