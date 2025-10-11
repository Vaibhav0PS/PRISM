const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schoolName: {
    type: String,
    required: [true, 'School name is required'],
    trim: true
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ }
  },
  contactPerson: {
    type: String,
    required: [true, 'Contact person is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
  },
  principalName: {
    type: String,
    required: [true, 'Principal name is required'],
    trim: true
  },
  documents: [{
    type: String // URLs to uploaded documents
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'in_review', 'verified', 'rejected'],
    default: 'pending'
  },
  aiVerificationScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  aiVerificationDetails: {
    documentAuthenticity: { type: Number, min: 0, max: 100 },
    dataConsistency: { type: Number, min: 0, max: 100 },
    anomalyDetection: String,
    verifiedAt: Date,
    reviewedBy: String // 'AI' or admin userId
  },
  adminNotes: String,
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  requests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  }],
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
schoolSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('School', schoolSchema);