import mongoose from "mongoose";

export const MEMBERSHIP_TIER = {
  FREE: "free",
  PRO: "pro",
  BUSINESS: "business",
};

export const MEMBERSHIP_STATUS = {
  ACTIVE: "active",
  TRIAL: "trial",
  PAUSED: "paused",
  CANCELED: "canceled",
  EXPIRED: "expired",
};

const membershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    tier: {
      type: String,
      enum: Object.values(MEMBERSHIP_TIER),
      default: MEMBERSHIP_TIER.FREE,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(MEMBERSHIP_STATUS),
      default: MEMBERSHIP_STATUS.ACTIVE,
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endsAt: {
      type: Date,
      default: null,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    metadata: {
      planName: { type: String, default: "" },
      notes: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

membershipSchema.index({ user: 1, tier: 1 });

export default mongoose.model("Membership", membershipSchema);