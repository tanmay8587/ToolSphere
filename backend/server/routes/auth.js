import express from "express";
import {
  registerUser,
  loginUser,
  googleAuth,
  getProfile,
  updateProfile,
  updateNewsletterPreference,
  toggleBookmark,
  addReview,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  changePassword,
  verifyEmail,
  resendVerificationEmail,
  logoutUser,
  deleteAccount,
} from "../controllers/userController.js";
import { verifyUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.post("/logout", verifyUser, logoutUser);

router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.get("/verify-reset-token/:token", verifyResetToken);
router.put("/change-password", verifyUser, changePassword);
router.delete("/account", verifyUser, deleteAccount);

router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

router.get("/profile", verifyUser, getProfile);
router.put("/profile", verifyUser, updateProfile);
router.put("/newsletter-preference", verifyUser, updateNewsletterPreference);
router.post("/tools/:toolId/bookmark", verifyUser, toggleBookmark);
router.post("/tools/:toolId/review", verifyUser, addReview);

export default router;
