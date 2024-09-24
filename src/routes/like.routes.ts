import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import likeController from "../controllers/like.controller";

const router = Router();

//Protected Routes

// Event Like/Unlike
router.route("/like-event/:eventId").post(verifyJWT, likeController.likeEvent);
router.route("/unlike-event/:eventId").delete(verifyJWT, likeController.unlikeEvent);

// Blog Like/Unlike
router.route("/like-blog/:blogId").post(verifyJWT, likeController.likeBlog);
router.route("/unlike-blog/:blogId").delete(verifyJWT, likeController.unlikeBlog);

// Project Like/Unlike
router.route("/like-project/:projectId").post(verifyJWT, likeController.likeProject);
router.route("/unlike-project/:projectId").delete(verifyJWT, likeController.unlikeProject);

// Comment Like/Unlike
router.route("/like-comment/:commentId").post(verifyJWT, likeController.likeComment);
router.route("/unlike-comment/:commentId").delete(verifyJWT, likeController.unlikeComment);

export default router;
