import { useState, useEffect, useRef, useContext } from "react";
import { journalAPI, harmfulWordAPI } from "../utils/api";
import Navbar from "../components/Navbar";
import { Send, X } from "lucide-react";
import { Line } from "react-chartjs-2";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Chart.js registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

// Helper to analyze mood via API
const analyzeMood = async (text) => {
  const res = await api.post("/mood/analyze", { text });
  return res.data || { moodLabel: "neutral", score: 5, summary: "" };
};

const MoodJournal = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [error, setError] = useState("");

  const journalsRef = useRef([]);

  // Fetch journal entries on mount
  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const res = await journalAPI.getAll({ limit: 200 });
      const entries = res.data?.data || [];

      entries.forEach((entry) => {
        if (!Array.isArray(entry.harmfulWords)) entry.harmfulWords = [];
      });

      setJournals(entries);
      journalsRef.current = entries;
    } catch (err) {
      console.error("Journal Fetch Error:", err);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError("");

    try {
      // First check for harmful words
      let harmfulWords = [];
      try {
        const hw = await harmfulWordAPI.check({ content });
        harmfulWords = hw.data?.words || [];

        if (harmfulWords.length > 0) {
          // Log harmful words
          await Promise.all(
            harmfulWords.map((word) =>
              journalAPI.logHarmfulWord({
                word,
                context: content,
                userId: user?.id,
              })
            )
          );
          
          // Show error message and stop further processing
          setError("Please avoid using harmful language. We're here to help you feel better.");
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Harmful detection failed:", e);
      }

      // Create temporary entry for instant UI feedback
      const tempEntry = {
        id: "temp-" + Date.now(),
        content,
        harmfulWords: [],
        mood: "neutral",
        moodScore: 5,
        aiResponse: "Analyzing your mood...",
        createdAt: new Date().toISOString(),
      };

      journalsRef.current = [tempEntry, ...journalsRef.current];
      setJournals([...journalsRef.current]);

      // Analyze mood
      let moodResult = { moodLabel: "neutral", score: 5, summary: "" };
      try {
        moodResult = await analyzeMood(content);
      } catch (e) {
        console.warn("Mood analysis failed:", e);
        moodResult.summary = "I noticed you're sharing something important. I'm here to listen and support you.";
      }

      // Save journal entry
      const saveRes = await journalAPI.create({
        content,
        harmfulWords,
        mood: moodResult.moodLabel,
        moodScore: moodResult.score,
        aiResponse: moodResult.summary,
      });

      const saved = saveRes.data?.data || {};
      if (!Array.isArray(saved.harmfulWords)) saved.harmfulWords = [];

      // Update the entry with saved data
      const updatedJournals = journalsRef.current.map(j => 
        j.id === tempEntry.id ? { ...saved, id: tempEntry.id } : j
      );
      
      journalsRef.current = updatedJournals;
      setJournals(updatedJournals);
      setContent("");
    } catch (err) {
      console.error("Save Journal Error:", err);
      setError("An error occurred while saving your entry. Please try again.");
    }

    setLoading(false);
  };

  // Chart data with proper date handling
  const chartData = {
    labels: journalsRef.current.map((j) => {
      try {
        const date = new Date(j.createdAt);
        if (isNaN(date.getTime())) return 'Invalid date';
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        console.warn('Invalid date format:', j.createdAt, e);
        return 'Invalid date';
      }
    }),
    datasets: [
      {
        label: "Mood Score",
        data: journalsRef.current.map((j) => {
          const score = parseFloat(j.moodScore);
          return isNaN(score) ? 5 : score;
        }),
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79,70,229,0.3)",
        tension: 0.4,
        pointBackgroundColor: "#4f46e5",
        pointBorderColor: "#fff",
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#4f46e5",
        pointHoverBorderColor: "#fff",
        pointHitRadius: 10,
        pointBorderWidth: 2,
      },
    ],
  };

  const filtered = journalsRef.current.filter(j => j.id !== "temp-" + Date.now());

  return (
    <div className="min-h-screen bg-[#d5f8f0] flex flex-col items-center">
      <Navbar />

      <div className="w-full max-w-3xl p-6 flex flex-col gap-6">
        <div className="bg-white rounded-xl p-6 border-2 border-teal-400 shadow-md flex flex-col">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="p-3 border rounded-lg mb-3 focus:outline-teal-400"
            placeholder="Write your mood here..."
            rows={4}
            disabled={loading}
          />

          <div className="flex justify-between items-center">
            <button
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className="bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 mr-2" /> 
              {loading ? 'Processing...' : 'Send'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-teal-400 shadow-md flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-lg">Entries</h2>
            <button
              className="bg-teal-400 text-white px-3 py-1 rounded hover:bg-teal-500 transition-colors"
              onClick={() => setShowGraph(true)}
            >
              Graph
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-3">
            {filtered.length === 0 ? (
              <p className="text-gray-500">No entries yet.</p>
            ) : (
              filtered.map((e) => (
                <div key={e.id} className="p-3 border rounded-lg shadow-sm bg-gray-50">
                  <p className="text-gray-800">{e.content}</p>
                  {e.aiResponse && (
                    <p className="text-sm text-gray-500 mt-1">{e.aiResponse}</p>
                  )}
                  {e.harmfulWords && e.harmfulWords.length > 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Harmful words detected: {e.harmfulWords.join(", ")}
                    </p>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(e.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showGraph && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-xl relative">
            <button
              className="absolute top-3 right-3 text-gray-700 hover:text-gray-900"
              onClick={() => setShowGraph(false)}
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="font-bold text-xl mb-4">Mood Trend Graph</h2>

            <div className="w-full h-96">
              <Line 
                data={chartData} 
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45
                      }
                    },
                    y: {
                      min: 0,
                      max: 10,
                      ticks: {
                        stepSize: 1
                      }
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.dataset.label || '';
                          if (context.parsed.y !== null) {
                            const entry = journalsRef.current[context.dataIndex];
                            return `${label}: ${context.parsed.y} - ${entry.content.substring(0, 30)}${entry.content.length > 30 ? '...' : ''}`;
                          }
                          return label;
                        }
                      }
                    }
                  }
                }}
                redraw
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodJournal;
