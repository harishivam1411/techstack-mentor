import { create } from 'zustand';
import type { Message, InterviewSession, Result, Suggestion } from '../types';

interface AppState {
  // User
  userId: string;
  setUserId: (userId: string) => void;

  // Interview
  currentSession: InterviewSession | null;
  messages: Message[];
  isLoading: boolean;
  setCurrentSession: (session: InterviewSession | null) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;

  // Audio
  isRecording: boolean;
  isProcessingAudio: boolean;
  audioError: string | null;
  setIsRecording: (isRecording: boolean) => void;
  setIsProcessingAudio: (isProcessing: boolean) => void;
  setAudioError: (error: string | null) => void;

  // Results
  results: Result[];
  currentResult: Result | null;
  setResults: (results: Result[]) => void;
  setCurrentResult: (result: Result | null) => void;

  // Suggestions
  suggestions: Suggestion[];
  setSuggestions: (suggestions: Suggestion[]) => void;

  // UI State
  currentView: 'home' | 'interview' | 'results' | 'suggestions';
  setCurrentView: (view: 'home' | 'interview' | 'results' | 'suggestions') => void;
}

export const useStore = create<AppState>((set) => ({
  // User
  userId: localStorage.getItem('userId') || `user_${Date.now()}`,
  setUserId: (userId) => {
    localStorage.setItem('userId', userId);
    set({ userId });
  },

  // Interview
  currentSession: null,
  messages: [],
  isLoading: false,
  setCurrentSession: (session) => set({ currentSession: session }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [] }),
  setLoading: (loading) => set({ isLoading: loading }),

  // Audio
  isRecording: false,
  isProcessingAudio: false,
  audioError: null,
  setIsRecording: (isRecording) => set({ isRecording }),
  setIsProcessingAudio: (isProcessing) => set({ isProcessingAudio: isProcessing }),
  setAudioError: (error) => set({ audioError: error }),

  // Results
  results: [],
  currentResult: null,
  setResults: (results) => set({ results }),
  setCurrentResult: (result) => set({ currentResult: result }),

  // Suggestions
  suggestions: [],
  setSuggestions: (suggestions) => set({ suggestions }),

  // UI State
  currentView: 'home',
  setCurrentView: (view) => set({ currentView: view }),
}));
