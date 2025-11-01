from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ResultResponse(BaseModel):
    id: int
    user_id: str
    session_id: str
    tech_stack: str
    score: float
    feedback: Optional[str]
    total_questions: int
    correct_answers: int
    created_at: datetime

    class Config:
        from_attributes = True


class ResultListResponse(BaseModel):
    results: List[ResultResponse]
    total: int
