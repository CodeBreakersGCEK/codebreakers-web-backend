import { Request, Response } from "express";
import { IUser } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Project } from "../models/project.model";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose from "mongoose";

interface UserRequest extends Request {
  user?: IUser;
  isAdmin?: boolean;
}

class projectController {
  // 1. Create a new project
  createProject = asyncHandler(async (req: UserRequest, res: Response) => {
    const { title, description, sourceCodeLink, tags, techStack } = req.body;

    if (!title || !description || !sourceCodeLink) {
      throw new ApiError(
        400,
        "Please provide title, description and source code link"
      );
    }

    const project = await Project.create({
      ...req.body,
      author: req.user?._id,
      tags: tags.split(",").map((tag: string) => tag.trim()),
      techStack: techStack.split(",").map((tech: string) => tech.trim()),
    });

    if (!project) {
      throw new ApiError(500, "Project not created");
    }

    res.status(201).json(new ApiResponse(201, "Project created", project));
  });

  // 2. Update a project
  updateProject = asyncHandler(async (req: UserRequest, res: Response) => {
    const { projectId } = req.params;

    if (!projectId) {
      throw new ApiError(400, "Please provide project id");
    }

    const project = await Project.findById(projectId);

    if (
      project?.author.toString() !==
      (req.user?._id as mongoose.Types.ObjectId).toString()
    ) {
      throw new ApiError(403, "You are not authorized to update this project");
    }

    if (req.body.tags) {
      req.body.tags = req.body.tags.split(",").map((tag: string) => tag.trim());
    }

    if (req.body.techStack) {
      req.body.techStack = req.body.techStack
        .split(",")
        .map((tech: string) => tech.trim());
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      req.body,
      { new: true }
    );

    if (!updatedProject) {
      throw new ApiError(500, "Project not updated");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Project updated", updatedProject));
  });

  // 3. Delete a project
  deleteProject = asyncHandler(async (req: UserRequest, res: Response) => {
    const { projectId } = req.params;

    if (!projectId) {
      throw new ApiError(400, "Please provide project id");
    }

    const project = await Project.findById(projectId);

    if (
      project?.author.toString() !==
        (req.user?._id as mongoose.Types.ObjectId).toString() &&
      !req.isAdmin
    ) {
      throw new ApiError(403, "You are not authorized to delete this project");
    }

    await Project.findByIdAndDelete(projectId);

    res.status(200).json(new ApiResponse(200, "Project deleted", {}));
  });

  // 4. Review a project (only for admin)
  reviewProject = asyncHandler(async (req: UserRequest, res: Response) => {
    if (!req.isAdmin) {
      throw new ApiError(403, "You are not authorized to review projects");
    }
    const { projectId } = req.params;

    if (!projectId) {
      throw new ApiError(400, "Please provide project id");
    }

    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    if (project.status !== "PENDING") {
      throw new ApiError(400, "Project is already reviewed");
    }

    if (req.body.status !== "APPROVED" && req.body.status !== "REJECTED") {
      throw new ApiError(400, "Please provide a valid status");
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      {
        status: req.body.status,
        reviewBy: req.user?._id,
      },
      { new: true }
    );

    if (!updatedProject) {
      throw new ApiError(500, "Project not reviewed");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Project reviewed", updatedProject));
  });

  // 5. Get all projects (only for admin)
  getAllProjects = asyncHandler(async (req: UserRequest, res: Response) => {
    if (!req.isAdmin) {
      throw new ApiError(403, "You are not authorized to view projects");
    }

    const projects = await Project.aggregate([
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
          description: 1,
          sourceCodeLink: 1,
          deployedLink: 1,
          status: 1,
          reviewBy: 1,
          tags: 1,
          techStack: 1,
          author: 1,
          publishedAt: 1,
        },
      },
    ]);

    if (!projects) {
      throw new ApiError(404, "No projects found");
    }

    res.status(200).json(new ApiResponse(200, "All projects", projects));
  });

  // 6. Get a project by id
  getProjectById = asyncHandler(async (req: UserRequest, res: Response) => {
    const { projectId } = req.params;

    if (!projectId) {
      throw new ApiError(400, "Please provide project id");
    }

    const project = await Project.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(projectId),
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
          description: 1,
          sourceCodeLink: 1,
          deployedLink: 1,
          status: 1,
          reviewBy: 1,
          tags: 1,
          techStack: 1,
          author: 1,
          publishedAt: 1,
        },
      },
    ]);

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    res.status(200).json(new ApiResponse(200, "Project", project[0]));
  });

  // 7. Get all approved projects
  getApprovedProjects = asyncHandler(async (req: UserRequest, res: Response) => {
      const projects = await Project.aggregate([
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
            description: 1,
            sourceCodeLink: 1,
            deployedLink: 1,
            status: 1,
            reviewBy: 1,
            tags: 1,
            techStack: 1,
            author: 1,
            publishedAt: 1,
          },
        },
      ]);

      if (!projects) {
        throw new ApiError(404, "No projects found");
      }

      res.status(200).json(new ApiResponse(200, "Approved projects", projects));
    }
  );
}

export default new projectController();
