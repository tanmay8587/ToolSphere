import mongoose from "mongoose";
import { sanitizeTextField } from "../utils/validation.js";

const maintenanceSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "maintenance_mode",
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      default: "We'll be back soon! The website is currently under maintenance.",
    },
    estimatedTime: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to sanitize text fields for XSS prevention
maintenanceSettingSchema.pre("save", function(next) {
  if (this.isModified("message") && this.message) {
    this.message = sanitizeTextField(this.message);
  }
  if (this.isModified("estimatedTime") && this.estimatedTime) {
    this.estimatedTime = sanitizeTextField(this.estimatedTime);
  }
  next();
});

const MaintenanceSetting = mongoose.model("MaintenanceSetting", maintenanceSettingSchema);

export default MaintenanceSetting;