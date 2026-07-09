import Tool from "../models/Tool.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import WebsiteBranding from "../models/WebsiteBranding.js";
import SeoSetting from "../models/SeoSetting.js";
import AnalyticsSetting from "../models/AnalyticsSetting.js";
import ContactSetting from "../models/ContactSetting.js";
import SmtpSetting from "../models/SmtpSetting.js";
import SocialLink from "../models/SocialLink.js";

/* ==========================================
   EXPORT WEBSITE SETTINGS
   ========================================== */
export const exportSettings = async (req, res) => {
  try {
    const [
      branding,
      seo,
      analytics,
      contact,
      smtp,
      social
    ] = await Promise.all([
      WebsiteBranding.find({}).lean(),
      SeoSetting.find({}).lean(),
      AnalyticsSetting.find({}).lean(),
      ContactSetting.find({}).lean(),
      SmtpSetting.find({}).lean(),
      SocialLink.find({}).lean(),
    ]);

    res.json({
      success: true,
      data: {
        branding,
        seo,
        analytics,
        contact,
        smtp,
        social,
      },
      exportedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to export settings",
    });
  }
};

/* ==========================================
   EXPORT TOOLS
   ========================================== */
export const exportTools = async (req, res) => {
  try {
    const tools = await Tool.find({ isDeleted: false }).lean();

    res.json({
      success: true,
      data: tools,
      count: tools.length,
      exportedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to export tools",
    });
  }
};

/* ==========================================
   EXPORT CATEGORIES
   ========================================== */
export const exportCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).lean();

    res.json({
      success: true,
      data: categories,
      count: categories.length,
      exportedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to export categories",
    });
  }
};

/* ==========================================
   EXPORT USERS
   ========================================== */
export const exportUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").lean();

    res.json({
      success: true,
      data: users,
      count: users.length,
      exportedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to export users",
    });
  }
};