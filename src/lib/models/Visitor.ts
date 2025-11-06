import mongoose, { Document, Schema } from 'mongoose';

export interface IVisitor extends Document {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  age?: number;
  occupation?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  
  // Visitor categorization
  type: 'first-time' | 'from-other-altar' | 'returning';
  status: 'visiting' | 'joining';
  
  // For joining visitors
  password?: string; // Only for joining visitors who get accounts
  monitoringStartDate?: Date;
  monitoringEndDate?: Date; // 3 months from start
  monitoringStatus: 'active' | 'completed' | 'converted-to-member' | 'inactive' | 'needs-attention';
  
  // Assignment
  protocolTeam: mongoose.Types.ObjectId;
  assignedProtocolMember: mongoose.Types.ObjectId;
  
  // Tracking
  visitHistory: {
    date: Date;
    eventType: string;
    notes?: string;
    attendanceStatus: 'present' | 'absent';
  }[];
  
  // Feedback and responses
  suggestions: {
    date: Date;
    message: string;
    category: 'service' | 'facility' | 'community' | 'spiritual' | 'other';
  }[];
  
  experiences: {
    date: Date;
    rating: number; // 1-5 stars
    message: string;
    eventType?: string;
  }[];
  
  // Event responses (similar to members)
  eventResponses: {
    event: mongoose.Types.ObjectId;
    willAttend: boolean;
    reason?: string;
    responseDate: Date;
  }[];
  
  // Monitoring progress
  milestones: {
    week: number; // Week 1-12 (3 months)
    completed: boolean;
    notes?: string;
    protocolMemberNotes?: string;
    completedDate?: Date;
  }[];
  
  // Profile information
  profilePicture?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // Source tracking
  referredBy?: string;
  howDidYouHear?: string;
  previousChurch?: string;
  
  // Integration tracking
  integrationChecklist: {
    welcomePackage: boolean;
    homeVisit: boolean;
    smallGroupIntro: boolean;
    ministryOpportunities: boolean;
    mentorAssigned: boolean;
    regularCheckIns: boolean;
  };
  
  // Status flags
  isActive: boolean;
  canLogin: boolean; // Only true for joining visitors
  
  createdAt: Date;
  updatedAt: Date;
}

const VisitorSchema = new Schema<IVisitor>({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: { 
    type: String,
    trim: true
  },
  address: { 
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: 1,
    max: 120
  },
  occupation: {
    type: String,
    trim: true
  },
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed']
  },
  
  // Visitor categorization
  type: {
    type: String,
    enum: ['first-time', 'from-other-altar', 'returning'],
    required: true
  },
  status: {
    type: String,
    enum: ['visiting', 'joining'],
    required: true
  },
  
  // For joining visitors
  password: {
    type: String,
    select: false // Hidden by default
  },
  monitoringStartDate: {
    type: Date
  },
  monitoringEndDate: {
    type: Date
  },
  monitoringStatus: {
    type: String,
    enum: ['active', 'completed', 'converted-to-member', 'inactive', 'needs-attention'],
    default: 'active'
  },
  
  // Assignment
  protocolTeam: {
    type: Schema.Types.ObjectId,
    ref: 'ProtocolTeam',
    required: true
  },
  assignedProtocolMember: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Tracking
  visitHistory: [{
    date: { type: Date, required: true },
    eventType: { type: String, required: true },
    notes: String,
    attendanceStatus: {
      type: String,
      enum: ['present', 'absent'],
      required: true
    }
  }],
  
  // Feedback
  suggestions: [{
    date: { type: Date, default: Date.now },
    message: { type: String, required: true },
    category: {
      type: String,
      enum: ['service', 'facility', 'community', 'spiritual', 'other'],
      required: true
    }
  }],
  
  experiences: [{
    date: { type: Date, default: Date.now },
    rating: { 
      type: Number, 
      required: true,
      min: 1,
      max: 5
    },
    message: { type: String, required: true },
    eventType: String
  }],
  
  // Event responses
  eventResponses: [{
    event: { 
      type: Schema.Types.ObjectId, 
      ref: 'Event',
      required: true
    },
    willAttend: { 
      type: Boolean, 
      required: true 
    },
    reason: String,
    responseDate: { 
      type: Date, 
      default: Date.now 
    }
  }],
  
  // Monitoring milestones
  milestones: [{
    week: { 
      type: Number, 
      required: true,
      min: 1,
      max: 12
    },
    completed: { 
      type: Boolean, 
      default: false 
    },
    notes: String,
    protocolMemberNotes: String,
    completedDate: Date
  }],
  
  // Profile
  profilePicture: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  
  // Source
  referredBy: String,
  howDidYouHear: String,
  previousChurch: String,
  
  // Integration tracking
  integrationChecklist: {
    welcomePackage: { type: Boolean, default: false },
    homeVisit: { type: Boolean, default: false },
    smallGroupIntro: { type: Boolean, default: false },
    ministryOpportunities: { type: Boolean, default: false },
    mentorAssigned: { type: Boolean, default: false },
    regularCheckIns: { type: Boolean, default: false }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  canLogin: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for attendance rate calculation
VisitorSchema.virtual('attendanceRate').get(function() {
  if (this.visitHistory.length === 0) return 0;
  const presentCount = this.visitHistory.filter(visit => visit.attendanceStatus === 'present').length;
  return Math.round((presentCount / this.visitHistory.length) * 100);
});

// Virtual for monitoring progress percentage
VisitorSchema.virtual('monitoringProgress').get(function() {
  if (this.milestones.length === 0) return 0;
  const completedMilestones = this.milestones.filter(m => m.completed).length;
  return Math.round((completedMilestones / 12) * 100); // 12 weeks = 3 months
});

// Virtual for days remaining in monitoring
VisitorSchema.virtual('daysRemaining').get(function() {
  if (!this.monitoringEndDate) return null;
  const today = new Date();
  const endDate = new Date(this.monitoringEndDate);
  const timeDiff = endDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return Math.max(0, daysDiff);
});

// Virtual for integration completion percentage
VisitorSchema.virtual('integrationProgress').get(function() {
  if (!this.integrationChecklist) return 0;
  const total = 6; // Total checklist items
  const completed = Object.values(this.integrationChecklist).filter(Boolean).length;
  return Math.round((completed / total) * 100);
});

// Add indexes
VisitorSchema.index({ email: 1 });
VisitorSchema.index({ protocolTeam: 1 });
VisitorSchema.index({ assignedProtocolMember: 1 });
VisitorSchema.index({ status: 1 });
VisitorSchema.index({ monitoringStatus: 1 });
VisitorSchema.index({ monitoringEndDate: 1 });

export const Visitor = mongoose.models.Visitor || mongoose.model<IVisitor>('Visitor', VisitorSchema);
