import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import projectController from "../controllers/project.controller";

const router = Router();

// Project routes
router.route("/get-project/:projectId").get(projectController.getProjectById);
router
  .route("/get-approved-projects")
  .get(projectController.getApprovedProjects);

// Project routes
router
  .route("/create-project")
  .post(verifyJWT, projectController.createProject);
router
  .route("/update-project/:projectId")
  .patch(verifyJWT, projectController.updateProject);
router
  .route("/delete-project/:projectId")
  .delete(verifyJWT, projectController.deleteProject);

// Admin routes
router
  .route("/review-project/:projectId")
  .patch(verifyJWT, projectController.reviewProject);
router
  .route("/get-all-projects")
  .get(verifyJWT, projectController.getAllProjects);

export default router;
