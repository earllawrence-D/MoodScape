import express from "express";
import { submitFeedback, getAllFeedbacks } from "../controllers/feedbackController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// User route
router.post("/", protect, submitFeedback);

// Admin route
router.get("/admin/", protect, adminOnly, getAllFeedbacks);

export default router;
