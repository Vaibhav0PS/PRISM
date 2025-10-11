const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['academic', 'sports', 'extracurricular']
  },
  achievementDetails: {
    type: String,
    required: [true, 'Achievement details are required']
  },
  financialNeed: {
    type: Number,
    required: [true, 'Financial need amount is required'],
    min: [0, 'Financial need cannot be negative']
  },
  documents: [{
    type: String // URLs to certificates, report cards, etc.
  }],
  status: {
    type: String,
    enum: ['pending', 'verified', 'funded', 'enrolled', 'rejected'],
    default: 'pending'
  },
  aiVerificationScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  aiVerificationDetails: {
    credibilityScore: { type: Number, min: 0, max: 100 },
    documentValidity: { type: Number, min: 0, max: 100 },
    needAssessment: String,
    verifiedAt: Date
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
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
studentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Student', studentSchema);