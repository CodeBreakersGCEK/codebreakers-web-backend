import { Request, Response } from "express";
import { Event } from "../models/event.model";
import { IUser } from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose from "mongoose";

interface UserRequest extends Request {
  user?: IUser;
  isAdmin?: boolean;
}

class eventController {
  // 1. Create a new event (only for admin)
  createEvent = asyncHandler(async (req: UserRequest, res: Response) => {
    if (!req?.isAdmin) {
      throw new ApiError(403, "You are not authorized to perform this action");
    }
    const { title, description, date, tags } = req.body;

    if (!title || !description || !date) {
      throw new ApiError(400, "Please provide all the required fields");
    }
    let imageUrl: string = "";
    if (req.file) {
      const eventImage = await uploadOnCloudinary(req.file?.path);
      imageUrl = eventImage?.secure_url || "";
    }
    if (!imageUrl) {
      throw new ApiError(500, "Failed to upload image");
    }
    const event = await Event.create({
      ...req.body,
      eventImage: imageUrl,
      date: new Date(date),
      tags: tags?.split(","),
      createdBy: req.user?._id,
    });
    if (!event) {
      throw new ApiError(500, "Failed to create event");
    }
    res
      .status(201)
      .json(new ApiResponse(201, "Event created successfully", event));
  });

  // 2. Update an event (only for admin)
  updateEvent = asyncHandler(async (req: UserRequest, res: Response) => {
    if (!req?.isAdmin) {
      throw new ApiError(403, "You are not authorized to perform this action");
    }
    const { eventId } = req.params;
    if (!eventId) {
      throw new ApiError(400, "Please provide event id");
    }
    const { date, tags } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) {
      throw new ApiError(404, "Event not found");
    }
    let imageUrl: string = "";
    if (req.file) {
      const existingAvatarPublicId = event.eventImage.substring(
        event.eventImage.lastIndexOf("/") + 1,
        event.eventImage.lastIndexOf(".")
      );
      if (existingAvatarPublicId) {
        await deleteFromCloudinary(existingAvatarPublicId, "image");
      }
      const newEventImage = await uploadOnCloudinary(req.file.path);
      if (!newEventImage) {
        throw new ApiError(500, "Error uploading Event picture");
      }
      imageUrl = newEventImage?.secure_url || "";
    }

    if (!imageUrl) {
      throw new ApiError(500, "Failed to upload image");
    }
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        eventImage: imageUrl,
        date: new Date(date),
        tags: tags?.split(","),
      },
      { new: true }
    );
    if (!updatedEvent) {
      throw new ApiError(500, "Failed to update event");
    }
    res
      .status(200)
      .json(new ApiResponse(200, "Event updated successfully", updatedEvent));
  });

  // 3. Delete an event (only for admin)
  deleteEvent = asyncHandler(async (req: UserRequest, res: Response) => {
    if (!req?.isAdmin) {
      throw new ApiError(403, "You are not authorized to perform this action");
    }
    const { eventId } = req.params;
    if (!eventId) {
      throw new ApiError(400, "Please provide event id");
    }
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      throw new ApiError(404, "Event not found");
    }
    const existingAvatarPublicId = event.eventImage.substring(
      event.eventImage.lastIndexOf("/") + 1,
      event.eventImage.lastIndexOf(".")
    );
    if (existingAvatarPublicId) {
      await deleteFromCloudinary(existingAvatarPublicId, "image");
    }
    res
      .status(200)
      .json(new ApiResponse(200, "Event deleted successfully", event));
  });

  // 4. Get an event
  getEvent = asyncHandler(async (req: UserRequest, res: Response) => {
    const { eventId } = req.params;
    if (!eventId) {
      throw new ApiError(400, "Please provide event id");
    }
    const event = await Event.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "participants",
          foreignField: "_id",
          as: "participants",
          pipeline: [
            {
              $project: {
                fullname: 1,
                email: 1,
                username: 1,
                avatar: 1,
                registrationNumber: 1,
                role: 1,
                skills: 1,
                socialMediaLinks: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
          pipeline: [
            {
              $project: {
                fullname: 1,
                email: 1,
                username: 1,
                avatar: 1,
                registrationNumber: 1,
                role: 1,
                skills: 1,
                socialMediaLinks: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "winner",
          foreignField: "_id",
          as: "winner",
          pipeline: [
            {
              $project: {
                fullname: 1,
                email: 1,
                username: 1,
                avatar: 1,
                registrationNumber: 1,
                role: 1,
                skills: 1,
                socialMediaLinks: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          winner: {
            $arrayElemAt: ["$winner", 0],
          },
          createdBy: {
            $arrayElemAt: ["$createdBy", 0],
          },
        },
      },
    ]);
    if (!event) {
      throw new ApiError(404, "Event not found");
    }
    res.status(200).json(new ApiResponse(200, "Event found", event));
  });

  // 5. Get all events
  getAllEvents = asyncHandler(async (req: UserRequest, res: Response) => {
    const events = await Event.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "participants",
          foreignField: "_id",
          as: "participants",
          pipeline: [
            {
              $project: {
                fullname: 1,
                email: 1,
                username: 1,
                avatar: 1,
                registrationNumber: 1,
                role: 1,
                skills: 1,
                socialMediaLinks: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
          pipeline: [
            {
              $project: {
                fullname: 1,
                email: 1,
                username: 1,
                avatar: 1,
                registrationNumber: 1,
                role: 1,
                skills: 1,
                socialMediaLinks: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "winner",
          foreignField: "_id",
          as: "winner",
          pipeline: [
            {
              $project: {
                fullname: 1,
                email: 1,
                username: 1,
                avatar: 1,
                registrationNumber: 1,
                role: 1,
                skills: 1,
                socialMediaLinks: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          winner: {
            $arrayElemAt: ["$winner", 0],
          },
          createdBy: {
            $arrayElemAt: ["$createdBy", 0],
          },
        },
      },
    ]);
    if (!events) {
      throw new ApiError(404, "No events found");
    }
    res.status(200).json(new ApiResponse(200, "Events found", events));
  });

  // 6. Join an event
  joinEvent = asyncHandler(async (req: UserRequest, res: Response) => {
    const { eventId } = req.params;
    if (!eventId) {
      throw new ApiError(400, "Please provide event id");
    }
    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        $addToSet: {
          participants: req.user?._id,
        },
      },
      { new: true }
    );
    if (!event) {
      throw new ApiError(404, "Event not found");
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "You have successfully joined the event", event)
      );
  });

  // 7. Leave an event
  leaveEvent = asyncHandler(async (req: UserRequest, res: Response) => {
    const { eventId } = req.params;
    if (!eventId) {
      throw new ApiError(400, "Please provide event id");
    }
    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        $pull: {
          participants: req.user?._id,
        },
      },
      { new: true }
    );
    if (!event) {
      throw new ApiError(404, "Event not found");
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "You have successfully left the event", event)
      );
  });
}

export default new eventController();
