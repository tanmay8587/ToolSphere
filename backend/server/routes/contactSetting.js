import express from "express";

import {
  getContactSettings,
  getAllContactSettings,
  updateContactSetting,
  initializeContactSettings,
  getFooterSettings,
} from "../controllers/contactSettingController.js";

import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ===========================
   PUBLIC ROUTES
   =========================== */
router.get("/", getContactSettings);
router.get("/footer", getFooterSettings);

/* ===========================
   ADMIN ROUTES
   =========================== */
router.get("/admin/all", verifyAdmin, getAllContactSettings);
router.put("/admin/:key", verifyAdmin, updateContactSetting);
router.post("/admin/initialize", verifyAdmin, initializeContactSettings);

export default router;