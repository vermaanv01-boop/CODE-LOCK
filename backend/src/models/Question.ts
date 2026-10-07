import mongoose, { Schema, Document } from 'mongoose';
import { RoundNumber } from '@shared/types';

export interface IQuestionContent {
  title: string;
  problemStatement: string;
  inputDescription?: string;
  outputDescription?: string;
  constraints?: string[];
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  starterCode?: string;
  language?: string;
}

export interface IQuestion extends Document {
  round: RoundNumber;
  questionNumber: number;
  type: 'CODING' | 'DEBUGGING' | 'LOGIC_EXTRACTION';
  content: IQuestionContent;
  expectedAnswer: string;
  active: boolean;
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  round: { type: Number, required: true, index: true },
  questionNumber: { type: Number, required: true, index: true },
  type: { type: String, enum: ['CODING', 'DEBUGGING', 'LOGIC_EXTRACTION'], required: true },
  content: {
    title: { type: String, required: true },
    problemStatement: { type: String, required: true },
    inputDescription: { type: String },
    outputDescription: { type: String },
    constraints: [{ type: String }],
    examples: [{
      input: { type: String },
      output: { type: String },
      explanation: { type: String }
    }],
    starterCode: { type: String },
    language: { type: String, default: 'cpp' }
  },
  expectedAnswer: { type: String, required: true },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

QuestionSchema.index({ round: 1, questionNumber: 1 }, { unique: true });

export const Question = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
