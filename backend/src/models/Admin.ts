import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  username: string;
  name: string;
  passwordHash: string;
  role: 'ADMIN' | 'ORGANIZER';
  active: boolean;
  createdAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
  username: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'ORGANIZER'], default: 'ADMIN' },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Admin = mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);
