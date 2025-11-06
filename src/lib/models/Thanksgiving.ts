import mongoose, { Document, Schema } from 'mongoose';

export interface IThanksgiving extends Document {
  member: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: 'answered-prayer' | 'blessing' | 'healing' | 'provision' | 'protection' | 'guidance' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'acknowledged' | 'closed';
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  bishopNotes?: string;
  acknowledgedDate?: Date;
  tags: string[];
  isActive: boolean;
}

const thanksgivingSchema: Schema = new Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  category: {
    type: String,
    enum: ['answered-prayer', 'blessing', 'healing', 'provision', 'protection', 'guidance', 'other'],
    default: 'blessing',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'acknowledged', 'closed'],
    default: 'pending',
  },
  isPrivate: { type: Boolean, default: false },
  bishopNotes: { type: String, trim: true, maxlength: 1000 },
  acknowledgedDate: { type: Date },
  tags: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

thanksgivingSchema.index({ member: 1, createdAt: -1 });
thanksgivingSchema.index({ status: 1, priority: 1 });
thanksgivingSchema.index({ category: 1, createdAt: -1 });

thanksgivingSchema.set('toJSON', { virtuals: true });
thanksgivingSchema.set('toObject', { virtuals: true });

export const Thanksgiving = mongoose.models.Thanksgiving || mongoose.model<IThanksgiving>('Thanksgiving', thanksgivingSchema);
