import express from "express";
import analyzeMood from "../utils/moodAnalyzer.js";

const router = express.Router();

router.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing text" });
    }

    const result = await analyzeMood(text);
    res.json(result);
  } catch (err) {
    console.error("Mood analyze route error:", err);
    res.status(500).json({ error: "Failed to analyze mood" });
  }
});

export default router;
