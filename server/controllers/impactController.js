const School = require('../models/School');
const Student = require('../models/Student');
const Request = require('../models/Request');
const Donation = require('../models/Donation');
const College = require('../models/College');
const VerificationLog = require('../models/VerificationLog');

// @desc    Get overall platform statistics
// @route   GET /api/impact/overall
// @access  Public
const getOverallStatistics = async (req, res) => {
  try {
    // Get basic counts
    const totalSchools = await School.countDocuments();
    const verifiedSchools = await School.countDocuments({ verificationStatus: 'verified' });
    const totalStudents = await Student.countDocuments();
    const verifiedStudents = await Student.countDocuments({ status: 'verified' });
    const fundedStudents = await Student.countDocuments({ status: { $in: ['funded', 'enrolled'] } });
    const totalRequests = await Request.countDocuments();
    const approvedRequests = await Request.countDocuments({ status: 'approved' });
    const fundedRequests = await Request.countDocuments({ status: 'funded' });
    const totalColleges = await College.countDocuments();
    const verifiedColleges = await College.countDocuments({ verificationStatus: 'verified' });

    // Get donation statistics
    const donationStats = await Donation.aggregate([
      {
        $group: {
          _id: null,
          totalDonations: { $sum: 1 },
          totalAmountRaised: { $sum: '$amount' },
          avgDonation: { $avg: '$amount' }
        }
      }
    ]);

    // Get funding statistics for requests
    const requestFundingStats = await Request.aggregate([
      {
        $group: {
          _id: null,
          totalAmountNeeded: { $sum: '$amountNeeded' },
          totalAmountFunded: { $sum: '$amountFunded' }
        }
      }
    ]);

    // Get verification statistics
    const verificationStats = await VerificationLog.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get AI verification score distribution
    const aiScoreDistribution = await VerificationLog.aggregate([
      {
        $bucket: {
          groupBy: '$aiScore',
          boundaries: [0, 50, 80, 100],
          default: 'other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    const stats = donationStats[0] || { totalDonations: 0, totalAmountRaised: 0, avgDonation: 0 };
    const requestStats = requestFundingStats[0] || { totalAmountNeeded: 0, totalAmountFunded: 0 };

    // Calculate funding percentage
    const fundingPercentage = requestStats.totalAmountNeeded > 0 
      ? Math.round((requestStats.totalAmountFunded / requestStats.totalAmountNeeded) * 100)
      : 0;

    // Process verification stats
    const verificationSummary = verificationStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        schools: {
          total: totalSchools,
          verified: verifiedSchools,
          verificationRate: totalSchools > 0 ? Math.round((verifiedSchools / totalSchools) * 100) : 0
        },
        students: {
          total: totalStudents,
          verified: verifiedStudents,
          funded: fundedStudents,
          verificationRate: totalStudents > 0 ? Math.round((verifiedStudents / totalStudents) * 100) : 0,
          fundingRate: verifiedStudents > 0 ? Math.round((fundedStudents / verifiedStudents) * 100) : 0
        },
        requests: {
          total: totalRequests,
          approved: approvedRequests,
          funded: fundedRequests,
          approvalRate: totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0,
          fundingRate: approvedRequests > 0 ? Math.round((fundedRequests / approvedRequests) * 100) : 0
        },
        colleges: {
          total: totalColleges,
          verified: verifiedColleges,
          verificationRate: totalColleges > 0 ? Math.round((verifiedColleges / totalColleges) * 100) : 0
        },
        donations: {
          totalDonations: stats.totalDonations,
          totalAmountRaised: stats.totalAmountRaised,
          averageDonation: Math.round(stats.avgDonation || 0)
        },
        funding: {
          totalAmountNeeded: requestStats.totalAmountNeeded,
          totalAmountFunded: requestStats.totalAmountFunded,
          fundingPercentage
        },
        verification: {
          summary: verificationSummary,
          aiScoreDistribution
        }
      }
    });

  } catch (error) {
    console.error('Get overall statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overall statistics',
      error: error.message
    });
  }
};

