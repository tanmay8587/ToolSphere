import Tool from "../models/Tool.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import Review from "../models/Review.js";
import Report from "../models/Report.js";
import Bookmark from "../models/Bookmark.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

import { createSlug } from "../utils/slug.js";
import { normalizeTags, validateToolPayload } from "../utils/validation.js";
import { notifyNewTool } from "../utils/newsletterEmail.js";

/* =====================================
   PUBLIC - GET TOOLS
===================================== */

export const getTools = async (req, res) => {
  try {

    const {
      search = "",
      category = "All",
      pricing = "All",
      rating = "all",
      sort = "popular",
      page = "1",
      limit = "24",
    } = req.query;

    const filters = {
      approved: true,
      isDeleted: false,
      status: "active",
    };

    // Category filter
    if (category && category !== "All") {
      filters.category = category;
    }

    // Pricing filter
    if (pricing && pricing !== "All") {
      filters.pricing = pricing;
    }

    if (rating !== "all") {
      filters.rating = {
        $gte: Number(rating),
      };
    }

    if (typeof search === 'string' && search) {
      const truncatedSearch = search.substring(0, 100);
      const escapedSearch = truncatedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filters.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { category: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
        { tags: { $in: [new RegExp(escapedSearch, "i")] } },
      ];
    }

    const sortMap = {
      popular: { featured: -1, rating: -1, createdAt: -1 },
      rating: { rating: -1 },
      newest: { createdAt: -1 },
    };

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 24;

    const skip = (pageNumber - 1) * limitNumber;

    const [total, tools] = await Promise.all([
      Tool.countDocuments(filters),
      Tool.find(filters)
        .sort(sortMap[sort] || sortMap.popular)
        .skip(skip)
        .limit(limitNumber),
    ]);

    res.json({
      success: true,
      total,
      tools,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber),
      },
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tools",
    });
  }
};

export const searchTools = getTools;

/* =====================================
   GET TOOL BY SLUG
===================================== */

export const getToolBySlug = async (req, res) => {
  try {
    const tool = await Tool.findOne({
      slug: req.params.slug,
      isDeleted: false,
    });

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: "Tool not found",
      });
    }

    await Tool.updateOne(
      { slug: req.params.slug },
      { $inc: { views: 1 } }
    );

    res.json({
      success: true,
      tool,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tool",
    });
  }
};

/* =====================================
   GET CATEGORIES
===================================== */

