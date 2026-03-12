import { useState, useCallback, useRef } from "react";

export const OPENAI_VOICES = [
  { id: "alloy", name: "Alloy", description: "Neutral and balanced" },
  { id: "ash", name: "Ash", description: "Warm and clear" },
  { id: "coral", name: "Coral", description: "Warm and expressive" },
  { id: "echo", name: "Echo", description: "Smooth and composed" },
  { id: "fable", name: "Fable", description: "Expressive and dynamic" },
  { id: "nova", name: "Nova", description: "Friendly and natural" },
  { id: "onyx", name: "Onyx", description: "Deep and authoritative" },
  { id: "sage", name: "Sage", description: "Calm and thoughtful" },
  { id: "shimmer", name: "Shimmer", description: "Clear and bright" },
] as const;

export type OpenAIVoice = (typeof OPENAI_VOICES)[number]["id"];

interface SpeechSynthesisHook {
  isSpeaking: boolean;
  speak: (text: string, voice?: string) => void;
  stop: () => void;
}

export function useSpeechSynthesis(): SpeechSynthesisHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, voice?: string) => {
      stop();

      const controller = new AbortController();
      abortRef.current = controller;

      setIsSpeaking(true);

      fetch("/api/tts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: voice || "nova" }),
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error("TTS request failed");
          return res.blob();
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          audio.onended = () => {
            URL.revokeObjectURL(url);
            setIsSpeaking(false);
            audioRef.current = null;
          };

          audio.onerror = () => {
            URL.revokeObjectURL(url);
            setIsSpeaking(false);
            audioRef.current = null;
          };

          audio.play();
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error("TTS error:", err);
          }
          setIsSpeaking(false);
        });
    },
    [stop],
  );

  return { isSpeaking, speak, stop };
}