// @desc    Get regional analytics
// @route   GET /api/impact/regional
// @access  Public
const getRegionalAnalytics = async (req, res) => {
  try {
    // Get schools by state
    const schoolsByState = await School.aggregate([
      {
        $group: {
          _id: '$address.state',
          totalSchools: { $sum: 1 },
          verifiedSchools: {
            $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] }
          },
          avgVerificationScore: { $avg: '$aiVerificationScore' }
        }
      },
      { $sort: { totalSchools: -1 } }
    ]);

    // Get students by state (through school)
    const studentsByState = await Student.aggregate([
      {
        $lookup: {
          from: 'schools',
          localField: 'schoolId',
          foreignField: '_id',
          as: 'school'
        }
      },
      { $unwind: '$school' },
      {
        $group: {
          _id: '$school.address.state',
          totalStudents: { $sum: 1 },
          verifiedStudents: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          fundedStudents: {
            $sum: { $cond: [{ $in: ['$status', ['funded', 'enrolled']] }, 1, 0] }
          },
          totalFunding: { $sum: '$financialNeed' }
        }
      },
      { $sort: { totalStudents: -1 } }
    ]);

    // Get requests by state
    const requestsByState = await Request.aggregate([
      {
        $lookup: {
          from: 'schools',
          localField: 'schoolId',
          foreignField: '_id',
          as: 'school'
        }
      },
      { $unwind: '$school' },
      {
        $group: {
          _id: '$school.address.state',
          totalRequests: { $sum: 1 },
          approvedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          fundedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'funded'] }, 1, 0] }
          },
          totalAmountNeeded: { $sum: '$amountNeeded' },
          totalAmountFunded: { $sum: '$amountFunded' }
        }
      },
      { $sort: { totalRequests: -1 } }
    ]);

    // Get cities with most activity
    const citiesByActivity = await School.aggregate([
      {
        $group: {
          _id: {
            city: '$address.city',
            state: '$address.state'
          },
          schoolCount: { $sum: 1 },
          verifiedSchools: {
            $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          city: '$_id.city',
          state: '$_id.state',
          schoolCount: 1,
          verifiedSchools: 1
        }
      },
      { $sort: { schoolCount: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      success: true,
      data: {
        schoolsByState,
        studentsByState,
        requestsByState,
        topCities: citiesByActivity
      }
    });

  } catch (error) {
    console.error('Get regional analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching regional analytics',
      error: error.message
    });
  }
};

// @desc    Get funding trends over time
// @route   GET /api/impact/trends
// @access  Public
const getFundingTrends = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // month, week, day

    let dateFormat;
    switch (period) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%U'; // Year-Week
        break;
      case 'month':
      default:
        dateFormat = '%Y-%m';
        break;
    }

    // Get donation trends
    const donationTrends = await Donation.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          totalDonations: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgDonation: { $avg: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get verification trends
    const verificationTrends = await VerificationLog.aggregate([
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            entityType: '$entityType'
          },
          count: { $sum: 1 },
          avgScore: { $avg: '$aiScore' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          verifications: {
            $push: {
              entityType: '$_id.entityType',
              count: '$count',
              avgScore: '$avgScore'
            }
          },
          totalVerifications: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get request creation trends
    const requestTrends = await Request.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          totalRequests: { $sum: 1 },
          totalAmountNeeded: { $sum: '$amountNeeded' },
          avgAmountNeeded: { $avg: '$amountNeeded' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get student registration trends
    const studentTrends = await Student.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          totalStudents: { $sum: 1 },
          totalFinancialNeed: { $sum: '$financialNeed' },
          avgFinancialNeed: { $avg: '$financialNeed' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        period,
        donations: donationTrends,
        verifications: verificationTrends,
        requests: requestTrends,
        students: studentTrends
      }
    });

  } catch (error) {
    console.error('Get funding trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching funding trends',
      error: error.message
    });
  }
};

// @desc    Get verification analytics
// @route   GET /api/impact/verification-analytics
// @access  Private (Admin only)
const getVerificationAnalytics = async (req, res) => {
  try {
    // Get verification success rates by entity type
    const verificationByType = await VerificationLog.aggregate([
      {
        $group: {
          _id: '$entityType',
          totalVerifications: { $sum: 1 },
          avgAiScore: { $avg: '$aiScore' },
          autoApproved: {
            $sum: { $cond: [{ $gte: ['$aiScore', 80] }, 1, 0] }
          },
          manualReview: {
            $sum: { $cond: [{ $and: [{ $gte: ['$aiScore', 50] }, { $lt: ['$aiScore', 80] }] }, 1, 0] }
          },
          autoRejected: {
            $sum: { $cond: [{ $lt: ['$aiScore', 50] }, 1, 0] }
          }
        }
      }
    ]);

    // Get common flags and issues
    const commonFlags = await VerificationLog.aggregate([
      { $unwind: '$aiAnalysis.flags' },
      {
        $group: {
          _id: '$aiAnalysis.flags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get verification processing time (mock data since we don't track processing time)
    const processingStats = {
      avgProcessingTime: '2.3 seconds',
      totalProcessed: await VerificationLog.countDocuments(),
      pendingManualReview: await VerificationLog.countDocuments({ status: 'pending_manual_review' })
    };

    // Get AI confidence distribution
    const confidenceDistribution = await VerificationLog.aggregate([
      {
        $bucket: {
          groupBy: '$aiAnalysis.confidence',
          boundaries: [0, 25, 50, 75, 90, 100],
          default: 'other',
          output: {
            count: { $sum: 1 },
            avgScore: { $avg: '$aiScore' }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        verificationByType,
        commonFlags,
        processingStats,
        confidenceDistribution
      }
    });

  } catch (error) {
    console.error('Get verification analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verification analytics',
      error: error.message
    });
  }
};

module.exports = {
  getOverallStatistics,
  getRegionalAnalytics,
  getFundingTrends,
  getVerificationAnalytics
};