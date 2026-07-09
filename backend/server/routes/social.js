import express from "express";

import {
  getSocialLinks,
  getAllSocialLinks,
  updateSocialLink,
  initializeSocialLinks,
} from "../controllers/socialController.js";

import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ===========================
   PUBLIC ROUTES
   =========================== */
router.get("/", getSocialLinks);

/* ===========================
   ADMIN ROUTES
   =========================== */
router.get("/admin/all", verifyAdmin, getAllSocialLinks);
router.put("/admin/:platform", verifyAdmin, updateSocialLink);
router.post("/admin/initialize", verifyAdmin, initializeSocialLinks);

export default router;