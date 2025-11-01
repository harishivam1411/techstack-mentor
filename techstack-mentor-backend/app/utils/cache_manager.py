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

    def ping(self) -> bool:
        """Check if Redis connection is alive"""
        try:
            return self.redis_client.ping()
        except Exception as e:
            print(f"Redis connection error: {e}")
            return False


# Singleton instance
cache_manager = CacheManager()
