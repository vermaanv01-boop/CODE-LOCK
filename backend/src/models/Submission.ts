import mongoose, { Schema, Document } from 'mongoose';
import { RoundNumber } from '@shared/types';

export interface ISubmission extends Document {
  teamId: mongoose.Types.ObjectId;
  round: RoundNumber;
  questionNumber?: number; // Optional, can be full round code
  answer: string;
  correct: boolean;
  submittedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>({
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  round: { type: Number, required: true, index: true },
  questionNumber: { type: Number },
  answer: { type: String, required: true },
  correct: { type: Boolean, required: true },
  submittedAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

export const Submission = mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
