import { useState, useRef, useEffect } from "react";
import { aiAPI } from "../utils/api";
import { useVoice } from "../hooks/useVoice";
import Navbar from "../components/Navbar";
import { sanitizeForTTS } from "../utils/sanitizeForTTS";
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';

const AIChat = () => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volumes, setVolumes] = useState(new Array(7).fill(0));
  const [currentSentence, setCurrentSentence] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [ttsPermission, setTtsPermission] = useState('prompt');

  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const recognitionRef = useRef(null);
  const animationFrameRef = useRef(null);
  const inputRef = useRef(null);

  const { speakText, stopSpeaking, isSpeaking: isTtsSpeaking } = useVoice();

  // Check if device is mobile and TTS support
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      
      // Check TTS support
      if (!('speechSynthesis' in window) || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        setTtsSupported(false);
      }
      
      // Check TTS permission state if supported
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'microphone' })
          .then(permissionStatus => {
            setTtsPermission(permissionStatus.state);
            permissionStatus.onchange = () => setTtsPermission(permissionStatus.state);
          });
      }
    };
    
    checkMobile();
    
    // Cleanup
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Update speaking state
  useEffect(() => {
    setIsSpeaking(isTtsSpeaking);
  }, [isTtsSpeaking]);

  // Speak text with TTS
  const speakResponse = async (text) => {
    if (!ttsSupported) {
      console.warn('TTS not supported on this device');
      return;
    }
    
    try {
      const clean = sanitizeForTTS(text);
      await speakText(clean);
    } catch (error) {
      console.error('Error with TTS:', error);
      // Fallback to native speech synthesis if custom hook fails
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }
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
  const toggleListening = async () => {
    if (isListening) {
      stopListening();
      return;
    }

    try {
      // Request microphone permission on mobile
      if (isMobile && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      }
      
      startListening();
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('Please allow microphone access to use voice input.');
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Your browser does not support speech recognition. Please use Chrome, Edge, or Safari on iOS 14+.');
      return;
    }

    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Changed to false for better mobile compatibility
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0]?.transcript || '')
          .join('');
        
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please allow microphone access in your browser settings.');
        }
        stopListening();
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          // On mobile, we don't auto-restart to save battery
          if (!isMobile) {
            recognitionRef.current.start();
          } else {
            setIsListening(false);
          }
        }
      };

      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      alert('Error initializing speech recognition. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Chat messages */}
        <div className="mb-4 space-y-4">
          {/* Messages will be displayed here */}
        </div>
      </div>

      {/* Input area - Fixed at bottom on mobile, relative on desktop */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg md:relative md:border-t-0 md:shadow-none">
        <div className="max-w-4xl mx-auto flex flex-col space-y-2">
          {/* Visualizer for when listening */}
          {isListening && (
            <div className="flex justify-center items-center space-x-1 h-8 mb-2">
              {volumes.map((volume, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary-500 rounded-full transition-all duration-100"
                  style={{
                    height: `${5 + Math.random() * 20}%`,
                    transform: `scaleY(${isListening ? 1 + Math.random() * 2 : 1})`,
                  }}
                />
              ))}
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isMobile ? "Type or tap mic..." : "Type your message..."}
              className="flex-1 px-4 py-3 md:py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
              onKeyPress={(e) => e.key === 'Enter' && input.trim() && sendMessage(input)}
              aria-label="Message input"
            />
            
            {/* Voice input button */}
            <button
              onClick={toggleListening}
              disabled={!ttsSupported}
              className={`p-3 rounded-full transition-colors ${
                isListening 
                  ? 'bg-red-500 text-white' 
                  : ttsSupported 
                    ? 'bg-primary-100 text-primary-600 hover:bg-primary-200' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              title={ttsSupported ? (isListening ? 'Stop listening' : 'Voice input') : 'Voice input not supported'}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            {/* Send button */}
            <button
              onClick={() => input.trim() && sendMessage(input)}
              disabled={!input.trim()}
              className={`p-3 rounded-full transition-colors ${
                input.trim() 
                  ? 'bg-primary-500 text-white hover:bg-primary-600' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </div>
          
          {/* TTS Controls */}
          <div className="flex justify-end items-center space-x-2">
            <button
              onClick={() => isSpeaking ? stopSpeaking() : currentSentence && speakResponse(currentSentence)}
              disabled={!currentSentence}
              className={`text-sm flex items-center space-x-1 px-3 py-1 rounded-full ${
                currentSentence 
                  ? 'text-primary-600 hover:bg-primary-50' 
                  : 'text-gray-400'
              }`}
              aria-label={isSpeaking ? 'Stop speaking' : 'Read response aloud'}
            >
              {isSpeaking ? (
                <>
                  <VolumeX size={16} />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 size={16} />
                  <span>Listen</span>
                </>
              )}
            </button>
          </div>
          
          {/* Mobile browser notice */}
          {isMobile && !ttsSupported && (
            <div className="text-xs text-gray-500 text-center mt-1">
              Voice input may require Chrome or Safari on iOS 14.3+
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChat;