export const getCategories = async (req, res) => {
  try {
    // Get active categories from Category model
    const categoryDocs = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    // Get tool counts per category
    const toolCounts = await Tool.aggregate([
      {
        $match: {
          approved: true,
          isDeleted: false,
          status: "active",
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = {};
    toolCounts.forEach((item) => {
      countMap[item._id.toLowerCase()] = item.count;
    });

    const categories = categoryDocs.map((cat) => ({
      _id: cat.name,
      name: cat.name,
      icon: cat.icon || "🤖",
      description: cat.description || "Discover AI tools in this category.",
      count: countMap[cat.name.toLowerCase()] || 0,
    }));

    res.json({
      success: true,
      categories,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

/* =====================================
   FEATURED TOOLS
===================================== */

export const getFeaturedTools = async (req, res) => {
  try {
    const filters = {
      featured: true,
      approved: true,
      isDeleted: false,
      status: "active",
    };

    const tools = await Tool.find(filters)
      .sort({ rating: -1 })
      .limit(12);

    res.json({
      success: true,
      tools,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured tools",
    });
  }
};

/* =====================================
   ADMIN - GET ALL TOOLS
===================================== */

export const getAllToolsAdmin = async (req, res) => {
  try {
    const {
      search = "",
      category = "All",
      status = "All",
      featured = "All",
      page = "1",
      limit = "100",
    } = req.query;

    const filters = {};

    if (category !== "All") {
      filters.category = category;
    }

    if (status !== "All") {
      filters.status = status;
    }

    if (featured === "true") {
      filters.featured = true;
    }

    if (featured === "false") {
      filters.featured = false;
    }

    if (typeof search === 'string' && search) {
      const truncatedSearch = search.substring(0, 100);
      const escapedSearch = truncatedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filters.$or = [
        {
          name: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          category: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          description: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          tags: {
            $in: [new RegExp(escapedSearch, "i")],
          },
        },
      ];
    }

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));

    const total = await Tool.countDocuments(filters);

    const tools = await Tool.find(filters)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    res.json({
      success: true,
      total,
      tools,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Admin fetch failed",
    });
  }
};

export const getToolByIdAdmin = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: "Tool not found",
      });
    }

    res.json({
      success: true,
      tool,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tool",
    });
  }
};

/* =====================================
   ADMIN - ADD TOOL
===================================== */

export const addTool = async (req, res) => {
  try {
    const payload = {};

    // ONLY add fields if they exist properly

    if (req.body.name?.trim()) {
      payload.name = String(req.body.name).trim();
    }

    if (req.body.category?.trim()) {
      payload.category = String(req.body.category).trim();
    }

    if (req.body.website?.trim()) {
      payload.website = String(req.body.website).trim();
    }

    if (req.body.description?.trim()) {
      payload.description = String(req.body.description).trim();
    }

    if (req.body.pricing) payload.pricing = req.body.pricing;
    if (req.body.status) payload.status = req.body.status;

    if (typeof req.body.featured === "boolean") {
      payload.featured = req.body.featured;
    }

    if (req.body.logo?.trim()) {
      payload.logo = String(req.body.logo).trim();
    }

    if (req.body.coverImage?.trim()) {
      payload.coverImage = String(req.body.coverImage).trim();
    }

    payload.gallery = Array.isArray(req.body.gallery)
      ? req.body.gallery
      : undefined;

    payload.features = req.body.features ? normalizeTags(req.body.features) : undefined;
    payload.pros = req.body.pros ? normalizeTags(req.body.pros) : undefined;
    payload.cons = req.body.cons ? normalizeTags(req.body.cons) : undefined;

    payload.screenshots = Array.isArray(req.body.screenshots)
      ? req.body.screenshots
      : undefined;

    payload.seoTitle = req.body.seoTitle?.trim();
    payload.seoDescription = req.body.seoDescription?.trim();
    payload.seoKeywords = req.body.seoKeywords ? normalizeTags(req.body.seoKeywords) : undefined;
    payload.ogImage = req.body.ogImage?.trim();
    payload.canonicalUrl = req.body.canonicalUrl?.trim();

    payload.tags = req.body.tags ? normalizeTags(req.body.tags) : undefined;

    payload.updatedBy = req.admin?.email || "admin";

    // Slug
    if (req.body.slug) {
      payload.slug = createSlug(req.body.slug);
    } else {
      payload.slug = createSlug(payload.name);
    }

    const errors = validateToolPayload(payload);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(" "),
      });
    }

    let slugCandidate = payload.slug;
    let count = 1;

    while (await Tool.findOne({ slug: slugCandidate })) {
      slugCandidate = `${payload.slug}-${count}`;
      count++;
    }

    payload.slug = slugCandidate;
    payload.approved = payload.status === "active";
    payload.approvedAt = payload.approved ? Date.now() : null;

    const tool = await Tool.create(payload);

    // Send newsletter if requested
    let newsletterResult = null;
    if (req.body.notifyNewsletter === true || req.body.notifyNewsletter === "true") {
      try {
        newsletterResult = await notifyNewTool(tool);
      } catch (err) {
        // Log but don't fail the request
        console.error("Newsletter sending failed:", err);
      }
    }

    const response = {
      success: true,
      message: "Tool added successfully",
      tool,
    };

    if (newsletterResult) {
      response.newsletter = newsletterResult;
      if (newsletterResult.count > 0) {
        response.message = `Tool published successfully. Newsletter sent to ${newsletterResult.count} subscribers.`;
      } else {
        response.message = "Tool published successfully. No active newsletter subscribers to notify.";
      }
    }

    return res.status(201).json(response);

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to add tool",
    });
  }
};

/* =====================================
   ADMIN - UPDATE TOOL
===================================== */

