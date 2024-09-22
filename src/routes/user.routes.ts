import { Router } from "express";
import UserController from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// Public routes
router
  .route("/register")
  .post(upload.single("avatar"), UserController.registerUser);
router.route("/login").post(UserController.loginUser);

// Protected routes
router.route("/logout").get(verifyJWT, UserController.logoutUser);
router
  .route("/change-password")
  .patch(verifyJWT, UserController.changeUserPassword);
router.route("/refresh-token").get(UserController.refreshAccessToken);
router.route("/me").get(verifyJWT, UserController.getCurrentUser);
router
  .route("/update")
  .patch(verifyJWT, upload.single("avatar"), UserController.updateUserProfile);
router.route("/:username").get(verifyJWT, UserController.getUserProfile);

// Admin routes
router.route("/all-users").get(verifyJWT, UserController.getAllUsers);
router.route("/delete/:username").delete(verifyJWT, UserController.deleteUser);
router
  .route("/promote/:username")
  .patch(verifyJWT, UserController.changeUserRole);

export default router;
