import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tool",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

bookmarkSchema.index({ user: 1, tool: 1 }, { unique: true });

export default mongoose.model("Bookmark", bookmarkSchema);
