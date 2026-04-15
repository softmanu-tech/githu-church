import mongoose, { Document, Schema } from 'mongoose';

export interface IFinanceCategory extends Document {
  name: string;
  payBill: string;
  agentNumber: string;
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FinanceCategorySchema = new Schema<IFinanceCategory>(
  {
    name: { type: String, required: true, trim: true },
    payBill: { type: String, required: true, trim: true },
    agentNumber: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const FinanceCategory =
  mongoose.models.FinanceCategory ||
  mongoose.model<IFinanceCategory>('FinanceCategory', FinanceCategorySchema);
