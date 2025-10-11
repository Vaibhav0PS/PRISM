const express = require('express');
const {
  getVerifiedRequests,
  getVerifiedStudents,
  donateToRequest,
  sponsorStudent,
  getDonationHistory,
  getImpactMetrics
} = require('../controllers/donorController');
const { protect, authorize } = require('../middleware/auth');
const { validateDonation } = require('../middleware/validation');

const router = express.Router();

// All donor routes require authentication and donor/ngo role
router.use(protect);
router.use(authorize('donor', 'ngo'));

// Get verified requests and students
router.get('/requests', getVerifiedRequests);
router.get('/students', getVerifiedStudents);

// Donation routes
router.post('/donate/request', validateDonation, donateToRequest);
router.post('/donate/student', validateDonation, sponsorStudent);

// Donor dashboard data
router.get('/donations', getDonationHistory);
router.get('/impact', getImpactMetrics);

module.exports = router;