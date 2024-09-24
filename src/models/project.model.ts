import { Document, Schema, model } from "mongoose";

export interface IProject extends Document {
  title: string;
  description: string;
  author: Schema.Types.ObjectId;
  sourceCodeLink: string;
  deployedLink: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewBy: Schema.Types.ObjectId;
  tags: [string];
  techStack: [string];
}

const projectSchema: Schema<IProject> = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sourceCodeLink: {
      type: String,
      required: true,
    },
    deployedLink: {
      type: String,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    reviewBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    tags: {
      type: [String],
    },
    techStack: {
      type: [String],
    },
  },
  {
    timestamps: {
      createdAt: "publishedAt",
    },
  }
);

export const Project = model<IProject>("Project", projectSchema);
