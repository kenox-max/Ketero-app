const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const mongoose = require('mongoose');

// @route   GET /api/messages/:targetUserId
// @desc    Get message history with a specific matched user
// @access  Private
router.get('/:targetUserId', protect, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { targetUserId } = req.params;

    if (!mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({ error: 'Invalid conversation user' });
    }

    const [currentHasMatch, targetHasMatch] = await Promise.all([
      User.exists({ _id: currentUserId, matches: targetUserId }),
      User.exists({ _id: targetUserId, matches: currentUserId }),
    ]);
    if (!currentHasMatch || !targetHasMatch) {
      return res.status(403).json({ error: 'Message history is available only for matched users' });
    }

    // Retrieve messages where the exchange took place between these two users
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: currentUserId }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Server error retrieving chat history' });
  }
});

module.exports = router;
