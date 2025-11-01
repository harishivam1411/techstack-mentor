import React from "react";
import { Trophy, Calendar, Target, CheckCircle } from "lucide-react";
import type { Result } from "../types";
import { format } from "date-fns";

interface ResultCardProps {
  result: Result;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const scoreColor =
    result.score >= 8
      ? "text-green-600"
      : result.score >= 6
      ? "text-yellow-600"
      : "text-red-600";
  const scoreBackground =
    result.score >= 8
      ? "bg-green-50"
      : result.score >= 6
      ? "bg-yellow-50"
      : "bg-red-50";

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {result.techStack}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar size={14} />
            <span>
              {format(new Date(result.createdAt), "MMM dd, yyyy HH:mm")}
            </span>
          </div>
        </div>
        <div
          className={`${scoreBackground} ${scoreColor} rounded-lg px-4 py-2 flex items-center gap-2`}
        >
          <Trophy size={20} />
          <span className="text-2xl font-bold">
            {result.score.toFixed(1)}/10
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Target size={16} />
          <span className="text-sm">
            {result.correctAnswers}/{result.totalQuestions} correct
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <CheckCircle size={16} />
          <span className="text-sm">
            {Math.round((result.correctAnswers / result.totalQuestions) * 100)}%
            accuracy
          </span>
        </div>
      </div>

      {result.feedback && (
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Feedback</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {result.feedback}
          </p>
        </div>
      )}
    </div>
  );
};
