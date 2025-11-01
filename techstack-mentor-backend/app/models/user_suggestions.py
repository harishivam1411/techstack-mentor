from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class UserSuggestion(Base):
    __tablename__ = "user_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    session_id = Column(String, index=True, nullable=False)
    tech_stack = Column(String, nullable=False)
    missed_topics = Column(JSON, nullable=True)  # List of topics user struggled with
    improvement_areas = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<UserSuggestion(id={self.id}, user_id={self.user_id}, tech_stack={self.tech_stack})>"
