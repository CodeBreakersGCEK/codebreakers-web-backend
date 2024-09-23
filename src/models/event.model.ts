import { Document, Schema, model } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  eventImage: string;
  date: Date;
  duration: number;
  venue: string;
  participants: Schema.Types.ObjectId[];
  eventType: "QUIZ" | "DSA" | "HACKATHON" | "TECHFEST" | "OTHERS";
  createdBy: Schema.Types.ObjectId;
  tags: [string];
  winner: Schema.Types.ObjectId;
}

const eventSchema: Schema<IEvent> = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    eventImage: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    eventType: {
      type: String,
      enum: ["QUIZ", "DSA", "HACKATHON", "TECHFEST", "OTHERS"],
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: {
      type: [String],
    },
    winner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Event = model<IEvent>("Event", eventSchema);
