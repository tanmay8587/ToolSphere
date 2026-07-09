import mongoose from "mongoose";

/* ==========================================
   NOTIFICATION TYPES
========================================== */
const NOTIFICATION_TYPES = [
  "review",
  "contact",
  "user",
  "newsletter",
  "tool",
];

/* ==========================================
   NOTIFICATION SCHEMA
========================================== */
const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPES,
        message: "Invalid notification type: {VALUE}",
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Notification", notificationSchema);