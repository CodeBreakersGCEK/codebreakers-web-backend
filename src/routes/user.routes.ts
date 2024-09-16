import { Router } from "express";
import UserController from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router
  .route("/register")
  .post(upload.single("avatar"), UserController.registerUser);

export default router;
