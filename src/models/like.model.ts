import { Schema, Document, model } from "mongoose";

export interface ILike extends Document {
  event: Schema.Types.ObjectId;
  project: Schema.Types.ObjectId;
  blog: Schema.Types.ObjectId;
  comment: Schema.Types.ObjectId;
  author: Schema.Types.ObjectId;
}

const likeSchema: Schema<ILike> = new Schema({
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
  comment: {
    type: Schema.Types.ObjectId,
    ref: "Comment",
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

export const Like = model<ILike>("Like", likeSchema);
