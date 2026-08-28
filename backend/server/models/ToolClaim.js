import mongoose from "mongoose";

/**
 * Tool Claim Model
 *
 * Represents a request by a company/user to "own" (claim) a tool listing.
 * The claiming user must provide verification details so an admin can confirm
 * they are authorized. Once approved, the tool gains the verified badge.
 */
const toolClaimSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tool",
      required: true,
      index: true,
    },

    // Company / ownership information provided with the verification request.
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [200, "Company name cannot exceed 200 characters"],
    },

    // Company contact used to verify ownership (e.g. a company email / domain).
    contactEmail: {
      type: String,
      required: [true, "Company contact email is required"],
      lowercase: true,
      trim: true,
    },

    companyWebsite: {
      type: String,
      default: "",
      trim: true,
    },

    // What role the requester holds in the company (Owner, Admin, etc.).
    role: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Role cannot exceed 100 characters"],
    },

    // Supporting details the user provides to prove ownership/authorization.
    verificationDetails: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2000, "Verification details are too long"],
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "revoked"],
      default: "pending",
      index: true,
    },

    // Admin note/reason (especially useful when rejecting or revoking).
    adminNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Admin note is too long"],
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One user should never hold more than one active (pending/approved) claim
// against the same tool.
toolClaimSchema.index({ user: 1, tool: 1, status: 1 });

export default mongoose.model("ToolClaim", toolClaimSchema);