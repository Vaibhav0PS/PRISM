const Request = require('../models/Request');
const Student = require('../models/Student');
const Donation = require('../models/Donation');
const School = require('../models/School');

// @desc    Get all verified requests
// @route   GET /api/donor/requests
// @access  Private (Donor/NGO only)
const getVerifiedRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, category, minAmount, maxAmount, location } = req.query;
    
    // Build filter for verified requests only
    let filter = { 
      status: 'approved',
      aiVerificationScore: { $gte: 50 } // Only show requests with decent AI scores
    };

    // Add optional filters
    if (type) filter.requestType = type;
    if (category) filter.category = category;
    if (minAmount) filter.amountNeeded = { ...filter.amountNeeded, $gte: parseInt(minAmount) };
    if (maxAmount) filter.amountNeeded = { ...filter.amountNeeded, $lte: parseInt(maxAmount) };

    const requests = await Request.find(filter)
      .populate({
        path: 'schoolId',
        select: 'schoolName address contactPerson phone verificationStatus aiVerificationScore',
        match: location ? { 'address.city': new RegExp(location, 'i') } : {}
      })
      .sort({ aiVerificationScore: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter out requests where school population failed (due to location filter)
    const filteredRequests = requests.filter(req => req.schoolId);

    const total = await Request.countDocuments(filter);

    res.json({
      success: true,
      count: filteredRequests.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: filteredRequests
    });

  } catch (error) {
    console.error('Get verified requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verified requests',
      error: error.message
    });
  }
};

// @desc    Get verified students for sponsorship
// @route   GET /api/donor/students
// @access  Private (Donor/NGO only)
const getVerifiedStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, grade, minNeed, maxNeed, location } = req.query;
    
    // Build filter for verified students only
    let filter = { 
      status: 'verified',
      aiVerificationScore: { $gte: 50 }
    };

    // Add optional filters
    if (category) filter.category = category;
    if (grade) filter.grade = grade;
    if (minNeed) filter.financialNeed = { ...filter.financialNeed, $gte: parseInt(minNeed) };
    if (maxNeed) filter.financialNeed = { ...filter.financialNeed, $lte: parseInt(maxNeed) };

    const students = await Student.find(filter)
      .populate({
        path: 'schoolId',
        select: 'schoolName address contactPerson verificationStatus',
        match: location ? { 'address.city': new RegExp(location, 'i') } : {}
      })
      .sort({ aiVerificationScore: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter out students where school population failed
    const filteredStudents = students.filter(student => student.schoolId);

    const total = await Student.countDocuments(filter);

    res.json({
      success: true,
      count: filteredStudents.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: filteredStudents
    });

  } catch (error) {
    console.error('Get verified students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verified students',
      error: error.message
    });
  }
};

// @desc    Donate to a request
// @route   POST /api/donor/donate/request
// @access  Private (Donor/NGO only)
const donateToRequest = async (req, res) => {
  try {
    const { requestId, amount } = req.body;

    if (!requestId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and valid amount are required'
      });
    }

    // Find and verify the request
    const request = await Request.findById(requestId).populate('schoolId');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Request is not approved for funding'
      });
    }

    // Check if request is already fully funded
    if (request.amountFunded >= request.amountNeeded) {
      return res.status(400).json({
        success: false,
        message: 'Request is already fully funded'
      });
    }

    // Calculate actual donation amount (don't exceed needed amount)
    const remainingAmount = request.amountNeeded - request.amountFunded;
    const donationAmount = Math.min(amount, remainingAmount);

    // Create donation record
    const donation = await Donation.create({
      donorId: req.user.id,
      requestId: requestId,
      amount: donationAmount,
      paymentStatus: 'completed', // In real app, this would be 'pending' until payment gateway confirms
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // Update request funded amount
    request.amountFunded += donationAmount;
    if (request.amountFunded >= request.amountNeeded) {
      request.status = 'funded';
    }
    await request.save();

    res.status(201).json({
      success: true,
      message: 'Donation successful',
      data: {
        donation,
        request: {
          id: request._id,
          title: request.title,
          amountNeeded: request.amountNeeded,
          amountFunded: request.amountFunded,
          status: request.status
        }
      }
    });

  } catch (error) {
    console.error('Donate to request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing donation',
      error: error.message
    });
  }
};

