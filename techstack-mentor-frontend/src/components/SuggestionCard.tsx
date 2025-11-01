import React from 'react';
import { Lightbulb, BookOpen, TrendingUp } from 'lucide-react';
import type { Suggestion } from '../types';
import { format } from 'date-fns';

interface SuggestionCardProps {
  suggestion: Suggestion;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-amber-100 text-amber-600 rounded-lg p-3">
          <Lightbulb size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">{suggestion.techStack}</h3>
          <p className="text-sm text-gray-500">{format(new Date(suggestion.createdAt), 'MMM dd, yyyy')}</p>
        </div>
      </div>

      {suggestion.missedTopics && suggestion.missedTopics.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-700">Topics to Review</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestion.missedTopics.map((topic, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {suggestion.improvementAreas && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-primary-600" />
            <h4 className="text-sm font-semibold text-gray-700">Improvement Areas</h4>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{suggestion.improvementAreas}</p>
        </div>
      )}
    </div>
  );
};
