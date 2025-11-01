import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { TechStackSelector } from '../components/TechStackSelector';
import { interviewApi } from '../services/api';
import type { TechStack, Message } from '../types';

export const Interview: React.FC = () => {
  const { setCurrentView, userId, currentSession, setCurrentSession, messages, addMessage, clearMessages, isLoading, setLoading, setCurrentResult } = useStore();

  const [showSelector, setShowSelector] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTechStackSelect = async (techStack: TechStack) => {
    setLoading(true);
    try {
      const response = await interviewApi.start({
        user_id: userId,
        tech_stack: techStack,
      });

      setCurrentSession({
        sessionId: response.session_id,
        techStack: response.tech_stack,
        isActive: true,
      });

      // Add AI's welcome message
      addMessage({
        id: Date.now().toString(),
        role: 'ai',
        content: response.message,
        timestamp: new Date(),
      });

      setShowSelector(false);
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentSession) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    setLoading(true);
    try {
      const response = await interviewApi.sendMessage({
        session_id: currentSession.sessionId,
        user_message: content,
      });

      // Add AI response
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.ai_message,
        timestamp: new Date(),
      });

      // Update session with question progress
      if (response.question_number && response.total_questions) {
        setCurrentSession({
          ...currentSession,
          questionNumber: response.question_number,
          totalQuestions: response.total_questions,
        });
      }

      // If interview is complete, fetch results
      if (response.is_complete) {
        setTimeout(() => handleEndInterview(), 2000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'Sorry, there was an error processing your response. Please try again.',
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEndInterview = async () => {
    if (!currentSession) return;

    setLoading(true);
    try {
      const result = await interviewApi.end(currentSession.sessionId);

      setCurrentResult({
        id: 0,
        userId: userId,
        sessionId: result.session_id,
        techStack: currentSession.techStack,
        score: result.score,
        feedback: result.feedback,
        totalQuestions: result.total_questions,
        correctAnswers: Math.round((result.score / 10) * result.total_questions),
        createdAt: result.created_at,
      });

      // Show results in chat
      const resultMessage = `
## 🎉 Interview Complete!

**Your Score:** ${result.score.toFixed(1)}/10

**Feedback:**
${result.feedback}

**Missed Topics:**
${result.missed_topics.length > 0 ? result.missed_topics.map(t => `- ${t}`).join('\n') : 'None - Great job!'}

**Areas for Improvement:**
${result.improvement_areas}
      `;

      addMessage({
        id: Date.now().toString(),
        role: 'ai',
        content: resultMessage,
        timestamp: new Date(),
      });

      setShowResult(true);
      setCurrentSession({ ...currentSession, isActive: false });
    } catch (error) {
      console.error('Error ending interview:', error);
      alert('Failed to get results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    clearMessages();
    setCurrentSession(null);
    setShowSelector(true);
    setShowResult(false);
    setCurrentView('home');
  };

  if (showSelector) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button onClick={handleBackToHome} className="btn-secondary mb-6 flex items-center gap-2">
          <ArrowLeft size={18} />
          Back to Home
        </button>
        <TechStackSelector onSelect={handleTechStackSelect} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleBackToHome} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {currentSession?.techStack} Interview
              </h1>
              {currentSession?.questionNumber && currentSession?.totalQuestions && (
                <p className="text-sm text-gray-500">
                  Question {currentSession.questionNumber} of {currentSession.totalQuestions}
                </p>
              )}
            </div>
          </div>
          {showResult && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={20} />
              <span className="text-sm font-medium">Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              <span>AI is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {!showResult && (
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              onSend={handleSendMessage}
              disabled={isLoading || !currentSession?.isActive}
              placeholder="Type your answer here..."
            />
          </div>
        </div>
      )}

      {showResult && (
        <div className="bg-primary-50 border-t border-primary-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-primary-900 font-medium">Interview completed! Check your results above.</p>
            <button onClick={handleBackToHome} className="btn-primary">
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