export const updateTool = async (req, res) => {
  try {

    let imageUrl = undefined;

    // ✅ Cloudinary Upload (memory storage)
    if (req.file && req.file.buffer) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "tools",
            transformation: [
              { quality: "auto", fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });

      imageUrl = uploadResult.secure_url;
    }

    const payload = {
      ...req.body,

      name:
        req.body.name && req.body.name.trim().length > 0
          ? String(req.body.name).trim()
          : undefined,
      category: req.body.category ? String(req.body.category).trim() : undefined,
      website: req.body.website ? String(req.body.website).trim() : undefined,
      description: req.body.description ? String(req.body.description).trim() : undefined,

      pricing: req.body.pricing,
      status: req.body.status,

      featured:
        typeof req.body.featured === "boolean"
          ? req.body.featured
          : undefined,

      logo: typeof req.body.logo === 'string' ? String(req.body.logo).trim() : undefined,

      coverImage: typeof req.body.coverImage === 'string'
        ? String(req.body.coverImage).trim()
        : undefined,

      gallery: Array.isArray(req.body.gallery) ? req.body.gallery : (typeof req.body.gallery === 'string' ? [] : undefined),

      features: req.body.features ? normalizeTags(req.body.features) : undefined,
      pros: req.body.pros ? normalizeTags(req.body.pros) : undefined,
      cons: req.body.cons ? normalizeTags(req.body.cons) : undefined,

      screenshots: Array.isArray(req.body.screenshots)
        ? req.body.screenshots
        : undefined,

      seoTitle: req.body.seoTitle ? String(req.body.seoTitle).trim() : undefined,
      seoDescription: req.body.seoDescription ? String(req.body.seoDescription).trim() : undefined,
      seoKeywords: req.body.seoKeywords ? normalizeTags(req.body.seoKeywords) : undefined,
      ogImage: req.body.ogImage ? String(req.body.ogImage).trim() : undefined,
      canonicalUrl: req.body.canonicalUrl ? String(req.body.canonicalUrl).trim() : undefined,

      tags: req.body.tags ? normalizeTags(req.body.tags) : undefined,

      updatedBy: req.admin?.email || "admin",
    };

    // ✅ Override logo if image uploaded
    if (imageUrl) {
      payload.logo = imageUrl;
    }

    // slug handling
    if (req.body.slug) {
      payload.slug = createSlug(req.body.slug);
    } else if (req.body.name) {
      payload.slug = createSlug(req.body.name);
    }

    const errors = validateToolPayload(payload, true);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(" "),
      });
    }

    if (payload.slug) {
      const existing = await Tool.findOne({
        slug: payload.slug,
        _id: { $ne: req.params.id },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Slug already exists",
        });
      }
    }

    if (payload.status) {
      payload.approved = payload.status === "active";
      payload.approvedAt = payload.status === "active" ? Date.now() : null;
    }

    const tool = await Tool.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: "Tool not found",
      });
    }

    // Send newsletter if requested
    let newsletterResult = null;
    if (req.body.notifyNewsletter === true || req.body.notifyNewsletter === "true") {
      try {
        newsletterResult = await notifyNewTool(tool);
      } catch (err) {
        // Log but don't fail the request
        console.error("Newsletter sending failed:", err);
      }
    }

    const response = {
      success: true,
      tool,
      image: tool.logo,
    };

    if (newsletterResult) {
      response.newsletter = newsletterResult;
      if (newsletterResult.count > 0) {
        response.message = `Tool updated successfully. Newsletter sent to ${newsletterResult.count} subscribers.`;
      } else {
        response.message = "Tool updated successfully. No active newsletter subscribers to notify.";
      }
    }

    return res.json(response);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update tool",
    });
  }
};

/* =====================================
    ADMIN - DELETE TOOL
===================================== */

export const deleteTool = async (req, res) => {
  try {
    const toolId = req.params.id;
    
    // Find and delete the tool
    const deletedTool = await Tool.findByIdAndDelete(toolId);

    if (!deletedTool) {
      return res.status(404).json({
        success: false,
        message: "Tool not found",
      });
    }

    // Cascade delete: Remove related reviews and bookmarks
    await Promise.all([
      Review.deleteMany({ tool: toolId }),
      Bookmark.deleteMany({ tool: toolId }),
    ]);

    res.json({
      success: true,
      message: "Tool deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};

/* =====================================
   ADMIN - APPROVE TOOL
===================================== */

export const approveTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);

    if (!tool || tool.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Tool not found",
      });
    }

    tool.approved = true;
    tool.status = "active";
    tool.approvedAt = Date.now();
    tool.rejectedReason = "";
    tool.updatedBy = req.admin?.email || "admin";

    await tool.save();

    res.json({
      success: true,
      message: "Tool approved successfully",
      tool,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Approve failed",
    });
  }
};

/* =====================================
   ADMIN - REJECT / UNPUBLISH TOOL
===================================== */

export const rejectTool = async (req, res) => {
  try {
    const { status = "pending", reason = "" } = req.body;
    const tool = await Tool.findById(req.params.id);

    if (!tool || tool.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Tool not found",
      });
    }

    tool.approved = false;
    tool.status = ["pending", "rejected"].includes(status)
      ? status
      : "pending";
    tool.rejectedReason = String(reason || "Unapproved by admin").trim();
    tool.updatedBy = req.admin?.email || "admin";

    await tool.save();

    res.json({
      success: true,
      message: "Tool unpublished successfully",
      tool,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unpublish failed",
    });
  }
};

/* =====================================
   ADMIN - TOGGLE FEATURE
===================================== */

export const toggleFeaturedTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);

    if (!tool || tool.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Tool not found",
      });
    }

    tool.featured = !tool.featured;
    tool.featuredAt = tool.featured ? Date.now() : null;
    tool.updatedBy = req.admin?.email || "admin";

    await tool.save();

    res.json({
      success: true,
      featured: tool.featured,
      tool,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Toggle failed",
    });
  }
};

