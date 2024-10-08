import mongoose from "mongoose";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response } from "express";
import { IUser, User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary";

interface UserRequest extends Request {
  user?: IUser;
  isAdmin?: boolean;
}

class UserController {
  //Generate access token and refresh token
  generateAccessTokenAndRefreshToken = async (
    userId: mongoose.Types.ObjectId
  ) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
    } catch (error: any) {
      throw new ApiError(
        500,
        error.message || "An error occurred while generating tokens"
      );
    }
  };

  // Register a new user
  registerUser = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { fullname, username, email, password, skills, socialMediaLinks } =
        req.body;

      if (!username || !fullname || !email || !password) {
        throw new ApiError(400, "Please provide all required fields");
      }

      // Check for existing user
      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (existingUser) {
        throw new ApiError(400, "User already exists");
      }

      if (skills) {
        req.body.skills = skills
          .split(",")
          .map((skill: string) => skill.trim());
      }

      // Upload profile picture to cloudinary
      let profilePictureUrl = "";
      if (req.file) {
        const uploadResults = await uploadOnCloudinary(req.file.path);
        if (!uploadResults) {
          throw new ApiError(500, "Error uploading profile picture");
        }
        profilePictureUrl = uploadResults.secure_url;
      }

      const user = await User.create({
        ...req.body,
        username: username.toLowerCase().trim(),
        socialMediaLinks: JSON.parse(socialMediaLinks),
        avatar: profilePictureUrl,
      });

      const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
      );

      if (!createdUser) {
        throw new ApiError(500, "Error registering user");
      }

      res
        .status(201)
        .json(new ApiResponse(201, "User registered", createdUser));
    } catch (error: any) {
      throw new ApiError(
        500,
        error.message || "An error occurred while registering user"
      );
    }
  });

  // Login a user
  loginUser = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new ApiError(400, "Please provide email and password");
      }

      const user = await User.findOne({ email });
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      const isPasswordValid = await user.isPasswordCorrect(password);
      if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
      }

      const { accessToken, refreshToken } =
        await this.generateAccessTokenAndRefreshToken(
          user._id as mongoose.Types.ObjectId
        );

      const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
      );

      const options = {
        httpOnly: true,
        secure: true,
      };

      res
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .status(200)
        .json(
          new ApiResponse(200, "User logged in", {
            user: loggedInUser,
            accessToken,
            refreshToken,
          })
        );
    } catch (error: any) {
      throw new ApiError(
        500,
        error.message || "An error occurred while logging in user"
      );
    }
  });

  // Logout a user
  logoutUser = asyncHandler(async (req: UserRequest, res: Response) => {
    try {
      const user = await User.findById(req.user?._id);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      user.refreshToken = "";
      await user.save({ validateBeforeSave: false });

      const options = {
        httpOnly: true,
        secure: true,
      };

      res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User logged out", {}));
    } catch (error: any) {
      throw new ApiError(
        500,
        error.message || "An error occurred while logging out user"
      );
    }
  });

  // Refresh access token
  refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    try {
      const incomingRefreshToken = req.cookies.refreshToken;
      if (!incomingRefreshToken) {
        throw new ApiError(400, "Please provide a refresh token");
      }

      if (!process.env.REFRESH_TOKEN_SECRET) {
        throw new ApiError(500, "Internal Server Error: Missing token secret");
      }
      const decoded = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      const user = await User.findById((decoded as JwtPayload)._id);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      if (user?.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Invalid refresh token");
      }

      const { accessToken, refreshToken } =
        await this.generateAccessTokenAndRefreshToken(
          user._id as mongoose.Types.ObjectId
        );

      const options = {
        httpOnly: true,
        secure: true,
      };

      res
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .status(200)
        .json(
          new ApiResponse(200, "Access token refreshed", {
            accessToken,
            refreshToken,
          })
        );
    } catch (error: any) {
      throw new ApiError(
        500,
        error.message || "An error occurred while refreshing access token"
      );
    }
  });

  // Change user password
  changeUserPassword = asyncHandler(async (req: UserRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Please provide current and new password");
      }

      const user = await User.findById(req.user?._id);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      const isPasswordValid = await user.isPasswordCorrect(currentPassword);
      if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
      }

      user.password = newPassword;
      await user.save({ validateBeforeSave: false });

      res.status(200).json(new ApiResponse(200, "Password changed", {}));
    } catch (error: any) {
      throw new ApiError(
        500,
        error.message || "An error occurred while changing password"
      );
    }
  });

  // Update user profile
  updateUserProfile = asyncHandler(async (req: UserRequest, res: Response) => {
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (req.body.skills) {
      req.body.skills = req.body.skills
        .split(",")
        .map((skill: string) => skill.trim());
    }

    if (req.body.socialMediaLinks) {
      req.body.socialMediaLinks = JSON.parse(req.body.socialMediaLinks);
    }
    let profilePictureUrl: string = "";
    if (req.file) {
      const existingAvatarPublicId = req.user?.avatar.substring(
        req.user?.avatar.lastIndexOf("/") + 1,
        req.user?.avatar.lastIndexOf(".")
      );
      if (existingAvatarPublicId) {
        await deleteFromCloudinary(existingAvatarPublicId, "image");
      }
      const newAvatar = await uploadOnCloudinary(req.file.path);
      if (!newAvatar) {
        throw new ApiError(500, "Error uploading profile picture");
      }
      profilePictureUrl = newAvatar.secure_url || "";
    }

    const updated = await User.findByIdAndUpdate(
      req.user?._id,
      { ...req.body, avatar: profilePictureUrl || user.avatar },
      { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!updated) {
      throw new ApiError(500, "Error updating user profile");
    }

    res.status(200).json(new ApiResponse(200, "Profile updated", updated));
  });

  // Get all users (Admin only)
  getAllUsers = asyncHandler(async (req: UserRequest, res: Response) => {
    if (!req.isAdmin) {
      throw new ApiError(403, "Unauthorized to get all users");
    }
    const users = await User.find({}).select("-password -refreshToken");

    res.status(200).json(new ApiResponse(200, "All users", users));
  });

  // Delete user by username (Admin only)
  deleteUser = asyncHandler(async (req: UserRequest, res: Response) => {
    const { username } = req.params;
    if (!req.isAdmin) {
      throw new ApiError(403, "Unauthorized to delete user");
    }
    if (!username) {
      throw new ApiError(400, "Please provide a username");
    }
    const user = await User.findOneAndDelete({ username });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    res.status(200).json(new ApiResponse(200, "User deleted", {}));
  });

  // Change user role (Admin only)
  changeUserRole = asyncHandler(async (req: UserRequest, res: Response) => {
    const { role } = req.body;
    const { username } = req.params;
    if (!req.isAdmin) {
      throw new ApiError(403, "Unauthorized to change user role");
    }
    if (!username || !role) {
      throw new ApiError(400, "Please provide a username and role");
    }
    const user = await User.findOneAndUpdate(
      { username },
      { role, ...req.body },
      { new: true }
    ).select("-password -refreshToken");
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    res.status(200).json(new ApiResponse(200, "User role changed", user));
  });

  // Get userProfile by ID
  getUserProfile = asyncHandler(async (req: UserRequest, res: Response) => {
    const { username } = req.params;
    if (!username) {
      throw new ApiError(400, "Please provide a username");
    }
    const user = await User.aggregate([
      {
        $match: { username },
      },
      // Pipeline for blogs
      {
        $lookup: {
          from: "blogs",
          localField: "_id",
          foreignField: "author",
          as: "posts",
          pipeline: [
            {
              $match: {
                status: "APPROVED",
              },
            },
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "blog",
                as: "Bloglikes",
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
                      avatar: 1,
                      email: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                totalLikes: { $size: "$Bloglikes" },
                isLiked: {
                  $cond: {
                    if: { $in: [req.user?._id, "$Bloglikes.author"] },
                    then: true,
                    else: false,
                  },
                },
                reviewBy: { $arrayElemAt: ["$reviewBy", 0] },
              },
            },
            {
              $project: {
                title: 1,
                content: 1,
                publishedAt: 1,
                tags: 1,
                totalLikes: 1,
                isLiked: 1,
                reviewBy: 1,
              },
            },
          ],
        },
      },
      // Pipeline for Events
      {
        $lookup: {
          from: "events",
          localField: "events",
          foreignField: "_id",
          as: "events",
          pipeline: [
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "event",
                as: "Eventlikes",
              },
            },
            {
              $addFields: {
                totalLikes: { $size: "$Eventlikes" },
                isLiked: {
                  $cond: {
                    if: { $in: [req.user?._id, "$Eventlikes.author"] },
                    then: true,
                    else: false,
                  },
                },
                reviewBy: { $arrayElemAt: ["$reviewBy", 0] },
              },
            },
            {
              $project: {
                title: 1,
                description: 1,
                date: 1,
                eventImage: 1,
                venue: 1,
                eventType: 1,
                tags: 1,
                winner: 1,
                totalLikes: 1,
                isLiked: 1,
              },
            },
          ],
        },
      },
      // Pipeline for Projects
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "author",
          as: "projects",
          pipeline: [
            {
              $match: {
                status: "APPROVED",
              },
            },
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "project",
                as: "Projectlikes",
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
                totalLikes: { $size: "$Projectlikes" },
                isLiked: {
                  $cond: {
                    if: { $in: [req.user?._id, "$Projectlikes.author"] },
                    then: true,
                    else: false,
                  },
                },
                reviewBy: { $arrayElemAt: ["$reviewBy", 0] },
              },
            },
            {
              $project: {
                title: 1,
                description: 1,
                sourceCodeLink: 1,
                deployedLink: 1,
                tags: 1,
                techStack: 1,
                totalLikes: 1,
                isLiked: 1,
                reviewBy: 1,
              },
            },
          ],
        },
      },
      // Projecting pipeline
      {
        $project: {
          password: 0,
          refreshToken: 0,
        },
      },
    ]);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    res.status(200).json(new ApiResponse(200, "User profile", user[0]));
  });
}

export default new UserController();
