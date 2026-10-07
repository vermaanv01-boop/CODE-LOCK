import mongoose, { Schema, Document } from 'mongoose';
import { RoundNumber } from '@shared/types';

export interface IRoundCompletion extends Document {
  teamId: mongoose.Types.ObjectId;
  round: RoundNumber;
  completedAt: Date;
  elapsedTimeMs: number; // Official time from contestStartTime to completedAt
  createdAt: Date;
}

const RoundCompletionSchema = new Schema<IRoundCompletion>({
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  round: { type: Number, required: true, index: true },
  completedAt: { type: Date, required: true },
  elapsedTimeMs: { type: Number, required: true }
}, {
  timestamps: true
});

RoundCompletionSchema.index({ teamId: 1, round: 1 }, { unique: true });

export const RoundCompletion = mongoose.models.RoundCompletion || mongoose.model<IRoundCompletion>('RoundCompletion', RoundCompletionSchema);
