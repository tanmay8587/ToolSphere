import mongoose from "mongoose";
import { sanitizeTextField } from "../utils/validation.js";

/**
 * Team Member Model
 *
 * Represents an additional user who belongs to a company. A "company" in the
 * ToolSphere context is identified by the account that owns verified tool
 * claims (the "companyOwner"). Team members are linked to that owner and
 * inherit access to the owner's claimed tools.
 */
const teamMemberSchema = new mongoose.Schema(
  {
    // The user account that owns the verified/approved tool claims. This
    // defines the company that the member belongs to.
    companyOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // The linked user account, if the member has registered / accepted the
    // invitation. Null while the invitation is still pending.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    name: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    // Where the invitation was sent / the member's account email.
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["owner", "admin", "editor", "viewer"],
      default: "editor",
    },

    status: {
      type: String,
      enum: ["invited", "active", "inactive"],
      default: "invited",
      index: true,
    },

    // One-time invitation token (and expiry) so a pending member can later
    // accept their invite.
    inviteToken: {
      type: String,
      default: "",
    },
    inviteTokenExpire: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// A company should only ever have one team record per email address.
teamMemberSchema.index({ companyOwner: 1, email: 1 }, { unique: true });

// Pre-save hook to sanitize text fields for XSS prevention.
teamMemberSchema.pre("save", function (next) {
  if (this.isModified("name") && this.name) {
    this.name = sanitizeTextField(this.name);
  }
  next();
});

export default mongoose.model("TeamMember", teamMemberSchema);
