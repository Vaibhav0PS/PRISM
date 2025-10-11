const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collegeName: {
    type: String,
    required: [true, 'College name is required'],
    trim: true
  },
  affiliationNumber: {
    type: String,
    required: [true, 'Affiliation number is required'],
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
  scholarshipsOffered: [{
    name: String,
    amount: Number,
    criteria: String,
    duration: String
  }],
  studentsSponsored: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
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
    institutionalCredibility: { type: Number, min: 0, max: 100 },
    accreditationValidity: { type: Number, min: 0, max: 100 },
    verifiedAt: Date
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
collegeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('College', collegeSchema);