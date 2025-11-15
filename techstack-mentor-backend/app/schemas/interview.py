from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class TechStack(str, Enum):
    REACT = "React.js"
    NODE = "Node.js"
    PYTHON = "Python"
    DATABASE = "Database (SQL/PostgreSQL)"
    DEVOPS = "DevOps (Docker, CI/CD)"


class StartInterviewRequest(BaseModel):
    user_id: str = Field(..., description="User identifier")
    tech_stack: TechStack = Field(..., description="Selected tech stack for interview")


class StartInterviewResponse(BaseModel):
    session_id: str
    message: str
    tech_stack: str
    audio_url: Optional[str] = None


class SendMessageRequest(BaseModel):
    session_id: str = Field(..., description="Interview session ID")
    user_message: str = Field(..., description="User's answer to the question")


class SendMessageResponse(BaseModel):
    ai_message: str
    is_complete: bool = False
    question_number: Optional[int] = None
    total_questions: Optional[int] = None


class InterviewStatus(BaseModel):
    session_id: str
    tech_stack: str
    current_question: int
    total_questions: int
    is_complete: bool
    questions: List[str]
    answers: List[str]


class EndInterviewResponse(BaseModel):
    session_id: str
    score: float
    feedback: str
    missed_topics: List[str]
    improvement_areas: str
    total_questions: int
    created_at: datetime
