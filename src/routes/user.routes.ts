import { Router } from "express";
import UserController from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router
  .route("/register")
  .post(upload.single("avatar"), UserController.registerUser);
router.route("/login").post(UserController.loginUser);
router.route("/logout").get(verifyJWT, UserController.logoutUser);

export default router;
