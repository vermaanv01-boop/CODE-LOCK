import mongoose, { Schema, Document } from 'mongoose';
import { ContestStatus, RoundStatus } from '@shared/types';

export interface IContest extends Document {
  status: ContestStatus;
  contestStartTime: Date | null;
  contestEndTime: Date | null;
  round1Status: RoundStatus;
  round2Status: RoundStatus;
  round3Status: RoundStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ContestSchema = new Schema<IContest>({
  status: {
    type: String,
    enum: ['NOT_STARTED', 'ACTIVE', 'COMPLETED'],
    default: 'NOT_STARTED'
  },
  contestStartTime: { type: Date, default: null },
  contestEndTime: { type: Date, default: null },
  round1Status: { type: String, enum: ['LOCKED', 'ACTIVE', 'COMPLETED'], default: 'LOCKED' },
  round2Status: { type: String, enum: ['LOCKED', 'ACTIVE', 'COMPLETED'], default: 'LOCKED' },
  round3Status: { type: String, enum: ['LOCKED', 'ACTIVE', 'COMPLETED'], default: 'LOCKED' }
}, {
  timestamps: true
});

export const Contest = mongoose.models.Contest || mongoose.model<IContest>('Contest', ContestSchema);
