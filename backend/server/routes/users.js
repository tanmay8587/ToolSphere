import express from "express";
import { getSavedBlogs } from "../controllers/userController.js";
import { verifyUser } from "../middleware/auth.js";

/* ===========================
   USER ROUTES  (/api/users)
   All routes require an authenticated user.
   =========================== */
const router = express.Router();

/**
 * GET /api/users/me/saved-blogs
 * - Returns the current user's saved blogs (populated).
 */
router.get("/me/saved-blogs", verifyUser, getSavedBlogs);

export default router;