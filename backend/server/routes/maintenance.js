import express from "express";
import {
  getMaintenanceStatus,
  toggleMaintenanceMode,
  updateMaintenanceSettings,
} from "../controllers/maintenanceController.js";
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

/* ===========================
   PUBLIC ROUTES
=========================== */
router.get("/status", getMaintenanceStatus);

/* ===========================
   ADMIN ROUTES
=========================== */
router.put("/toggle", verifyAdmin, toggleMaintenanceMode);
router.put("/settings", verifyAdmin, updateMaintenanceSettings);

export default router;