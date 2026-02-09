const express = require('express');
const router = express.Router();
const { getRecommendations, getPeakHours, getProfitAnalysis } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public
router.get('/recommendations/:itemId', getRecommendations);

// Admin Only
router.get('/peak-hours', protect, admin, getPeakHours);
router.get('/profit', protect, admin, getProfitAnalysis);

module.exports = router;
