import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";

class UserController {
  // Register a new user
  registerUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {
          registrationNumber,
          fullname,
          email,
          password,
          bio,
          skills,
          role,
          socialLinks,
        } = req.body;

        if (!registrationNumber || !fullname || !email || !password) {
          throw new ApiError(400, "Please provide all required fields");
        }

        // Check for existing user
        const existingUser = await User.findOne({
          $or: [{ registrationNumber }, { email }],
        });

        if (existingUser) {
          throw new ApiError(400, "User already exists");
        }

        if (skills) {
          req.body.skills = skills.split(",");
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
          socialLinks: JSON.parse(socialLinks),
          profilePicture: profilePictureUrl,
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
    }
  );
}

export default new UserController();
