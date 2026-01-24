import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  audioBlob: Blob | null;
  duration: number;
  analyserData: Uint8Array | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'checking';
  requestPermission: () => Promise<boolean>;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [analyserData, setAnalyserData] = useState<Uint8Array | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
    return () => {
      cleanup();
    };
  }, []);

  const checkPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied');
      result.onchange = () => {
        setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied');
      };
    } catch {
      setPermissionStatus('prompt');
    }
  };

  const cleanup = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
      return true;
    } catch {
      setPermissionStatus('denied');
      return false;
    }
  };

  const updateAnalyser = useCallback(() => {
    if (analyserRef.current && isRecording) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      setAnalyserData(new Uint8Array(dataArray));
      animationRef.current = requestAnimationFrame(updateAnalyser);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermissionStatus('granted');

      // Setup audio analyser
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        cleanup();
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Start analyser animation
      updateAnalyser();
    } catch (error) {
      console.error('Error starting recording:', error);
      setPermissionStatus('denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setAnalyserData(null);
    chunksRef.current = [];
  };

  return {
    isRecording,
    isPaused,
    audioUrl,
    audioBlob,
    duration,
    analyserData,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    permissionStatus,
    requestPermission,
  };
}
