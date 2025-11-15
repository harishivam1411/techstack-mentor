import redis
import json
from typing import Optional, Dict, Any, List
from app.config import get_settings

settings = get_settings()


class CacheManager:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            password=settings.redis_password if settings.redis_password else None,
            db=settings.redis_db,
            decode_responses=True
        )
        self.ttl = settings.session_ttl

    def create_session(self, session_id: str, user_id: str, tech_stack: str) -> bool:
        """Create a new interview session in cache"""
        session_data = {
            "user_id": user_id,
            "tech_stack": tech_stack,
            "questions": [],
            "answers": [],
            "audio_urls": [],  # Store pre-generated audio URLs for questions
            "transcription_status": [],  # Track which answers are transcribed [True/False]
            "current_index": 0,
            "is_complete": False
        }
        return self.set_session(session_id, session_data)

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve session data from cache"""
        try:
            data = self.redis_client.get(f"session:{session_id}")
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            print(f"Error getting session: {e}")
            return None

    def set_session(self, session_id: str, data: Dict[str, Any]) -> bool:
        """Save session data to cache with TTL"""
        try:
            self.redis_client.setex(
                f"session:{session_id}",
                self.ttl,
                json.dumps(data)
            )
            return True
        except Exception as e:
            print(f"Error setting session: {e}")
            return False

    def add_question(self, session_id: str, question: str) -> bool:
        """Add a question to the session"""
        session = self.get_session(session_id)
        if not session:
            return False

        session["questions"].append(question)
        return self.set_session(session_id, session)

    def add_answer(self, session_id: str, answer: str) -> bool:
        """Add an answer to the session"""
        session = self.get_session(session_id)
        if not session:
            return False

        session["answers"].append(answer)
        session["current_index"] += 1
        return self.set_session(session_id, session)

    def add_answer_no_increment(self, session_id: str, answer: str) -> bool:
        """Add an answer to the session without incrementing index (for background tasks)"""
        session = self.get_session(session_id)
        if not session:
            return False

        session["answers"].append(answer)
        return self.set_session(session_id, session)

    def increment_index(self, session_id: str) -> bool:
        """Increment the current question index"""
        session = self.get_session(session_id)
        if not session:
            return False

        session["current_index"] += 1
        return self.set_session(session_id, session)

    def get_qa_pairs(self, session_id: str) -> List[Dict[str, str]]:
        """Get all Q&A pairs from the session"""
        session = self.get_session(session_id)
        if not session:
            return []

        questions = session.get("questions", [])
        answers = session.get("answers", [])

        return [
            {"question": q, "answer": a}
            for q, a in zip(questions, answers)
        ]

    def mark_complete(self, session_id: str) -> bool:
        """Mark the interview session as complete"""
        session = self.get_session(session_id)
        if not session:
            return False

        session["is_complete"] = True
        return self.set_session(session_id, session)

    def delete_session(self, session_id: str) -> bool:
        """Delete a session from cache"""
        try:
            self.redis_client.delete(f"session:{session_id}")
            return True
        except Exception as e:
            print(f"Error deleting session: {e}")
            return False

    def is_session_complete(self, session_id: str) -> bool:
        """Check if the interview is complete"""
        session = self.get_session(session_id)
        if not session:
            return False
        return session.get("is_complete", False)

    def get_current_question_count(self, session_id: str) -> int:
        """Get the current question count"""
        session = self.get_session(session_id)
        if not session:
            return 0
        return len(session.get("questions", []))

    def set_audio_urls(self, session_id: str, audio_urls: List[str]) -> bool:
        """Set all pre-generated audio URLs for questions"""
        session = self.get_session(session_id)
        if not session:
            return False

        session["audio_urls"] = audio_urls
        return self.set_session(session_id, session)

    def get_current_audio_url(self, session_id: str) -> Optional[str]:
        """Get the audio URL for the current question"""
        session = self.get_session(session_id)
        if not session:
            return None

        current_index = session.get("current_index", 0)
        audio_urls = session.get("audio_urls", [])

        if current_index < len(audio_urls):
            return audio_urls[current_index]
        return None

    def get_next_question_data(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get the next question and its audio URL"""
        session = self.get_session(session_id)
        if not session:
            return None

        current_index = session.get("current_index", 0)
        questions = session.get("questions", [])
        audio_urls = session.get("audio_urls", [])

        if current_index < len(questions):
            return {
                "question": questions[current_index],
                "audio_url": audio_urls[current_index] if current_index < len(audio_urls) else None,
                "question_number": current_index + 1
            }
        return None

    def mark_transcription_pending(self, session_id: str) -> bool:
        """Mark that a new transcription is pending"""
        session = self.get_session(session_id)
        if not session:
            return False

        # Add False to indicate pending transcription
        if "transcription_status" not in session:
            session["transcription_status"] = []
        session["transcription_status"].append(False)
        return self.set_session(session_id, session)

    def mark_transcription_complete(self, session_id: str, answer_index: int) -> bool:
        """Mark that a specific answer's transcription is complete"""
        session = self.get_session(session_id)
        if not session:
            return False

        if "transcription_status" not in session:
            session["transcription_status"] = []

        # Ensure the list is long enough
        while len(session["transcription_status"]) <= answer_index:
            session["transcription_status"].append(False)

        session["transcription_status"][answer_index] = True
        return self.set_session(session_id, session)

    def are_all_transcriptions_complete(self, session_id: str) -> bool:
        """Check if all transcriptions are complete"""
        session = self.get_session(session_id)
        if not session:
            return False

        answers = session.get("answers", [])
        transcription_status = session.get("transcription_status", [])

        # All answers should have corresponding transcription status
        if len(transcription_status) != len(answers):
            return False

        # All should be True
        return all(transcription_status)

    def get_transcription_progress(self, session_id: str) -> Dict[str, int]:
        """Get transcription progress"""
        session = self.get_session(session_id)
        if not session:
            return {"total": 0, "completed": 0}

        transcription_status = session.get("transcription_status", [])
        return {
            "total": len(transcription_status),
            "completed": sum(1 for status in transcription_status if status)
        }

    def ping(self) -> bool:
        """Check if Redis connection is alive"""
        try:
            return self.redis_client.ping()
        except Exception as e:
            print(f"Redis connection error: {e}")
            return False


# Singleton instance
cache_manager = CacheManager()
