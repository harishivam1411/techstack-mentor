import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import AudioRecorder from '../components/AudioRecorder';
import AudioPlayer from '../components/AudioPlayer';
import { TechStackSelector } from '../components/TechStackSelector';
import { interviewApi, audioApi } from '../services/api';
import type { TechStack, Message } from '../types';

export const Interview: React.FC = () => {
  const {
    setCurrentView,
    userId,
    currentSession,
    setCurrentSession,
    messages,
    addMessage,
    clearMessages,
    isLoading,
    setLoading,
    isProcessingAudio,
    setIsProcessingAudio,
    audioError,
    setAudioError,
    setCurrentResult
  } = useStore();

  const [showSelector, setShowSelector] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(1); // 1, 2, 3 for progress steps
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isUserRecording, setIsUserRecording] = useState(false);
  const [interviewResult, setInterviewResult] = useState<any>(null);
  const [hasAnsweredOnce, setHasAnsweredOnce] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTechStackSelect = async (techStack: TechStack) => {
    setLoading(true);
    setShowLoadingModal(true);
    setLoadingProgress(1);

    try {
      // Simulate step 1: Tech stack selected (already done)
      setLoadingProgress(1);

      // Step 2: Start generating questions
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoadingProgress(2);

      const response = await interviewApi.start({
        user_id: userId,
        tech_stack: techStack,
      });

      // Step 3: Audio files created
      setLoadingProgress(3);
      await new Promise(resolve => setTimeout(resolve, 800));

      setCurrentSession({
        sessionId: response.session_id,
        techStack: response.tech_stack,
        isActive: true,
      });

      // Add AI's welcome message with audio
      addMessage({
        id: Date.now().toString(),
        role: 'ai',
        content: response.message,
        timestamp: new Date(),
        audioUrl: response.audio_url,
      });

      // Wait a moment to show completion before closing
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowLoadingModal(false);
      setShowSelector(false);
    } catch (error) {
      console.error('Error starting interview:', error);
      setShowLoadingModal(false);
      alert('Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    if (!currentSession) return;

    setIsProcessingAudio(true);
    setAudioError(null);
    setHasAnsweredOnce(true); // Track that user has provided at least one answer

    try {
      // Upload audio and get transcription + AI response
      const response = await audioApi.uploadAudio(currentSession.sessionId, audioBlob);

      // Add user message (generic, no transcription shown)
      addMessage({
        id: Date.now().toString(),
        role: 'user',
        content: 'Audio response',
        timestamp: new Date(),
      });

      // Add AI response with audio
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.ai_message,
        timestamp: new Date(),
        audioUrl: response.audio_url,
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
    } catch (error: any) {
      console.error('Error processing audio:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to process audio. Please try again.';
      setAudioError(errorMessage);
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `Sorry, there was an error processing your audio: ${errorMessage}`,
        timestamp: new Date(),
      });
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleEndInterview = async () => {
    if (!currentSession) return;

    setLoading(true);
    setIsProcessingAudio(true);
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

      // Store result for modal display
      setInterviewResult(result);
      setShowResult(true);
      setShowSummaryModal(true);
      setCurrentSession({ ...currentSession, isActive: false });
    } catch (error: any) {
      console.error('Error ending interview:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to get results. Please try again.';
      setAudioError(`Evaluation failed: ${errorMessage}`);
      setTimeout(() => setAudioError(null), 5000); // Clear error after 5 seconds
    } finally {
      setLoading(false);
      setIsProcessingAudio(false);
    }
  };

  const handleBackToHome = () => {
    clearMessages();
    setCurrentSession(null);
    setShowSelector(true);
    setShowResult(false);
    setHasAnsweredOnce(false);
    setCurrentView('home');
  };

  if (showSelector) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 p-6">
          <button onClick={handleBackToHome} className="btn-secondary mb-6 flex items-center gap-2">
            <ArrowLeft size={18} />
            Back to Home
          </button>
          <TechStackSelector onSelect={handleTechStackSelect} />
        </div>

        {/* Loading Modal for Interview Creation */}
        {showLoadingModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl p-10 max-w-md w-full border border-gray-700/50 animate-slide-in">
              {/* Animated Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {/* Outer rotating ring */}
                  <div className="w-24 h-24 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  {/* Inner pulsing circle */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-blue-500/50">
                      <Loader2 size={32} className="text-white animate-spin" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading Text */}
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-white">Creating Your Interview</h3>
                <div className="space-y-2">
                  <p className="text-gray-300">Please wait while we prepare your personalized interview...</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span>Generating questions & audio</span>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="mt-6 space-y-2 text-left bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-gray-300">Tech stack selected</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {loadingProgress >= 2 ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <Loader2 size={16} className="text-blue-500 animate-spin" />
                    )}
                    <span className="text-gray-300">Generating interview questions</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {loadingProgress >= 3 ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <Loader2 size={16} className="text-blue-500 animate-spin" />
                    )}
                    <span className="text-gray-300">Creating audio files</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Full-Screen Split-Screen Interview Room */}
      <div className="relative h-full grid grid-cols-2 gap-0">
          {/* Agent Panel (Left) */}
          <div className="relative flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-r border-gray-700/50 overflow-hidden">
            {/* Animated background particles */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl animate-pulse delay-700"></div>
            </div>

            <div className="text-center relative z-10">
              {/* Agent Avatar with Enhanced Glow and Ring */}
              <div className={`relative inline-block mb-8 ${isAudioPlaying ? 'glow-agent' : 'floating-gentle'}`}>
                {/* Outer ring with shimmer effect */}
                <div className={`avatar-ring ${isAudioPlaying ? 'active' : ''}`}>
                  <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-purple-700 flex items-center justify-center text-white text-8xl shadow-glow-blue transition-all duration-500 hover:scale-105">
                    {/* Inner glow effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-300/30 to-transparent"></div>
                    <span className="relative z-10">🤖</span>
                  </div>
                </div>
                {/* Status indicator dot */}
                {isAudioPlaying && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-2 bg-blue-500/90 backdrop-blur-sm px-4 py-1 rounded-full shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-white text-xs font-medium">Speaking</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Agent Label with modern styling */}
              <h3 className="text-2xl font-bold text-white mb-3 tracking-wide">AI Interviewer</h3>
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className={`w-2 h-2 rounded-full ${isAudioPlaying ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'}`}></div>
                <p className="text-gray-300 text-sm font-medium">
                  {isAudioPlaying ? 'Speaking...' : 'Ready'}
                </p>
              </div>

              {/* Audio Player - Positioned below avatar */}
              {messages.length > 0 && messages[messages.length - 1].role === 'ai' && messages[messages.length - 1].audioUrl && (
                <div className="mt-6 px-8 w-full max-w-md mx-auto">
                  <AudioPlayer
                    audioUrl={audioApi.getAudioUrl(messages[messages.length - 1].audioUrl!)}
                    autoPlay={true}
                    showReplay={true}
                    onPlay={() => setIsAudioPlaying(true)}
                    onPause={() => setIsAudioPlaying(false)}
                    onEnded={() => setIsAudioPlaying(false)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* User Panel (Right) */}
          <div className="relative flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 overflow-hidden">
            {/* Animated background particles */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-20 right-10 w-36 h-36 bg-green-500 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-10 left-10 w-44 h-44 bg-emerald-500 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            <div className="text-center relative z-10">
              {/* User Avatar with Enhanced Glow and Ring */}
              <div className={`relative inline-block mb-8 ${isUserRecording ? 'glow-user' : 'floating-gentle'}`}>
                {/* Outer ring with shimmer effect */}
                <div className={`avatar-ring ${isUserRecording ? 'active' : ''}`}>
                  <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-green-400 via-emerald-600 to-teal-700 flex items-center justify-center text-white text-8xl shadow-glow-green transition-all duration-500 hover:scale-105">
                    {/* Inner glow effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-green-300/30 to-transparent"></div>
                    <span className="relative z-10">👤</span>
                  </div>
                </div>
                {/* Status indicator dot */}
                {isUserRecording && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-2 bg-green-500/90 backdrop-blur-sm px-4 py-1 rounded-full shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-white text-xs font-medium">Recording</span>
                    </div>
                  </div>
                )}
              </div>

              {/* User Label with modern styling */}
              <h3 className="text-2xl font-bold text-white mb-3 tracking-wide">You</h3>
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className={`w-2 h-2 rounded-full ${isUserRecording ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                <p className="text-gray-300 text-sm font-medium">
                  {isUserRecording ? 'Recording...' : 'Ready to answer'}
                </p>
              </div>

              {/* Question counter badge */}
              {currentSession?.questionNumber && currentSession?.totalQuestions && (
                <div className="inline-flex items-center gap-2 glass-dark px-5 py-2 rounded-full">
                  <span className="text-blue-400 font-bold text-lg">{currentSession.questionNumber}</span>
                  <span className="text-gray-400 text-sm">/</span>
                  <span className="text-gray-400 text-sm">{currentSession.totalQuestions}</span>
                  <span className="text-gray-400 text-xs ml-1">Questions</span>
                </div>
              )}
            </div>
          </div>

        {/* Floating Control Container Box */}
        {!showResult && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
            {/* Glassmorphic Container Box */}
            <div className="bg-gray-900/80 backdrop-blur-2xl rounded-2xl border-2 border-gray-700/50 shadow-2xl p-6 min-w-[600px]">
              {/* Decorative top border glow */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

              <div className="space-y-4">
                {/* Error Alert */}
                {audioError && (
                  <div className="bg-gradient-to-r from-red-900/90 to-red-800/90 border border-red-500/50 text-red-200 px-5 py-3 rounded-xl text-sm shadow-xl animate-slide-in">
                    <div className="flex items-center gap-3">
                      <span className="text-red-400 text-lg">⚠️</span>
                      <span className="text-red-200">{audioError}</span>
                    </div>
                  </div>
                )}

                {/* Processing Indicator */}
                {(isLoading || isProcessingAudio) && (
                  <div className="flex items-center justify-center gap-3 text-gray-200 bg-gradient-to-r from-blue-900/70 to-purple-900/70 px-5 py-3 rounded-xl border border-blue-500/30 shadow-lg">
                    <Loader2 size={20} className="animate-spin text-blue-400" />
                    <span className="text-sm font-medium">
                      {showResult
                        ? 'Finalizing transcriptions & evaluating...'
                        : isProcessingAudio
                          ? 'Processing your response...'
                          : 'Loading...'}
                    </span>
                  </div>
                )}

                {/* Audio Recorder with End Interview Button */}
                <div className="flex items-center justify-center gap-3">
                  <AudioRecorder
                    onSend={handleSendAudio}
                    disabled={!currentSession?.isActive}
                    isProcessing={isProcessingAudio}
                    onStartRecording={() => setIsUserRecording(true)}
                    onStopRecording={() => setIsUserRecording(false)}
                  />
                  <button
                    onClick={handleEndInterview}
                    disabled={isLoading || isProcessingAudio || !hasAnsweredOnce}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/40 shadow-xl hover:shadow-red-500/50 hover:scale-105 active:scale-95"
                    title={!hasAnsweredOnce ? "Answer at least one question to end interview" : "End Interview"}
                  >
                    <span className="font-medium text-sm">End Interview</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Modal */}
      {showSummaryModal && interviewResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 rounded-t-2xl border-b border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <CheckCircle size={28} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Interview Complete!</h2>
                    <p className="text-blue-100 text-sm">{currentSession?.techStack} Assessment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6 space-y-6">
              {/* Score Card */}
              <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-xl p-6 border border-blue-500/30 backdrop-blur-sm">
                <div className="text-center">
                  <p className="text-gray-300 text-sm font-medium mb-2">Your Score</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-5xl font-bold text-white">{interviewResult.score.toFixed(1)}</span>
                    <span className="text-2xl text-gray-400">/10</span>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Questions:</span>
                      <span className="text-white font-semibold">{interviewResult.total_questions}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Feedback
                </h3>
                <p className="text-gray-300 leading-relaxed bg-gray-800/50 p-4 rounded-lg border border-gray-700/30">
                  {interviewResult.feedback}
                </p>
              </div>

              {/* Missed Topics */}
              {interviewResult.missed_topics && interviewResult.missed_topics.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Missed Topics
                  </h3>
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                    <ul className="space-y-2">
                      {interviewResult.missed_topics.map((topic: string, index: number) => (
                        <li key={index} className="text-yellow-200 text-sm flex items-start gap-2">
                          <span className="text-yellow-500 mt-1">•</span>
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Areas for Improvement */}
              {interviewResult.improvement_areas && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Areas for Improvement
                  </h3>
                  <p className="text-gray-300 leading-relaxed bg-green-900/20 border border-green-500/30 p-4 rounded-lg">
                    {interviewResult.improvement_areas}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 z-10 bg-gray-800/95 px-8 py-6 rounded-b-2xl border-t border-gray-700/50 backdrop-blur-sm shadow-lg">
              <button
                onClick={handleBackToHome}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/30 hover:scale-105 active:scale-95"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
