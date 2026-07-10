import express from "express";

import {
  subscribe,
  verifyNewsletter,
  unsubscribe,
  getSubscribers,
  deleteSubscriber,
  resendVerification,
  getNewsletterStats,
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
 * GET /api/newsletter/verify/:token
 * - Verify a newsletter subscription via the email confirmation token
 */
router.get("/verify/:token", verifyNewsletter);

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
 * - Get all subscribers (admin only, paginated + search + filter + sort)
 */
router.get("/subscribers", verifyAdmin, getSubscribers);

/**
 * GET /api/newsletter/stats
 * - Get newsletter dashboard statistics (admin only)
 */
router.get("/stats", verifyAdmin, getNewsletterStats);

/**
 * DELETE /api/newsletter/subscribers/:id
 * - Delete subscriber (admin only)
 */
router.delete("/subscribers/:id", verifyAdmin, deleteSubscriber);

/**
 * POST /api/newsletter/subscribers/:id/resend-verification
 * - Resend verification email to a subscriber (admin only)
 */
router.post("/subscribers/:id/resend-verification", verifyAdmin, resendVerification);

export default router;