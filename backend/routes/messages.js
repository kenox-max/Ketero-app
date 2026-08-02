const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

// @route   GET /api/messages/:targetUserId
// @desc    Get message history with a specific matched user
// @access  Private
router.get('/:targetUserId', protect, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { targetUserId } = req.params;

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
