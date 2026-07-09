import express from "express";

import {
  getAllSmtpSettings,
  updateSmtpSetting,
  initializeSmtpSettings,
  testEmail,
} from "../controllers/smtpController.js";

import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ===========================
   ADMIN ROUTES
   =========================== */
router.get("/admin/all", verifyAdmin, getAllSmtpSettings);
router.put("/admin/:key", verifyAdmin, updateSmtpSetting);
router.post("/admin/initialize", verifyAdmin, initializeSmtpSettings);
router.post("/admin/test", verifyAdmin, testEmail);

export default router;