// @desc    Sponsor a student
// @route   POST /api/donor/donate/student
// @access  Private (Donor/NGO only)
const sponsorStudent = async (req, res) => {
  try {
    const { studentId, amount } = req.body;

    if (!studentId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and valid amount are required'
      });
    }

    // Find and verify the student
    const student = await Student.findById(studentId).populate('schoolId');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.status !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Student is not verified for sponsorship'
      });
    }

    if (student.donorId) {
      return res.status(400).json({
        success: false,
        message: 'Student is already sponsored'
      });
    }

    // Create donation record
    const donation = await Donation.create({
      donorId: req.user.id,
      studentId: studentId,
      amount: amount,
      paymentStatus: 'completed',
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // Update student with donor information
    student.donorId = req.user.id;
    student.status = 'funded';
    await student.save();

    res.status(201).json({
      success: true,
      message: 'Student sponsorship successful',
      data: {
        donation,
        student: {
          id: student._id,
          studentName: student.studentName,
          grade: student.grade,
          category: student.category,
          financialNeed: student.financialNeed,
          status: student.status
        }
      }
    });

  } catch (error) {
    console.error('Sponsor student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing student sponsorship',
      error: error.message
    });
  }
};

// @desc    Get donation history
// @route   GET /api/donor/donations
// @access  Private (Donor/NGO only)
const getDonationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const donations = await Donation.find({ donorId: req.user.id })
      .populate({
        path: 'requestId',
        select: 'title requestType category amountNeeded status',
        populate: {
          path: 'schoolId',
          select: 'schoolName address'
        }
      })
      .populate({
        path: 'studentId',
        select: 'studentName grade category financialNeed status',
        populate: {
          path: 'schoolId',
          select: 'schoolName address'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments({ donorId: req.user.id });

    res.json({
      success: true,
      count: donations.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: donations
    });

  } catch (error) {
    console.error('Get donation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donation history',
      error: error.message
    });
  }
};

// @desc    Get impact metrics for donor
// @route   GET /api/donor/impact
// @access  Private (Donor/NGO only)
const getImpactMetrics = async (req, res) => {
  try {
    const donorId = req.user.id;

    // Get donation statistics
    const donationStats = await Donation.aggregate([
      { $match: { donorId: donorId } },
      {
        $group: {
          _id: null,
          totalDonations: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgDonation: { $avg: '$amount' }
        }
      }
    ]);

    // Get students sponsored
    const studentsSponsored = await Student.countDocuments({ donorId: donorId });

    // Get requests funded
    const requestsFunded = await Donation.distinct('requestId', { donorId: donorId });

    // Get schools impacted
    const schoolsImpacted = await Donation.aggregate([
      { $match: { donorId: donorId } },
      {
        $lookup: {
          from: 'requests',
          localField: 'requestId',
          foreignField: '_id',
          as: 'request'
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $project: {
          schoolId: {
            $cond: {
              if: { $gt: [{ $size: '$request' }, 0] },
              then: { $arrayElemAt: ['$request.schoolId', 0] },
              else: { $arrayElemAt: ['$student.schoolId', 0] }
            }
          }
        }
      },
      {
        $group: {
          _id: '$schoolId'
        }
      },
      {
        $count: 'uniqueSchools'
      }
    ]);

    const stats = donationStats[0] || { totalDonations: 0, totalAmount: 0, avgDonation: 0 };
    const uniqueSchools = schoolsImpacted[0]?.uniqueSchools || 0;

    res.json({
      success: true,
      data: {
        totalDonations: stats.totalDonations,
        totalAmountDonated: stats.totalAmount,
        averageDonation: Math.round(stats.avgDonation || 0),
        studentsSponsored,
        requestsFunded: requestsFunded.length,
        schoolsImpacted: uniqueSchools
      }
    });

  } catch (error) {
    console.error('Get impact metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching impact metrics',
      error: error.message
    });
  }
};

module.exports = {
  getVerifiedRequests,
  getVerifiedStudents,
  donateToRequest,
  sponsorStudent,
  getDonationHistory,
  getImpactMetrics
};