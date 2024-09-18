import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { IUser, User } from "../models/user.model";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose from "mongoose";

interface UserRequest extends Request {
  user?: IUser;
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
      const {
        registrationNumber,
        fullname,
        email,
        password,
        skills,
        socialMediaLinks,
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
}

export default new UserController();
