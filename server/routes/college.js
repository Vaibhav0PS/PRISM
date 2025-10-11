const express = require('express');
const {
  createOrUpdateProfile,
  getProfile,
  getFundedStudents,
  processAdmission,
  submitStudentFeedback,
  getCollegeImpact,
  getEnrolledStudents
} = require('../controllers/collegeController');
const { protect, authorize } = require('../middleware/auth');
const { validateCollegeProfile } = require('../middleware/validation');

const router = express.Router();

// All college routes require authentication and college role
router.use(protect);
router.use(authorize('college'));

// College profile routes
router.route('/profile')
  .get(getProfile)
  .post(validateCollegeProfile, createOrUpdateProfile);

// Student management routes
router.get('/students', getFundedStudents);
router.get('/enrolled-students', getEnrolledStudents);
router.post('/admission', processAdmission);

// Feedback and reporting
router.post('/feedback', submitStudentFeedback);
router.get('/impact', getCollegeImpact);

module.exports = router;