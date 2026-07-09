import express from "express";
import {
  registerUser,
  loginUser,
  googleAuth,
  getProfile,
  updateNewsletterPreference,
  toggleBookmark,
  addReview,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  logoutUser,
} from "../controllers/userController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.post("/logout", verifyUser, logoutUser);

router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

router.get("/profile", verifyUser, getProfile);
router.put("/newsletter-preference", verifyUser, updateNewsletterPreference);
router.post("/tools/:toolId/bookmark", verifyUser, toggleBookmark);
router.post("/tools/:toolId/review", verifyUser, addReview);

export default router;
