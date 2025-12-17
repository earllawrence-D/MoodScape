import { useState, useEffect, useRef, useContext } from "react";
import api, { journalAPI, harmfulWordAPI } from "../utils/api";
import Navbar from "../components/Navbar";
import { Send, X } from "lucide-react";
import { Line } from "react-chartjs-2";
import { AuthContext } from "../context/AuthContext";
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

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Navbar />
      <div className="flex-1 pt-20 px-4 pb-8 w-full max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Journal Input */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">How are you feeling today?</h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Write about your day, thoughts, or feelings..."
              rows={4}
              disabled={loading}
            />
            
            {error && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {error}
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={loading || !content.trim()}
                className="bg-teal-600 text-white py-2.5 px-6 rounded-lg hover:bg-teal-700 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> 
                    Share Your Thoughts
                  </>
                )}
              </button>
            </div>
          </div>
          {/* Journal Entries */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Your Journal Entries</h2>
                {journalsRef.current.length > 0 && (
                  <button
                    onClick={() => setShowGraph(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-teal-700 bg-teal-100 hover:bg-teal-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                    </svg>
                    View Mood Graph
                  </button>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {journalsRef.current.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No entries yet. Start by writing about your day!</p>
                </div>
              ) : (
                journalsRef.current.map((entry) => (
                  <div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-800 whitespace-pre-line">{entry.content}</p>
                        {entry.aiResponse && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-sm text-blue-700">{entry.aiResponse}</p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <div className={`h-3 w-3 rounded-full ${
                          entry.moodScore >= 7 ? 'bg-green-500' : 
                          entry.moodScore >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} title={`Mood: ${entry.moodScore}/10`}></div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center text-xs text-gray-400">
                      <span>
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Mood Graph Modal */}
      {showGraph && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl shadow-xl relative max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Mood Trend</h2>
              <button
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                onClick={() => setShowGraph(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <div className="h-full">
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                          font: {
                            size: 11
                          }
                        }
                      },
                      y: {
                        min: 0,
                        max: 10,
                        ticks: {
                          stepSize: 1
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const entry = journalsRef.current[context.dataIndex];
                            return [
                              `Mood: ${context.parsed.y}/10`,
                              `Entry: ${entry.content.substring(0, 30)}${entry.content.length > 30 ? '...' : ''}`
                            ];
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MoodJournal;