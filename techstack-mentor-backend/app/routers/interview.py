from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import uuid
from pathlib import Path

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
from app.utils.audio_service import audio_service
from app.database import get_db
from app.models.user_results import UserResult
from app.models.user_suggestions import UserSuggestion
from app.config import get_settings

router = APIRouter(prefix="/api/interview", tags=["interview"])
settings = get_settings()


async def transcribe_audio_background(file_path: str, session_id: str, answer_index: int):
    """
    Background task to transcribe audio and store the answer.
    This runs asynchronously without blocking the response.
    Note: Index is already incremented before this task runs.
    """
    try:
        # Transcribe audio to text
        transcribed_text = await audio_service.transcribe_audio(file_path)

        # Store the transcribed answer (without incrementing index, already done)
        cache_manager.add_answer_no_increment(session_id, transcribed_text)

        # Mark this transcription as complete
        cache_manager.mark_transcription_complete(session_id, answer_index)

        print(f"Background transcription complete for session {session_id}, answer {answer_index}: {transcribed_text[:50]}...")
    except Exception as e:
        print(f"Background transcription failed for session {session_id}, answer {answer_index}: {str(e)}")
        # Still mark as complete (but with empty/failed answer) to not block evaluation
        cache_manager.mark_transcription_complete(session_id, answer_index)


@router.post("/start", response_model=StartInterviewResponse)
async def start_interview(request: StartInterviewRequest):
    """Start a new mock interview session with pre-generated questions and audio"""
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

    # Generate ALL questions upfront
    questions = llm_service.generate_questions(
        tech_stack=request.tech_stack.value,
        num_questions=settings.max_questions_per_interview
    )

    if not questions:
        raise HTTPException(status_code=500, detail="Failed to generate questions")

    # Store ALL questions in cache
    for question in questions:
        cache_manager.add_question(session_id, question)

    # Pre-generate TTS for ALL questions
    audio_urls = []
    for idx, question in enumerate(questions, start=1):
        try:
            # Create audio version of question
            question_text = f"Question {idx}: {question}"
            tts_audio = await audio_service.text_to_speech(question_text)
            audio_file_path = await audio_service.save_ai_response_audio(
                audio_data=tts_audio,
                session_id=session_id,
                question_number=idx
            )
            audio_url = audio_service.get_audio_url(audio_file_path)
            audio_urls.append(audio_url)
        except Exception as e:
            print(f"TTS generation failed for question {idx}: {str(e)}")
            # Add None to maintain index alignment
            audio_urls.append(None)

    # Store all audio URLs in cache
    cache_manager.set_audio_urls(session_id, audio_urls)

    # Prepare welcome message (audio-only, no text display needed)
    welcome_message = f"""Welcome to your {request.tech_stack.value} mock interview!

I'll be asking you {settings.max_questions_per_interview} questions to assess your knowledge and skills.

Listen to the first question and record your answer."""

    # Return first question with its pre-generated audio
    return StartInterviewResponse(
        session_id=session_id,
        message=welcome_message,
        tech_stack=request.tech_stack.value,
        audio_url=audio_urls[0] if audio_urls else None
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
    import asyncio

    # Get session from cache
    session = cache_manager.get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    # CRITICAL: Wait for all transcriptions to complete (max 30 seconds)
    print(f"Waiting for transcriptions to complete for session {session_id}...")
    max_wait_time = 30  # seconds
    wait_interval = 0.5  # seconds
    elapsed_time = 0

    while not cache_manager.are_all_transcriptions_complete(session_id) and elapsed_time < max_wait_time:
        progress = cache_manager.get_transcription_progress(session_id)
        print(f"Transcription progress: {progress['completed']}/{progress['total']}")
        await asyncio.sleep(wait_interval)
        elapsed_time += wait_interval

    # Check final status
    if cache_manager.are_all_transcriptions_complete(session_id):
        print(f"All transcriptions complete for session {session_id}")
    else:
        progress = cache_manager.get_transcription_progress(session_id)
        print(f"WARNING: Timeout waiting for transcriptions. Progress: {progress['completed']}/{progress['total']}")

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


@router.post("/audio/upload")
async def upload_audio(
    background_tasks: BackgroundTasks,
    session_id: str,
    audio_file: UploadFile = File(...)
):
    """
    FAST audio upload with immediate response.
    Returns next pre-generated question instantly while transcribing in background.
    """
    try:
        # Validate session
        session = cache_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Interview session not found or expired")

        if session.get("is_complete"):
            raise HTTPException(status_code=400, detail="Interview already completed")

        # Validate file format
        if not audio_service.validate_audio_format(audio_file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported audio format. Supported formats: {settings.supported_audio_formats}"
            )

        # Read file content
        file_content = await audio_file.read()

        # Validate file size
        if not audio_service.validate_audio_file_size(len(file_content)):
            raise HTTPException(
                status_code=400,
                detail=f"Audio file too large. Maximum size: {settings.max_audio_file_size_mb}MB"
            )

        # Save uploaded file IMMEDIATELY (no transcription yet)
        file_extension = Path(audio_file.filename).suffix
        saved_file_path = await audio_service.save_uploaded_file(
            file_data=file_content,
            session_id=session_id,
            extension=file_extension
        )

        # Mark transcription as pending (before increment)
        answer_index = session.get("current_index", 0)  # Get current index before increment
        cache_manager.mark_transcription_pending(session_id)

        # Increment index BEFORE returning next question
        cache_manager.increment_index(session_id)

        # REFRESH session data after increment (get fresh data from Redis)
        session = cache_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=500, detail="Failed to refresh session")

        # Get CURRENT state after increment (now using fresh data)
        current_index = session.get("current_index", 0)
        total_questions = settings.max_questions_per_interview

        # Check if interview is complete (all questions answered)
        if current_index >= total_questions:
            cache_manager.mark_complete(session_id)

            # Start background transcription for last answer
            background_tasks.add_task(transcribe_audio_background, saved_file_path, session_id, answer_index)

            completion_message = "Thank you for completing the interview! Processing your final answer..."

            return {
                "ai_message": completion_message,
                "audio_url": None,  # No more questions
                "is_complete": True,
                "question_number": current_index,
                "total_questions": total_questions
            }

        # Get next question and audio from cache (INSTANT!)
        next_q_data = cache_manager.get_next_question_data(session_id)

        if not next_q_data:
            raise HTTPException(status_code=500, detail="Failed to get next question")

        # Start background transcription task (non-blocking)
        background_tasks.add_task(transcribe_audio_background, saved_file_path, session_id, answer_index)

        # Return IMMEDIATELY with pre-generated question and audio
        return {
            "ai_message": f"Question {next_q_data['question_number']}: {next_q_data['question']}",
            "audio_url": next_q_data["audio_url"],
            "is_complete": False,
            "question_number": next_q_data["question_number"],
            "total_questions": total_questions
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process audio: {str(e)}")


@router.get("/audio/recordings/{filename}")
async def get_recording(filename: str):
    """Serve user recording audio files"""
    file_path = Path(settings.audio_recordings_dir) / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")

    return FileResponse(
        path=file_path,
        media_type="audio/webm",
        filename=filename
    )


@router.get("/audio/responses/{filename}")
async def get_response_audio(filename: str):
    """Serve AI response audio files"""
    file_path = Path(settings.audio_responses_dir) / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")

    return FileResponse(
        path=file_path,
        media_type="audio/mpeg",
        filename=filename
    )
