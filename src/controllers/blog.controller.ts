import { Request, Response } from "express";
import { Blog } from "../models/blog.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { IUser } from "../models/user.model";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose from "mongoose";

interface UserRequest extends Request {
  user?: IUser;
  isAdmin?: boolean;
}

class blogController {
  //1. Create a new blog
  createBlog = asyncHandler(async (req: UserRequest, res: Response) => {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      throw new ApiError(400, "Title, content, and author are required");
    }

    if (tags) {
      req.body.tags = tags.split(",");
    }

    const blog = await Blog.create({
      ...req.body,
      author: req.user?._id,
    });

    if (!blog) {
      throw new ApiError(500, "Failed to create blog");
    }

    res.status(201).json(new ApiResponse(201, "Blog created", blog));
  });

  //2. Update a blog
  updateBlog = asyncHandler(async (req: UserRequest, res: Response) => {
    const { blogId } = req.params;

    if (!blogId) {
      throw new ApiError(400, "Blog ID is required");
    }

    const blog = await Blog.findById(blogId);

    if (!blog) {
      throw new ApiError(404, "Blog not found");
    }

    if (
      blog.author.toString() !==
      ((req.user?._id as mongoose.Types.ObjectId).toString() as string)
    ) {
      throw new ApiError(403, "You are not authorized to update this blog");
    }

    const { tags } = req.body;

    if (tags) {
      req.body.tags = tags.split(",").map((tag: string) => tag.trim());
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      { ...req.body },
      { new: true }
    );

    if (!updatedBlog) {
      throw new ApiError(500, "Failed to update blog");
    }

    res.status(200).json(new ApiResponse(200, "Blog updated", updatedBlog));
  });

  //3. Delete a blog
  deleteBlog = asyncHandler(async (req: UserRequest, res: Response) => {
    const { blogId } = req.params;

    if (!blogId) {
      throw new ApiError(400, "Blog ID is required");
    }

    const blog = await Blog.findById(blogId);

    if (!blog) {
      throw new ApiError(404, "Blog not found");
    }

    if (
      blog.author.toString() !==
        ((req.user?._id as mongoose.Types.ObjectId).toString() as string) &&
      !req.isAdmin
    ) {
      throw new ApiError(403, "You are not authorized to delete this blog");
    }

    await Blog.findByIdAndDelete(blogId);

    res.status(200).json(new ApiResponse(200, "Blog deleted", {}));
  });

  //4. Review a blog (only for admin)
  reviewBlog = asyncHandler(async (req: UserRequest, res: Response) => {
    if (!req.isAdmin) {
      throw new ApiError(403, "You are not authorized to review blogs");
    }
    const { blogId } = req.params;
    const { status } = req.body;
    if (!blogId || !status) {
      throw new ApiError(400, "Blog ID and status are required");
    }
    const blog = await Blog.findById(blogId);
    if (!blog) {
      throw new ApiError(404, "Blog not found");
    }
    if (status !== "APPROVED" && status !== "REJECTED") {
      throw new ApiError(400, "Invalid status");
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      { status, reviewBy: req.user?._id },
      { new: true }
    );

    if (!updatedBlog) {
      throw new ApiError(500, "Failed to review blog");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Blog reviewed succssfully", updatedBlog));
  });

  //5. Get all blogs (only for admin)
  getAllBlogs = asyncHandler(async (req: UserRequest, res: Response) => {
    if (!req.isAdmin) {
      throw new ApiError(403, "You are not authorized to view all blogs");
    }

    const blogs = await Blog.aggregate([
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
                username: 1,
                registrationNumber: 1,
                avatar: 1,
                email: 1,
                role: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reviewBy",
          foreignField: "_id",
          as: "reviewBy",
          pipeline: [
            {
              $project: {
                fullname: 1,
                username: 1,
                registrationNumber: 1,
                avatar: 1,
                email: 1,
                role: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          author: { $arrayElemAt: ["$author", 0] },
          reviewBy: { $arrayElemAt: ["$reviewBy", 0] },
        },
      },
      {
        $project: {
          title: 1,
          content: 1,
          tags: 1,
          status: 1,
          author: 1,
          reviewBy: 1,
          publishedAt: 1,
        },
      },
    ]);

    if (!blogs) {
      throw new ApiError(404, "No blogs found");
    }

    res.status(200).json(new ApiResponse(200, "All blogs", blogs));
  });

  //7. Get a blog by id
  getBlogById = asyncHandler(async (req: UserRequest, res: Response) => {
    const { blogId } = req.params;

    if (!blogId) {
      throw new ApiError(400, "Blog ID is required");
    }

    const blog = await Blog.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(blogId),
        },
      },
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
                username: 1,
                registrationNumber: 1,
                avatar: 1,
                email: 1,
                role: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reviewBy",
          foreignField: "_id",
          as: "reviewBy",
          pipeline: [
            {
              $project: {
                fullname: 1,
                username: 1,
                registrationNumber: 1,
                avatar: 1,
                email: 1,
                role: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          author: { $arrayElemAt: ["$author", 0] },
          reviewBy: { $arrayElemAt: ["$reviewBy", 0] },
        },
      },

      {
        $project: {
          title: 1,
          content: 1,
          tags: 1,
          status: 1,
          author: 1,
          reviewBy: 1,
          publishedAt: 1,
        },
      },
    ]);

    if (!blog) {
      throw new ApiError(404, "Blog not found");
    }

    res.status(200).json(new ApiResponse(200, "Blog found", blog[0]));
  });

  //8. Get all approved blogs
  getApprovedBlogs = asyncHandler(async (req: UserRequest, res: Response) => {
    const blogs = await Blog.aggregate([
      {
        $match: {
          status: "APPROVED",
        },
      },
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
                username: 1,
                registrationNumber: 1,
                avatar: 1,
                email: 1,
                role: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reviewBy",
          foreignField: "_id",
          as: "reviewBy",
          pipeline: [
            {
              $project: {
                fullname: 1,
                username: 1,
                registrationNumber: 1,
                avatar: 1,
                email: 1,
                role: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          author: { $arrayElemAt: ["$author", 0] },
          reviewBy: { $arrayElemAt: ["$reviewBy", 0] },
        },
      },
      {
        $project: {
          title: 1,
          content: 1,
          tags: 1,
          status: 1,
          author: 1,
          reviewBy: 1,
          publishedAt: 1,
        },
      },
    ]);

    if (!blogs) {
      throw new ApiError(404, "No blogs found");
    }

    res.status(200).json(new ApiResponse(200, "Approved blogs", blogs));
  });
}

export default new blogController();
