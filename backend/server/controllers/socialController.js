import SocialLink from "../models/SocialLink.js";
import logger from "../utils/logger.js";

// Shared constant for all valid platforms
const VALID_PLATFORMS = [
  "x",
  "linkedin",
  "github",
  "instagram",
  "youtube",
  "discord",
  "telegram",
  "facebook",
];

// Helper function to auto-initialize social links if they don't exist
const ensureSocialLinksExist = async () => {
  try {
    const count = await SocialLink.countDocuments();
    
    if (count === 0) {
      const socialLinksToCreate = VALID_PLATFORMS.map(platform => ({
        platform,
        url: "",
        isActive: true,
      }));
      
      await SocialLink.insertMany(socialLinksToCreate);
      logger.info("Auto-initialized default social links");
    }
  } catch (err) {
    logger.error("Failed to initialize social links", { error: err.message });
    throw err;
  }
};

/* ==========================================
   GET ALL SOCIAL LINKS (PUBLIC)
   ========================================== */

export const getSocialLinks = async (req, res) => {
  try {
    // Ensure social links exist before fetching
    await ensureSocialLinksExist();
    
    const socialLinks = await SocialLink.find({ isActive: true })
      .sort({ platform: 1 })
      .lean();

    res.json({
      success: true,
      socialLinks,
    });
  } catch (err) {
    logger.error("Failed to fetch social links", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch social links",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   GET ALL SOCIAL LINKS (ADMIN)
   ========================================== */

export const getAllSocialLinks = async (req, res) => {
  try {
    // Ensure social links exist before fetching
    await ensureSocialLinksExist();

    const socialLinks = await SocialLink.find({})
      .sort({ platform: 1 })
      .lean();

    res.json({
      success: true,
      socialLinks,
    });
  } catch (err) {
    logger.error("Failed to fetch social links (admin)", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch social links",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   UPDATE SOCIAL LINK (ADMIN)
   ========================================== */

export const updateSocialLink = async (req, res) => {
  try {
    const { platform } = req.params;
    const { url, isActive } = req.body;

    // Validate platform
    if (!VALID_PLATFORMS.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: "Invalid platform",
      });
    }

    // Validate URL if provided
    if (url !== undefined && url.trim() !== "") {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(url.trim())) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid URL starting with http:// or https://",
        });
      }
    }

    // Find or create the social link
    let socialLink = await SocialLink.findOne({ platform });

    if (!socialLink) {
      // Create new social link if it doesn't exist
      socialLink = new SocialLink({
        platform,
        url: url || "",
        isActive: isActive !== undefined ? isActive : true,
      });
    } else {
      // Update existing social link
      if (url !== undefined) {
        socialLink.url = url.trim();
      }
      if (isActive !== undefined) {
        socialLink.isActive = isActive;
      }
    }

    await socialLink.save();

    res.json({
      success: true,
      message: "Social link updated successfully",
      socialLink,
    });
  } catch (err) {
    logger.error("Failed to update social link", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to update social link",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/* ==========================================
   INITIALIZE DEFAULT SOCIAL LINKS (ADMIN)
   ========================================== */

export const initializeSocialLinks = async (req, res) => {
  try {
    const results = await Promise.all(
      VALID_PLATFORMS.map(async (platform) => {
        const existing = await SocialLink.findOne({ platform });
        if (!existing) {
          const newLink = new SocialLink({
            platform,
            url: "",
            isActive: true,
          });
          await newLink.save();
          return { platform, created: true };
        }
        return { platform, created: false };
      })
    );

    const createdCount = results.filter((r) => r.created).length;

    res.json({
      success: true,
      message: `Social links initialized. ${createdCount} new platforms added.`,
      results,
    });
  } catch (err) {
    logger.error("Failed to initialize social links", { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Failed to initialize social links",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
