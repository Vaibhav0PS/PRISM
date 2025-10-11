const geminiService = require('../services/geminiService');
const VerificationLog = require('../models/VerificationLog');
const School = require('../models/School');
const Student = require('../models/Student');
const Request = require('../models/Request');
const College = require('../models/College');

// @desc    Trigger AI verification for school
// @route   POST /api/verify/school/:id
// @access  Private (Admin or School owner)
const verifySchool = async (req, res) => {
  try {
    const schoolId = req.params.id;
    const school = await School.findById(schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Check authorization (admin or school owner)
    if (req.user.role !== 'admin' && school.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify this school'
      });
    }

    // Update status to in_review
    school.verificationStatus = 'in_review';
    await school.save();

    // Perform AI verification
    const aiResult = await geminiService.analyzeSchoolDocuments(school, school.documents);

    // Update school with AI results
    school.aiVerificationScore = aiResult.data.score;
    school.aiVerificationDetails = {
      documentAuthenticity: aiResult.data.documentAuthenticity || 0,
      dataConsistency: aiResult.data.dataConsistency || 0,
      anomalyDetection: aiResult.data.anomalyDetection || '',
      verifiedAt: new Date(),
      reviewedBy: 'AI'
    };

    // Determine verification status based on AI score
    school.verificationStatus = geminiService.getVerificationStatus(aiResult.data.score);

    await school.save();

    // Create verification log
    const verificationLog = new VerificationLog({
      entityType: 'school',
      entityId: schoolId,
      verificationType: aiResult.requiresManualReview ? 'hybrid' : 'ai_automated',
      aiScore: aiResult.data.score,
      aiAnalysis: {
        confidence: aiResult.confidence,
        keyFindings: aiResult.data.keyFindings || [],
        flags: aiResult.data.flags || [],
        recommendations: aiResult.data.recommendations || ''
      },
      documentsAnalyzed: school.documents,
      status: aiResult.requiresManualReview ? 'pending_manual_review' : 'completed'
    });

    await verificationLog.save();

    res.json({
      success: true,
      message: 'School verification completed',
      data: {
        school: {
          id: school._id,
          verificationStatus: school.verificationStatus,
          aiVerificationScore: school.aiVerificationScore,
          aiVerificationDetails: school.aiVerificationDetails
        },
        verificationLog: verificationLog._id,
        requiresManualReview: aiResult.requiresManualReview
      }
    });

  } catch (error) {
    console.error('School verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during school verification',
      error: error.message
    });
  }
};

// @desc    Trigger AI verification for student
// @route   POST /api/verify/student/:id
// @access  Private (Admin or School owner)
const verifyStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await Student.findById(studentId).populate('schoolId');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && student.schoolId.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify this student'
      });
    }

    // Update status to pending verification
    student.status = 'pending';
    await student.save();

    // Perform AI verification
    const aiResult = await geminiService.analyzeStudentProfile(student, student.documents);

    // Update student with AI results
    student.aiVerificationScore = aiResult.data.score;
    student.aiVerificationDetails = {
      credibilityScore: aiResult.data.credibilityScore || 0,
      documentValidity: aiResult.data.documentValidity || 0,
      needAssessment: aiResult.data.needAssessment || '',
      verifiedAt: new Date()
    };

    // Determine verification status
    if (aiResult.data.score >= 80) {
      student.status = 'verified';
    } else if (aiResult.data.score >= 50) {
      student.status = 'pending'; // Requires manual review
    } else {
      student.status = 'rejected';
    }

    await student.save();

    // Create verification log
    const verificationLog = new VerificationLog({
      entityType: 'student',
      entityId: studentId,
      verificationType: aiResult.requiresManualReview ? 'hybrid' : 'ai_automated',
      aiScore: aiResult.data.score,
      aiAnalysis: {
        confidence: aiResult.confidence,
        keyFindings: aiResult.data.keyFindings || [],
        flags: aiResult.data.flags || [],
        recommendations: aiResult.data.recommendations || ''
      },
      documentsAnalyzed: student.documents,
      status: aiResult.requiresManualReview ? 'pending_manual_review' : 'completed'
    });

    await verificationLog.save();

    res.json({
      success: true,
      message: 'Student verification completed',
      data: {
        student: {
          id: student._id,
          status: student.status,
          aiVerificationScore: student.aiVerificationScore,
          aiVerificationDetails: student.aiVerificationDetails
        },
        verificationLog: verificationLog._id,
        requiresManualReview: aiResult.requiresManualReview
      }
    });

  } catch (error) {
    console.error('Student verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during student verification',
      error: error.message
    });
  }
};

