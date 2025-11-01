import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ResultCard } from '../components/ResultCard';
import { resultsApi } from '../services/api';
import type { Result } from '../types';

export const Results: React.FC = () => {
  const { setCurrentView, userId, results, setResults } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await resultsApi.getUserResults(userId, 20);
      const formattedResults: Result[] = data.results.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      sessionId: r.session_id,
      techStack: r.tech_stack,
      score: r.score,
      feedback: r.feedback,
      totalQuestions: r.total_questions,
      correctAnswers: r.correct_answers,
      createdAt: r.created_at,
    }));

    setResults(formattedResults);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to load results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageScore = () => {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.score, 0);
    return (sum / results.length).toFixed(1);
  };

  const getBestScore = () => {
    if (results.length === 0) return 0;
    return Math.max(...results.map(r => r.score)).toFixed(1);
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
              <h1 className="text-3xl font-bold text-gray-900">Past Results</h1>
              <p className="text-gray-600">Review your interview performance history</p>
            </div>
          </div>
          <button onClick={fetchResults} className="btn-secondary">
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
            <button onClick={fetchResults} className="btn-primary mt-4">
              Try Again
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Yet</h3>
            <p className="text-gray-600 mb-6">Take your first mock interview to see results here!</p>
            <button onClick={() => setCurrentView('interview')} className="btn-primary">
              Start Interview
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-gray-600 text-sm mb-1">Total Interviews</p>
                <p className="text-3xl font-bold text-gray-900">{results.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-gray-600 text-sm mb-1">Average Score</p>
                <p className="text-3xl font-bold text-primary-600">{calculateAverageScore()}/10</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-gray-600 text-sm mb-1">Best Score</p>
                <p className="text-3xl font-bold text-green-600">{getBestScore()}/10</p>
              </div>
            </div>

            {/* Results List */}
            <div className="space-y-6">
              {results.map((result) => (
                <ResultCard key={result.id} result={result} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
