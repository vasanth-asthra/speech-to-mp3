"use client";

import { useRef, useState, useEffect } from "react";
import { Mic, Pause, Play, Square } from "lucide-react";

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  


  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      if (audioURL) URL.revokeObjectURL(audioURL);
      setAudioBlob(null);
      setAudioURL(null);

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setSeconds(0);
    } catch (err) {
      console.error("Microphone error:", err);
    }
  };

  const pauseRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === "recording") {
      rec.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === "paused") {
      rec.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    const rec = mediaRecorderRef.current;
    if (!rec || rec.state === "inactive") return;

    rec.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
    };

    rec.stop();
    rec.stream.getTracks().forEach(track => track.stop());
    setIsRecording(false);
    setIsPaused(false);
  };

  const clearAudio = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioBlob(null);
    setAudioURL(null);
    setSeconds(0);
    audioChunksRef.current = [];
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const saveRecording = () => {
    alert("Audio saved!");
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
  };

  const formatTime = (t: number) => `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, "0")}`;

  return (
    <div className="recorder-card">
      <h2>Voice Recorder</h2>

      {!isRecording && !audioBlob && !audioURL && (
        <button className="record-btn" onClick={startRecording}>
          <Mic size={24} />
        </button>
      )}

      {isRecording && (
        <div className="recording-state">
          <div className={`wave ${isPaused ? "paused" : ""}`}>
            {[...Array(5)].map((_, i) => (
              <span key={i}></span>
            ))}
          </div>

          <div className="timer">{formatTime(seconds)}</div>
          <div className="btn-group">
            {!isPaused ? (
              <button className="pause-btn" onClick={pauseRecording}>
                <Pause size={24} />
              </button>
            ) : (
              <button className="resume-btn" onClick={resumeRecording}>
                <Play size={24} />
              </button>
            )}
            <button className="stop-btn" onClick={stopRecording}>
              <Square size={24} /> 
            </button>
          </div>
        </div>
      )}

      {audioURL && (
        <div className="audio-controls">
          <div className="controls-row">
            <button onClick={togglePlay} className="play-btn">
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <input
              type="range"
              min={0}
              max={duration}
              step={0.01}
              value={currentTime}
              onChange={handleSeek}
              className="seek-range"
            />
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          <audio
            ref={audioRef}
            src={audioURL}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            className="audio-hidden"
          />
          <div className="actions">
            <button className="save-btn" onClick={saveRecording}>
              Save
            </button>
            <button className="clear-btn" onClick={clearAudio}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
