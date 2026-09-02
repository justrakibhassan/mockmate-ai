import mongoose, { Schema, Document } from "mongoose";

export interface IInterview extends Document {
  clerkId: string;
  jobPosition: string;
  jobDesc: string;
  jobExperience: string;
  questions: string[];
  idealAnswers?: string[];
  answers?: {
    question: string;
    answer: string;
    feedback?: string;
    rating?: number;
    idealAnswer?: string;
  }[];
  status: "pending" | "completed";
  overallRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema: Schema = new Schema(
  {
    clerkId: { type: String, required: true },
    jobPosition: { type: String, required: true },
    jobDesc: { type: String, required: true },
    jobExperience: { type: String, required: true },
    questions: { type: [String], default: [] },
    idealAnswers: { type: [String], default: [] },
    answers: [
      {
        question: { type: String },
        answer: { type: String },
        feedback: { type: String },
        rating: { type: Number },
        idealAnswer: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    overallRating: { type: Number },
  },
  { timestamps: true }
);

InterviewSchema.index({ clerkId: 1, createdAt: -1 });

const Interview =
  mongoose.models.Interview ||
  mongoose.model<IInterview>("Interview", InterviewSchema);

export default Interview;
