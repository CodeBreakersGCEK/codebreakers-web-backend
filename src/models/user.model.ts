import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export interface IUser extends Document {
  registrationNumber: string;
  fullname: string;
  email: string;
  password: string;
  avatar: string;
  skills: string[];
  role: "ADMIN" | "USER" | "ALUMNI";
  events: string[];
  batch: string;
  position: string;
  socialMediaLinks: ISocialMedia;
  refreshToken: string;
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

interface ISocialMedia {
  github: string;
  linkedin: string;
  twitter: string;
  facebook: string;
  instagram: string;
  portfolio: string;
  discord: string;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      unique: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      enum: ["ADMIN", "USER", "ALUMNI"],
      default: "USER",
    },
    events: {
      type: [String],
      default: [],
    },
    batch: {
      type: String,
    },
    position: {
      type: String,
    },
    socialMediaLinks: {
      type: {
        github: String,
        linkedin: String,
        twitter: String,
        facebook: String,
        instagram: String,
        portfolio: String,
        discord: String,
      },
      default: {
        github: "",
        linkedin: "",
        twitter: "",
        facebook: "",
        instagram: "",
        portfolio: "",
        discord: "",
      },
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    {
      _id: this._id,
      registrationNumber: this.registrationNumber,
      email: this.email,
      fullname: this.fullname,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY as string,
    }
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign(
    {
      _id: this._id,
      registrationNumber: this.registrationNumber,
      email: this.email,
      fullname: this.fullname,
      role: this.role,
    },
    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY as string,
    }
  );
};

export const User = mongoose.model<IUser>("User", userSchema);
