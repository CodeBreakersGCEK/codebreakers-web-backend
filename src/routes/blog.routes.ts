import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import blogController from "../controllers/blog.controller";

const router = Router();

// Public routes
router.route("/get-approved-blogs").get(blogController.getApprovedBlogs);

// Protected routes
router.route("/create-blog").post(verifyJWT, blogController.createBlog);
router.route("/get-blog/:blogId").get(verifyJWT,blogController.getBlogById);
router
  .route("/update-blog/:blogId")
  .patch(verifyJWT, blogController.updateBlog);
router
  .route("/delete-blog/:blogId")
  .delete(verifyJWT, blogController.deleteBlog);

// Admin routes
router
  .route("/review-blog/:blogId")
  .patch(verifyJWT, blogController.reviewBlog);
router.route("/get-all-blogs").get(verifyJWT, blogController.getAllBlogs);

export default router;
