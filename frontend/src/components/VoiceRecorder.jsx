// components/VoiceRecorder.jsx
import { useState, useEffect, useRef } from "react";

const VoiceRecorder = ({ onText, listening }) => {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false; // IMPORTANT fix for double-hearing
    rec.continuous = false;

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript.trim();
      onText(transcript);
    };

    recognitionRef.current = rec;
  }, []);

  // Start listening
  const start = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  // Stop listening
  const stop = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return (
    <button
      onClick={isListening ? stop : start}
      className={`px-4 py-2 rounded-xl shadow ${
        isListening ? "bg-red-500 text-white" : "bg-blue-500 text-white"
      }`}
    >
      {isListening ? "Stop" : "Speak"}
    </button>
  );
};

export default VoiceRecorder;
