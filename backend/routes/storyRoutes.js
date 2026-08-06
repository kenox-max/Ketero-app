const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const { protect } = require('../middleware/auth');

// @route   POST /api/stories
// @desc    Post a new temporary 24-hour story
router.post('/', protect, async (req, res) => {
  try {
    const { mediaUrl, caption } = req.body;

    if (!mediaUrl) {
      return res.status(400).json({ error: 'Media URL is required to publish a story' });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours expiry

    const story = await Story.create({
      userId: req.user._id,
      mediaUrl,
      caption: caption || '',
      expiresAt,
    });

    const populatedStory = await Story.findById(story._id).populate('userId', 'name profilePhoto verifiedStatus');

    res.status(201).json(populatedStory);
  } catch (error) {
    console.error('Create Story Error:', error);
    res.status(500).json({ error: 'Failed to publish story' });
  }
});

// @route   GET /api/stories
// @desc    Fetch all non-expired active stories
router.get('/', protect, async (req, res) => {
  try {
    const activeStories = await Story.find({
      expiresAt: { $gt: new Date() },
    })
      .populate('userId', 'name profilePhoto verifiedStatus')
      .sort({ createdAt: -1 });

    res.json(activeStories);
  } catch (error) {
    console.error('Fetch Stories Error:', error);
    res.status(500).json({ error: 'Failed to fetch active stories' });
  }
});

module.exports = router;
