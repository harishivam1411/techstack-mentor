import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import type { Message } from '../types';
import { format } from 'date-fns';
import AudioPlayer from './AudioPlayer';
import { audioApi } from '../services/api';

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
            <div className="space-y-3">
              {/* Audio player for AI messages - AUDIO ONLY MODE */}
              {message.audioUrl ? (
                <div>
                  <AudioPlayer
                    audioUrl={audioApi.getAudioUrl(message.audioUrl)}
                    autoPlay={true}
                    showReplay={true}
                  />
                  {/* Hidden text for accessibility */}
                  <p className="sr-only">{message.content}</p>
                </div>
              ) : (
                /* Fallback to text if no audio (completion message, etc.) */
                <div className="text-sm">
                  <ReactMarkdown className="prose prose-sm max-w-none">{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
          ) : (
            /* User message - just show generic "Audio response sent" */
            <div className="text-sm">
              <p>🎤 Audio response sent</p>
            </div>
          )}
        </div>
        <span className="text-xs text-gray-400 mt-1">
          {format(new Date(message.timestamp), 'HH:mm')}
        </span>
      </div>
    </div>
  );
};
