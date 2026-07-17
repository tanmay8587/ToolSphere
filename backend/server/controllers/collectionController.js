import asyncHandler from "../middleware/asyncHandler.js";
import Collection from "../models/Collection.js";
import { sendErrorResponse } from "../utils/errorResponse.js";

/**
 * POST /api/collections
 * - Logged-in user only.
 * - Creates a new collection with a name for the current user.
 * - Returns the created collection.
 */
export const createCollection = asyncHandler(async (req, res) => {
  const { name, isPublic } = req.body;

  if (!name || !name.trim()) {
    return sendErrorResponse(res, 400, "Collection name is required.");
  }

  const collection = await Collection.create({
    user: req.user.id,
    name: name.trim(),
    tools: [],
    isPublic: isPublic || false,
  });

  res.status(201).json({
    success: true,
    data: collection,
  });
});

/**
 * GET /api/collections
 * - Logged-in user only.
 * - Returns all collections belonging to the current user, with tool data populated.
 */
export const getCollections = asyncHandler(async (req, res) => {
  const collections = await Collection.find({ user: req.user.id }).populate("tools");

  res.status(200).json({
    success: true,
    data: collections,
  });
});

/**
 * POST /api/collections/:id/tools
 * - Logged-in user only.
 * - Adds a tool to the user's collection, preventing duplicates.
 */
export const addToolToCollection = asyncHandler(async (req, res) => {
  const { toolId } = req.body;

  if (!toolId) {
    return sendErrorResponse(res, 400, "Tool ID is required.");
  }

  const collection = await Collection.findOne({ _id: req.params.id, user: req.user.id });

  if (!collection) {
    return sendErrorResponse(res, 404, "Collection not found.");
  }

  if (collection.tools.includes(toolId)) {
    return sendErrorResponse(res, 400, "Tool already exists in this collection.");
  }

  collection.tools.push(toolId);
  await collection.save();

  const updated = await collection.populate("tools");

  res.status(200).json({
    success: true,
    data: updated,
  });
});

export const removeToolFromCollection = asyncHandler(async (req, res) => {
  const { toolId } = req.body;

  if (!toolId) {
    return sendErrorResponse(res, 400, "Tool ID is required.");
  }

  const collection = await Collection.findOne({ _id: req.params.id, user: req.user.id });

  if (!collection) {
    return sendErrorResponse(res, 404, "Collection not found.");
  }

  collection.tools = collection.tools.filter(
    (id) => id.toString() !== toolId.toString()
  );
  await collection.save();

  const updated = await collection.populate("tools");

  res.status(200).json({
    success: true,
    data: updated,
  });
});

export const renameCollection = asyncHandler(async (req, res) => {
  const { name, isPublic } = req.body;

  if (!name || !name.trim()) {
    return sendErrorResponse(res, 400, "Collection name is required.");
  }

  const collection = await Collection.findOne({ _id: req.params.id, user: req.user.id });

  if (!collection) {
    return sendErrorResponse(res, 404, "Collection not found.");
  }

  collection.name = name.trim();
  if (isPublic !== undefined) {
    collection.isPublic = isPublic;
  }
  await collection.save();

  res.status(200).json({
    success: true,
    data: collection,
  });
});

export const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!collection) {
    return sendErrorResponse(res, 404, "Collection not found.");
  }

  res.status(200).json({
    success: true,
    message: "Collection deleted successfully.",
  });
});

/**
 * GET /api/collections/shared/:shareId
 * - Public (no authentication required).
 * - Returns a single public collection by its shareId, with tool data and
 *   owner info populated. Returns 404 if the collection is private or missing.
 */
export const getSharedCollection = asyncHandler(async (req, res) => {
  const { shareId } = req.params;

  if (!shareId) {
    return sendErrorResponse(res, 400, "Share ID is required.");
  }

  const collection = await Collection.findOne({ shareId, isPublic: true })
    .populate("tools")
    .populate("user", "name avatar");

  if (!collection) {
    return sendErrorResponse(res, 404, "Shared collection not found or is private.");
  }

  res.status(200).json({
    success: true,
    data: collection,
  });
});

export default { createCollection, getCollections, addToolToCollection, removeToolFromCollection, renameCollection, deleteCollection, getSharedCollection };
