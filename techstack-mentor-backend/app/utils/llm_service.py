from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferWindowMemory
from langchain.chains import ConversationChain
from typing import Dict, List, Tuple
import json
from app.config import get_settings

settings = get_settings()


class LLMService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            openai_api_key=settings.openai_api_key
        )
        self.max_questions = settings.max_questions_per_interview

    def generate_questions(self, tech_stack: str, num_questions: int = None) -> List[str]:
        """Generate interview questions based on tech stack"""
        if num_questions is None:
            num_questions = self.max_questions

        prompt = f"""You are an expert technical interviewer. Generate {num_questions} interview questions for {tech_stack}.

Requirements:
- Questions should range from basic to advanced
- Cover different aspects of {tech_stack}
- Be specific and clear
- Avoid yes/no questions
- Focus on practical knowledge and problem-solving

Return ONLY a JSON array of questions, nothing else. Format:
["question 1", "question 2", ...]
"""

        response = self.llm.invoke(prompt)
        try:
            questions = json.loads(response.content)
            return questions[:num_questions]
        except json.JSONDecodeError:
            # Fallback: split by newlines and clean
            lines = response.content.strip().split('\n')
            questions = [line.strip('- ').strip('"').strip("'").strip() for line in lines if line.strip()]
            return [q for q in questions if q and not q.startswith('[') and not q.startswith('{')][:num_questions]

    def get_next_question(self, tech_stack: str, current_index: int, total_questions: int,
                         previous_qa: List[Dict[str, str]] = None) -> str:
        """Get the next question based on context"""
        if previous_qa and len(previous_qa) > 0:
            # Generate follow-up or next contextual question
            context = "\n".join([f"Q: {qa['question']}\nA: {qa['answer']}" for qa in previous_qa[-3:]])

            prompt = f"""You are conducting a {tech_stack} technical interview.

Previous conversation:
{context}

Generate the next question (question {current_index + 1} of {total_questions}) that:
- Builds on the previous answers
- Tests a different aspect of {tech_stack}
- Is clear and specific

Return ONLY the question text, nothing else."""

            response = self.llm.invoke(prompt)
            return response.content.strip()
        else:
            # Generate first question
            questions = self.generate_questions(tech_stack, 1)
            return questions[0] if questions else f"What are the key concepts in {tech_stack}?"

    def evaluate_interview(self, tech_stack: str, qa_pairs: List[Dict[str, str]]) -> Dict[str, any]:
        """Evaluate the entire interview and provide feedback"""
        qa_text = "\n\n".join([
            f"Q{i+1}: {qa['question']}\nA{i+1}: {qa['answer']}"
            for i, qa in enumerate(qa_pairs)
        ])

        prompt = f"""You are an expert technical interviewer evaluating a {tech_stack} mock interview.

Interview Transcript:
{qa_text}

Provide a comprehensive evaluation in the following JSON format:
{{
    "score": <number between 0-10>,
    "feedback": "<detailed feedback paragraph>",
    "missed_topics": ["topic1", "topic2", ...],
    "improvement_areas": "<specific areas to improve>",
    "strengths": ["strength1", "strength2", ...],
    "correct_count": <estimated number of correct/good answers>
}}

Evaluation criteria:
- Technical accuracy
- Depth of understanding
- Practical knowledge
- Problem-solving approach
- Communication clarity

Return ONLY valid JSON, nothing else."""

        response = self.llm.invoke(prompt)

        try:
            evaluation = json.loads(response.content)

            # Validate and set defaults
            if "score" not in evaluation:
                evaluation["score"] = 5.0
            if "feedback" not in evaluation:
                evaluation["feedback"] = "Interview completed."
            if "missed_topics" not in evaluation:
                evaluation["missed_topics"] = []
            if "improvement_areas" not in evaluation:
                evaluation["improvement_areas"] = "Continue practicing."
            if "correct_count" not in evaluation:
                # Estimate based on score
                evaluation["correct_count"] = int((evaluation["score"] / 10.0) * len(qa_pairs))

            return evaluation
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            # Return default evaluation
            return {
                "score": 5.0,
                "feedback": "Interview completed. Unable to parse detailed evaluation.",
                "missed_topics": [],
                "improvement_areas": "Review all topics covered.",
                "strengths": [],
                "correct_count": len(qa_pairs) // 2
            }

    def get_greeting_message(self) -> str:
        """Get the initial greeting message"""
        return """👋 Hi there! Welcome to TechStack Mentor - Your AI Mock Interviewer!

What would you like to do today?

1️⃣ Take a Mock Interview
2️⃣ View Past Results
3️⃣ View Suggested Topics

Please select an option (1, 2, or 3) to continue."""

    def get_tech_stack_selection_message(self) -> str:
        """Get tech stack selection message"""
        return """Great! Let's start your mock interview.

Please select a tech stack:

• React.js
• Node.js
• Python
• Database (SQL/PostgreSQL)
• DevOps (Docker, CI/CD)

Which tech stack would you like to be tested on?"""


# Singleton instance
llm_service = LLMService()
