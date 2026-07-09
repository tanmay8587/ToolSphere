import SmtpSetting from "../models/SmtpSetting.js";
import logger from "../utils/logger.js";

// Default SMTP settings
const DEFAULT_SMTP_SETTINGS = [
  { key: "smtp_host", value: "" },
  { key: "smtp_port", value: "587" },
  { key: "smtp_username", value: "" },
  { key: "smtp_password", value: "" },
  { key: "smtp_sender_name", value: "ToolSphere" },
  { key: "smtp_sender_email", value: "" },
];

const seedSmtpSettings = async () => {
  try {
    const count = await SmtpSetting.countDocuments();
    
    if (count === 0) {
      await SmtpSetting.insertMany(DEFAULT_SMTP_SETTINGS);
      logger.info("Seeded default SMTP settings");
    } else {
      logger.info("SMTP settings already exist, skipping seed");
    }
  } catch (err) {
    logger.error("Failed to seed SMTP settings", { error: err.message });
    throw err;
  }
};

export default seedSmtpSettings;