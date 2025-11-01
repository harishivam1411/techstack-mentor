from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.schemas.results import ResultResponse, ResultListResponse
from app.database import get_db
from app.models.user_results import UserResult

router = APIRouter(prefix="/api/results", tags=["results"])


@router.get("/{user_id}", response_model=ResultListResponse)
async def get_user_results(user_id: str, limit: int = 10, db: Session = Depends(get_db)):
    """Get all results for a specific user"""
    results = db.query(UserResult).filter(
        UserResult.user_id == user_id
    ).order_by(
        desc(UserResult.created_at)
    ).limit(limit).all()

    return ResultListResponse(
        results=[ResultResponse.model_validate(r) for r in results],
        total=len(results)
    )


@router.get("/session/{session_id}", response_model=ResultResponse)
async def get_session_result(session_id: str, db: Session = Depends(get_db)):
    """Get result for a specific session"""
    result = db.query(UserResult).filter(
        UserResult.session_id == session_id
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    return ResultResponse.model_validate(result)


@router.get("/latest/{user_id}", response_model=ResultResponse)
async def get_latest_result(user_id: str, db: Session = Depends(get_db)):
    """Get the most recent result for a user"""
    result = db.query(UserResult).filter(
        UserResult.user_id == user_id
    ).order_by(
        desc(UserResult.created_at)
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="No results found for this user")

    return ResultResponse.model_validate(result)


@router.get("/tech-stack/{user_id}/{tech_stack}", response_model=ResultListResponse)
async def get_results_by_tech_stack(
    user_id: str,
    tech_stack: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get results for a specific user and tech stack"""
    results = db.query(UserResult).filter(
        UserResult.user_id == user_id,
        UserResult.tech_stack == tech_stack
    ).order_by(
        desc(UserResult.created_at)
    ).limit(limit).all()

    return ResultListResponse(
        results=[ResultResponse.model_validate(r) for r in results],
        total=len(results)
    )
