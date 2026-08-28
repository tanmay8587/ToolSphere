import express from "express";
import { submitToolClaim, getMyToolClaims } from "../controllers/toolClaimController.js";
import { verifyUser } from "../middleware/auth.js";

/* ===========================
   TOOL CLAIM ROUTES  (/api/tool-claims)
   All routes require an authenticated user.
   =========================== */
const router = express.Router();

/**
 * POST /api/tool-claims
 * - Logged-in user only.
 * - Company claims an existing tool by submitting verification details.
 */
router.post("/", verifyUser, submitToolClaim);

/**
 * GET /api/tool-claims/my
 * - Logged-in user only.
 * - Lists the claims submitted by the current user.
 */
router.get("/my", verifyUser, getMyToolClaims);

export default router;