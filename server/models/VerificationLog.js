const mongoose = require('mongoose');

const verificationLogSchema = new mongoose.Schema({
  entityType: {
    type: String,
    required: true,
    enum: ['school', 'student', 'request', 'college']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType'
  },
  verificationType: {
    type: String,
    required: true,
    enum: ['ai_automated', 'manual_review', 'hybrid']
  },
  aiScore: {
    type: Number,
    min: 0,
    max: 100
  },
  aiAnalysis: {
    confidence: { type: Number, min: 0, max: 100 },
    keyFindings: [String],
    flags: [String], // potential issues detected
    recommendations: String
  },
  manualReview: {
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewerNotes: String,
    finalDecision: {
      type: String,
      enum: ['approved', 'rejected', 'needs_more_info']
    },
    reviewedAt: Date
  },
  documentsAnalyzed: [String], // URLs of documents checked
  status: {
    type: String,
    enum: ['completed', 'pending_manual_review', 'flagged'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
verificationLogSchema.index({ entityType: 1, entityId: 1 });
verificationLogSchema.index({ status: 1 });
verificationLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('VerificationLog', verificationLogSchema);