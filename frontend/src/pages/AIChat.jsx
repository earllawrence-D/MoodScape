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
      // Check for iOS/Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

      if (isIOS) {
        // For iOS, use a simple pulsing animation instead of microphone input
        let direction = 1;
        let value = 0.2;

        const updateEqualizer = () => {
          value += 0.02 * direction;
          if (value > 0.8) direction = -1;
          if (value < 0.2) direction = 1;

          setVolumes(new Array(7).fill(0).map((_, i) =>
            Math.max(0, value + (Math.random() * 0.2 - 0.1))
          ));

          animationFrameRef.current = requestAnimationFrame(updateEqualizer);
        };

        updateEqualizer();
        return;
      }

      // For non-iOS devices, use the microphone input
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;

      analyserRef.current = analyser;
      audioRef.current = audioContext;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      const updateEqualizer = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        const barValues = [];
        for (let i = 0; i < 7; i++) {
          const slice = dataArrayRef.current.slice(i * 14, i * 14 + 14);
          const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
          barValues.push(Math.min(avg / 128 - 1, 1)); // center at 0
        }

        setVolumes((prev) => prev.map((v, i) => v + (barValues[i] - v) * 0.3));
        animationFrameRef.current = requestAnimationFrame(updateEqualizer);
      };

      updateEqualizer();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      // Fallback to simple animation if microphone access fails
      let direction = 1;
      let value = 0.2;

      const updateEqualizer = () => {
        value += 0.02 * direction;
        if (value > 0.8) direction = -1;
        if (value < 0.2) direction = 1;

        setVolumes(new Array(7).fill(0).map((_, i) =>
          Math.max(0, value + (Math.random() * 0.2 - 0.1))
        ));

        animationFrameRef.current = requestAnimationFrame(updateEqualizer);
      };

      updateEqualizer();
    }
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

      // Check for mobile Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    // Check for secure context on mobile
    const isSecure = window.isSecureContext || 
                    window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

    if (!isSecure) {
      alert('Voice input requires a secure context (HTTPS) on mobile devices. Please use the text input instead.');
      return;
    }

    // Use webkitSpeechRecognition for Safari/iOS
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    const recognizer = new SpeechRecognition();
    recognizer.continuous = false;
    recognizer.interimResults = false;
    recognizer.lang = "en-US";
    
    // Additional configuration for iOS/Safari
    if (isIOS || isSafari) {
      recognizer.continuous = true; // Helps with iOS quirks
      recognizer.interimResults = true; // Get interim results for better UX
    }

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
      className="min-h-screen flex flex-col items-center px-4 w-full"
      style={{ background: "linear-gradient(145deg, #d9e9ff, #d7fff0, #fce7ff)" }}
    >
      <Navbar />

      <div className="w-full max-w-4xl flex-1 flex flex-col items-center pt-6 md:pt-12 pb-8 px-4">
        {/* Listening Circle */}
        <div 
          className="relative cursor-pointer select-none w-full max-w-md mx-auto"
          onClick={toggleListening}
          role="button"
          aria-label={isListening ? "Stop listening" : "Start speaking"}
        >
          <div
            className={`relative w-full aspect-square rounded-full shadow-xl border-2 flex items-center justify-center transition-all duration-500
            ${isListening ? "ring-8 ring-teal-300 animate-pulse" : "ring-4 ring-gray-300"}
            max-w-xs sm:max-w-sm mx-auto`}
            style={{ background: circleColor }}
          >
            <div className="flex items-center justify-center gap-2 sm:gap-3 w-3/4 h-3/4">
              {volumes.map((value, i) => (
                <div
                  key={i}
                  className="w-2 sm:w-3 rounded-full bg-white transition-transform duration-150 ease-out flex-shrink-0"
                  style={{
                    height: `${value * 100}%`,
                    maxHeight: '120px',
                    transform: `translateY(${50 - value * 25}%)`,
                    background: lineColor,
                  }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>

          {/* Text */}
          <p className="text-center mt-4 sm:mt-6 text-base sm:text-lg font-medium text-gray-700">
            {isListening ? "Listening…" : "Tap to speak"}
          </p>
        </div>

        {/* Spoken AI Sentence */}
        {currentSentence && (
          <div className="mt-4 sm:mt-6 p-4 bg-white/90 rounded-xl shadow-lg w-full max-w-2xl mx-auto text-center">
            {currentSentence}
          </div>
        )}

        {/* Input Form */}
        <form
          className="mt-12 flex items-center gap-3 w-full max-w-lg"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              sendMessage(input);
              setInput("");
            }
          }}
        >
          <input
            className="flex-1 p-3 rounded-xl shadow bg-white/70 border border-gray-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            placeholder="Type your message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Type your message"
          />
          <button 
            type="submit"
            className="px-5 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
