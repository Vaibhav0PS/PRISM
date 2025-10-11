const College = require('../models/College');
const Student = require('../models/Student');
const User = require('../models/User');

// @desc    Create/Update college profile
// @route   POST /api/college/profile
// @access  Private (College only)
const createOrUpdateProfile = async (req, res) => {
  try {
    const {
      collegeName,
      affiliationNumber,
      address,
      contactPerson,
      phone,
      scholarshipsOffered
    } = req.body;

    // Check if college profile already exists for this user
    let college = await College.findOne({ userId: req.user.id });

    if (college) {
      // Update existing profile
      college.collegeName = collegeName;
      college.affiliationNumber = affiliationNumber;
      college.address = address;
      college.contactPerson = contactPerson;
      college.phone = phone;
      if (scholarshipsOffered) college.scholarshipsOffered = scholarshipsOffered;
      college.verificationStatus = 'pending'; // Reset verification status on update
      college.aiVerificationScore = 0;
      
      await college.save();
    } else {
      // Create new profile
      college = await College.create({
        userId: req.user.id,
        collegeName,
        affiliationNumber,
        address,
        contactPerson,
        phone,
        scholarshipsOffered: scholarshipsOffered || []
      });

      // Update user's profileId
      await User.findByIdAndUpdate(req.user.id, { profileId: college._id });
    }

    res.status(college.isNew ? 201 : 200).json({
      success: true,
      message: `College profile ${college.isNew ? 'created' : 'updated'} successfully`,
      data: college
    });

  } catch (error) {
    console.error('College profile error:', error);
    
    // Handle duplicate affiliation number
    if (error.code === 11000 && error.keyPattern?.affiliationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Affiliation number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating/updating college profile',
      error: error.message
    });
  }
};

// @desc    Get college profile
// @route   GET /api/college/profile
// @access  Private (College only)
const getProfile = async (req, res) => {
  try {
    const college = await College.findOne({ userId: req.user.id })
      .populate('studentsSponsored');

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College profile not found'
      });
    }

    res.json({
      success: true,
      data: college
    });

  } catch (error) {
    console.error('Get college profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching college profile',
      error: error.message
    });
  }
};

// @desc    Get funded students available for admission
// @route   GET /api/college/students
// @access  Private (College only)
const getFundedStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, grade } = req.query;

    // Build filter for funded students not yet enrolled
    let filter = { 
      status: 'funded',
      collegeId: { $exists: false } // Not yet enrolled in any college
    };

    // Add optional filters
    if (category) filter.category = category;
    if (grade) filter.grade = grade;

    const students = await Student.find(filter)
      .populate({
        path: 'schoolId',
        select: 'schoolName address contactPerson phone'
      })
      .populate({
        path: 'donorId',
        select: 'email'
      })
      .sort({ aiVerificationScore: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Student.countDocuments(filter);

    res.json({
      success: true,
      count: students.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: students
    });

  } catch (error) {
    console.error('Get funded students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching funded students',
      error: error.message
    });
  }
};

// @desc    Process student admission
// @route   POST /api/college/admission
// @access  Private (College only)
const processAdmission = async (req, res) => {
  try {
    const { studentId, scholarshipOffered, admissionNotes } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    // Get college profile
    const college = await College.findOne({ userId: req.user.id });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College profile not found. Please create your college profile first.'
      });
    }

    // Check if college is verified
    if (college.verificationStatus !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'College must be verified before processing admissions'
      });
    }

    // Find and verify the student
    const student = await Student.findById(studentId).populate('schoolId donorId');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.status !== 'funded') {
      return res.status(400).json({
        success: false,
        message: 'Student must be funded before admission'
      });
    }

    if (student.collegeId) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in a college'
      });
    }

    // Process admission
    student.collegeId = college._id;
    student.status = 'enrolled';
    await student.save();

    // Add student to college's sponsored students
    college.studentsSponsored.push(student._id);
    await college.save();

    res.json({
      success: true,
      message: 'Student admission processed successfully',
      data: {
        student: {
          id: student._id,
          studentName: student.studentName,
          grade: student.grade,
          category: student.category,
          status: student.status,
          school: student.schoolId.schoolName,
          donor: student.donorId.email
        },
        college: {
          id: college._id,
          collegeName: college.collegeName,
          totalStudentsSponsored: college.studentsSponsored.length
        }
      }
    });

  } catch (error) {
    console.error('Process admission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing student admission',
      error: error.message
    });
  }
};

