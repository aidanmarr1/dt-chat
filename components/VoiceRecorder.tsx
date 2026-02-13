"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface VoiceRecorderProps {
  onRecorded: (file: File) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onRecorded, onCancel }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const streamRef = useRef<MediaStream | null>(null);
  const MAX_DURATION = 120; // 2 minutes

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setRecording(false);
  }, []);

  useEffect(() => {
    // Auto-start recording
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-stop at max duration
  useEffect(() => {
    if (elapsed >= MAX_DURATION) {
      stopRecording();
    }
  }, [elapsed, stopRecording]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size > 0) {
          const file = new File([blob], `voice-${Date.now()}.webm`, { type: mimeType });
          onRecorded(file);
        }
      };

      recorder.start(100);
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    } catch {
      setError("Microphone access denied");
    }
  }

  function handleCancel() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    onCancel();
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 w-full">
        <p className="text-sm text-red-400 flex-1">{error}</p>
        <button onClick={onCancel} className="text-sm text-muted hover:text-foreground">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 w-full animate-fade-in">
      {/* Cancel button */}
      <button
        onClick={handleCancel}
        className="p-2 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all active:scale-90 shrink-0"
        title="Cancel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Recording indicator */}
      <div className="flex items-center gap-2 flex-1">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-recording-pulse shrink-0" />
        <span className="text-sm text-foreground font-mono">{formatTime(elapsed)}</span>

        {/* Waveform bars */}
        <div className="flex items-center gap-0.5 flex-1 h-6">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-red-400/60 rounded-full min-w-[2px] max-w-[4px] animate-waveform"
              style={{
                animationDelay: `${i * 0.05}s`,
                animationPlayState: recording ? "running" : "paused",
              }}
            />
          ))}
        </div>

        <span className="text-[10px] text-muted">{formatTime(MAX_DURATION - elapsed)}</span>
      </div>

      {/* Stop/Send button */}
      <button
        onClick={stopRecording}
        className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all active:scale-90 shrink-0 shadow-sm"
        title="Stop & send"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      </button>
    </div>
  );
}
