export default function generateReport(entries) {
  if (entries.length === 0) return { analysis: "No entries yet." };

  const scores = entries.map(e => e.mood_score);
  const avg = (scores.reduce((a,b)=>a+b,0) / scores.length).toFixed(2);
  const trend = scores[scores.length-1] - scores[0];

  return {
    totalEntries: entries.length,
    averageMoodScore: avg,
    trend:
      trend > 0 
        ? "Improving emotional health"
        : trend < 0 
          ? "Declining mood patterns"
          : "Stable mood",

    recommendedAction:
      trend < 0
        ? "Therapist intervention recommended."
        : "Keep journaling daily."
  };
}
