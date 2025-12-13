import { useState, useRef } from "react";
import { aiAPI } from "../utils/api";
import { useVoice } from "../hooks/useVoice";
import Navbar from "../components/Navbar";
import { sanitizeForTTS } from "../utils/sanitizeForTTS";

const AIChat = () => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [volumes, setVolumes] = useState(new Array(7).fill(0));
  const [currentSentence, setCurrentSentence] = useState("");

  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const recognitionRef = useRef(null);
  const animationFrameRef = useRef(null);

  const { speakText, stopSpeaking } = useVoice();

  // Speak text with TTS
  const speakResponse = async (text) => {
    const clean = sanitizeForTTS(text);
    await speakText(clean);
  };

  // -----------------------------
  // Send message (text or voice)
  // -----------------------------
  const sendMessage = async (message) => {
    if (!message.trim()) return; // text input works even if not listening
    stopSpeaking();

    try {
      const res = await aiAPI.chat({
        message,
        short: true,
        style: "concise, sympathetic, calm",
        tool: null,
      });

      const replyText = sanitizeForTTS(res?.data?.reply || "I'm here. Tell me more.");

      // Split into short sentences
      const lines = replyText
        .split(/([.!?])/)
        .reduce((acc, curr) => {
          if (/[.!?]/.test(curr)) acc.push((acc.pop() || "") + curr.trim());
          else acc.push(curr.trim());
          return acc;
        }, [])
        .filter(Boolean);

      // Fake bar animation while AI is speaking
      const fakeAnimation = setInterval(() => {
        setVolumes(Array(7).fill(Math.random() * 0.8));
      }, 150);

      for (const line of lines) {
        setCurrentSentence(line);
        await speakResponse(line);
      }

      clearInterval(fakeAnimation);
      setVolumes(new Array(7).fill(0));
      setCurrentSentence("");
    } catch {
      const errorMsg = "Something went wrong. Let's try again gently.";
      setCurrentSentence(errorMsg);
      await speakResponse(errorMsg);
      setVolumes(new Array(7).fill(0));
    }
  };

  // -----------------------------
  // Mic Equalizer
  // -----------------------------
  const startEqualizerMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioRef.current = new AudioContext();
      const source = audioRef.current.createMediaStreamSource(stream);

      analyserRef.current = audioRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      source.connect(analyserRef.current);

      animateBars();
    } catch (err) {
      console.log("Mic analyzer error:", err);
    }
  };

  const animateBars = () => {
    if (!isListening) return;
    animationFrameRef.current = requestAnimationFrame(animateBars);

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    const barValues = [];
    for (let i = 0; i < 7; i++) {
      const slice = dataArrayRef.current.slice(i * 14, i * 14 + 14);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      barValues.push(Math.min(avg / 128 - 1, 1)); // center at 0
    }

    setVolumes((prev) => prev.map((v, i) => v + (barValues[i] - v) * 0.3));
  };

  // -----------------------------
  // STT / Listening Toggle
  // -----------------------------
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      stopSpeaking();
      setIsListening(false);
      setCurrentSentence("");
      audioRef.current?.close();
      cancelAnimationFrame(animationFrameRef.current);
      setVolumes(new Array(7).fill(0));
      return;
    }

    // Check for secure context on mobile
    const isSecure = window.isSecureContext || 
                    window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

    if (!isSecure) {
      alert('Voice input requires a secure context (HTTPS) on mobile devices. Please use the text input instead.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    const recognizer = new SpeechRecognition();
    recognizer.continuous = false;
    recognizer.interimResults = false;
    recognizer.lang = "en-US";

    recognizer.onstart = () => {
      setIsListening(true);
      startEqualizerMic();
    };

    recognizer.onend = () => {
      setIsListening(false);
      stopSpeaking();
      audioRef.current?.close();
      cancelAnimationFrame(animationFrameRef.current);
      setVolumes(new Array(7).fill(0));
    };

    recognizer.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) sendMessage(transcript);
    };

    recognizer.start();
    recognitionRef.current = recognizer;
  };

  // -----------------------------
  // UI
  // -----------------------------
  const circleColor = "#6EE7B7";
  const lineColor = "#FFFFFF";

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4"
      style={{ background: "linear-gradient(145deg, #d9e9ff, #d7fff0, #fce7ff)" }}
    >
      <Navbar />

      {/* Listening Circle */}
      <div className="mt-24 relative cursor-pointer select-none" onClick={toggleListening}>
        <div
          className={`relative w-64 h-64 rounded-full shadow-xl border-2 flex items-center justify-center transition-all duration-500
          ${isListening ? "ring-8 ring-teal-300 animate-pulse" : "ring-4 ring-gray-300"}`}
          style={{ background: circleColor }}
        >
          <div className="flex items-center gap-3 h-48">
            {volumes.map((value, i) => (
              <div
                key={i}
                className="w-3 rounded-full bg-white transition-transform duration-150 ease-out"
                style={{
                  height: `${value * 120}px`,
                  transform: `translateY(${60 - value * 60}px)`,
                  background: lineColor,
                }}
              />
            ))}
          </div>
        </div>

        {/* Text */}
        <p className="text-center mt-6 text-lg font-medium text-gray-700">
          {isListening ? "Listening…" : "Tap to speak"}
        </p>
      </div>

      {/* Spoken AI Sentence */}
      {currentSentence && (
        <div className="mt-4 p-3 bg-white/90 rounded-xl shadow max-w-md text-center">
          {currentSentence}
        </div>
      )}

      {/* Input */}
      <form
        className="mt-12 flex items-center gap-3 w-full max-w-lg"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
          setInput("");
        }}
      >
        <input
          className="flex-1 p-3 rounded-xl shadow bg-white/70 border border-gray-300 backdrop-blur-sm"
          placeholder="Type your message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="px-5 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 shadow">
          Send
        </button>
      </form>
    </div>
  );
};

export default AIChat;
