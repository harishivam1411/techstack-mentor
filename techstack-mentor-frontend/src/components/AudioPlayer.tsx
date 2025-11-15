import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Loader2 } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  showReplay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  autoPlay = false,
  showReplay = true,
  onPlay,
  onPause,
  onEnded
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Audio event handlers
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (onEnded) {
        onEnded();
      }
    };

    const handleError = () => {
      setError('Failed to load audio');
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      // Auto-play if enabled
      if (autoPlay) {
        playAudio();
      }
    };

    // Attach event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    // Cleanup
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl, autoPlay, onEnded]);

  const playAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      await audio.play();
      setIsPlaying(true);
      setError(null);
      // Call onPlay callback
      if (onPlay) onPlay();
    } catch (err: any) {
      setError('Failed to play audio: ' + err.message);
      setIsPlaying(false);
    }
  };

  const pauseAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
    // Call onPause callback
    if (onPause) onPause();
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const handleReplay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    playAudio();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player relative glass-dark rounded-xl p-4 space-y-3 shadow-glow-blue border border-blue-500/20 backdrop-blur-xl">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 rounded-xl pointer-events-none"></div>

      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {error && (
        <div className="relative text-red-400 text-sm bg-red-900/30 px-3 py-2 rounded-lg border border-red-500/30">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4 relative z-10">
        {/* Play/Pause button */}
        <button
          onClick={handlePlayPause}
          disabled={isLoading || !!error}
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full hover:from-blue-600 hover:to-blue-800 transition-all duration-300 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50 hover:scale-105 active:scale-95"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        {/* Progress bar and time */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="flex-1 relative group">
              {/* Progress bar background */}
              <div className="w-full h-2.5 bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
                {/* Progress bar fill with gradient */}
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100 relative"
                  style={{ width: `${progressPercentage}%` }}
                >
                  {/* Animated shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>
              {/* Seek input (invisible but interactive) */}
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                disabled={isLoading || !!error}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Seek audio"
              />
            </div>
          </div>

          {/* Time display */}
          <div className="flex items-center justify-between text-xs text-blue-300 font-mono px-1">
            <span className="bg-blue-900/30 px-2 py-0.5 rounded">{formatTime(currentTime)}</span>
            <span className="text-gray-500">/</span>
            <span className="bg-blue-900/30 px-2 py-0.5 rounded">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Replay button */}
        {showReplay && (
          <button
            onClick={handleReplay}
            disabled={isLoading || !!error}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-900/50 text-blue-300 rounded-full hover:bg-blue-800/50 hover:text-blue-200 transition-all duration-300 disabled:bg-gray-700/30 disabled:text-gray-500 disabled:cursor-not-allowed border border-blue-700/30 hover:border-blue-500/50 hover:scale-105 active:scale-95"
            aria-label="Replay from start"
            title="Replay"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </div>

      {isLoading && !error && (
        <div className="relative flex items-center justify-center gap-2 text-xs text-blue-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading audio...</span>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
