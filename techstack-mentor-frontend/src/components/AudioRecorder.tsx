import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Loader2, Send, Trash2 } from 'lucide-react';

interface AudioRecorderProps {
  onSend: (audioBlob: Blob) => void;
  disabled?: boolean;
  isProcessing?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onSend,
  disabled = false,
  isProcessing = false,
  onStartRecording,
  onStopRecording
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check browser support and mic permission on mount
  useEffect(() => {
    checkBrowserSupport();
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const checkBrowserSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Edge.');
      return false;
    }
    if (!window.MediaRecorder) {
      setError('MediaRecorder API is not supported in your browser.');
      return false;
    }
    return true;
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      streamRef.current = stream;
      setHasPermission(true);
      setError(null);
      return true;
    } catch (err: any) {
      setHasPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission denied. Please enable microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError('Failed to access microphone: ' + err.message);
      }
      return false;
    }
  };

  const startRecording = async () => {
    if (!checkBrowserSupport()) return;

    // Request permission if not granted
    if (!hasPermission) {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }

    try {
      // Clear previous recording
      setAudioBlob(null);
      setAudioURL(null);
      audioChunksRef.current = [];

      // Get media stream if not already available
      let stream = streamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      }

      // Determine MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioURL = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioURL(audioURL);
      };

      mediaRecorder.onerror = (event: any) => {
        setError('Recording failed: ' + event.error);
        stopRecording();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Call onStartRecording callback
      if (onStartRecording) onStartRecording();

      // Start timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      setError('Failed to start recording: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);

    // Call onStopRecording callback
    if (onStopRecording) onStopRecording();

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
      // Clear recording after sending
      setAudioBlob(null);
      setAudioURL(null);
      setRecordingTime(0);
    }
  };

  const handleClear = () => {
    setAudioBlob(null);
    setAudioURL(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-recorder">
      {/* Recording controls */}
      <div className="flex items-center gap-3">
        {!isRecording && !audioBlob && (
          <button
            onClick={startRecording}
            disabled={disabled || isProcessing || error !== null}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-300 backdrop-blur-xl ${
              disabled || isProcessing || error !== null
                ? 'bg-gray-700/80 text-gray-400 cursor-not-allowed border border-gray-600/50 shadow-xl'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-blue-500/50 hover:scale-105 active:scale-95 border border-blue-500/50'
            }`}
            aria-label="Start recording"
          >
            <Mic className="w-5 h-5" />
            <span className="text-sm">Start Recording</span>
          </button>
        )}

        {isRecording && (
          <>
            <div className="flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-green-900/90 to-emerald-800/90 border border-green-500/50 rounded-lg backdrop-blur-xl shadow-2xl">
              <div className="relative">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <span className="font-semibold text-green-100 text-sm">Recording</span>
              <span className="text-green-100 font-mono text-sm bg-green-950/50 px-2 py-1 rounded">{formatTime(recordingTime)}</span>
            </div>
            <button
              onClick={stopRecording}
              className="px-4 py-3 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-xl hover:shadow-red-500/50 hover:scale-105 active:scale-95 border border-red-500/50 backdrop-blur-xl"
              aria-label="Stop recording"
            >
              <Square className="w-5 h-5" />
            </button>
          </>
        )}

        {audioBlob && !isRecording && (
          <>
            <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-900/90 to-emerald-800/90 border border-green-500/50 rounded-lg backdrop-blur-xl shadow-2xl">
              <Play className="w-4 h-4 text-green-300" />
              <span className="font-semibold text-green-100 text-sm">Ready</span>
              <span className="text-green-100 font-mono text-sm bg-green-950/50 px-2 py-1 rounded">{formatTime(recordingTime)}</span>
            </div>

            <button
              onClick={handleClear}
              disabled={isProcessing}
              className="px-4 py-3 bg-gray-700/90 text-gray-300 rounded-lg hover:bg-gray-600/90 hover:text-white transition-all duration-300 disabled:opacity-50 border border-gray-600/50 hover:border-gray-500/50 hover:scale-105 active:scale-95 backdrop-blur-xl shadow-xl"
              aria-label="Discard recording"
              title="Discard"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <button
              onClick={handleSend}
              disabled={isProcessing}
              className="px-5 py-3 bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xl hover:shadow-green-500/50 hover:scale-105 active:scale-95 border border-green-500/50 backdrop-blur-xl"
              aria-label="Send recording"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="text-sm font-medium">Send</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

    </div>
  );
};

export default AudioRecorder;
