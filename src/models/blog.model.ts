import { Document, Schema, model } from "mongoose";

export interface IBlog extends Document {
  title: string;
  content: string;
  author: Schema.Types.ObjectId;
  tags: [string];
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewBy: Schema.Types.ObjectId;
}

const blogSchema: Schema<IBlog> = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: {
      type: [String],
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
  },
  { timestamps: true }
);

export const Blog = model<IBlog>("Blog", blogSchema);
