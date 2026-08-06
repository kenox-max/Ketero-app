const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { protect } = require('../middleware/auth');

// @route   POST /api/reports
// @desc    Submit a support ticket / report a problem
router.post('/', protect, async (req, res) => {
  try {
    const { subject, description } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Please provide both subject and issue description' });
    }

    const report = await Report.create({
      reporterId: req.user._id,
      subject,
      description,
      status: 'pending',
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Create Report Error:', error);
    res.status(500).json({ error: 'Failed to submit report ticket' });
  }
});

// @route   GET /api/reports/my-reports
// @desc    Get user's submitted support tickets and resolution statuses
router.get('/my-reports', protect, async (req, res) => {
  try {
    const reports = await Report.find({ reporterId: req.user._id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Fetch User Reports Error:', error);
    res.status(500).json({ error: 'Failed to fetch your support tickets' });
  }
});

module.exports = router;
