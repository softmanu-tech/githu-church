// lib/models/User.ts
import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    role: 'bishop' | 'leader' | 'member' | 'protocol';
    group?: mongoose.Types.ObjectId; // Keep for backward compatibility
    groups?: mongoose.Types.ObjectId[]; // New: support multiple groups
    protocolTeam?: mongoose.Types.ObjectId;
    phone?: string;
    residence?: string;
    department?: string;
    profilePicture?: string;
    lastPasswordReset?: Date;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['bishop', 'leader', 'member', 'protocol'], required: true },
        group: { type: Schema.Types.ObjectId, ref: 'Group' }, // Keep for backward compatibility
        groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }], // New: support multiple groups
        protocolTeam: { type: Schema.Types.ObjectId, ref: 'ProtocolTeam' },
        phone: { type: String },
        residence: { type: String },
        department: { type: String },
        profilePicture: { type: String },
        lastPasswordReset: { type: Date },
    },
    { timestamps: true }
);

export const User = models.User || model<IUser>('User', UserSchema);
