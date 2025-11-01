from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import uuid
from datetime import datetime

from app.schemas.interview import (
    StartInterviewRequest,
    StartInterviewResponse,
    SendMessageRequest,
    SendMessageResponse,
    EndInterviewResponse,
    InterviewStatus
)
from app.utils.cache_manager import cache_manager
from app.utils.llm_service import llm_service
from app.database import get_db
from app.models.user_results import UserResult
from app.models.user_suggestions import UserSuggestion
from app.config import get_settings

router = APIRouter(prefix="/api/interview", tags=["interview"])
settings = get_settings()


@router.post("/start", response_model=StartInterviewResponse)
async def start_interview(request: StartInterviewRequest):
    """Start a new mock interview session"""
    # Generate unique session ID
    session_id = str(uuid.uuid4())

    # Create session in cache
    success = cache_manager.create_session(
        session_id=session_id,
        user_id=request.user_id,
        tech_stack=request.tech_stack.value
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to create interview session")

    # Generate initial questions
    questions = llm_service.generate_questions(
        tech_stack=request.tech_stack.value,
        num_questions=settings.max_questions_per_interview
    )

    # Store first question
    if questions:
        cache_manager.add_question(session_id, questions[0])

    # Prepare welcome message
    welcome_message = f"""Welcome to your {request.tech_stack.value} mock interview!

I'll be asking you {settings.max_questions_per_interview} questions to assess your knowledge and skills.

Let's begin:

**Question 1:** {questions[0] if questions else 'Tell me about your experience with ' + request.tech_stack.value}

Please type your answer below."""

    return StartInterviewResponse(
        session_id=session_id,
        message=welcome_message,
        tech_stack=request.tech_stack.value
    )


@router.post("/message", response_model=SendMessageResponse)
async def send_message(request: SendMessageRequest):
    """Send a message (answer) and get the next question"""
    # Get session from cache
    session = cache_manager.get_session(request.session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found or expired")

    if session.get("is_complete"):
        raise HTTPException(status_code=400, detail="Interview already completed")

    # Store user's answer
    cache_manager.add_answer(request.session_id, request.user_message)

    current_count = cache_manager.get_current_question_count(request.session_id)
    total_questions = settings.max_questions_per_interview

    # Check if interview is complete
    if current_count >= total_questions:
        cache_manager.mark_complete(request.session_id)

        return SendMessageResponse(
            ai_message="Thank you for completing the interview! Let me evaluate your responses...",
            is_complete=True,
            question_number=current_count,
            total_questions=total_questions
        )

    # Get Q&A pairs for context
    qa_pairs = cache_manager.get_qa_pairs(request.session_id)

    # Generate next question
    next_question = llm_service.get_next_question(
        tech_stack=session["tech_stack"],
        current_index=current_count,
        total_questions=total_questions,
        previous_qa=qa_pairs
    )

    # Store next question
    cache_manager.add_question(request.session_id, next_question)

    # Prepare response message
    response_message = f"""**Question {current_count + 1}:** {next_question}

Please type your answer below."""

    return SendMessageResponse(
        ai_message=response_message,
        is_complete=False,
        question_number=current_count + 1,
        total_questions=total_questions
    )


@router.post("/end/{session_id}", response_model=EndInterviewResponse)
async def end_interview(session_id: str, db: Session = Depends(get_db)):
    """End the interview and get evaluation results"""
    # Get session from cache
    session = cache_manager.get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    # Get Q&A pairs
    qa_pairs = cache_manager.get_qa_pairs(session_id)

    if not qa_pairs:
        raise HTTPException(status_code=400, detail="No answers found in this session")

    # Evaluate using LLM
    evaluation = llm_service.evaluate_interview(
        tech_stack=session["tech_stack"],
        qa_pairs=qa_pairs
    )

    # Save to database
    result = UserResult(
        user_id=session["user_id"],
        session_id=session_id,
        tech_stack=session["tech_stack"],
        score=evaluation["score"],
        feedback=evaluation["feedback"],
        total_questions=len(qa_pairs),
        correct_answers=evaluation.get("correct_count", 0)
    )
    db.add(result)

    # Save suggestions
    suggestion = UserSuggestion(
        user_id=session["user_id"],
        session_id=session_id,
        tech_stack=session["tech_stack"],
        missed_topics=evaluation["missed_topics"],
        improvement_areas=evaluation["improvement_areas"]
    )
    db.add(suggestion)

    db.commit()
    db.refresh(result)

    # Clean up cache (optional - let TTL handle it)
    # cache_manager.delete_session(session_id)

    return EndInterviewResponse(
        session_id=session_id,
        score=evaluation["score"],
        feedback=evaluation["feedback"],
        missed_topics=evaluation["missed_topics"],
        improvement_areas=evaluation["improvement_areas"],
        total_questions=len(qa_pairs),
        created_at=result.created_at
    )


@router.get("/status/{session_id}", response_model=InterviewStatus)
async def get_interview_status(session_id: str):
    """Get the current status of an interview session"""
    session = cache_manager.get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    return InterviewStatus(
        session_id=session_id,
        tech_stack=session["tech_stack"],
        current_question=len(session.get("answers", [])),
        total_questions=settings.max_questions_per_interview,
        is_complete=session.get("is_complete", False),
        questions=session.get("questions", []),
        answers=session.get("answers", [])
    )


@router.get("/health")
async def health_check():
    """Check if interview service is healthy"""
    redis_status = cache_manager.ping()

    return {
        "status": "healthy" if redis_status else "unhealthy",
        "redis": "connected" if redis_status else "disconnected"
    }
