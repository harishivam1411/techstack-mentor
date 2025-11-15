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

        prompt = f"""You are an expert technical interviewer creating a {tech_stack} assessment with {num_questions} questions.

QUESTION GENERATION REQUIREMENTS:

1. DIFFICULTY DISTRIBUTION:
   - Beginner (20%): Core concepts, basic syntax, fundamental principles
   - Intermediate (60%): Practical application, common patterns, best practices
   - Advanced (20%): Architecture, performance, edge cases, real-world scenarios

2. TOPIC COVERAGE:
   For {tech_stack}, include questions about:
   - Fundamentals and core concepts (30%)
   - Best practices and patterns (25%)
   - Real-world application and problem-solving (25%)
   - Performance, optimization, and security (10%)
   - Advanced features and ecosystem (10%)

3. QUESTION QUALITY:
   - Must be open-ended (no yes/no questions)
   - Require explanation and understanding, not just memorization
   - Test practical knowledge and critical thinking
   - Include scenario-based questions when relevant
   - Should allow for follow-up discussion
   - Must be clear and unambiguous

4. QUESTION TYPES TO INCLUDE:
   - Conceptual: "Explain how X works..."
   - Comparative: "What's the difference between X and Y..."
   - Practical: "How would you implement/solve..."
   - Architectural: "Design a system that..."
   - Debugging: "What would cause X problem and how to fix..."

5. AVOID:
   - Yes/no questions
   - Trick questions
   - Overly obscure or theoretical questions
   - Questions requiring specific version knowledge
   - Multiple unrelated questions in one

EXAMPLES FOR REFERENCE:

Good: "Explain the virtual DOM in React and how it improves performance"
Bad: "Does React use a virtual DOM?" (yes/no)

Good: "How would you optimize a slow database query? Walk through your approach"
Bad: "What is query optimization?" (too broad)

Good: "Describe the differences between var, let, and const, and when to use each"
Bad: "What are the variable types in JavaScript?" (too basic)

Generate {num_questions} high-quality {tech_stack} interview questions following these guidelines.

Return ONLY a JSON array of question strings, no explanations:
["question 1", "question 2", "question 3", ...]
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

        prompt = f"""You are an expert technical interviewer evaluating a {tech_stack} mock interview with {len(qa_pairs)} questions.

INTERVIEW TRANSCRIPT:
{qa_text}

EVALUATION INSTRUCTIONS:

1. VALIDATION CHECK:
   - Verify each answer contains actual content (not just "Audio response" or empty)
   - If any answers appear incomplete, note this in feedback
   - Only evaluate based on actual provided responses

2. SCORING RUBRIC (0-10 scale):

   9-10 (Expert): Deep technical understanding, correct use of best practices, handles edge cases,
                  provides real-world examples, demonstrates senior-level knowledge

   7-8 (Strong): Solid fundamentals, good technical accuracy, understands core concepts,
                 minor gaps in advanced topics or best practices

   5-6 (Intermediate): Basic understanding, some correct answers, missing depth or detail,
                       gaps in best practices or architecture knowledge

   3-4 (Beginner): Superficial knowledge, significant gaps, incorrect concepts,
                   lacks practical application understanding

   0-2 (Insufficient): Major misunderstandings, mostly incorrect, incomplete responses,
                       fundamental concept confusion

3. EVALUATION CRITERIA (Per Answer):

   For EACH question, assess:
   - Technical Accuracy (0-3 points): Is the answer factually correct?
   - Depth & Detail (0-3 points): Does it show deep understanding vs surface knowledge?
   - Practical Application (0-2 points): Real-world usage, examples, scenarios
   - Best Practices (0-2 points): Follows industry standards, security, performance

4. TECH STACK SPECIFIC EVALUATION:

   For {tech_stack}, specifically check:
   - Core concepts and fundamentals understanding
   - Common patterns and anti-patterns knowledge
   - Performance and optimization awareness
   - Security best practices
   - Real-world application experience
   - Ecosystem and tooling familiarity

5. FEEDBACK REQUIREMENTS:
   - Be specific with examples from their answers
   - Point out what was good AND what needs improvement
   - Provide actionable next steps
   - Mention specific resources or topics to study
   - Be encouraging but honest

6. MISSED TOPICS:
   - List specific {tech_stack} topics that should have been covered but weren't
   - Include fundamentals, intermediate, and advanced topics
   - Be specific (e.g., "React Hooks lifecycle" not just "React")

Provide your evaluation in EXACT JSON format:
{{
    "score": <number 0-10 with one decimal, e.g., 7.5>,
    "feedback": "<3-5 sentence detailed, specific feedback with examples>",
    "missed_topics": ["specific topic 1", "specific topic 2", ...],
    "improvement_areas": "<specific actionable advice on what to study/practice>",
    "strengths": ["specific strength 1", "specific strength 2", ...],
    "correct_count": <number of questions answered well (0-{len(qa_pairs)})>
}}

IMPORTANT: Return ONLY valid JSON, no markdown, no explanations, just the JSON object."""

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