// @desc    Trigger AI verification for request
// @route   POST /api/verify/request/:id
// @access  Private (Admin or School owner)
const verifyRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await Request.findById(requestId).populate('schoolId');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && request.schoolId.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify this request'
      });
    }

    // Update status to in_review
    request.status = 'in_review';
    await request.save();

    // Perform AI verification
    const aiResult = await geminiService.analyzeInfrastructureRequest(request, request.documents);

    // Update request with AI results
    request.aiVerificationScore = aiResult.data.score;
    request.aiVerificationDetails = {
      legitimacyScore: aiResult.data.legitimacyScore || 0,
      needValidation: aiResult.data.needValidation || 0,
      budgetReasonability: aiResult.data.budgetReasonability || '',
      riskAssessment: aiResult.data.riskAssessment || '',
      verifiedAt: new Date()
    };

    // Determine verification status
    request.status = geminiService.getVerificationStatus(aiResult.data.score);
    if (request.status === 'verified') {
      request.status = 'approved'; // Use 'approved' for requests instead of 'verified'
    }

    await request.save();

    // Create verification log
    const verificationLog = new VerificationLog({
      entityType: 'request',
      entityId: requestId,
      verificationType: aiResult.requiresManualReview ? 'hybrid' : 'ai_automated',
      aiScore: aiResult.data.score,
      aiAnalysis: {
        confidence: aiResult.confidence,
        keyFindings: aiResult.data.keyFindings || [],
        flags: aiResult.data.flags || [],
        recommendations: aiResult.data.recommendations || ''
      },
      documentsAnalyzed: request.documents,
      status: aiResult.requiresManualReview ? 'pending_manual_review' : 'completed'
    });

    await verificationLog.save();

    res.json({
      success: true,
      message: 'Request verification completed',
      data: {
        request: {
          id: request._id,
          status: request.status,
          aiVerificationScore: request.aiVerificationScore,
          aiVerificationDetails: request.aiVerificationDetails
        },
        verificationLog: verificationLog._id,
        requiresManualReview: aiResult.requiresManualReview
      }
    });

  } catch (error) {
    console.error('Request verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during request verification',
      error: error.message
    });
  }
};

