import express from "express";
import { submitToolRequest } from "../controllers/toolRequestController.js";
import { verifyUser } from "../middleware/auth.js";

/* ===========================
   TOOL REQUEST ROUTES  (/api/tool-requests)
   All routes require an authenticated user.
   =========================== */
const router = express.Router();

/**
 * POST /api/tool-requests
 * - Logged-in user only.
 * - Saves a new tool request.
 */
router.post("/", verifyUser, submitToolRequest);

export default router;