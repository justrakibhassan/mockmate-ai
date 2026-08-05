import mongoose, { Schema, Document } from "mongoose";

export interface IProcessedEvent extends Document {
  eventId: string;
  createdAt: Date;
}

const ProcessedEventSchema: Schema = new Schema({
  eventId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

const ProcessedEvent =
  mongoose.models.ProcessedEvent ||
  mongoose.model<IProcessedEvent>("ProcessedEvent", ProcessedEventSchema);

export default ProcessedEvent;
