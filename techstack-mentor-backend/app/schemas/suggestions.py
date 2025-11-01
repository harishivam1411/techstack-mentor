from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class SuggestionResponse(BaseModel):
    id: int
    user_id: str
    tech_stack: str
    missed_topics: Optional[List[str]]
    improvement_areas: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
