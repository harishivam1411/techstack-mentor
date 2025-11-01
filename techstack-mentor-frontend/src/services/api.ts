import axios from 'axios';
import type {
  StartInterviewRequest,
  StartInterviewResponse,
  SendMessageRequest,
  SendMessageResponse,
  EndInterviewResponse,
  Result,
  Suggestion,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interview endpoints
export const interviewApi = {
  start: async (data: StartInterviewRequest): Promise<StartInterviewResponse> => {
    const response = await api.post('/api/interview/start', data);
    return response.data;
  },

  sendMessage: async (data: SendMessageRequest): Promise<SendMessageResponse> => {
    const response = await api.post('/api/interview/message', data);
    return response.data;
  },

  end: async (sessionId: string): Promise<EndInterviewResponse> => {
    const response = await api.post(`/api/interview/end/${sessionId}`);
    return response.data;
  },

  getStatus: async (sessionId: string) => {
    const response = await api.get(`/api/interview/status/${sessionId}`);
    return response.data;
  },

  health: async () => {
    const response = await api.get('/api/interview/health');
    return response.data;
  },
};

// Results endpoints
export const resultsApi = {
  getUserResults: async (userId: string, limit: number = 10): Promise<{ results: Result[]; total: number }> => {
    const response = await api.get(`/api/results/${userId}`, { params: { limit } });
    return response.data;
  },

  getSessionResult: async (sessionId: string): Promise<Result> => {
    const response = await api.get(`/api/results/session/${sessionId}`);
    return response.data;
  },

  getLatestResult: async (userId: string): Promise<Result> => {
    const response = await api.get(`/api/results/latest/${userId}`);
    return response.data;
  },

  getResultsByTechStack: async (
    userId: string,
    techStack: string,
    limit: number = 10
  ): Promise<{ results: Result[]; total: number }> => {
    const response = await api.get(`/api/results/tech-stack/${userId}/${techStack}`, { params: { limit } });
    return response.data;
  },
};

// Suggestions endpoints
export const suggestionsApi = {
  getUserSuggestions: async (userId: string, limit: number = 10): Promise<Suggestion[]> => {
    const response = await api.get(`/api/suggestions/${userId}`, { params: { limit } });
    return response.data;
  },

  getLatestSuggestion: async (userId: string): Promise<Suggestion> => {
    const response = await api.get(`/api/suggestions/latest/${userId}`);
    return response.data;
  },

  getSuggestionsByTechStack: async (userId: string, techStack: string, limit: number = 10): Promise<Suggestion[]> => {
    const response = await api.get(`/api/suggestions/tech-stack/${userId}/${techStack}`, { params: { limit } });
    return response.data;
  },
};

export default api;