/* =====================================
   ADMIN - CATEGORIES
===================================== */

export const getAdminCategories = async (req, res) => {
  try {
    // Get ALL categories from Category model (admin needs to see all)
    const categoryDocs = await Category.find({})
      .sort({ name: 1 })
      .lean();

    // Get tool counts per category
    const toolCounts = await Tool.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    toolCounts.forEach((item) => {
      countMap[item._id.toLowerCase()] = item.count;
    });

    const categories = categoryDocs.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      icon: cat.icon || "🤖",
      description: cat.description || "",
      isActive: cat.isActive,
      count: countMap[cat.name.toLowerCase()] || 0,
      createdAt: cat.createdAt,
    }));

    res.json({
      success: true,
      categories,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load categories" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const existing = await Category.findOne({ name: name.toLowerCase() });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await Category.create({ name: name.toLowerCase() });

    res.status(201).json({ success: true, message: "Category created", category });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create category" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { icon, name, description } = req.body;

    const updateData = {};
    
    // Handle icon: explicit empty string means remove icon, otherwise use provided value or keep existing
    if (icon !== undefined) {
      updateData.icon = icon || "";
    }
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (description !== undefined) {
      updateData.description = description;
    }

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, message: "Category updated", category });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update category" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete category" });
  }
};

export const toggleCategoryActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      { isActive: isActive !== undefined ? isActive : true },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, message: `Category ${category.isActive ? 'enabled' : 'disabled'} successfully`, category });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to toggle category" });
  }
};

/* =====================================
    ADMIN - USERS
===================================== */

export const getAdminUsers = async (req, res) => {
  try {
    const {
      search = "",
      status = "All",
      page = "1",
      limit = "20",
    } = req.query;

    // Build filters
    const filters = {};

    // Search filter
    if (typeof search === "string" && search) {
      const truncatedSearch = search.substring(0, 100);
      const escapedSearch = truncatedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filters.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    // Status filter
    if (status === "verified") {
      filters.isVerified = true;
    } else if (status === "pending") {
      filters.isVerified = false;
    } else if (status === "admin") {
      filters.role = "admin";
    }

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));

    // Get total count
    const total = await User.countDocuments(filters);

    // Get users with pagination
    const users = await User.find(filters)
      .sort({ createdAt: -1 })
      .select("-password")
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    // Get summary counts
    const [verified, pending, admins] = await Promise.all([
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isVerified: false }),
      User.countDocuments({ role: "admin" }),
    ]);

    res.json({
      success: true,
      users,
      total,
      verified,
      pending,
      admins,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load users" });
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified, emailVerificationToken, emailVerificationExpire } = req.body;

    const updateData = {};
    
    if (isVerified !== undefined) {
      updateData.isVerified = isVerified;
    }
    
    if (emailVerificationToken !== undefined) {
      updateData.emailVerificationToken = emailVerificationToken;
    }
    
    if (emailVerificationExpire !== undefined) {
      updateData.emailVerificationExpire = emailVerificationExpire;
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
};

export const deleteAdminUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find and delete the user
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Cascade delete: Remove related reviews and bookmarks
    await Promise.all([
      Review.deleteMany({ user: userId }),
      Bookmark.deleteMany({ user: userId }),
    ]);

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

/* =====================================
   RELATED TOOLS
===================================== */

export const getRelatedTools = async (req, res) => {
  try {
    const tool = await Tool.findOne({
      slug: req.params.slug,
      isDeleted: false,
    });

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: "Tool not found",
      });
    }

    const related = await Tool.find({
      _id: { $ne: tool._id },
      category: tool.category,
      approved: true,
      status: "active",
      isDeleted: false,
    })
      .sort({ featured: -1, rating: -1, createdAt: -1 })
      .limit(6);

    res.json({
      success: true,
      tools: related,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch related tools",
    });
  }
};

/* =====================================
   PUBLIC - REPORT TOOL
   ===================================== */

export const reportTool = async (req, res) => {
  try {
    const { toolId, toolName, reason, comment } = req.body;

    if (!toolId || !toolName || !reason) {
      return res.status(400).json({
        success: false,
        message: "Tool ID, tool name, and reason are required",
      });
    }

    const validReasons = ["Broken Link", "Incorrect Information", "Duplicate Tool", "Spam", "Other"];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report reason",
      });
    }

    const tool = await Tool.findById(toolId);
    if (!tool || tool.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Tool not found",
      });
    }

    const report = await Report.create({
      toolId,
      toolName,
      reason,
      comment: comment || "",
    });

    res.status(201).json({
      success: true,
      message: "Report submitted successfully. Thank you for helping us improve.",
      report,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to submit report",
    });
  }
};
