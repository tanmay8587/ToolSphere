import mongoose from "mongoose";
import SocialLink from "../models/SocialLink.js";
import logger from "./logger.js";

const seedSocialLinks = async () => {
  try {
    // Check if social links already exist
    const count = await SocialLink.countDocuments();
    
    if (count > 0) {
      logger.info("ℹ️ Social links already exist, skipping seed");
      return;
    }

    const defaultPlatforms = [
      "x",
      "linkedin",
      "github",
      "instagram",
      "youtube",
      "discord",
      "telegram",
      "facebook",
    ];

    const socialLinks = defaultPlatforms.map((platform) => ({
      platform,
      url: "",
      isActive: true,
    }));

    await SocialLink.insertMany(socialLinks);
    logger.info(`✅ Seeded ${socialLinks.length} social link platforms`);
  } catch (err) {
    logger.error("⚠️ Social links seed failed:", err.message);
  }
};

export default seedSocialLinks;