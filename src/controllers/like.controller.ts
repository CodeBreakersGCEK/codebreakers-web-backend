import { Request, Response } from "express";
import { Like } from "../models/like.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { IUser } from "../models/user.model";
import { ApiResponse } from "../utils/ApiResponse";

interface UserRequest extends Request {
  user?: IUser;
  isAdmin?: boolean;
}

class LikeController {
  // Event Like/Unlike
  likeEvent = asyncHandler(async (req: UserRequest, res: Response) => {
    const { eventId } = req.params;
    if (!eventId) {
      throw new ApiError(400, "Event ID is required");
    }
    const response = await Like.create({
      author: req.user?._id,
      event: eventId,
    });

    if (!response) {
      throw new ApiError(500, "Failed to like event");
    }

    res
      .status(201)
      .json(new ApiResponse(201, "Event liked successfully", response));
  });
  unlikeEvent = asyncHandler(async (req: UserRequest, res: Response) => {
    const { eventId } = req.params;
    if (!eventId) {
      throw new ApiError(400, "Event ID is required");
    }
    const response = await Like.findOneAndDelete({
      author: req.user?._id,
      event: eventId,
    });

    if (!response) {
      throw new ApiError(500, "Failed to unlike event");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Event unliked successfully", response));
  });

  // Blog Like/Unlike
  likeBlog = asyncHandler(async (req: UserRequest, res: Response) => {
    const { blogId } = req.params;
    if (!blogId) {
      throw new ApiError(400, "Blog ID is required");
    }
    const response = await Like.create({
      author: req.user?._id,
      blog: blogId,
    });

    if (!response) {
      throw new ApiError(500, "Failed to like blog");
    }

    res
      .status(201)
      .json(new ApiResponse(201, "Blog liked successfully", response));
  });
  unlikeBlog = asyncHandler(async (req: UserRequest, res: Response) => {
    const { blogId } = req.params;
    if (!blogId) {
      throw new ApiError(400, "Blog ID is required");
    }
    const response = await Like.findOneAndDelete({
      author: req.user?._id,
      blog: blogId,
    });

    if (!response) {
      throw new ApiError(500, "Failed to unlike blog");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Blog unliked successfully", response));
  });

  // Project Like/Unlike
  likeProject = asyncHandler(async (req: UserRequest, res: Response) => {
    const { projectId } = req.params;
    if (!projectId) {
      throw new ApiError(400, "Project ID is required");
    }
    const response = await Like.create({
      author: req.user?._id,
      project: projectId,
    });

    if (!response) {
      throw new ApiError(500, "Failed to like project");
    }

    res
      .status(201)
      .json(new ApiResponse(201, "Project liked successfully", response));
  });
  unlikeProject = asyncHandler(async (req: UserRequest, res: Response) => {
    const { projectId } = req.params;
    if (!projectId) {
      throw new ApiError(400, "Project ID is required");
    }
    const response = await Like.findOneAndDelete({
      author: req.user?._id,
      project: projectId,
    });

    if (!response) {
      throw new ApiError(500, "Failed to unlike project");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Project unliked successfully", response));
  });

  // Comment Like/Unlike
  likeComment = asyncHandler(async (req: UserRequest, res: Response) => {
    const { commentId } = req.params;
    if (!commentId) {
      throw new ApiError(400, "Comment ID is required");
    }
    const response = await Like.create({
      author: req.user?.id,
      comment: commentId,
    });

    if (!response) {
      throw new ApiError(500, "Failed to like comment");
    }

    res
      .status(201)
      .json(new ApiResponse(201, "Comment liked successfully", response));
  });
  unlikeComment = asyncHandler(async (req: UserRequest, res: Response) => {
    const { commentId } = req.params;
    if (!commentId) {
      throw new ApiError(400, "Comment ID is required");
    }
    const response = await Like.findOneAndDelete({
      author: req.user?.id,
      comment: commentId,
    });

    if (!response) {
      throw new ApiError(500, "Failed to unlike comment");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Comment unliked successfully", response));
  });
}

export default new LikeController();
