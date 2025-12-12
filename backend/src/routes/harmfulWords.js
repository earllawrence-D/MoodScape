import express from "express";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Protect the route
router.use(protect);

router.post("/check", async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ words: [] });

  // simple detection logic
  const harmfulList = [
    "kill myself", "suicide", "end it", "i want to die",
    "i want to hurt myself", "i'm done living", "i want to disappear",
    "self harm", "hurt myself", "cut myself", "i wish i was dead"
  ];

  const found = harmfulList.filter(phrase =>
    content.toLowerCase().includes(phrase)
  );

  res.json({ words: found });
});

export default router;
