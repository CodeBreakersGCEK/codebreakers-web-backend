import { Document, Schema, model } from "mongoose";

export interface IComment extends Document {
  content: string;
  event: Schema.Types.ObjectId;
  project: Schema.Types.ObjectId;
  blog: Schema.Types.ObjectId;
  author: Schema.Types.ObjectId;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy: Schema.Types.ObjectId;
}

const commentSchema: Schema<IComment> = new Schema({
  content: {
    type: String,
    required: true,
  },
  event: {
    type: Schema.Types.ObjectId,
    ref: "Event",
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: "Project",
  },
  blog: {
    type: Schema.Types.ObjectId,
    ref: "Blog",
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING",
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

export const Comment = model<IComment>("Comment", commentSchema);
