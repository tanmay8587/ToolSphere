import asyncHandler from "../middleware/asyncHandler.js";
import UserToolList from "../models/UserToolList.js";
import { sendErrorResponse } from "../utils/errorResponse.js";

/**
 * POST /api/user-tool-lists
 * - Logged-in user only.
 * - Creates a new tool list with a name for the current user.
 * - Returns the created list.
 */
export const createUserToolList = asyncHandler(async (req, res) => {
  const { name, isPublic } = req.body;

  if (!name || !name.trim()) {
    return sendErrorResponse(res, 400, "List name is required.");
  }

  const userToolList = await UserToolList.create({
    user: req.user.id,
    name: name.trim(),
    tools: [],
    isPublic: isPublic || false,
    sharedWith: [],
  });

  res.status(201).json({
    success: true,
    data: userToolList,
  });
});

/**
 * GET /api/user-tool-lists
 * - Logged-in user only.
 * - Returns all lists belonging to the current user, with tool data populated.
 */
export const getUserToolLists = asyncHandler(async (req, res) => {
  const lists = await UserToolList.find({ user: req.user.id }).populate("tools");

  res.status(200).json({
    success: true,
    data: lists,
  });
});

/**
 * GET /api/user-tool-lists/shared
 * - Logged-in user only.
 * - Returns all lists shared with the current user.
 */
export const getSharedUserToolLists = asyncHandler(async (req, res) => {
  const lists = await UserToolList.find({
    sharedWith: req.user.id,
  }).populate("tools user");

  res.status(200).json({
    success: true,
    data: lists,
  });
});

/**
 * GET /api/user-tool-lists/public
 * - Public endpoint (no auth required).
 * - Returns all public lists with tool data populated.
 */
export const getPublicUserToolLists = asyncHandler(async (req, res) => {
  const lists = await UserToolList.find({ isPublic: true }).populate("tools user");

  res.status(200).json({
    success: true,
    data: lists,
  });
});

/**
 * GET /api/user-tool-lists/:id
 * - Logged-in user only (owner or shared user).
 * - Returns a specific list with tool data populated.
 */
export const getUserToolListById = asyncHandler(async (req, res) => {
  const list = await UserToolList.findOne({
    _id: req.params.id,
    $or: [
      { user: req.user.id },
      { sharedWith: req.user.id },
      { isPublic: true },
    ],
  }).populate("tools user");

  if (!list) {
    return sendErrorResponse(res, 404, "List not found or you don't have access.");
  }

  res.status(200).json({
    success: true,
    data: list,
  });
});

/**
 * POST /api/user-tool-lists/:id/tools
 * - Logged-in user only (owner or shared user with edit access).
 * - Adds a tool to the list, preventing duplicates.
 */
export const addToolToList = asyncHandler(async (req, res) => {
  const { toolId } = req.body;

  if (!toolId) {
    return sendErrorResponse(res, 400, "Tool ID is required.");
  }

  const list = await UserToolList.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!list) {
    return sendErrorResponse(res, 404, "List not found or you don't have permission to edit.");
  }

  if (list.tools.includes(toolId)) {
    return sendErrorResponse(res, 400, "Tool already exists in this list.");
  }

  list.tools.push(toolId);
  await list.save();

  const updated = await list.populate("tools");

  res.status(200).json({
    success: true,
    data: updated,
  });
});

/**
 * DELETE /api/user-tool-lists/:id/tools
 * - Logged-in user only (owner or shared user with edit access).
 * - Removes a tool from the list.
 */
export const removeToolFromList = asyncHandler(async (req, res) => {
  const { toolId } = req.body;

  if (!toolId) {
    return sendErrorResponse(res, 400, "Tool ID is required.");
  }

  const list = await UserToolList.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!list) {
    return sendErrorResponse(res, 404, "List not found or you don't have permission to edit.");
  }

  list.tools = list.tools.filter(
    (id) => id.toString() !== toolId.toString()
  );
  await list.save();

  const updated = await list.populate("tools");

  res.status(200).json({
    success: true,
    data: updated,
  });
});

/**
 * PATCH /api/user-tool-lists/:id
 * - Logged-in user only (owner only).
 * - Renames the list or toggles public/private status.
 */
export const updateUserToolList = asyncHandler(async (req, res) => {
  const { name, isPublic } = req.body;

  const list = await UserToolList.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!list) {
    return sendErrorResponse(res, 404, "List not found or you don't have permission to edit.");
  }

  if (name !== undefined && name.trim()) {
    list.name = name.trim();
  }

  if (isPublic !== undefined) {
    list.isPublic = isPublic;
  }

  await list.save();

  res.status(200).json({
    success: true,
    data: list,
  });
});

/**
 * DELETE /api/user-tool-lists/:id
 * - Logged-in user only (owner only).
 * - Deletes the list.
 */
export const deleteUserToolList = asyncHandler(async (req, res) => {
  const list = await UserToolList.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!list) {
    return sendErrorResponse(res, 404, "List not found or you don't have permission to delete.");
  }

  res.status(200).json({
    success: true,
    message: "List deleted successfully.",
  });
});

/**
 * POST /api/user-tool-lists/:id/share
 * - Logged-in user only (owner only).
 * - Shares the list with another user by email.
 */
export const shareUserToolList = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return sendErrorResponse(res, 400, "Email is required.");
  }

  const list = await UserToolList.findOne({
    _id: req.params.id,
    user: req.user.id,
  }).populate("sharedWith");

  if (!list) {
    return sendErrorResponse(res, 404, "List not found or you don't have permission to share.");
  }

  // Import User model to find user by email
  const User = (await import("../models/User.js")).default;
  const userToShare = await User.findOne({ email: email.trim().toLowerCase() });

  if (!userToShare) {
    return sendErrorResponse(res, 404, "User with this email not found.");
  }

  // Check if already shared with this user
  if (list.sharedWith.some((user) => user._id.toString() === userToShare._id.toString())) {
    return sendErrorResponse(res, 400, "List is already shared with this user.");
  }

  // Check if trying to share with themselves
  if (userToShare._id.toString() === req.user.id.toString()) {
    return sendErrorResponse(res, 400, "You cannot share a list with yourself.");
  }

  list.sharedWith.push(userToShare._id);
  await list.save();

  const updated = await list.populate("sharedWith user tools");

  res.status(200).json({
    success: true,
    data: updated,
    message: "List shared successfully.",
  });
});

/**
 * DELETE /api/user-tool-lists/:id/share/:userId
 * - Logged-in user only (owner only).
 * - Removes a user from the shared list.
 */
export const unshareUserToolList = asyncHandler(async (req, res) => {
  const list = await UserToolList.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!list) {
    return sendErrorResponse(res, 404, "List not found or you don't have permission to modify sharing.");
  }

  list.sharedWith = list.sharedWith.filter(
    (userId) => userId.toString() !== req.params.userId.toString()
  );
  await list.save();

  const updated = await list.populate("sharedWith user tools");

  res.status(200).json({
    success: true,
    data: updated,
    message: "User removed from shared list.",
  });
});

export default {
  createUserToolList,
  getUserToolLists,
  getSharedUserToolLists,
  getPublicUserToolLists,
  getUserToolListById,
  addToolToList,
  removeToolFromList,
  updateUserToolList,
  deleteUserToolList,
  shareUserToolList,
  unshareUserToolList,
};