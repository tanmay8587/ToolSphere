import express from "express";

import {
  getBrandingSettings,
  getAllBrandingSettings,
  updateBrandingSetting,
  initializeBrandingSettings,
} from "../controllers/websiteBrandingController.js";

import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ===========================
   PUBLIC ROUTES
   =========================== */
router.get("/", getBrandingSettings);

/* ===========================
   ADMIN ROUTES
   =========================== */
router.get("/admin/all", verifyAdmin, getAllBrandingSettings);
router.put("/admin/:key", verifyAdmin, updateBrandingSetting);
router.post("/admin/initialize", verifyAdmin, initializeBrandingSettings);

export default router;