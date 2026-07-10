import { Router } from "express";
import {
  submitContact,
  submitContactAuth,
  verifyContactEmail,
} from "../controllers/contactController.js";
import { verifyUser } from "../middleware/auth.js";

const router = Router();

// Public route - submit contact form (POST /api/contact)
router.post("/", submitContact);

// Authenticated route - submit contact form (POST /api/contact/auth)
// Uses req.user.email, ignores client-provided email
router.post("/auth", verifyUser, submitContactAuth);

// Public route - verify contact email (GET /api/contact/verify-email/:token)
router.get("/verify-email/:token", verifyContactEmail);

export default router;
