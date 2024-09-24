import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import commentController from "../controllers/comment.controller";

const router = Router();

//Protected Routes

// Event Comments
router.route("/event/create/:eventId").post(verifyJWT, commentController.craeteEventComments);
router.route("/event/delete/:commentId").delete(verifyJWT, commentController.deleteEventComments);

// Project Comments
router.route("/project/create/:projectId").post(verifyJWT, commentController.createProjectComments);
router.route("/project/delete/:commentId").delete(verifyJWT, commentController.deleteProjectComments);

// Blog Comments
router.route("/blog/create/:blogId").post(verifyJWT, commentController.createBlogComments);
router.route("/blog/delete/:commentId").delete(verifyJWT, commentController.deleteBlogComments);


//Admin Routes
router.route("/review-comment/:commentId").patch(verifyJWT, commentController.reviewComment);
router.route("/all-comments").get(verifyJWT, commentController.getAllComments);


export default router;