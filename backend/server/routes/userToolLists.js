import express from "express";
import { createUserToolList, getUserToolLists, getSharedUserToolLists, getPublicUserToolLists, getUserToolListById, addToolToList, removeToolFromList, updateUserToolList, deleteUserToolList, shareUserToolList, unshareUserToolList } from "../controllers/userToolListController.js";
import { verifyUser } from "../middleware/auth.js";

/* ===========================
   USER TOOL LIST ROUTES  (/api/user-tool-lists)
   All routes require an authenticated user unless specified.
   =========================== */
const router = express.Router();

/**
 * POST /api/user-tool-lists
 * - Logged-in user only.
 * - Creates a new tool list with a name.
 */
router.post("/", verifyUser, createUserToolList);

/**
 * GET /api/user-tool-lists
 * - Logged-in user only.
 * - Returns all lists of the current user (tool data populated).
 */
router.get("/", verifyUser, getUserToolLists);

/**
 * GET /api/user-tool-lists/shared
 * - Logged-in user only.
 * - Returns all lists shared with the current user.
 */
router.get("/shared", verifyUser, getSharedUserToolLists);

/**
 * GET /api/user-tool-lists/public
 * - Public endpoint (no auth required).
 * - Returns all public lists.
 */
router.get("/public", getPublicUserToolLists);

/**
 * GET /api/user-tool-lists/:id
 * - Logged-in user only (owner or shared user).
 * - Returns a specific list with tool data populated.
 */
router.get("/:id", verifyUser, getUserToolListById);

/**
 * POST /api/user-tool-lists/:id/tools
 * - Logged-in user only (owner only).
 * - Adds a tool to the list (no duplicates).
 */
router.post("/:id/tools", verifyUser, addToolToList);

/**
 * DELETE /api/user-tool-lists/:id/tools
 * - Logged-in user only (owner only).
 * - Removes a tool from the list.
 */
router.delete("/:id/tools", verifyUser, removeToolFromList);

/**
 * PATCH /api/user-tool-lists/:id
 * - Logged-in user only (owner only).
 * - Renames the list or toggles public/private status.
 */
router.patch("/:id", verifyUser, updateUserToolList);

/**
 * DELETE /api/user-tool-lists/:id
 * - Logged-in user only (owner only).
 * - Deletes the list.
 */
router.delete("/:id", verifyUser, deleteUserToolList);

/**
 * POST /api/user-tool-lists/:id/share
 * - Logged-in user only (owner only).
 * - Shares the list with another user by email.
 */
router.post("/:id/share", verifyUser, shareUserToolList);

/**
 * DELETE /api/user-tool-lists/:id/share/:userId
 * - Logged-in user only (owner only).
 * - Removes a user from the shared list.
 */
router.delete("/:id/share/:userId", verifyUser, unshareUserToolList);

export default router;