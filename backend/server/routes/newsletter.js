import express from "express";

import {
  subscribe,
  unsubscribe,
  getSubscribers,
  deleteSubscriber,
} from "../controllers/newsletterController.js";

import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ===========================
   PUBLIC ROUTES
   =========================== */

/**
 * POST /api/newsletter/subscribe
 * - Subscribe to newsletter (supports both authenticated and guest users)
 */
router.post("/subscribe", subscribe);

/**
 * POST /api/newsletter/unsubscribe
 * - Unsubscribe from newsletter
 */
router.post("/unsubscribe", unsubscribe);

/* ===========================
   ADMIN ROUTES
=========================== */

/**
 * GET /api/newsletter/subscribers
 * - Get all subscribers (admin only)
 */
router.get("/subscribers", verifyAdmin, getSubscribers);

/**
 * DELETE /api/newsletter/subscribers/:id
 * - Delete subscriber (admin only)
 */
router.delete("/subscribers/:id", verifyAdmin, deleteSubscriber);

export default router;