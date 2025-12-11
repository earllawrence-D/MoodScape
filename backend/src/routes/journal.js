import express from "express";
import { getJournals, createJournal } from "../controllers/journalController.js";
import { protect } from "../middleware/auth.js"; // <-- use 'protect'
import { journalLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Protect all journal routes
router.use(protect);

// GET requests are unlimited
router.get("/", getJournals);

// Limit POST requests (creating journals)
router.post("/", journalLimiter, createJournal);

export default router;
