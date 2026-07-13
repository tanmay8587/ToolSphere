import express from "express";
import { createCollection, getCollections, addToolToCollection, removeToolFromCollection, renameCollection, deleteCollection } from "../controllers/collectionController.js";
import { verifyUser } from "../middleware/auth.js";

/* ===========================
   COLLECTION ROUTES  (/api/collections)
   All routes require an authenticated user.
   =========================== */
const router = express.Router();

/**
 * POST /api/collections
 * - Logged-in user only.
 * - Creates a new collection with a name.
 */
router.post("/", verifyUser, createCollection);

/**
 * GET /api/collections
 * - Logged-in user only.
 * - Returns all collections of the current user (tool data populated).
 */
router.get("/", verifyUser, getCollections);

/**
 * POST /api/collections/:id/tools
 * - Logged-in user only.
 * - Adds a tool to the collection (no duplicates).
 */
router.post("/:id/tools", verifyUser, addToolToCollection);

/**
 * DELETE /api/collections/:id/tools
 * - Logged-in user only.
 * - Removes a tool from the collection.
 */
router.delete("/:id/tools", verifyUser, removeToolFromCollection);

/**
 * PATCH /api/collections/:id
 * - Logged-in user only.
 * - Renames the collection.
 */
router.patch("/:id", verifyUser, renameCollection);

/**
 * DELETE /api/collections/:id
 * - Logged-in user only.
 * - Deletes the collection.
 */
router.delete("/:id", verifyUser, deleteCollection);

export default router;
