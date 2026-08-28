import crypto from "crypto";
import asyncHandler from "../middleware/asyncHandler.js";
import Tool from "../models/Tool.js";
import ToolClaim from "../models/ToolClaim.js";
import TeamMember from "../models/TeamMember.js";
import User from "../models/User.js";
import { sanitizeTextField } from "../utils/validation.js";
import { sendErrorResponse } from "../utils/errorResponse.js";

/**
 * Resolves the "company" context for the currently authenticated user.
 *
 * A user is treated as a company owner the moment they hold any tool claim
 * (the account that submits claims). Team members are linked to an owner via
 * the TeamMember model and inherit access to the owner's tools.
 *
 * @returns {Promise<{ownerId: string, isOwner: boolean, isMember: boolean, role: string}|null>}
 */
const resolveCompany = async (req) => {
  const hasClaim = await ToolClaim.exists({ user: req.user.id });
  if (hasClaim) {
    return { ownerId: req.user.id, isOwner: true, isMember: false, role: "owner" };
  }

  const membership = await TeamMember.findOne({
    user: req.user.id,
    status: "active",
  });
  if (membership) {
    return {
      ownerId: String(membership.companyOwner),
      isOwner: false,
      isMember: true,
      role: membership.role,
    };
  }

  return null;
};

// Owners and admin/editor members may modify tool details.
const canManage = (company) =>
  company && (company.isOwner || ["admin", "editor"].includes(company.role));

/* =====================================
   GET /api/company/overview
   ===================================== */
export const getCompanyOverview = asyncHandler(async (req, res) => {
  const company = await resolveCompany(req);
  if (!company) {
    return sendErrorResponse(res, 404, "No company account found. Claim a tool to get started.");
  }

  const [approvedClaims, pendingClaims, tools, activeMembers] = await Promise.all([
    ToolClaim.countDocuments({ user: company.ownerId, status: "approved" }),
    ToolClaim.countDocuments({ user: company.ownerId, status: "pending" }),
    Tool.find({ claimedBy: company.ownerId, isDeleted: false, verified: true }),
    TeamMember.countDocuments({ companyOwner: company.ownerId, status: "active" }),
  ]);

  let views = 0;
  let clicks = 0;
  let visits = 0;
  let reviews = 0;
  let bookmarks = 0;
  let ratingWeight = 0;

  tools.forEach((t) => {
    views += t.views || 0;
    clicks += t.clicks || 0;
    visits += t.visitCount || 0;
    reviews += t.reviewCount || 0;
    bookmarks += t.bookmarkCount || 0;
    ratingWeight += (t.rating || 0) * (t.reviewCount || 0);
  });

  const infoClaim = await ToolClaim.findOne({ user: company.ownerId, status: "approved" })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: {
      isOwner: company.isOwner,
      role: company.role,
      info: infoClaim
        ? {
            companyName: infoClaim.companyName,
            contactEmail: infoClaim.contactEmail,
            companyWebsite: infoClaim.companyWebsite,
          }
        : null,
      stats: {
        totalTools: tools.length,
        approvedClaims,
        pendingClaims,
        teamMembers: activeMembers + 1, // + the owner
      },
      analytics: {
        views,
        clicks,
        visits,
        reviews,
        bookmarks,
        avgRating: reviews > 0 ? (ratingWeight / reviews).toFixed(1) : "0.0",
      },
    },
  });
});

/* =====================================
   GET /api/company/tools
   ===================================== */
export const getCompanyTools = asyncHandler(async (req, res) => {
  const company = await resolveCompany(req);
  if (!company) {
    return sendErrorResponse(res, 404, "No company account found.");
  }

  const [tools, claims] = await Promise.all([
    Tool.find({ claimedBy: company.ownerId, isDeleted: false })
      .select(
        "name slug logo category pricing description verified featured views clicks rating reviewCount visitCount bookmarkCount createdAt"
      )
      .sort({ createdAt: -1 }),
    ToolClaim.find({ user: company.ownerId })
      .populate("tool", "name slug logo category")
      .sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      tools,
      claims,
      isOwner: company.isOwner,
      role: company.role,
    },
  });
});

/* =====================================
   GET /api/company/tools/:id
   ===================================== */
export const getCompanyTool = asyncHandler(async (req, res) => {
  const company = await resolveCompany(req);
  if (!company) {
    return sendErrorResponse(res, 404, "No company account found.");
  }

  const tool = await Tool.findOne({
    _id: req.params.id,
    claimedBy: company.ownerId,
    isDeleted: false,
  });

  if (!tool) {
    return sendErrorResponse(res, 404, "Tool not found or not owned by your company.");
  }

  res.status(200).json({ success: true, data: tool });
});

