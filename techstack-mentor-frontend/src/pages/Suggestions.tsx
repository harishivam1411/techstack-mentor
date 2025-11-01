import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SuggestionCard } from '../components/SuggestionCard';
import { suggestionsApi } from '../services/api';
import type { Suggestion } from '../types';

export const Suggestions: React.FC = () => {
  const { setCurrentView, userId, suggestions, setSuggestions } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await suggestionsApi.getUserSuggestions(userId, 20);
      const formattedResults: Suggestion[] = data.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        techStack: r.tech_stack,
        missedTopics: r.missed_topics,
        improvementAreas: r.improvement_areas,
        createdAt: r.created_at,
    }));

    setSuggestions(formattedResults);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Failed to load suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentView('home')} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Suggested Topics</h1>
              <p className="text-gray-600">Areas to improve based on your past interviews</p>
            </div>
          </div>
          <button onClick={fetchSuggestions} className="btn-secondary">
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button onClick={fetchSuggestions} className="btn-primary mt-4">
              Try Again
            </button>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Suggestions Yet</h3>
            <p className="text-gray-600 mb-6">Complete an interview to get personalized improvement suggestions!</p>
            <button onClick={() => setCurrentView('interview')} className="btn-primary">
              Start Interview
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {suggestions.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
