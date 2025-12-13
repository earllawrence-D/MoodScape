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

  // Initialize audio context for mobile devices
  const initAudioContext = () => {
    try {
      // Create new audio context if none exists or if closed
      if (!audioRef.current || audioRef.current.state === 'closed') {
        console.log('Initializing new audio context');
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioRef.current = new AudioContext();
        console.log('Audio context created:', audioRef.current.state);
      } 
      // Resume if suspended (iOS requirement)
      else if (audioRef.current.state === 'suspended') {
        console.log('Resuming suspended audio context');
        return audioRef.current.resume().then(() => {
          console.log('Audio context resumed');
          return true;
        });
      }
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error initializing audio context:', error);
      return Promise.reject(error);
    }
  };

  // Speak text with TTS
  const speakResponse = async (text) => {
    if (!text) return;
    
    console.log('Starting TTS for text:', text);
    const clean = sanitizeForTTS(text);
    
    try {
      // Initialize audio context first
      await initAudioContext();
      
      // For mobile devices, we need to create a new Audio instance for each utterance
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobileDevice) {
        console.log('Mobile device detected, using mobile TTS strategy');
        
        // Ensure speechSynthesis is available
        if (!window.speechSynthesis) {
          throw new Error('Speech synthesis not supported on this device');
        }
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(clean);
        
        // Mobile-specific settings
        utterance.volume = 1;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        
        return new Promise((resolve, reject) => {
          utterance.onend = () => {
            console.log('Mobile TTS completed');
            resolve();
          };
          
          utterance.onerror = (event) => {
            console.error('Mobile TTS error:', event);
            reject(event.error || 'TTS failed');
          };
          
          // Small delay to ensure previous speech is cancelled
          setTimeout(() => {
            try {
              window.speechSynthesis.speak(utterance);
            } catch (e) {
              console.error('Error speaking utterance:', e);
              reject(e);
            }
          }, 100);
        });
      } else {
        // Use the custom TTS for desktop
        console.log('Using custom TTS');
        await speakText(clean);
      }
      
      console.log('TTS completed successfully');
    } catch (error) {
      console.error('TTS Error:', error);
      throw error; // Re-throw to be caught by the caller
    }
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

      // Animation state ref to track if we should keep animating
      const isAnimating = useRef(true);
      
      // Cleanup function to stop animation
      const stopAnimation = () => {
        isAnimating.current = false;
        setVolumes(new Array(7).fill(0));
        setCurrentSentence("");
      };

      // Animation frame for smooth visualization
      const animate = () => {
        if (!isAnimating.current) return;
        
        setVolumes(prevVolumes => {
          // Create a smooth wave-like animation
          const now = Date.now();
          return prevVolumes.map((_, i) => {
            const offset = i * 0.5; // Stagger the waves
            return Math.sin((now / 200) + offset) * 0.4 + 0.5; // Values between 0.1 and 0.9
          });
        });
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      // Start animation
      animationFrameRef.current = requestAnimationFrame(animate);

      try {
        for (const line of lines) {
          if (!isAnimating.current) break; // Stop if animation was cancelled
          
          setCurrentSentence(line);
          await speakResponse(line).catch(error => {
            console.error('Error in speakResponse:', error);
            throw error; // Re-throw to be caught by the outer try-catch
          });
        }
      } finally {
        // Ensure we always clean up, even if there's an error
        stopAnimation();
        cancelAnimationFrame(animationFrameRef.current);
      }
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
  const toggleListening = async () => {
    console.log('Toggle listening called, current state:', isListening);
    
    // For mobile, we need to initialize audio on user gesture
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobileDevice) {
      try {
        console.log('Mobile device detected, initializing audio context');
        await initAudioContext();
      } catch (error) {
        console.error('Failed to initialize audio on mobile:', error);
        alert('Could not initialize audio. Please ensure you have given microphone permissions.');
        return;
      }
    }
    
    if (isListening) {
      console.log('Stopping listening...');
      recognitionRef.current?.stop();
      stopSpeaking();
      setIsListening(false);
      setCurrentSentence("");
      
      // Don't close audio context on mobile to avoid re-initialization issues
      if (audioRef.current && !isMobileDevice) {
        console.log('Closing audio context');
        try {
          await audioRef.current.close();
        } catch (e) {
          console.warn('Error closing audio context:', e);
        }
        audioRef.current = null;
      }
      
      cancelAnimationFrame(animationFrameRef.current);
      setVolumes(new Array(7).fill(0));
      return;
    }

    // Check for browser support
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isSecure = window.isSecureContext || 
                    window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';
    
    console.log('Mobile:', isMobileDevice, 
                'Safari:', isSafari,
                'Secure Context:', isSecure, 
                'Protocol:', window.location.protocol,
                'User Agent:', navigator.userAgent);

    if (isMobileDevice && !isSecure) {
      const errorMsg = 'Voice input requires a secure context (HTTPS) on mobile devices. Please use the text input instead.';
      console.warn(errorMsg);
      alert(errorMsg);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const errorMsg = "Speech recognition is not supported in your browser.";
      console.error(errorMsg);
      alert(errorMsg);
      return;
    }

    const recognizer = new SpeechRecognition();
    recognizer.continuous = false;
    recognizer.interimResults = false;

    recognizer.onstart = () => {
      setIsListening(true);
      startEqualizerMic();
    };

    recognizer.onend = () => {
      setIsListening(false);
      stopSpeaking();
      cancelAnimationFrame(animationFrameRef.current);
      setVolumes(new Array(7).fill(0));
    };

    recognizer.onresult = (event) => {
      console.log('Speech recognition result:', event);
      const transcript = event.results[0][0].transcript;
      console.log('Recognized transcript:', transcript);
      if (transcript) {
        setInput(transcript);
        sendMessage(transcript);
      }
    };

    recognizer.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      alert(`Speech recognition error: ${event.error}`);
      setIsListening(false);
      setVolumes(new Array(7).fill(0));
    };

    recognizer.start();
    recognitionRef.current = recognizer;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Stop any ongoing speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      
      // Stop any ongoing recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn('Error stopping recognition:', e);
        }
      }
      
      // Clean up audio context
      if (audioRef.current) {
        try {
          if (audioRef.current.state !== 'closed') {
            audioRef.current.close();
          }
        } catch (e) {
          console.warn('Error closing audio context:', e);
        }
      }
      
      // Stop any animation
      cancelAnimationFrame(animationFrameRef.current);
      
      // Reset states
      setVolumes(new Array(7).fill(0));
      setCurrentSentence("");
      setIsListening(false);
    };
  }, []);

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
