import { Router } from "express";
import { upload } from "../middlewares/multer.middleware";
import { verifyJWT } from "../middlewares/auth.middleware";
import eventController from "../controllers/event.controller";

const router = Router();

// Public Routes
router.route("/all-events").get(eventController.getAllEvents);
router.route("/event/:eventId").get(eventController.getEvent);

// Admin Routes
router
  .route("/create-event")
  .post(verifyJWT, upload.single("eventImage"), eventController.createEvent);
router
  .route("/update-event/:eventId")
  .patch(verifyJWT, eventController.updateEvent);
router
  .route("/delete-event/:eventId")
  .delete(verifyJWT, eventController.deleteEvent);

export default router;
