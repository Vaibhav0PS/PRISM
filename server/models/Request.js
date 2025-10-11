const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  requestType: {
    type: String,
    required: true,
    enum: ['infrastructure', 'student', 'equipment']
  },
  title: {
    type: String,
    required: [true, 'Request title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Request description is required']
  },
  amountNeeded: {
    type: Number,
    required: [true, 'Amount needed is required'],
    min: [1, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: true // lab, classroom, sanitation, etc.
  },
  documents: [{
    type: String // supporting documents/images URLs
  }],
  status: {
    type: String,
    enum: ['pending', 'in_review', 'approved', 'funded', 'rejected'],
    default: 'pending'
  },
  aiVerificationScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  aiVerificationDetails: {
    legitimacyScore: { type: Number, min: 0, max: 100 },
    needValidation: { type: Number, min: 0, max: 100 },
    budgetReasonability: String,
    riskAssessment: String,
    verifiedAt: Date
  },
  adminNotes: String,
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  amountFunded: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
requestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Request', requestSchema);