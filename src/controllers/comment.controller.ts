import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Comment } from "../models/comment.model";
import { Event } from "../models/event.model";
import { ApiResponse } from "../utils/ApiResponse";

interface UserRequest extends Request {
  user?: any;
  isAdmin?: boolean;
}

class commentController {
  // Create/Delete Event Comments
  craeteEventComments = asyncHandler(
    async (req: UserRequest, res: Response) => {
      const { eventId } = req.params;
      if (!eventId) {
        throw new ApiError(400, "Event ID is required");
      }
      const event = await Event.findById(eventId);
      if (!event) {
        throw new ApiError(404, "Event not found");
      }
      const response = await Comment.create({
        ...req.body,
        author: req.user?._id,
        event: eventId,
      });

      if (!response) {
        throw new ApiError(500, "Failed to create comment");
      }

      res
        .status(201)
        .json(new ApiResponse(201, "Comment created successfully", response));
    }
  );
  deleteEventComments = asyncHandler(
    async (req: UserRequest, res: Response) => {
      const { commentId } = req.params;
      if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
      }
      const response = await Comment.findOneAndDelete({
        _id: commentId,
        author: req.user?._id,
      });

      if (!response) {
        throw new ApiError(500, "Failed to delete comment");
      }

      res
        .status(200)
        .json(new ApiResponse(200, "Comment deleted successfully", response));
    }
  );

  // Create/Delete Blog Comments
  createBlogComments = asyncHandler(async (req: UserRequest, res: Response) => {
    const { blogId } = req.params;
    if (!blogId) {
      throw new ApiError(400, "Blog ID is required");
    }
    const response = await Comment.create({
      ...req.body,
      blog: blogId,
      author: req.user?._id,
    });

    if (!response) {
      throw new ApiError(500, "Failed to create comment");
    }

    res
      .status(201)
      .json(new ApiResponse(201, "Comment created successfully", response));
  });
  deleteBlogComments = asyncHandler(async (req: UserRequest, res: Response) => {
    const { commentId } = req.params;
    if (!commentId) {
      throw new ApiError(400, "Comment ID is required");
    }
    const response = await Comment.findOneAndDelete({
      _id: commentId,
      author: req.user?._id,
    });

    if (!response) {
      throw new ApiError(500, "Failed to delete comment");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Comment deleted successfully", response));
  });

  // Create/Delete Project Comments
  createProjectComments = asyncHandler(
    async (req: UserRequest, res: Response) => {
      const { projectId } = req.params;
      if (!projectId) {
        throw new ApiError(400, "Project ID is required");
      }
      const response = await Comment.create({
        ...req.body,
        project: projectId,
        author: req.user?._id,
      });

      if (!response) {
        throw new ApiError(500, "Failed to create comment");
      }

      res
        .status(201)
        .json(new ApiResponse(201, "Comment created successfully", response));
    }
  );
  deleteProjectComments = asyncHandler(
    async (req: UserRequest, res: Response) => {
      const { commentId } = req.params;
      if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
      }
      const response = await Comment.findOneAndDelete({
        _id: commentId,
        author: req.user?._id,
      });

      if (!response) {
        throw new ApiError(500, "Failed to delete comment");
      }

      res
        .status(200)
        .json(new ApiResponse(200, "Comment deleted successfully", response));
    }
  );

  // Review Comments (Only Admins)
  reviewComment = asyncHandler(async (req: UserRequest, res: Response) => {
    if (!req.isAdmin) {
      throw new ApiError(403, "Unauthorized");
    }
    const { commentId } = req.params;
    if (!commentId) {
      throw new ApiError(400, "Comment ID is required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    if (comment.status !== "PENDING") {
      throw new ApiError(400, "Comment has already been reviewed");
    }

    if (!req.body.status) {
      throw new ApiError(400, "Status is required");
    }

    if (req.body.status !== "APPROVED" && req.body.status !== "REJECTED") {
      throw new ApiError(400, "Invalid status");
    }

    const response = await Comment.findByIdAndUpdate(
      commentId,
      {
        status: req.body.status,
        reviewedBy: req.user?._id,
      },
      { new: true }
    );

    if (!response) {
      throw new ApiError(500, "Failed to review comment");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Comment reviewed successfully", response));
  });

  // Get all Comments (Only Admins)
  getAllComments = asyncHandler(async (req: UserRequest, res: Response) => {
    if (!req.isAdmin) {
      throw new ApiError(403, "Unauthorized");
    }
    const comments = await Comment.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
          pipeline: [
            {
              $project: {
                fullname: 1,
                email: 1,
                username: 1,
                registrationNumber: 1,
                avatar: 1,
                role: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "event",
          pipeline: [
            {
              $project: {
                title: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "project",
          pipeline: [
            {
              $project: {
                title: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "blogs",
          localField: "blog",
          foreignField: "_id",
          as: "blog",
          pipeline: [
            {
              $project: {
                title: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reviewedBy",
          foreignField: "_id",
          as: "reviewedBy",
          pipeline: [
            {
              $project: {
                fullname: 1,
                email: 1,
                username: 1,
                registrationNumber: 1,
                avatar: 1,
                role: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          author: { $arrayElemAt: ["$author", 0] },
          event: { $arrayElemAt: ["$event", 0] },
          project: { $arrayElemAt: ["$project", 0] },
          blog: { $arrayElemAt: ["$blog", 0] },
          reviewedBy: { $arrayElemAt: ["$reviewedBy", 0] },
        }
      }
    ]);
    res.status(200).json(new ApiResponse(200, "All comments", comments));
  });
}

export default new commentController();