// @desc    Trigger AI verification for college
// @route   POST /api/verify/college/:id
// @access  Private (Admin or College owner)
const verifyCollege = async (req, res) => {
  try {
    const collegeId = req.params.id;
    const college = await College.findById(collegeId);

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && college.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify this college'
      });
    }

    // Update status to in_review
    college.verificationStatus = 'in_review';
    await college.save();

    // Perform AI verification (assuming college has documents array)
    const documents = []; // College documents would be added here
    const aiResult = await geminiService.analyzeCollegeCredentials(college, documents);

    // Update college with AI results
    college.aiVerificationScore = aiResult.data.score;
    college.aiVerificationDetails = {
      institutionalCredibility: aiResult.data.institutionalCredibility || 0,
      accreditationValidity: aiResult.data.accreditationValidity || 0,
      verifiedAt: new Date()
    };

    // Determine verification status
    college.verificationStatus = geminiService.getVerificationStatus(aiResult.data.score);

    await college.save();

    // Create verification log
    const verificationLog = new VerificationLog({
      entityType: 'college',
      entityId: collegeId,
      verificationType: aiResult.requiresManualReview ? 'hybrid' : 'ai_automated',
      aiScore: aiResult.data.score,
      aiAnalysis: {
        confidence: aiResult.confidence,
        keyFindings: aiResult.data.keyFindings || [],
        flags: aiResult.data.flags || [],
        recommendations: aiResult.data.recommendations || ''
      },
      documentsAnalyzed: documents,
      status: aiResult.requiresManualReview ? 'pending_manual_review' : 'completed'
    });

    await verificationLog.save();

    res.json({
      success: true,
      message: 'College verification completed',
      data: {
        college: {
          id: college._id,
          verificationStatus: college.verificationStatus,
          aiVerificationScore: college.aiVerificationScore,
          aiVerificationDetails: college.aiVerificationDetails
        },
        verificationLog: verificationLog._id,
        requiresManualReview: aiResult.requiresManualReview
      }
    });

  } catch (error) {
    console.error('College verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during college verification',
      error: error.message
    });
  }
};

// @desc    Get all items pending verification
// @route   GET /api/verify/pending
// @access  Private (Admin only)
const getPendingVerifications = async (req, res) => {
  try {
    const verificationLogs = await VerificationLog.find({
      status: 'pending_manual_review'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: verificationLogs.length,
      data: verificationLogs
    });

  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending verifications',
      error: error.message
    });
  }
};

// @desc    Get verification history for entity
// @route   GET /api/verify/logs/:entityId
// @access  Private
const getVerificationLogs = async (req, res) => {
  try {
    const entityId = req.params.entityId;
    
    const logs = await VerificationLog.find({ entityId })
      .populate('manualReview.reviewerId', 'email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });

  } catch (error) {
    console.error('Get verification logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verification logs',
      error: error.message
    });
  }
};

// @desc    Admin manual review override
// @route   PUT /api/verify/manual-review/:id
// @access  Private (Admin only)
const manualReviewOverride = async (req, res) => {
  try {
    const logId = req.params.id;
    const { decision, notes } = req.body;

    if (!['approved', 'rejected', 'needs_more_info'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid decision. Must be approved, rejected, or needs_more_info'
      });
    }

    const log = await VerificationLog.findById(logId);
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Verification log not found'
      });
    }

    // Update verification log with manual review
    log.manualReview = {
      reviewerId: req.user.id,
      reviewerNotes: notes,
      finalDecision: decision,
      reviewedAt: new Date()
    };
    log.status = 'completed';
    log.verificationType = 'hybrid';

    await log.save();

    // Update the actual entity based on manual review decision
    await updateEntityStatus(log.entityType, log.entityId, decision);

    res.json({
      success: true,
      message: 'Manual review completed',
      data: log
    });

  } catch (error) {
    console.error('Manual review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during manual review',
      error: error.message
    });
  }
};

// Helper function to update entity status based on manual review
const updateEntityStatus = async (entityType, entityId, decision) => {
  let Model;
  let statusField = 'verificationStatus';

  switch (entityType) {
    case 'school':
      Model = School;
      break;
    case 'student':
      Model = Student;
      statusField = 'status';
      break;
    case 'request':
      Model = Request;
      statusField = 'status';
      break;
    case 'college':
      Model = College;
      break;
    default:
      throw new Error('Invalid entity type');
  }

  const entity = await Model.findById(entityId);
  if (entity) {
    if (decision === 'approved') {
      entity[statusField] = entityType === 'request' ? 'approved' : 'verified';
    } else if (decision === 'rejected') {
      entity[statusField] = 'rejected';
    } else {
      entity[statusField] = 'pending';
    }
    
    await entity.save();
  }
};

module.exports = {
  verifySchool,
  verifyStudent,
  verifyRequest,
  verifyCollege,
  getPendingVerifications,
  getVerificationLogs,
  manualReviewOverride
};