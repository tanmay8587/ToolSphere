import asyncHandler from "../middleware/asyncHandler.js";
import ToolClaim from "../models/ToolClaim.js";
import Tool from "../models/Tool.js";
import { sanitizeTextField } from "../utils/validation.js";
import { sendErrorResponse } from "../utils/errorResponse.js";
import { createNotification } from "../utils/notificationHelper.js";
import logger from "../utils/logger.js";

/* =====================================
   USER - SUBMIT A TOOL CLAIM
===================================== */

/**
 * POST /api/tool-claims
 * - Logged-in user only.
 * - Company claims an existing tool listing by submitting verification info.
 */
export const submitToolClaim = asyncHandler(async (req, res) => {
  const { tool, companyName, contactEmail, companyWebsite, role, verificationDetails } = req.body;

  if (!tool || !tool.trim()) {
    return sendErrorResponse(res, 400, "Tool is required.");
  }

  if (!companyName || !companyName.trim()) {
    return sendErrorResponse(res, 400, "Company name is required.");
  }

  if (!contactEmail || !contactEmail.trim()) {
    return sendErrorResponse(res, 400, "Company contact email is required for verification.");
  }

  const claimedTool = await Tool.findOne({
    _id: tool,
    isDeleted: false,
  });

  if (!claimedTool) {
    return sendErrorResponse(res, 404, "Tool not found.");
  }

  // A tool that already has an approved/verified owner cannot be claimed again.
  if (claimedTool.verified) {
    return sendErrorResponse(res, 409, "This tool has already been claimed and verified.");
  }

  // Block duplicate claims (pending or approved) by the same user for the same tool.
  const existingClaim = await ToolClaim.findOne({
    user: req.user.id,
    tool: claimedTool._id,
    status: { $in: ["pending", "approved"] },
  });

  if (existingClaim) {
    return sendErrorResponse(res, 409, "You already have an active claim for this tool.");
  }

  const toolClaim = await ToolClaim.create({
    user: req.user.id,
    tool: claimedTool._id,
    companyName: sanitizeTextField(companyName.trim()),
    contactEmail: contactEmail.trim().toLowerCase(),
    companyWebsite: companyWebsite && companyWebsite.trim() ? companyWebsite.trim() : "",
    role: role && role.trim() ? sanitizeTextField(role.trim()) : "",
    verificationDetails:
      verificationDetails && verificationDetails.trim()
        ? sanitizeTextField(verificationDetails.trim())
        : "",
  });

  res.status(201).json({
    success: true,
    message: "Your claim request has been submitted for review.",
    data: toolClaim,
  });
});

/* =====================================
   USER - GET MY CLAIMS
===================================== */

/**
 * GET /api/tool-claims/my
 * - Logged-in user only.
 * - Returns all claims submitted by the current user, with tool details populated.
 */
export const getMyToolClaims = asyncHandler(async (req, res) => {
  const claims = await ToolClaim.find({ user: req.user.id })
    .populate("tool", "name slug logo category verified")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: claims,
  });
});

/* =====================================
   ADMIN - LIST ALL CLAIMS
===================================== */

/**
 * GET /api/admin/tool-claims
 * - Admin only.
 * - Returns all claim requests, optionally filtered by status and search.
 */
