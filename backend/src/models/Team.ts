import mongoose, { Schema, Document } from 'mongoose';
import { TeamStatus, RoundNumber } from '@shared/types';

export interface ITeam extends Document {
  teamNumber: string;
  teamName: string;
  teamLeader: string;
  thinker: string;
  coder: string;
  debugger: string;
  supporter: string;
  currentRound: RoundNumber;
  status: TeamStatus;
  accessPin?: string;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>({
  teamNumber: { type: String, required: true, unique: true, index: true },
  teamName: { type: String, required: true, index: true },
  teamLeader: { type: String, required: true },
  thinker: { type: String, required: true },
  coder: { type: String, required: true },
  debugger: { type: String, required: true },
  supporter: { type: String, required: true },
  currentRound: { type: Number, default: 1, min: 1, max: 3 },
  status: { 
    type: String, 
    enum: ['REGISTERED', 'IN_ROUND_1', 'ROUND_1_COMPLETE', 'IN_ROUND_2', 'ROUND_2_COMPLETE', 'IN_ROUND_3', 'FINISHED', 'DISQUALIFIED'], 
    default: 'REGISTERED' 
  },
  accessPin: { type: String, default: '' },
  registeredAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const Team = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