/* =====================================
   PUT /api/company/tools/:id
   ===================================== */
export const updateCompanyTool = asyncHandler(async (req, res) => {
  const company = await resolveCompany(req);
  if (!company) {
    return sendErrorResponse(res, 404, "No company account found.");
  }
  if (!canManage(company)) {
    return sendErrorResponse(res, 403, "You do not have permission to edit this tool.");
  }

  const tool = await Tool.findOne({
    _id: req.params.id,
    claimedBy: company.ownerId,
    isDeleted: false,
  });
  if (!tool) {
    return sendErrorResponse(res, 404, "Tool not found or not owned by your company.");
  }

  const allowed = [
    "description",
    "website",
    "pricing",
    "logo",
    "coverImage",
    "gallery",
    "features",
    "pros",
    "cons",
    "screenshots",
    "tags",
    "seoTitle",
    "seoDescription",
    "seoKeywords",
  ];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  // ----- validation & sanitization -----
  if (updates.description !== undefined) {
    const d = String(updates.description || "").trim();
    if (d.length < 30) return sendErrorResponse(res, 400, "Description must be at least 30 characters.");
    if (d.length > 5000) return sendErrorResponse(res, 400, "Description is too long.");
    updates.description = sanitizeTextField(d);
  }

  if (updates.website !== undefined) {
    const w = String(updates.website || "").trim();
    if (!w) return sendErrorResponse(res, 400, "Website is required.");
    if (!/^https?:\/\//i.test(w)) {
      return sendErrorResponse(res, 400, "Website must be a valid http(s) URL.");
    }
    updates.website = w;
  }

  if (updates.pricing !== undefined) {
    const p = String(updates.pricing);
    if (!["Free", "Freemium", "Paid", "Custom"].includes(p)) {
      return sendErrorResponse(res, 400, "Pricing must be one of: Free, Freemium, Paid, Custom.");
    }
    updates.pricing = p;
  }

  const arrayKeys = ["gallery", "features", "pros", "cons", "screenshots", "tags", "seoKeywords"];
  arrayKeys.forEach((key) => {
    if (updates[key] !== undefined) {
      updates[key] = Array.isArray(updates[key])
        ? updates[key].map((s) => sanitizeTextField(String(s || "").trim())).filter(Boolean)
        : [];
    }
  });

  ["logo", "coverImage", "seoTitle", "seoDescription"].forEach((key) => {
    if (updates[key] !== undefined) {
      updates[key] = sanitizeTextField(String(updates[key] || "").trim());
    }
  });

  Object.assign(tool, updates);
  tool.updatedBy = String(req.user.id);
  await tool.save();

  res.status(200).json({
    success: true,
    message: "Tool details updated successfully.",
    data: tool,
  });
});

/* =====================================
   GET /api/company/analytics
   ===================================== */
export const getCompanyAnalytics = asyncHandler(async (req, res) => {
  const company = await resolveCompany(req);
  if (!company) {
    return sendErrorResponse(res, 404, "No company account found.");
  }

  const tools = await Tool.find({ claimedBy: company.ownerId, isDeleted: false, verified: true }).select(
    "name slug logo category views clicks visitCount rating reviewCount bookmarkCount featured"
  );

  const perTool = tools.map((t) => ({
    _id: t._id,
    name: t.name,
    slug: t.slug,
    logo: t.logo,
    category: t.category,
    views: t.views || 0,
    clicks: t.clicks || 0,
    visits: t.visitCount || 0,
    rating: t.rating || 0,
    reviewCount: t.reviewCount || 0,
    bookmarkCount: t.bookmarkCount || 0,
    featured: t.featured,
  }));

  const totals = perTool.reduce(
    (acc, t) => {
      acc.views += t.views;
      acc.clicks += t.clicks;
      acc.visits += t.visits;
      acc.reviews += t.reviewCount;
      acc.bookmarks += t.bookmarkCount;
      acc.ratingWeight += t.rating * t.reviewCount;
      acc.tools += 1;
      return acc;
    },
    { views: 0, clicks: 0, visits: 0, reviews: 0, bookmarks: 0, ratingWeight: 0, tools: 0 }
  );

  res.status(200).json({
    success: true,
    data: {
      totals: {
        views: totals.views,
        clicks: totals.clicks,
        visits: totals.visits,
        reviews: totals.reviews,
        bookmarks: totals.bookmarks,
        toolsCount: totals.tools,
        avgRating: totals.reviews > 0 ? (totals.ratingWeight / totals.reviews).toFixed(1) : "0.0",
      },
      tools: perTool.sort((a, b) => b.views - a.views),
    },
  });
});

