import React from 'react';
import { Code, Server, Database, Cloud, Sparkles } from 'lucide-react';
import type { TechStack } from '../types';

interface TechStackSelectorProps {
  onSelect: (techStack: TechStack) => void;
}

const techStacks: { name: TechStack; icon: React.ReactNode; color: string; description: string }[] = [
  {
    name: 'React.js',
    icon: <Code size={32} />,
    color: 'bg-blue-500',
    description: 'Frontend library for building UIs',
  },
  {
    name: 'Node.js',
    icon: <Server size={32} />,
    color: 'bg-green-500',
    description: 'JavaScript runtime for backend',
  },
  {
    name: 'Python',
    icon: <Sparkles size={32} />,
    color: 'bg-yellow-500',
    description: 'Versatile programming language',
  },
  {
    name: 'Database (SQL/PostgreSQL)',
    icon: <Database size={32} />,
    color: 'bg-purple-500',
    description: 'Relational database management',
  },
  {
    name: 'DevOps (Docker, CI/CD)',
    icon: <Cloud size={32} />,
    color: 'bg-indigo-500',
    description: 'Deployment and automation',
  },
];

export const TechStackSelector: React.FC<TechStackSelectorProps> = ({ onSelect }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Your Tech Stack</h2>
        <p className="text-gray-600">Choose the technology you want to be tested on</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {techStacks.map((tech) => (
          <button
            key={tech.name}
            onClick={() => onSelect(tech.name)}
            className="group relative overflow-hidden bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-left border-2 border-transparent hover:border-primary-500"
          >
            <div className={`${tech.color} w-16 h-16 rounded-lg flex items-center justify-center text-white mb-4`}>
              {tech.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{tech.name}</h3>
            <p className="text-sm text-gray-600">{tech.description}</p>
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary-50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        ))}
      </div>
    </div>
  );
};
