import asyncHandler from "../middleware/asyncHandler.js";
import ToolRequest from "../models/ToolRequest.js";
import { sendErrorResponse } from "../utils/errorResponse.js";

/**
 * POST /api/tool-requests
 * - Logged-in user only.
 * - Saves a new tool request submitted by the current user.
 * - Returns the created request.
 */
export const submitToolRequest = asyncHandler(async (req, res) => {
  const { toolName, website, category, description } = req.body;

  if (!toolName || !toolName.trim()) {
    return sendErrorResponse(res, 400, "Tool name is required.");
  }

  if (!category || !category.trim()) {
    return sendErrorResponse(res, 400, "Category is required.");
  }

  const toolRequest = await ToolRequest.create({
    user: req.user.id,
    toolName: toolName.trim(),
    website: website && website.trim() ? website.trim() : "",
    category: category.trim(),
    description: description && description.trim() ? description.trim() : "",
  });

  res.status(201).json({
    success: true,
    data: toolRequest,
  });
});

/**
 * GET /api/admin/tool-requests
 * - Admin only.
 * - Returns all tool requests, most recent first, with user data populated.
 */
export const getAllToolRequests = asyncHandler(async (req, res) => {
  const toolRequests = await ToolRequest.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: toolRequests,
  });
});

export default { submitToolRequest, getAllToolRequests };
