import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import type { Message } from '../types';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAI = message.role === 'ai';

  return (
    <div className={`flex gap-3 mb-4 animate-slide-in ${isAI ? '' : 'flex-row-reverse'}`}>
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isAI ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-700'
        }`}
      >
        {isAI ? <Bot size={20} /> : <User size={20} />}
      </div>
      <div className={`flex-1 max-w-[80%] ${isAI ? '' : 'flex flex-col items-end'}`}>
        <div
          className={`rounded-lg px-4 py-3 ${
            isAI ? 'bg-white border border-gray-200' : 'bg-primary-600 text-white'
          }`}
        >
          {isAI ? (
            <ReactMarkdown className="prose prose-sm max-w-none">{message.content}</ReactMarkdown>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        <span className="text-xs text-gray-400 mt-1">
          {format(new Date(message.timestamp), 'HH:mm')}
        </span>
      </div>
    </div>
  );
};
