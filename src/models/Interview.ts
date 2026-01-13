import mongoose, { Schema, Document } from "mongoose";

export interface IInterview extends Document {
  clerkId: string;
  jobPosition: string;
  jobDesc: string;
  jobExperience: string;
  questions: string[];
  answers?: {
    question: string;
    answer: string;
    feedback?: string;
    rating?: number;
  }[];
  status: "pending" | "completed";
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
    answers: [
      {
        question: { type: String },
        answer: { type: String },
        feedback: { type: String },
        rating: { type: Number },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Interview =
  mongoose.models.Interview ||
  mongoose.model<IInterview>("Interview", InterviewSchema);

export default Interview;
