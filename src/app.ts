import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import e from "express";
import { asyncHandler } from "./utils/asyncHandler";
import { ApiResponse } from "./utils/ApiResponse";
import { ApiError } from "./utils/ApiError";

const app = express();

// Use middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

export { app };
