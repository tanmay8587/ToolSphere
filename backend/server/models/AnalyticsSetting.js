import mongoose from "mongoose";
import { sanitizeTextField } from "../utils/validation.js";

const analyticsSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to sanitize text fields for XSS prevention
analyticsSettingSchema.pre("save", function(next) {
  if (this.isModified("value") && this.value) {
    this.value = sanitizeTextField(this.value);
  }
  next();
});

const AnalyticsSetting = mongoose.model("AnalyticsSetting", analyticsSettingSchema);

export default AnalyticsSetting;