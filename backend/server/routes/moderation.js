import express from "express";

import {
  getPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  requestChanges,
} from "../controllers/moderationController.js";

import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ===========================
   MODERATION QUEUE (ADMIN)
   =========================== */

/* Pending submissions */
router.get("/pending", verifyAdmin, getPendingSubmissions);

/* Approve / Reject / Request Changes */
router.put("/:id/approve", verifyAdmin, approveSubmission);
router.put("/:id/reject", verifyAdmin, rejectSubmission);
router.put("/:id/request-changes", verifyAdmin, requestChanges);

export default router;