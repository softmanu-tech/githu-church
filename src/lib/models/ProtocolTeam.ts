import mongoose, { Document, Schema } from 'mongoose';

export interface IProtocolTeam extends Document {
  name: string;
  description?: string;
  leader: mongoose.Types.ObjectId; // Protocol team leader
  members: mongoose.Types.ObjectId[]; // Protocol team members
  responsibilities: string[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId; // Bishop who created the team
  createdAt: Date;
  updatedAt: Date;
}

const ProtocolTeamSchema = new Schema<IProtocolTeam>({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  leader: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  members: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User'
  }],
  responsibilities: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better performance
ProtocolTeamSchema.index({ name: 1 });
ProtocolTeamSchema.index({ leader: 1 });
ProtocolTeamSchema.index({ isActive: 1 });

export const ProtocolTeam = mongoose.models.ProtocolTeam || mongoose.model<IProtocolTeam>('ProtocolTeam', ProtocolTeamSchema);
