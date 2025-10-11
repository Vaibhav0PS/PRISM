const express = require('express');
const {
  createOrUpdateProfile,
  getProfile,
  addStudent,
  getStudents,
  createRequest,
  getRequests,
  getRequestStatus,
  updateStudent
} = require('../controllers/schoolController');
const { protect, authorize } = require('../middleware/auth');
const {
  validateSchoolProfile,
  validateStudentProfile,
  validateRequest
} = require('../middleware/validation');

const router = express.Router();

// All school routes require authentication and school role
router.use(protect);
router.use(authorize('school'));

// School profile routes
router.route('/profile')
  .get(getProfile)
  .post(validateSchoolProfile, createOrUpdateProfile);

// Student management routes
router.route('/students')
  .get(getStudents)
  .post(validateStudentProfile, addStudent);

router.put('/students/:id', validateStudentProfile, updateStudent);

// Request management routes
router.route('/requests')
  .get(getRequests)
  .post(validateRequest, createRequest);

router.get('/requests/:id/status', getRequestStatus);

module.exports = router;