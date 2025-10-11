const express = require('express');
const {
  getOverallStatistics,
  getRegionalAnalytics,
  getFundingTrends,
  getVerificationAnalytics
} = require('../controllers/impactController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes (impact data should be transparent)
router.get('/overall', getOverallStatistics);
router.get('/regional', getRegionalAnalytics);
router.get('/trends', getFundingTrends);

// Admin-only routes
router.get('/verification-analytics', protect, authorize('admin'), getVerificationAnalytics);

module.exports = router;