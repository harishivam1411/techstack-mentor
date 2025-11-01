export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface InterviewSession {
  sessionId: string;
  techStack: string;
  isActive: boolean;
  questionNumber?: number;
  totalQuestions?: number;
}

export interface Result {
  id: number;
  userId: string;
  sessionId: string;
  techStack: string;
  score: number;
  feedback: string;
  totalQuestions: number;
  correctAnswers: number;
  createdAt: string;
}

export interface Suggestion {
  id: number;
  userId: string;
  techStack: string;
  missedTopics: string[];
  improvementAreas: string;
  createdAt: string;
}

export type TechStack =
  | 'React.js'
  | 'Node.js'
  | 'Python'
  | 'Database (SQL/PostgreSQL)'
  | 'DevOps (Docker, CI/CD)';

export interface StartInterviewRequest {
  user_id: string;
  tech_stack: TechStack;
}

export interface StartInterviewResponse {
  session_id: string;
  message: string;
  tech_stack: string;
}

export interface SendMessageRequest {
  session_id: string;
  user_message: string;
}

export interface SendMessageResponse {
  ai_message: string;
  is_complete: boolean;
  question_number?: number;
  total_questions?: number;
}

export interface EndInterviewResponse {
  session_id: string;
  score: number;
  feedback: string;
  missed_topics: string[];
  improvement_areas: string;
  total_questions: number;
  created_at: string;
}