/* =====================================
   GET /api/company/team
   ===================================== */
export const getTeamMembers = asyncHandler(async (req, res) => {
  const company = await resolveCompany(req);
  if (!company) {
    return sendErrorResponse(res, 404, "No company account found.");
  }

  const [members, ownerUser] = await Promise.all([
    TeamMember.find({ companyOwner: company.ownerId })
      .populate("user", "name email avatar")
      .sort({ createdAt: 1 }),
    User.findById(company.ownerId).select("name email avatar"),
  ]);

  const owner = {
    _id: company.ownerId,
    companyOwner: company.ownerId,
    user: company.ownerId,
    name: ownerUser?.name || "",
    email: ownerUser?.email || "",
    avatar: ownerUser?.avatar || "",
    role: "owner",
    status: "active",
    isOwner: true,
  };

  res.status(200).json({
    success: true,
    data: {
      owner,
      members,
      isOwner: company.isOwner,
      role: company.role,
    },
  });
});

/* =====================================
   POST /api/company/team  (invite)
   ===================================== */
export const inviteTeamMember = asyncHandler(async (req, res) => {
  const company = await resolveCompany(req);
  if (!company || !company.isOwner) {
    return sendErrorResponse(res, 403, "Only the company owner can manage team members.");
  }

  const { email, name, role } = req.body;
  if (!email || !email.trim()) {
    return sendErrorResponse(res, 400, "Email is required.");
  }
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return sendErrorResponse(res, 400, "Invalid email address.");
  }
  const memberRole = ["admin", "editor", "viewer"].includes(role) ? role : "editor";

  const existing = await TeamMember.findOne({ companyOwner: company.ownerId, email: normalized });
  if (existing) {
    return sendErrorResponse(res, 409, "A team member with this email already exists.");
  }

  const targetUser = await User.findOne({ email: normalized });
  const token = crypto.randomBytes(32).toString("hex");

  const member = await TeamMember.create({
    companyOwner: company.ownerId,
    user: targetUser ? targetUser._id : null,
    name: name ? sanitizeTextField(String(name).trim()) : targetUser ? targetUser.name : "",
    email: normalized,
    role: memberRole,
    status: targetUser ? "active" : "invited",
    inviteToken: token,
    inviteTokenExpire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.status(201).json({
    success: true,
    message: targetUser
      ? "Team member added."
      : "Invitation created. The member will be activated when they accept.",
    data: member,
  });
});

/* =====================================
   PUT /api/company/team/:id
   ===================================== */
export const updateTeamMember = asyncHandler(async (req, res) => {
  const company = await resolveCompany(req);
  if (!company || !company.isOwner) {
    return sendErrorResponse(res, 403, "Only the company owner can manage team members.");
  }

  const member = await TeamMember.findOne({ _id: req.params.id, companyOwner: company.ownerId });
  if (!member) {
    return sendErrorResponse(res, 404, "Team member not found.");
  }

  if (req.body.role !== undefined) {
    if (!["admin", "editor", "viewer"].includes(req.body.role)) {
      return sendErrorResponse(res, 400, "Invalid role.");
    }
    member.role = req.body.role;
  }
  if (req.body.status !== undefined) {
    if (!["active", "inactive"].includes(req.body.status)) {
      return sendErrorResponse(res, 400, "Invalid status.");
    }
    member.status = req.body.status;
  }

  await member.save();
  res.status(200).json({ success: true, message: "Team member updated.", data: member });
});

/* =====================================
   DELETE /api/company/team/:id
   ===================================== */
export const removeTeamMember = asyncHandler(async (req, res) => {
  const company = await resolveCompany(req);
  if (!company || !company.isOwner) {
    return sendErrorResponse(res, 403, "Only the company owner can manage team members.");
  }

  const member = await TeamMember.findOneAndDelete({ _id: req.params.id, companyOwner: company.ownerId });
  if (!member) {
    return sendErrorResponse(res, 404, "Team member not found.");
  }

  res.status(200).json({ success: true, message: "Team member removed." });
});

export default {
  getCompanyOverview,
  getCompanyTools,
  getCompanyTool,
  updateCompanyTool,
  getCompanyAnalytics,
  getTeamMembers,
  inviteTeamMember,
  updateTeamMember,
  removeTeamMember,
};
