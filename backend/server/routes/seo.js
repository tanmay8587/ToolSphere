import express from "express";

import {
  getSeoSettings,
  getAllSeoSettings,
  updateSeoSetting,
  initializeSeoSettings,
} from "../controllers/seoController.js";

import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ===========================
   PUBLIC ROUTES
   =========================== */
router.get("/", getSeoSettings);

/* ===========================
   ADMIN ROUTES
   =========================== */
router.get("/admin/all", verifyAdmin, getAllSeoSettings);
router.put("/admin/:key", verifyAdmin, updateSeoSetting);
router.post("/admin/initialize", verifyAdmin, initializeSeoSettings);

export default router;