import mongoose, { Document, Schema } from 'mongoose';

export interface IFinanceContribution extends Document {
  category: mongoose.Types.ObjectId;
  member: mongoose.Types.ObjectId;
  referenceNumber: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  transactionDate: Date;
  transactionTime: string;
  rawMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinanceContributionSchema = new Schema<IFinanceContribution>(
  {
    category: { type: Schema.Types.ObjectId, ref: 'FinanceCategory', required: true },
    member: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    referenceNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    bankName: { type: String, required: true, trim: true },
    accountNumber: { type: String, default: '', trim: true },
    transactionDate: { type: Date, required: true },
    transactionTime: { type: String, default: '' },
    rawMessage: { type: String, required: true },
  },
  { timestamps: true }
);

// Index for fast lookups per category and per member
FinanceContributionSchema.index({ category: 1, createdAt: -1 });
FinanceContributionSchema.index({ member: 1, createdAt: -1 });

export const FinanceContribution =
  mongoose.models.FinanceContribution ||
  mongoose.model<IFinanceContribution>('FinanceContribution', FinanceContributionSchema);
