declare module 'react-speech-recognition' {
  interface SpeechRecognitionOptions {
    continuous?: boolean;
    interimResults?: boolean;
    language?: string;
  }

  interface SpeechRecognition {
    startListening: (options?: SpeechRecognitionOptions) => Promise<void>;
    stopListening: () => void;
    abortListening: () => void;
  }

  interface UseSpeechRecognitionResponse {
    transcript: string;
    interimTranscript: string;
    finalTranscript: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
  }

  export function useSpeechRecognition(): UseSpeechRecognitionResponse;
  const recognition: SpeechRecognition;
  export default recognition;
}