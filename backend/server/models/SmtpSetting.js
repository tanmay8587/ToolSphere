import mongoose from "mongoose";
import { sanitizeTextField } from "../utils/validation.js";

const smtpSettingSchema = new mongoose.Schema(
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
smtpSettingSchema.pre("save", function(next) {
  if (this.isModified("value") && this.value) {
    this.value = sanitizeTextField(this.value);
  }
  next();
});

const SmtpSetting = mongoose.model("SmtpSetting", smtpSettingSchema);

export default SmtpSetting;