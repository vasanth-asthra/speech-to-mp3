"use client";

import { create } from "zustand";

interface AudioStore {
    isRecording: boolean;
    isPaused: boolean;
    audioURL: string | null;
    seconds: number;
    startRecording: () => Promise<void>;
    pauseRecording: () => void;
    resumeRecording: () => void;
    stopRecording: () => Promise<void>;
    clearAudio: () => void;
    saveRecording: () => void;
    formatTime: (t: number) => string;
}

export const useAudioStore = create<AudioStore>((set, get) => {
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let intervalId: number | null = null;

    const formatTime = (t: number) => {
        if (!isFinite(t) || t <= 0) return "0:00";
        const minutes = Math.floor(t / 60);
        const seconds = Math.floor(t % 60).toString().padStart(2, "0");
        return `${minutes}:${seconds}`;
    };

    // MP3 conversion
    const convertToMp3 = async (webmBlob: Blob): Promise<Blob> => {
        // Dynamic import of lamejs npm module
        const lamejsModule = await import("@breezystack/lamejs");
        const Mp3Encoder = lamejsModule.Mp3Encoder || lamejsModule.default?.Mp3Encoder;

        if (!Mp3Encoder) throw new Error("Mp3Encoder not found");

        const audioContext = new AudioContext();
        const arrayBuffer = await webmBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const samples = audioBuffer.getChannelData(0);
        const int16 = new Int16Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
            int16[i] = samples[i] < 0 ? samples[i] * 0x8000 : samples[i] * 0x7fff;
        }

        const encoder = new Mp3Encoder(1, audioBuffer.sampleRate, 128);
        const mp3Data: Uint8Array[] = [];
        const blockSize = 1152;

        for (let i = 0; i < int16.length; i += blockSize) {
            const chunk = int16.subarray(i, i + blockSize);
            const mp3buf = encoder.encodeBuffer(chunk);
            if (mp3buf.length > 0) mp3Data.push(mp3buf);
        }

        const mp3buf = encoder.flush();
        if (mp3buf.length > 0) mp3Data.push(mp3buf);

        return new Blob(mp3Data.map((b) => new Uint8Array(b.buffer as ArrayBuffer)), {
            type: "audio/mp3",
        });
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };

            mediaRecorder.start();

            if (intervalId) window.clearInterval(intervalId);
            intervalId = window.setInterval(() => set((s) => ({ seconds: s.seconds + 1 })), 1000);

            set({ isRecording: true, isPaused: false, audioURL: null, seconds: 0 });
        } catch (err) {
            console.error("Microphone error:", err);
        }
    };

    const pauseRecording = () => {
        if (!mediaRecorder) return;
        try {
            if (mediaRecorder.state === "recording") {
                mediaRecorder.pause();
                if (intervalId) {
                    window.clearInterval(intervalId);
                    intervalId = null;
                }
                set({ isPaused: true });
            }
        } catch (err) {
            console.error("Pause error:", err);
        }
    };

    const resumeRecording = () => {
        if (!mediaRecorder) return;
        try {
            if (mediaRecorder.state === "paused") {
                mediaRecorder.resume();
                if (!intervalId)
                    intervalId = window.setInterval(() => set((s) => ({ seconds: s.seconds + 1 })), 1000);
                set({ isPaused: false });
            }
        } catch (err) {
            console.error("Resume error:", err);
        }
    };

    const stopRecording = async () => {
        if (!mediaRecorder || mediaRecorder.state === "inactive") return;

        return new Promise<void>((resolve) => {
            mediaRecorder!.onstop = async () => {
                const webmBlob = new Blob(audioChunks, { type: "audio/webm" });
                try {
                    const mp3Blob = await convertToMp3(webmBlob);
                    const url = URL.createObjectURL(mp3Blob);
                    set({ audioURL: url, isRecording: false, isPaused: false });
                } catch (err) {
                    console.error("MP3 conversion error:", err);
                    const url = URL.createObjectURL(webmBlob);
                    set({ audioURL: url, isRecording: false, isPaused: false });
                }

                if (intervalId) {
                    window.clearInterval(intervalId);
                    intervalId = null;
                }
                resolve();
            };

            mediaRecorder!.stop();
            mediaRecorder!.stream.getTracks().forEach((t) => t.stop());
        });
    };

    const clearAudio = () => {
        const { audioURL } = get();
        if (audioURL) URL.revokeObjectURL(audioURL);
        set({ audioURL: null, seconds: 0 });
    };

    const saveRecording = () => {
        const { audioURL } = get();
        if (!audioURL) return;
        const a = document.createElement("a");
        a.href = audioURL;
        a.download = "recording.mp3";
        a.click();
    };

    return {
        isRecording: false,
        isPaused: false,
        audioURL: null,
        seconds: 0,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        clearAudio,
        saveRecording,
        formatTime,
    };
});
