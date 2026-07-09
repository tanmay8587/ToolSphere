import express from "express";

import {
  getAnalyticsSettings,
  getAllAnalyticsSettings,
  updateAnalyticsSetting,
  initializeAnalyticsSettings,
} from "../controllers/analyticsController.js";

import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ===========================
   PUBLIC ROUTES
   =========================== */
router.get("/", getAnalyticsSettings);

/* ===========================
   ADMIN ROUTES
   =========================== */
router.get("/admin/all", verifyAdmin, getAllAnalyticsSettings);
router.put("/admin/:key", verifyAdmin, updateAnalyticsSetting);
router.post("/admin/initialize", verifyAdmin, initializeAnalyticsSettings);

export default router;