// @desc    Submit student feedback/progress report
// @route   POST /api/college/feedback
// @access  Private (College only)
const submitStudentFeedback = async (req, res) => {
  try {
    const { studentId, feedback, academicProgress, attendanceRate } = req.body;

    if (!studentId || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and feedback are required'
      });
    }

    // Get college profile
    const college = await College.findOne({ userId: req.user.id });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College profile not found'
      });
    }

    // Find student and verify it belongs to this college
    const student = await Student.findOne({ 
      _id: studentId, 
      collegeId: college._id 
    }).populate('donorId schoolId');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or not enrolled in your college'
      });
    }

    // In a real application, you would create a separate StudentProgress model
    // For now, we'll add the feedback to a simple field or create a basic structure
    const feedbackData = {
      feedback,
      academicProgress,
      attendanceRate,
      submittedAt: new Date(),
      submittedBy: college._id
    };

    // You could extend the Student model to include a progress/feedback array
    // For now, we'll just return success with the feedback data
    
    res.json({
      success: true,
      message: 'Student feedback submitted successfully',
      data: {
        studentId: student._id,
        studentName: student.studentName,
        feedback: feedbackData,
        donor: student.donorId.email,
        school: student.schoolId.schoolName
      }
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting student feedback',
      error: error.message
    });
  }
};

// @desc    Get college impact data
// @route   GET /api/college/impact
// @access  Private (College only)
const getCollegeImpact = async (req, res) => {
  try {
    const college = await College.findOne({ userId: req.user.id });
    
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College profile not found'
      });
    }

    // Get students enrolled in this college
    const enrolledStudents = await Student.find({ collegeId: college._id })
      .populate('schoolId donorId');

    // Calculate impact metrics
    const totalStudentsEnrolled = enrolledStudents.length;
    const totalFundingReceived = enrolledStudents.reduce((sum, student) => sum + student.financialNeed, 0);
    
    // Group by category
    const categoryBreakdown = enrolledStudents.reduce((acc, student) => {
      acc[student.category] = (acc[student.category] || 0) + 1;
      return acc;
    }, {});

    // Group by grade
    const gradeBreakdown = enrolledStudents.reduce((acc, student) => {
      acc[student.grade] = (acc[student.grade] || 0) + 1;
      return acc;
    }, {});

    // Get unique schools and donors
    const uniqueSchools = [...new Set(enrolledStudents.map(s => s.schoolId._id.toString()))].length;
    const uniqueDonors = [...new Set(enrolledStudents.map(s => s.donorId._id.toString()))].length;

    res.json({
      success: true,
      data: {
        totalStudentsEnrolled,
        totalFundingReceived,
        uniqueSchoolsPartnered: uniqueSchools,
        uniqueDonorsConnected: uniqueDonors,
        categoryBreakdown,
        gradeBreakdown,
        scholarshipsOffered: college.scholarshipsOffered.length,
        verificationStatus: college.verificationStatus,
        aiVerificationScore: college.aiVerificationScore
      }
    });

  } catch (error) {
    console.error('Get college impact error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching college impact data',
      error: error.message
    });
  }
};

// @desc    Get enrolled students
// @route   GET /api/college/enrolled-students
// @access  Private (College only)
const getEnrolledStudents = async (req, res) => {
  try {
    const college = await College.findOne({ userId: req.user.id });
    
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College profile not found'
      });
    }

    const students = await Student.find({ collegeId: college._id })
      .populate('schoolId', 'schoolName address contactPerson phone')
      .populate('donorId', 'email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: students.length,
      data: students
    });

  } catch (error) {
    console.error('Get enrolled students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled students',
      error: error.message
    });
  }
};

module.exports = {
  createOrUpdateProfile,
  getProfile,
  getFundedStudents,
  processAdmission,
  submitStudentFeedback,
  getCollegeImpact,
  getEnrolledStudents
};