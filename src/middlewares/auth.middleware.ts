import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import jwt from "jsonwebtoken";
import { IUser, User } from "../models/user.model";

interface UserRequest extends Request {
  user?: IUser;
  isAdmin?: boolean;
}

const verifyJWT = asyncHandler(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
        throw new ApiError(401, "Unauthorized");
      }
      if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new ApiError(500, "Internal Server Error: Missing token secret");
      }
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      const user = await User.findById(
        (decodedToken as jwt.JwtPayload)._id
      ).select("-password -refreshToken");

      if (!user) {
        throw new ApiError(404, "User not found");
      }
      req.user = user;
      if (user.role == "ADMIN"){
        req.isAdmin = true;
      }
      next();
    } catch (error: any) {
      throw new ApiError(401, error.message || "Unauthorized");
    }
  }
);

export { verifyJWT };
