import mongoose, { Document, Schema } from 'mongoose';

export interface IProtocolStrategy extends Document {
  protocolTeam: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId; // Protocol team leader
  
  // Strategy categories
  category: 'visitor-outreach' | 'conversion-techniques' | 'follow-up-methods' | 'integration-strategies' | 'team-collaboration' | 'other';
  
  // Strategy details
  title: string;
  description: string;
  specificSteps: string[];
  
  // Success metrics
  implementationPeriod: string; // e.g., "3 months", "6 months"
  measuredResults: {
    beforeImplementation: {
      conversionRate: number;
      visitorCount: number;
      timeframe: string;
    };
    afterImplementation: {
      conversionRate: number;
      visitorCount: number;
      timeframe: string;
    };
    improvementPercentage: number;
  };
  
  // Evidence and examples
  successStories: Array<{
    visitorName: string; // Anonymous or first name only
    situation: string;
    strategy: string;
    outcome: string;
    timeToConversion: number; // days
  }>;
  
  // Sharing and approval
  status: 'draft' | 'submitted' | 'approved' | 'featured' | 'archived';
  approvedBy?: mongoose.Types.ObjectId; // Bishop
  approvalDate?: Date;
  approvalNotes?: string;
  
  // Usage tracking
  sharedWithTeams: mongoose.Types.ObjectId[];
  implementedByTeams: mongoose.Types.ObjectId[];
  effectiveness: {
    timesShared: number;
    timesImplemented: number;
    averageImprovement: number;
    feedback: Array<{
      teamId: mongoose.Types.ObjectId;
      rating: number; // 1-5
      comment: string;
      implementationSuccess: boolean;
    }>;
  };
  
  // Metadata
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  resourcesNeeded: string[];
  estimatedTimeToImplement: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const ProtocolStrategySchema = new Schema<IProtocolStrategy>({
  protocolTeam: {
    type: Schema.Types.ObjectId,
    ref: 'ProtocolTeam',
    required: true
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  category: {
    type: String,
    enum: ['visitor-outreach', 'conversion-techniques', 'follow-up-methods', 'integration-strategies', 'team-collaboration', 'other'],
    required: true
  },
  
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  specificSteps: [{
    type: String,
    maxlength: 500
  }],
  
  measuredResults: {
    beforeImplementation: {
      conversionRate: { type: Number, min: 0, max: 100 },
      visitorCount: { type: Number, min: 0 },
      timeframe: String
    },
    afterImplementation: {
      conversionRate: { type: Number, min: 0, max: 100 },
      visitorCount: { type: Number, min: 0 },
      timeframe: String
    },
    improvementPercentage: { type: Number }
  },
  
  successStories: [{
    visitorName: { type: String, maxlength: 50 },
    situation: { type: String, maxlength: 200 },
    strategy: { type: String, maxlength: 300 },
    outcome: { type: String, maxlength: 200 },
    timeToConversion: { type: Number, min: 1 }
  }],
  
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'featured', 'archived'],
    default: 'draft'
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  approvalNotes: String,
  
  sharedWithTeams: [{
    type: Schema.Types.ObjectId,
    ref: 'ProtocolTeam'
  }],
  implementedByTeams: [{
    type: Schema.Types.ObjectId,
    ref: 'ProtocolTeam'
  }],
  
  effectiveness: {
    timesShared: { type: Number, default: 0 },
    timesImplemented: { type: Number, default: 0 },
    averageImprovement: { type: Number, default: 0 },
    feedback: [{
      teamId: { type: Schema.Types.ObjectId, ref: 'ProtocolTeam' },
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      implementationSuccess: Boolean
    }]
  },
  
  tags: [String],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  resourcesNeeded: [String],
  estimatedTimeToImplement: String
}, {
  timestamps: true
});

// Indexes for better query performance
ProtocolStrategySchema.index({ protocolTeam: 1, status: 1 });
ProtocolStrategySchema.index({ category: 1, status: 1 });
ProtocolStrategySchema.index({ 'measuredResults.improvementPercentage': -1 });
ProtocolStrategySchema.index({ createdAt: -1 });

export const ProtocolStrategy = mongoose.models.ProtocolStrategy || mongoose.model<IProtocolStrategy>('ProtocolStrategy', ProtocolStrategySchema);
