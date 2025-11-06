// src/lib/models/Communication.ts
import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface ICommunication extends Document {
  sender: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: 'bishop' | 'leader' | 'protocol';
  recipients: {
    type: 'all_members' | 'all_leaders' | 'all_protocol' | 'group_members' | 'specific_users';
    groupId?: mongoose.Types.ObjectId;
    userIds?: mongoose.Types.ObjectId[];
  };
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'announcement' | 'meeting' | 'event' | 'prayer' | 'general';
  attachments?: string[];
  readBy: {
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  isActive: boolean;
  scheduledFor?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommunicationSchema: Schema<ICommunication> = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    senderRole: { 
      type: String, 
      enum: ['bishop', 'leader', 'protocol'], 
      required: true 
    },
    recipients: {
      type: {
        type: String,
        enum: ['all_members', 'all_leaders', 'all_protocol', 'group_members', 'specific_users'],
        required: true
      },
      groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
      userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }]
    },
    subject: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 5000 },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    category: {
      type: String,
      enum: ['announcement', 'meeting', 'event', 'prayer', 'general'],
      default: 'general'
    },
    attachments: [{ type: String }],
    readBy: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      readAt: { type: Date, default: Date.now }
    }],
    isActive: { type: Boolean, default: true },
    scheduledFor: { type: Date },
    sentAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes for better performance
CommunicationSchema.index({ sender: 1, createdAt: -1 });
CommunicationSchema.index({ 'recipients.userIds': 1, isActive: 1 });
CommunicationSchema.index({ 'recipients.groupId': 1, isActive: 1 });
CommunicationSchema.index({ priority: 1, createdAt: -1 });

export const Communication = models.Communication || model<ICommunication>('Communication', CommunicationSchema);
