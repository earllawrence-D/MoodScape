import Feedback from "../models/Feedback.js";
import User from "../models/User.js";

export const submitFeedback = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const feedback = await Feedback.create({
      userId: req.user.id,
      message,
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    console.error("Feedback submission error:", error); // <-- this will print the actual error
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      include: [{ model: User, as: "user", attributes: ["id", "username", "email"] }],
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: feedbacks });
  } catch (error) {
    console.error("Get all feedbacks error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
