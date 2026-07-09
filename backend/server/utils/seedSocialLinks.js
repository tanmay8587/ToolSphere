import mongoose from "mongoose";
import SocialLink from "../models/SocialLink.js";

const seedSocialLinks = async () => {
  try {
    // Check if social links already exist
    const count = await SocialLink.countDocuments();
    
    if (count > 0) {
      console.log("ℹ️ Social links already exist, skipping seed");
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
    console.log(`✅ Seeded ${socialLinks.length} social link platforms`);
  } catch (err) {
    console.error("⚠️ Social links seed failed:", err.message);
  }
};

export default seedSocialLinks;