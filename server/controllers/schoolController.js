const School = require('../models/School');
const Student = require('../models/Student');
const Request = require('../models/Request');
const User = require('../models/User');
const geminiService = require('../services/geminiService');

// @desc    Create/Update school profile
// @route   POST /api/school/profile
// @access  Private (School only)
const createOrUpdateProfile = async (req, res) => {
  try {
    const {
      schoolName,
      registrationNumber,
      address,
      contactPerson,
      phone,
      principalName,
      documents
    } = req.body;

    // Check if school profile already exists for this user
    let school = await School.findOne({ userId: req.user.id });

    if (school) {
      // Update existing profile
      school.schoolName = schoolName;
      school.registrationNumber = registrationNumber;
      school.address = address;
      school.contactPerson = contactPerson;
      school.phone = phone;
      school.principalName = principalName;
      if (documents) school.documents = documents;
      school.verificationStatus = 'pending'; // Reset verification status on update
      school.aiVerificationScore = 0;
      
      await school.save();
    } else {
      // Create new profile
      school = await School.create({
        userId: req.user.id,
        schoolName,
        registrationNumber,
        address,
        contactPerson,
        phone,
        principalName,
        documents: documents || []
      });

      // Update user's profileId
      await User.findByIdAndUpdate(req.user.id, { profileId: school._id });
    }

    // Auto-trigger AI verification
    try {
      const aiResult = await geminiService.analyzeSchoolDocuments(school, school.documents);
      
      school.aiVerificationScore = aiResult.data.score;
      school.aiVerificationDetails = {
        documentAuthenticity: aiResult.data.documentAuthenticity || 0,
        dataConsistency: aiResult.data.dataConsistency || 0,
        anomalyDetection: aiResult.data.anomalyDetection || '',
        verifiedAt: new Date(),
        reviewedBy: 'AI'
      };
      
      school.verificationStatus = geminiService.getVerificationStatus(aiResult.data.score);
      await school.save();
    } catch (verificationError) {
      console.error('Auto-verification failed:', verificationError);
      // Continue without failing the profile creation
    }

    res.status(school.isNew ? 201 : 200).json({
      success: true,
      message: `School profile ${school.isNew ? 'created' : 'updated'} successfully`,
      data: school
    });

  } catch (error) {
    console.error('School profile error:', error);
    
    // Handle duplicate registration number
    if (error.code === 11000 && error.keyPattern?.registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Registration number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating/updating school profile',
      error: error.message
    });
  }
};

// @desc    Get school profile
// @route   GET /api/school/profile
// @access  Private (School only)
const getProfile = async (req, res) => {
  try {
    const school = await School.findOne({ userId: req.user.id })
      .populate('students')
      .populate('requests');

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found'
      });
    }

    res.json({
      success: true,
      data: school
    });

  } catch (error) {
    console.error('Get school profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching school profile',
      error: error.message
    });
  }
};

// @desc    Add new student
// @route   POST /api/school/students
// @access  Private (School only)
const addStudent = async (req, res) => {
  try {
    const {
      studentName,
      grade,
      category,
      achievementDetails,
      financialNeed,
      documents
    } = req.body;

    // Get school profile
    const school = await School.findOne({ userId: req.user.id });
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found. Please create your school profile first.'
      });
    }

    // Create student
    const student = await Student.create({
      schoolId: school._id,
      studentName,
      grade,
      category,
      achievementDetails,
      financialNeed,
      documents: documents || []
    });

    // Add student to school's students array
    school.students.push(student._id);
    await school.save();

    // Auto-trigger AI verification for student
    try {
      const aiResult = await geminiService.analyzeStudentProfile(student, student.documents);
      
      student.aiVerificationScore = aiResult.data.score;
      student.aiVerificationDetails = {
        credibilityScore: aiResult.data.credibilityScore || 0,
        documentValidity: aiResult.data.documentValidity || 0,
        needAssessment: aiResult.data.needAssessment || '',
        verifiedAt: new Date()
      };
      
      // Determine status based on AI score
      if (aiResult.data.score >= 80) {
        student.status = 'verified';
      } else if (aiResult.data.score >= 50) {
        student.status = 'pending';
      } else {
        student.status = 'rejected';
      }
      
      await student.save();
    } catch (verificationError) {
      console.error('Student auto-verification failed:', verificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      data: student
    });

  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding student',
      error: error.message
    });
  }
};

