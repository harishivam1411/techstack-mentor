import React from 'react';
import { MessageSquare, Trophy, Lightbulb, Brain } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Home: React.FC = () => {
  const { setCurrentView } = useStore();

  const options = [
    {
      id: 1,
      title: 'Take a Mock Interview',
      description: 'Start a new AI-powered technical interview session',
      icon: <MessageSquare size={32} />,
      color: 'bg-blue-500',
      action: () => setCurrentView('interview'),
    },
    {
      id: 2,
      title: 'View Past Results',
      description: 'Review your previous interview scores and feedback',
      icon: <Trophy size={32} />,
      color: 'bg-green-500',
      action: () => setCurrentView('results'),
    },
    {
      id: 3,
      title: 'View Suggested Topics',
      description: 'See areas for improvement and topics to study',
      icon: <Lightbulb size={32} />,
      color: 'bg-amber-500',
      action: () => setCurrentView('suggestions'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary-600 text-white rounded-full p-4">
              <Brain size={48} />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            TechStack Mentor
          </h1>
          <p className="text-xl text-gray-600">
            Your AI-Powered Mock Interview Platform
          </p>
        </div>

        {/* Greeting */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            👋 Hi there! What would you like to do today?
          </h2>
          <p className="text-gray-600">
            Select an option below to get started
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={option.action}
              className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-left border-2 border-transparent hover:border-primary-500 transform hover:-translate-y-1"
            >
              <div className={`${option.color} w-16 h-16 rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {option.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {option.id}️⃣ {option.title}
              </h3>
              <p className="text-sm text-gray-600">
                {option.description}
              </p>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Powered by AI • Built for developers
          </p>
        </div>
      </div>
    </div>
  );
};
