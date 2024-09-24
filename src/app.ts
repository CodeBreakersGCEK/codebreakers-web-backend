import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Import routes
import userRouter from "./routes/user.routes";
import eventRouter from "./routes/event.routes";
import blogRouter from "./routes/blog.routes";
import projectRouter from "./routes/project.routes";
import likeRouter from "./routes/like.routes";
import commentRouter from "./routes/comment.routes";

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

// Use routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comments", commentRouter);

export { app };
