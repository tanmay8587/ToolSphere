import Tool from "../models/Tool.js";
import User from "../models/User.js";

import logger from "../utils/logger.js";
import { logActivity } from "../utils/activityLogger.js";
import { createNotification } from "../utils/notificationHelper.js";

/* =====================================
   MODERATION QUEUE - GET PENDING SUBMISSIONS
   ===================================== */

export const getPendingSubmissions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filters = {
      isDeleted: false,
      status: "pending",
    };

    const [tools, total] = await Promise.all([
      Tool.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Tool.countDocuments(filters),
    ]);

    res.json({
      success: true,
      tools,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error("[getPendingSubmissions] Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending submissions",
    });
  }
};

/* =====================================
   MODERATION QUEUE - APPROVE SUBMISSION
   ===================================== */

export const approveSubmission = async (req, res) => {
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
    tool.moderationNote = "";
    tool.updatedBy = req.admin?.email || "admin";

    await tool.save();

    await logActivity({
      admin: req.admin?.id || null,
      adminName: req.admin?.email || "admin",
      action: "approve",
      resource: "Tool",
      resourceId: tool._id,
      details: `Approved tool submission "${tool.name}"`,
    });

    // Notify the tool owner/creator about the approval
    if (tool.createdBy && tool.createdBy !== "admin" && tool.createdBy !== "system") {
      try {
        const owner = await User.findOne({ email: tool.createdBy.toLowerCase() });
        if (owner) {
          await createNotification({
            user: owner._id,
            title: "Tool Approved",
            message: `Your tool "${tool.name}" has been approved and is now live.`,
            type: "tool_approved",
            relatedId: tool._id,
          });
        }
      } catch (err) {
        logger.error("[approveSubmission] Failed to notify tool owner:", err);
      }
    }

    res.json({
      success: true,
      message: "Tool approved successfully",
      tool,
    });
  } catch (err) {
    logger.error("[approveSubmission] Error:", err);
    res.status(500).json({
      success: false,
      message: "Approve failed",
    });
  }
};

/* =====================================
   MODERATION QUEUE - REJECT SUBMISSION
   ===================================== */

export const rejectSubmission = async (req, res) => {
  try {
    const { reason = "" } = req.body;
    const tool = await Tool.findById(req.params.id);

    if (!tool || tool.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Tool not found",
      });
    }

    tool.approved = false;
    tool.status = "rejected";
    tool.rejectedReason = String(reason || "Rejected by admin").trim();
    tool.moderationNote = "";
    tool.updatedBy = req.admin?.email || "admin";

    await tool.save();

    await logActivity({
      admin: req.admin?.id || null,
      adminName: req.admin?.email || "admin",
      action: "reject",
      resource: "Tool",
      resourceId: tool._id,
      details: `Rejected tool submission "${tool.name}"${tool.rejectedReason ? `: ${tool.rejectedReason}` : ""}`,
    });

    // Notify the tool owner/creator about the rejection
    if (tool.createdBy && tool.createdBy !== "admin" && tool.createdBy !== "system") {
      try {
        const owner = await User.findOne({ email: tool.createdBy.toLowerCase() });
        if (owner) {
          await createNotification({
            user: owner._id,
            title: "Tool Rejected",
            message: `Your tool "${tool.name}" was rejected.${tool.rejectedReason ? ` Reason: ${tool.rejectedReason}` : ""}`,
            type: "tool_rejected",
            relatedId: tool._id,
          });
        }
      } catch (err) {
        logger.error("[rejectSubmission] Failed to notify tool owner:", err);
      }
    }

    res.json({
      success: true,
      message: "Tool rejected successfully",
      tool,
    });
  } catch (err) {
    logger.error("[rejectSubmission] Error:", err);
    res.status(500).json({
      success: false,
      message: "Reject failed",
    });
  }
};

/* =====================================
   MODERATION QUEUE - REQUEST CHANGES
   ===================================== */

export const requestChanges = async (req, res) => {
  try {
    const { note = "" } = req.body;

    if (!note || !String(note).trim()) {
      return res.status(400).json({
        success: false,
        message: "A change request note is required",
      });
    }

    const tool = await Tool.findById(req.params.id);

    if (!tool || tool.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Tool not found",
      });
    }

    tool.approved = false;
    tool.status = "changes_requested";
    tool.moderationNote = String(note).trim();
    tool.rejectedReason = "";
    tool.updatedBy = req.admin?.email || "admin";

    await tool.save();

    await logActivity({
      admin: req.admin?.id || null,
      adminName: req.admin?.email || "admin",
      action: "request_changes",
      resource: "Tool",
      resourceId: tool._id,
      details: `Requested changes for tool "${tool.name}": ${tool.moderationNote}`,
    });

    // Notify the tool owner/creator about the requested changes
    if (tool.createdBy && tool.createdBy !== "admin" && tool.createdBy !== "system") {
      try {
        const owner = await User.findOne({ email: tool.createdBy.toLowerCase() });
        if (owner) {
          await createNotification({
            user: owner._id,
            title: "Changes Requested",
            message: `Changes were requested for your tool "${tool.name}".${tool.moderationNote ? ` Details: ${tool.moderationNote}` : ""}`,
            type: "tool_changes_requested",
            relatedId: tool._id,
          });
        }
      } catch (err) {
        logger.error("[requestChanges] Failed to notify tool owner:", err);
      }
    }

    res.json({
      success: true,
      message: "Change request sent successfully",
      tool,
    });
  } catch (err) {
    logger.error("[requestChanges] Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to request changes",
    });
  }
};