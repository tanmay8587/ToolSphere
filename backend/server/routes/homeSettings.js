import express from "express";

import {
  getHomeSettings,
  updateHomeSettings,
} from "../controllers/homeSettingsController.js";

import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ===========================
   PUBLIC ROUTES
   =========================== */
router.get("/home-settings", getHomeSettings);

/* ===========================
   ADMIN ROUTES (protected)
   =========================== */
router.put("/admin/home-settings", verifyAdmin, updateHomeSettings);

export default router;