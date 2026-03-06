import { useState, useEffect, useCallback } from "react";

interface SpeechSynthesisHook {
  voices: SpeechSynthesisVoice[];
  isSpeaking: boolean;
  speak: (text: string, voiceName?: string) => void;
  stop: () => void;
}

export function useSpeechSynthesis(): SpeechSynthesisHook {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback(
    (text: string, voiceName?: string) => {
      if (!window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      if (voiceName) {
        const voice = voices.find((v) => v.name === voiceName);
        if (voice) utterance.voice = voice;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [voices],
  );

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return { voices, isSpeaking, speak, stop };
}
