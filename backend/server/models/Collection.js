import mongoose from "mongoose";
import crypto from "crypto";

const collectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tools: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tool" }],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure every collection has a stable, unique shareId used for public sharing URLs.
collectionSchema.pre("save", function (next) {
  if (!this.shareId) {
    this.shareId = crypto.randomBytes(8).toString("hex");
  }
  next();
});

export default mongoose.model("Collection", collectionSchema);
