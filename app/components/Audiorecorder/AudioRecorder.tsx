"use client";

import { Mic, Pause, Play, Square, AudioLines } from "lucide-react";
import { useAudioStore } from "../../../store/audioStore";
import AudioPlayer from "./AudioPlayer";

export default function AudioRecorder() {
    const {
        isRecording,
        isPaused,
        audioURL,
        seconds,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        clearAudio,
        saveRecording,
        formatTime,
    } = useAudioStore();

    return (
        <div className="recorder-card">
            <h2>Voice Recorder</h2>

            {!isRecording && !audioURL && (
                <button className="record-btn" onClick={startRecording}>
                    <Mic size={24} />
                </button>
            )}

            {isRecording && (
                <div className="recording-state">
                    <div className={`wave ${isPaused ? "paused" : "recording"}`}>
                        {[...Array(5)].map((_, i) => (
                            <AudioLines key={i} size={24} strokeWidth={2} />
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
                <AudioPlayer
                    audioURL={audioURL}
                    onSave={saveRecording}
                    onClear={clearAudio}
                    formatTime={formatTime}
                />
            )}
        </div>
    );
}
