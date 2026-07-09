import mongoose from "mongoose";
import { sanitizeTextField } from "../utils/validation.js";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
      index: true,
    },
    subject: {
      type: String,
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
      default: "",
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ["unread", "read", "replied"],
      default: "unread",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to sanitize text fields for XSS prevention
contactSchema.pre("save", function(next) {
  if (this.isModified("name") && this.name) {
    this.name = sanitizeTextField(this.name);
  }
  if (this.isModified("subject") && this.subject) {
    this.subject = sanitizeTextField(this.subject);
  }
  if (this.isModified("message") && this.message) {
    this.message = sanitizeTextField(this.message);
  }
  next();
});

// Compound index for efficient admin queries with status filtering and sorting
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ isRead: 1, createdAt: -1 });

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;