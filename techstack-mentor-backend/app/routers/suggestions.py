from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from app.schemas.suggestions import SuggestionResponse
from app.database import get_db
from app.models.user_suggestions import UserSuggestion

router = APIRouter(prefix="/api/suggestions", tags=["suggestions"])


@router.get("/{user_id}", response_model=List[SuggestionResponse])
async def get_user_suggestions(user_id: str, limit: int = 10, db: Session = Depends(get_db)):
    """Get all improvement suggestions for a specific user"""
    suggestions = db.query(UserSuggestion).filter(
        UserSuggestion.user_id == user_id
    ).order_by(
        desc(UserSuggestion.created_at)
    ).limit(limit).all()

    return [SuggestionResponse.model_validate(s) for s in suggestions]


@router.get("/latest/{user_id}", response_model=SuggestionResponse)
async def get_latest_suggestion(user_id: str, db: Session = Depends(get_db)):
    """Get the most recent suggestion for a user"""
    suggestion = db.query(UserSuggestion).filter(
        UserSuggestion.user_id == user_id
    ).order_by(
        desc(UserSuggestion.created_at)
    ).first()

    if not suggestion:
        raise HTTPException(status_code=404, detail="No suggestions found for this user")

    return SuggestionResponse.model_validate(suggestion)


@router.get("/tech-stack/{user_id}/{tech_stack}", response_model=List[SuggestionResponse])
async def get_suggestions_by_tech_stack(
    user_id: str,
    tech_stack: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get suggestions for a specific user and tech stack"""
    suggestions = db.query(UserSuggestion).filter(
        UserSuggestion.user_id == user_id,
        UserSuggestion.tech_stack == tech_stack
    ).order_by(
        desc(UserSuggestion.created_at)
    ).limit(limit).all()

    return [SuggestionResponse.model_validate(s) for s in suggestions]
