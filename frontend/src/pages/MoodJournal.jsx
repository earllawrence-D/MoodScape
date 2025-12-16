import { useState, useEffect, useRef, useContext } from "react";
import api, { journalAPI, harmfulWordAPI } from "../utils/api";
import Navbar from "../components/Navbar";
import { Send, X, BarChart2, BookOpen } from "lucide-react";
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

    // Temporary entry for instant UI feedback
    const tempEntry = {
      id: "temp-" + Date.now(),
      content,
      harmfulWords: [],
      mood: "neutral",
      moodScore: 5,
      aiResponse: "Analyzing...",
      createdAt: new Date().toISOString(),
    };

    journalsRef.current = [tempEntry, ...journalsRef.current];
    setJournals([...journalsRef.current]);

    try {
      // Detect harmful words
      let harmfulWords = [];
      try {
        const hw = await harmfulWordAPI.check({ content });
        harmfulWords = hw.data?.words || [];

        if (harmfulWords.length > 0) {
          await Promise.all(
            harmfulWords.map((word) =>
              journalAPI.logHarmfulWord({
                word,
                context: content,
                userId: user?.id,
              })
            )
          );
        }
      } catch (e) {
        console.warn("Harmful detection failed:", e);
      }

      // Analyze mood
      let moodResult = { moodLabel: "neutral", score: 5, summary: "" };
      try {
        moodResult = await analyzeMood(content);
      } catch (e) {
        console.warn("Mood analysis failed:", e);
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

      journalsRef.current = [
        saved,
        ...journalsRef.current.filter((j) => j.id !== tempEntry.id),
      ];

      setJournals([...journalsRef.current]);
      setContent("");
    } catch (err) {
      console.error("Save Journal Error:", err);
      alert("Error saving journal entry.");
    }

    setLoading(false);
  };

  // Chart data
  const chartData = {
    labels: journalsRef.current.map((j) =>
      new Date(j.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    ),
    datasets: [
      {
        label: "Mood Score",
        data: journalsRef.current.map((j) => j.moodScore ?? 5),
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79,70,229,0.3)",
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Journal Input Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <BookOpen className="mr-2 text-teal-500" /> Mood Journal
            </h1>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="How are you feeling today? Share your thoughts..."
              rows={6}
              disabled={loading}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSubmit}
                disabled={loading || !content.trim()}
                className={`flex items-center px-6 py-2.5 rounded-xl text-white font-medium transition-all ${
                  loading || !content.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-teal-500 hover:bg-teal-600 transform hover:-translate-y-0.5'
                }`}
              >
                {loading ? 'Sending...' : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Post Entry
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Journal Entries Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Your Journal Entries</h2>
              <button
                onClick={() => setShowGraph(true)}
                className="flex items-center text-teal-600 hover:text-teal-700 font-medium"
              >
                <BarChart2 className="w-5 h-5 mr-1" /> View Mood Graph
              </button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {journalsRef.current.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No entries yet. Start by writing your first journal entry!</p>
                </div>
              ) : (
                journalsRef.current.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-5 rounded-xl border ${
                      entry.harmfulWords.length > 0
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <p className="text-gray-800 whitespace-pre-line">{entry.content}</p>
                    {entry.aiResponse && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm text-blue-800">{entry.aiResponse}</p>
                      </div>
                    )}
                    {entry.harmfulWords.length > 0 && (
                      <div className="mt-2">
                        <span className="inline-block bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full">
                          Harmful content detected
                        </span>
                      </div>
                    )}
                    <div className="mt-3 text-xs text-gray-500">
                      {new Date(entry.createdAt).toLocaleString()}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-2xl relative">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowGraph(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Mood Trend Analysis</h2>
          <p className="text-gray-600 mb-6">Track your mood patterns over time</p>
          <div className="h-96 w-full">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                  },
                },
                scales: {
                  y: {
                    min: 0,
                    max: 10,
                    ticks: {
                      stepSize: 1
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodJournal;