export const getAllClaims = asyncHandler(async (req, res) => {
  const { status = "All", search = "", page = "1", limit = "20" } = req.query;

  const filters = {};

  if (status && status !== "All") {
    const allowed = ["pending", "approved", "rejected", "revoked"];
    if (!allowed.includes(status)) {
      return sendErrorResponse(res, 400, `Status must be one of: ${allowed.join(", ")}.`);
    }
    filters.status = status;
  }

  const pageNumber = Math.max(1, Number(page));
  const limitNumber = Math.max(1, Number(limit));

  // Optional search by tool name/slug.
  if (typeof search === "string" && search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matchingTools = await Tool.find({
      isDeleted: false,
      $or: [
        { name: { $regex: escapedSearch, $options: "i" } },
        { slug: { $regex: escapedSearch, $options: "i" } },
      ],
    })
      .select("_id")
      .lean();

    if (matchingTools.length > 0) {
      filters.tool = { $in: matchingTools.map((t) => t._id) };
    } else {
      // No matching tools found, so no claims can match.
      return res.status(200).json({
        success: true,
        total: 0,
        data: [],
        pagination: { total: 0, page: pageNumber, limit: limitNumber, pages: 0 },
      });
    }
  }

  const [total, claims] = await Promise.all([
    ToolClaim.countDocuments(filters),
    ToolClaim.find(filters)
      .populate("tool", "name slug logo category verified pricing")
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber),
  ]);

  res.status(200).json({
    success: true,
    total,
    data: claims,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      pages: Math.ceil(total / limitNumber),
    },
  });
});

/* =====================================
   ADMIN - UPDATE CLAIM STATUS
===================================== */

/**
 * PUT /api/admin/tool-claims/:id/status
 * - Admin only.
 * - Approve: marks the tool as verified and stores the claiming user.
 * - Reject / Revoke: marks the claim accordingly (revoke also un-verifies the tool).
 * - Notifies the claiming user about the outcome.
 */
export const updateClaimStatus = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;

  const allowed = ["approved", "rejected", "revoked"];
  if (!status || !allowed.includes(status)) {
    return sendErrorResponse(res, 400, `Status must be one of: ${allowed.join(", ")}.`);
  }

  const toolClaim = await ToolClaim.findById(req.params.id);

  if (!toolClaim) {
    return sendErrorResponse(res, 404, "Tool claim not found.");
  }

  const tool = await Tool.findById(toolClaim.tool);

  if (!tool) {
    return sendErrorResponse(res, 404, "Claimed tool not found.");
  }

  toolClaim.status = status;
  toolClaim.adminNote = adminNote && adminNote.trim() ? sanitizeTextField(adminNote.trim()) : "";
  toolClaim.reviewedBy = req.admin.id;
  toolClaim.reviewedAt = new Date();
  await toolClaim.save();

  // Update the tool's verification state based on the decision.
  if (status === "approved") {
    tool.verified = true;
    tool.verifiedAt = new Date();
    tool.claimedBy = toolClaim.user;
  } else if (status === "revoked") {
    // Revoking removes the verified badge and releases ownership.
    tool.verified = false;
    tool.verifiedAt = null;
    if (tool.claimedBy && String(tool.claimedBy) === String(toolClaim.user)) {
      tool.claimedBy = null;
    }
  }
  await tool.save();

  // Notify the claiming user about the decision.
  try {
    const titleMap = {
      approved: "Tool Claim Approved",
      rejected: "Tool Claim Rejected",
      revoked: "Tool Claim Revoked",
    };
    const messageMap = {
      approved: `Your claim for "${tool.name}" has been approved. The tool is now verified.`,
      rejected: `Your claim for "${tool.name}" has been rejected.${
        toolClaim.adminNote ? ` Reason: ${toolClaim.adminNote}` : ""
      }`,
      revoked: `The verified claim for "${tool.name}" has been revoked.${
        toolClaim.adminNote ? ` Reason: ${toolClaim.adminNote}` : ""
      }`,
    };

    await createNotification({
      user: toolClaim.user,
      title: titleMap[status] || "Tool Claim Updated",
      message: messageMap[status] || `Your claim for "${tool.name}" was updated to ${status}.`,
      type: "tool_claim_update",
      relatedId: toolClaim.tool,
    });
  } catch (err) {
    // Log but never fail the request if the notification fails.
    logger.error("[updateClaimStatus] Failed to notify user:", err);
  }

  res.status(200).json({
    success: true,
    message:
      status === "approved"
        ? `Claim approved. "${tool.name}" is now verified.`
        : status === "rejected"
        ? "Claim rejected."
        : "Claim revoked.",
    data: toolClaim,
  });
});

export default {
  submitToolClaim,
  getMyToolClaims,
  getAllClaims,
  updateClaimStatus,
};