// @desc    Get all students
// @route   GET /api/school/students
// @access  Private (School only)
const getStudents = async (req, res) => {
  try {
    const school = await School.findOne({ userId: req.user.id });
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found'
      });
    }

    const students = await Student.find({ schoolId: school._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: students.length,
      data: students
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
};

// @desc    Create new request
// @route   POST /api/school/requests
// @access  Private (School only)
const createRequest = async (req, res) => {
  try {
    const {
      requestType,
      title,
      description,
      amountNeeded,
      category,
      documents
    } = req.body;

    // Get school profile
    const school = await School.findOne({ userId: req.user.id });
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found. Please create your school profile first.'
      });
    }

    // Check if school is verified
    if (school.verificationStatus !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'School must be verified before creating requests'
      });
    }

    // Create request
    const request = await Request.create({
      schoolId: school._id,
      requestType,
      title,
      description,
      amountNeeded,
      category,
      documents: documents || []
    });

    // Add request to school's requests array
    school.requests.push(request._id);
    await school.save();

    // Auto-trigger AI verification for request
    try {
      const aiResult = await geminiService.analyzeInfrastructureRequest(request, request.documents);
      
      request.aiVerificationScore = aiResult.data.score;
      request.aiVerificationDetails = {
        legitimacyScore: aiResult.data.legitimacyScore || 0,
        needValidation: aiResult.data.needValidation || 0,
        budgetReasonability: aiResult.data.budgetReasonability || '',
        riskAssessment: aiResult.data.riskAssessment || '',
        verifiedAt: new Date()
      };
      
      request.status = geminiService.getVerificationStatus(aiResult.data.score);
      if (request.status === 'verified') {
        request.status = 'approved';
      }
      
      await request.save();
    } catch (verificationError) {
      console.error('Request auto-verification failed:', verificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      data: request
    });

  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating request',
      error: error.message
    });
  }
};

// @desc    Get all requests
// @route   GET /api/school/requests
// @access  Private (School only)
const getRequests = async (req, res) => {
  try {
    const school = await School.findOne({ userId: req.user.id });
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found'
      });
    }

    const requests = await Request.find({ schoolId: school._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });

  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching requests',
      error: error.message
    });
  }
};

// @desc    Get request status
// @route   GET /api/school/requests/:id/status
// @access  Private (School only)
const getRequestStatus = async (req, res) => {
  try {
    const requestId = req.params.id;
    const school = await School.findOne({ userId: req.user.id });
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found'
      });
    }

    const request = await Request.findOne({ 
      _id: requestId, 
      schoolId: school._id 
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: request._id,
        title: request.title,
        status: request.status,
        aiVerificationScore: request.aiVerificationScore,
        amountNeeded: request.amountNeeded,
        amountFunded: request.amountFunded,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt
      }
    });

  } catch (error) {
    console.error('Get request status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching request status',
      error: error.message
    });
  }
};

// @desc    Update student profile
// @route   PUT /api/school/students/:id
// @access  Private (School only)
const updateStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const school = await School.findOne({ userId: req.user.id });
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found'
      });
    }

    const student = await Student.findOne({ 
      _id: studentId, 
      schoolId: school._id 
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Update student fields
    const updateFields = ['studentName', 'grade', 'category', 'achievementDetails', 'financialNeed', 'documents'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        student[field] = req.body[field];
      }
    });

    // Reset verification status on update
    student.status = 'pending';
    student.aiVerificationScore = 0;

    await student.save();

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });

  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating student',
      error: error.message
    });
  }
};

module.exports = {
  createOrUpdateProfile,
  getProfile,
  addStudent,
  getStudents,
  createRequest,
  getRequests,
  getRequestStatus,
  updateStudent
};