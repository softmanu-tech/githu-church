import mongoose from 'mongoose';

const prayerRequestSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  memberName: {
    type: String,
    required: true
  },
  memberEmail: {
    type: String,
    required: true
  },
  memberPhone: {
    type: String
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['health', 'family', 'financial', 'spiritual', 'work', 'relationships', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'answered', 'closed'],
    default: 'pending'
  },
  bishopNotes: {
    type: String,
    maxlength: 1000
  },
  answeredDate: {
    type: Date
  },
  followUpDate: {
    type: Date
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
prayerRequestSchema.index({ member: 1, createdAt: -1 });
prayerRequestSchema.index({ status: 1, priority: 1 });
prayerRequestSchema.index({ category: 1, createdAt: -1 });

// Virtual for formatted date
prayerRequestSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for days since submission
prayerRequestSchema.virtual('daysSinceSubmission').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
prayerRequestSchema.set('toJSON', { virtuals: true });
prayerRequestSchema.set('toObject', { virtuals: true });

export const PrayerRequest = mongoose.models.PrayerRequest || mongoose.model('PrayerRequest', prayerRequestSchema);
