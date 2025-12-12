import { useState, useEffect, useRef, useContext } from "react";
import api, { journalAPI, harmfulWordAPI } from "../utils/api";
import Navbar from "../components/Navbar";
import { Send, X } from "lucide-react";
import { Line } from "react-chartjs-2";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// FIX: Register Chart.js scales
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

const analyzeMood = async (text) => {
  const res = await api.post("/mood/analyze", { text });
  return res.data;
};

const MoodJournal = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

  const journalsRef = useRef([]);

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const res = await journalAPI.getAll({ limit: 200 });
      const entries = res.data.data || [];

      entries.forEach((e) => {
        if (!Array.isArray(e.harmfulWords)) e.harmfulWords = [];
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

    try {
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

      // Harmful word detection
      let harmfulWords = [];
      try {
        const hw = await harmfulWordAPI.check({ content });
        harmfulWords = hw.data.words || [];

        if (harmfulWords.length > 0) {
          for (const word of harmfulWords) {
            await journalAPI.logHarmfulWord({
              word,
              context: content,
              userId: user?.id,
            });
          }
        }
      } catch (e) {
        console.warn("Harmful detection failed:", e);
      }

      // GPT Mood Analyzer
      let moodResult = { moodLabel: "neutral", score: 5, summary: "" };
      try {
        moodResult = await analyzeMood(content);
      } catch (e) {
        console.warn(e);
      }

      const save = await journalAPI.create({
        content,
        harmfulWords,
        mood: moodResult.moodLabel,
        moodScore: moodResult.score,
        aiResponse: moodResult.summary,
      });

      const saved = save.data.data;
      if (!Array.isArray(saved.harmfulWords)) saved.harmfulWords = [];

      journalsRef.current = [
        saved,
        ...journalsRef.current.filter((j) => j.id !== tempEntry.id),
      ];

      setJournals([...journalsRef.current]);
      setContent("");
    } catch (err) {
      console.error(err);
      alert("Error saving journal");
    }

    setLoading(false);
  };

  const filtered = journalsRef.current;

  const chartData = {
    labels: filtered.map((j) =>
      new Date(j.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    ),
    datasets: [
      {
        label: "Mood Score",
        data: filtered.map((j) => j.moodScore || 5),
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79,70,229,0.3)",
        tension: 0.4,
      },
    ],
  };

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
              className="bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600 flex items-center transition-colors"
            >
              <Send className="w-5 h-5 mr-2" /> Send
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
                  {e.harmfulWords.length > 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Harmful words detected: {e.harmfulWords.join(", ")}
                    </p>
                  )}
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
              <Line data={chartData} options={{ maintainAspectRatio: false }} redraw />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodJournal;
