from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class UserResult(Base):
    __tablename__ = "user_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    session_id = Column(String, unique=True, index=True, nullable=False)
    tech_stack = Column(String, nullable=False)
    score = Column(Float, nullable=False)
    feedback = Column(Text, nullable=True)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<UserResult(id={self.id}, user_id={self.user_id}, tech_stack={self.tech_stack}, score={self.score})>"
