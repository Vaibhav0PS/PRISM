const express = require('express');
const {
  verifySchool,
  verifyStudent,
  verifyRequest,
  verifyCollege,
  getPendingVerifications,
  getVerificationLogs,
  manualReviewOverride
} = require('../controllers/verificationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All verification routes require authentication
router.use(protect);

// AI verification triggers
router.post('/school/:id', verifySchool);
router.post('/student/:id', verifyStudent);
router.post('/request/:id', verifyRequest);
router.post('/college/:id', verifyCollege);

// Verification management (Admin only)
router.get('/pending', authorize('admin'), getPendingVerifications);
router.put('/manual-review/:id', authorize('admin'), manualReviewOverride);

// Verification logs (accessible to entity owners and admins)
router.get('/logs/:entityId', getVerificationLogs);

module.exports = router;