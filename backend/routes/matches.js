const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/matches/discovery
// @desc    Get potential matches (Discovery Loop) filtered by preferences
router.get('/discovery', protect, async (req, res) => {
  try {
    const currentUser = req.user;

    // Exclude current user, users already liked/matched, and optionally disliked
    const excludedUserIds = [
      currentUser._id,
      ...currentUser.likes,
      ...currentUser.matches,
    ];

    // Build query
    const query = {
      _id: { $nin: excludedUserIds }
    };

    // Filter by religion if user specifies interest (or matching same religion is highly valued in Ethiopia)
    // For prototype, we'll fetch all matching profiles but sort or score them.
    // Let's filter to match religion optionally, or just list everyone in same/similar locations first.
    let potentialMatches = await User.find(query).select('-password');

    // Simple sorting: put profiles with the same religion or same location first
    potentialMatches.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (a.religion === currentUser.religion) scoreA += 2;
      if (b.religion === currentUser.religion) scoreB += 2;

      if (a.location === currentUser.location) scoreA += 1;
      if (b.location === currentUser.location) scoreB += 1;

      return scoreB - scoreA; // Higher score first
    });

    res.json(potentialMatches);
  } catch (error) {
    console.error('Discovery Error:', error);
    res.status(500).json({ error: 'Server error loading discovery users' });
  }
});

// @route   POST /api/matches/like
// @desc    Like a user. If mutual, create a Match.
router.post('/like', protect, async (req, res) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(444).json({ error: 'Target user not found' });
    }

    // Check if already liked
    if (currentUser.likes.includes(targetUserId) || currentUser.matches.includes(targetUserId)) {
      return res.status(400).json({ error: 'User already liked or matched' });
    }

    // Check if target user has already liked the current user (Mutual Match)
    const isMutual = targetUser.likes.includes(currentUser._id) || targetUser.isSystemUser;

    if (isMutual) {
      // It's a match! Add to matches for both, and remove from likes if appropriate
      currentUser.matches.push(targetUserId);
      targetUser.matches.push(currentUser._id);

      // Remove from targetUser's likes if they had liked previously
      targetUser.likes = targetUser.likes.filter(id => id.toString() !== currentUser._id.toString());

      await currentUser.save();
      await targetUser.save();

      return res.json({
        match: true,
        message: `It's a Match! You and ${targetUser.name} can now chat for free.`,
        targetUser: {
          _id: targetUser._id,
          name: targetUser.name,
          profilePhoto: targetUser.profilePhoto,
          verifiedStatus: targetUser.verifiedStatus,
        }
      });
    } else {
      // Just a normal like
      currentUser.likes.push(targetUserId);
      await currentUser.save();

      return res.json({
        match: false,
        message: `Liked ${targetUser.name}. Waiting for mutual match.`,
      });
    }
  } catch (error) {
    console.error('Like Error:', error);
    res.status(500).json({ error: 'Server error processing swipe' });
  }
});

// @route   GET /api/matches
// @desc    Get all current mutual matches
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'matches',
      select: 'name age location religion profilePhoto verifiedStatus isPremium'
    });

    res.json(user.matches);
  } catch (error) {
    console.error('Get Matches Error:', error);
    res.status(500).json({ error: 'Server error fetching matches' });
  }
});

module.exports = router;
