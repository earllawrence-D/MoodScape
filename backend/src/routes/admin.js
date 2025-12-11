// routes/admin.js
import express from 'express';
import User from '../models/User.js'; // Sequelize model
import Feedback from '../models/Feedback.js'; // Make sure you have a Feedback model
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ===============================
// GET /api/admin/users
// ===============================
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role'], // only send necessary fields
    });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// GET /api/admin/feedback
router.get('/feedback', protect, adminOnly, async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(feedbacks);
  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    res.status(500).json({ message: 'Failed to fetch feedbacks' });
  }
});

// GET /api/admin/profile
// GET /api/admin/profile
router.get('/profile', protect, adminOnly, async (req, res) => {
  try {
    const admin = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'fullName', 'email', 'createdAt', 'role', 'isActive']
    });

    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    // Ensure isActive is true for admins
    if (admin.role === 'admin' && admin.isActive == null) {
      admin.isActive = true;
    }

    res.json({ success: true, data: admin });
  } catch (err) {
    console.error('Error fetching admin profile:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
