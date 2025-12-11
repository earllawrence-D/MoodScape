// hooks/useVoice.js
import { useRef } from "react";

export const useVoice = () => {
  const synthRef = useRef(window.speechSynthesis);

  // Stop any active speech
  const stopSpeaking = () => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
  };

  // Speak text safely
  const speakText = (text) => {
    return new Promise((resolve) => {
      stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      synthRef.current.speak(utterance);
    });
  };

  return { speakText, stopSpeaking };
};
