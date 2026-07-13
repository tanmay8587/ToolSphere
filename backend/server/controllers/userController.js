import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Review from "../models/Review.js";
import Notification from "../models/Notification.js";
import Bookmark from "../models/Bookmark.js";
import Tool from "../models/Tool.js";
import { validateEmail, validatePassword, sanitizeInput } from "../utils/validation.js";
import { sendEmail } from "./smtpController.js";
import logger from "../utils/logger.js";

const createToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ success: false, message: passwordValidation.message });
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedName = sanitizeInput(name);

    const existing = await User.findOne({ email: sanitizedEmail.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered." });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Hash token before saving
    const hashedVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

    const user = await User.create({
      name: sanitizedName,
      email: sanitizedEmail.toLowerCase(),
      password: hashed,
      avatar: avatar || "",
      isVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpire: verificationTokenExpire,
    });

    await Notification.create({
      title: "New User Registered",
      message: "A new user has created an account.",
      type: "user",
      isRead: false,
    });

    // Send verification email
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #06b6d4;">Verify Your Email Address</h2>
          <p>Thank you for registering with ToolSphere! Please click the link below to verify your email address:</p>
          <p style="margin: 20px 0;">
            <a href="${verificationUrl}" style="background-color: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours.</p>
          <p style="color: #6b7280; font-size: 14px;">If you did not create an account, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">ToolSphere</p>
        </div>
      `;

      await sendEmail(user.email, "Verify Your Email - ToolSphere", html);
    } catch (emailError) {
      logger.error("Failed to send verification email:", emailError);
    // Don't fail registration if email fails - user can request new verification email
    }

    res.status(201).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, isVerified: false },
      message: "Registration successful! Please check your email to verify your account."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Registration failed." });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // Sanitize email input
    const sanitizedEmail = sanitizeInput(email);

    const user = await User.findOne({ email: sanitizedEmail.toLowerCase() });
    
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    const token = createToken(user);

    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, isVerified: user.isVerified } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed." });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { email, name, avatar, googleId } = req.body;
    if (!email || !name || !googleId) {
      return res.status(400).json({ success: false, message: "Google auth data is required." });
    }

    // Sanitize email input
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedName = sanitizeInput(name);

    let user = await User.findOne({ email: sanitizedEmail.toLowerCase() });
    if (user) {
      // Check if email is verified for existing users
      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: "Please verify your email before logging in.",
        });
      }
      user.googleId = googleId;
      user.avatar = avatar || user.avatar;
      await user.save();
    } else {
      // For new Google users, require email verification
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      const hashedVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

      user = await User.create({
        name: sanitizedName,
        email: sanitizedEmail.toLowerCase(),
        avatar: avatar || "",
        googleId,
        isVerified: false,
        emailVerificationToken: hashedVerificationToken,
        emailVerificationExpire: verificationTokenExpire,
      });

      // Send verification email
      try {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #06b6d4;">Verify Your Email Address</h2>
            <p>Thank you for registering with ToolSphere! Please click the link below to verify your email address:</p>
            <p style="margin: 20px 0;">
              <a href="${verificationUrl}" style="background-color: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Verify Email Address
              </a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours.</p>
            <p style="color: #6b7280; font-size: 14px;">If you did not create an account, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 12px;">ToolSphere</p>
          </div>
        `;

        await sendEmail(user.email, "Verify Your Email - ToolSphere", html);
      } catch (emailError) {
        logger.error("Failed to send verification email:", emailError);
      }

      // Don't return token for unverified users
      return res.status(201).json({
        success: true,
        user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, isVerified: false },
        message: "Registration successful! Please check your email to verify your account."
      });
    }

    const token = createToken(user);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, isVerified: user.isVerified } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Google authentication failed." });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const bookmarks = await Bookmark.find({ user: user._id }).populate("tool");
    const reviews = await Review.find({ user: user._id }).populate("tool");

    res.json({
      success: true,
      user,
      bookmarks: bookmarks.map((bookmark) => bookmark.tool),
      reviews,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch profile." });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;

    if (!name && !avatar) {
      return res.status(400).json({ success: false, message: "Nothing to update." });
    }

    const updateFields = {};
    if (name) {
      const sanitizedName = sanitizeInput(name);
      if (sanitizedName.trim().length < 1) {
        return res.status(400).json({ success: false, message: "Name cannot be empty." });
      }
      updateFields.name = sanitizedName;
    }
    if (avatar) {
      updateFields.avatar = avatar;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({
      success: true,
      user,
      message: "Profile updated successfully.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update profile." });
  }
};

export const updateNewsletterPreference = async (req, res) => {
  try {
    const { newsletterEnabled } = req.body;

    if (typeof newsletterEnabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "newsletterEnabled must be a boolean.",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.newsletterEnabled = newsletterEnabled;
    await user.save();

    res.json({
      success: true,
      newsletterEnabled: user.newsletterEnabled,
      message: "Newsletter preference updated.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update newsletter preference." });
  }
};

export const toggleBookmark = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.toolId);
    if (!tool) {
      return res.status(404).json({ success: false, message: "Tool not found." });
    }

    const existing = await Bookmark.findOne({ user: req.user.id, tool: tool._id });
    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.json({ success: true, bookmarked: false });
    }

    await Bookmark.create({ user: req.user.id, tool: tool._id });
    res.json({ success: true, bookmarked: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update bookmark." });
  }
};

export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const tool = await Tool.findById(req.params.toolId);
    if (!tool) {
      return res.status(404).json({ success: false, message: "Tool not found." });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    const review = await Review.findOneAndUpdate(
      { user: req.user.id, tool: tool._id },
      { rating, comment },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await Notification.create({
      title: "New Review",
      message: "A new review has been submitted and is waiting for approval.",
      type: "review",
      isRead: false,
    });

    const reviews = await Review.find({ tool: tool._id }).populate("user", "name avatar");
    const averageRating = reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length;

    tool.rating = Number(averageRating.toFixed(1));
    await tool.save();

    res.json({ success: true, review, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add review." });
  }
};

/* ==========================================
   FORGOT PASSWORD
   ========================================== */

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const sanitizedEmail = sanitizeInput(email);
    const user = await User.findOne({ email: sanitizedEmail.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: "If an account with that email exists, we have sent a password reset link.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpire = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    // Hash token before saving
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = resetTokenExpire;
    await user.save();

    // Create reset URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // Send email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #06b6d4;">Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">ToolSphere</p>
      </div>
    `;

    await sendEmail(user.email, "Password Reset - ToolSphere", html);

    res.json({
      success: true,
      message: "If an account with that email exists, we have sent a password reset link.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to process forgot password request." });
  }
};

/* ==========================================
   RESET PASSWORD
   ========================================== */

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required." });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ success: false, message: passwordValidation.message });
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = "";
    user.resetPasswordExpire = null;
    await user.save();

    res.json({ success: true, message: "Password has been reset successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to reset password." });
  }
};

/* ==========================================
   VERIFY RESET TOKEN
   ========================================== */

export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message: "Reset token is required." });
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      // Check if token exists but is expired to give a precise message
      const expiredUser = await User.findOne({ resetPasswordToken: hashedToken });
      if (expiredUser) {
        return res.status(400).json({
          success: false,
          expired: true,
          message: "This password reset link has expired. Please request a new one.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "This password reset link is invalid. Please request a new one.",
      });
    }

    res.json({ success: true, message: "Token is valid." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to verify reset token." });
  }
};

/* ==========================================
   CHANGE PASSWORD (authenticated)
   ========================================== */

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password, new password, and confirmation are required.",
      });
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ success: false, message: passwordValidation.message });
    }

    // Ensure new password and confirmation match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation do not match.",
      });
    }

    // Prevent reusing the current password
    if (newPassword === currentPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password.",
      });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user || !user.password) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Verify the current password
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // Hash and store the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to change password." });
  }
};

/* ==========================================
   EMAIL VERIFICATION
   ========================================== */

export const verifyEmail = async (req, res) => {
  try {
    // Decode the token in case it was URL-encoded
    const { token } = req.params;
    const decodedToken = decodeURIComponent(token);

    if (!decodedToken) {
      return res.status(400).json({ success: false, message: "Verification token is required." });
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash("sha256").update(decodedToken).digest("hex");

    // Find user with valid token and not expired
    const query = {
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    };
    
    const user = await User.findOne(query);

    if (!user) {
      // Let's also check if the token exists but is expired
      const userWithToken = await User.findOne({ emailVerificationToken: hashedToken });
      if (userWithToken) {
        // Token exists but expired - log for debugging
        logger.warn("Verification token expired", { 
          userId: userWithToken._id,
          email: userWithToken.email,
          expiredAt: userWithToken.emailVerificationExpire 
        });
      }
      return res.status(400).json({ success: false, message: "Invalid or expired verification token." });
    }

    // Mark user as verified and clear verification fields
    user.isVerified = true;
    user.emailVerificationToken = "";
    user.emailVerificationExpire = null;
    
    await user.save();

    res.json({ success: true, message: "Email verified successfully! You can now log in." });
  } catch (err) {
    logger.error("Verification error:", err);
    res.status(500).json({ success: false, message: "Failed to verify email." });
  }
};

// Resend verification email
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const sanitizedEmail = sanitizeInput(email);
    const user = await User.findOne({ email: sanitizedEmail.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: "If an account with that email exists and needs verification, we have sent a new verification link.",
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Email is already verified." });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Hash token before saving
    const hashedVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

    user.emailVerificationToken = hashedVerificationToken;
    user.emailVerificationExpire = verificationTokenExpire;
    await user.save();

    // Send verification email
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #06b6d4;">Verify Your Email Address</h2>
          <p>You requested a new email verification link. Please click the button below to verify your email address:</p>
          <p style="margin: 20px 0;">
            <a href="${verificationUrl}" style="background-color: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours.</p>
          <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">ToolSphere</p>
        </div>
      `;

      await sendEmail(user.email, "Verify Your Email - ToolSphere", html);

      res.json({
        success: true,
        message: "If an account with that email exists and needs verification, we have sent a new verification link.",
      });
    } catch (emailError) {
      logger.error("Failed to send verification email:", emailError);
      res.status(500).json({ success: false, message: "Failed to send verification email. Please try again later." });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to resend verification email." });
  }
};

/* ==========================================
    LOGOUT
    ===================================== */

export const logoutUser = async (req, res) => {
  try {
    // For JWT-based auth, logout is handled client-side by removing the token
    // This endpoint exists for consistency and future token blacklist implementation
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Logout failed." });
  }
};

/* ==========================================
    GET SAVED BLOGS
    GET /api/users/me/saved-blogs
    Returns the current user's saved blogs (populated).
    ===================================== */
export const getSavedBlogs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("savedBlogs").populate({
      path: "savedBlogs",
      match: { isDeleted: false, status: "published" },
      select:
        "title slug coverImage category excerpt readingTime publishedAt views",
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Filter out any nulls (e.g. blogs that were soft-deleted and not matched)
    const savedBlogs = (user.savedBlogs || []).filter(Boolean);

    return res.json({
      success: true,
      savedBlogs,
      totalSaved: savedBlogs.length,
    });
  } catch (err) {
    logger.error("[getSavedBlogs] Error fetching saved blogs:", err);
    res.status(500).json({ success: false, message: "Failed to fetch saved blogs." });
  }
};

/* ==========================================
     GET LIKED BLOGS
     GET /api/users/me/liked-blogs
     Returns the current user's liked blogs (populated).
     ===================================== */
export const getLikedBlogs = async (req, res) => {
  try {
    // Import Blog model
    const Blog = (await import("../models/Blog.js")).default;

    // Find all blogs where the current user is in the likedBy array
    const likedBlogs = await Blog.find({
      likedBy: req.user.id,
      isDeleted: false,
      status: "published",
    }).select("title slug coverImage category excerpt readingTime publishedAt views");

    return res.json({
      success: true,
      likedBlogs,
      totalLiked: likedBlogs.length,
    });
  } catch (err) {
    logger.error("[getLikedBlogs] Error fetching liked blogs:", err);
    res.status(500).json({ success: false, message: "Failed to fetch liked blogs." });
  }
};

/* ==========================================
     DELETE ACCOUNT
     ===================================== */

export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required to delete your account." });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select("+password");
    if (!user || !user.password) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ success: false, message: "Incorrect password." });
    }

    const userId = user._id;

    // Remove user's bookmarks
    await Bookmark.deleteMany({ user: userId });

    // Remove user's reviews
    await Review.deleteMany({ user: userId });

    // Remove user from likedBy arrays in blogs
    const Blog = (await import("../models/Blog.js")).default;
    await Blog.updateMany(
      { likedBy: userId },
      { $pull: { likedBy: userId } }
    );

    // Remove user from savedBlogs arrays
    await User.findByIdAndUpdate(userId, { $set: { savedBlogs: [] } });

    // Delete the user account
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: "Your account has been deleted successfully." });
  } catch (err) {
    logger.error("[deleteAccount] Error deleting account:", err);
    res.status(500).json({ success: false, message: "Failed to delete account. Please try again." });
  }
};

/* ==========================================
     RECENTLY VIEWED TOOLS
     ===================================== */

/**
 * POST /api/users/me/viewed-tools
 * - Adds a tool to the user's recently viewed tools list
 * - Keeps only the last 10 viewed tools
 */
export const addViewedTool = async (req, res) => {
  try {
    const { toolId } = req.body;
    
    if (!toolId) {
      return res.status(400).json({ success: false, message: "Tool ID is required." });
    }

    // Verify tool exists
    const tool = await Tool.findById(toolId);
    if (!tool) {
      return res.status(404).json({ success: false, message: "Tool not found." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Remove the tool ID if it already exists (to avoid duplicates)
    user.recentlyViewedTools = user.recentlyViewedTools.filter(
      (id) => id.toString() !== toolId.toString()
    );

    // Add the tool ID to the beginning of the array
    user.recentlyViewedTools.unshift(toolId);

    // Keep only the last 10 viewed tools
    if (user.recentlyViewedTools.length > 10) {
      user.recentlyViewedTools = user.recentlyViewedTools.slice(0, 10);
    }

    await user.save();

    res.json({ success: true, message: "Tool added to recently viewed." });
  } catch (err) {
    logger.error("[addViewedTool] Error adding viewed tool:", err);
    res.status(500).json({ success: false, message: "Failed to add viewed tool." });
  }
};

/**
 * GET /api/users/me/recently-viewed-tools
 * - Returns the current user's recently viewed tools (populated)
 */
export const getRecentlyViewedTools = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("recentlyViewedTools")
      .populate({
        path: "recentlyViewedTools",
        match: { isDeleted: false, status: "active", approved: true },
        select:
          "name slug category description pricing rating logo coverImage",
      });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Filter out any nulls (e.g. tools that were soft-deleted or not approved)
    const recentlyViewedTools = (user.recentlyViewedTools || []).filter(Boolean);

    return res.json({
      success: true,
      recentlyViewedTools,
      total: recentlyViewedTools.length,
    });
  } catch (err) {
    logger.error("[getRecentlyViewedTools] Error fetching recently viewed tools:", err);
    res.status(500).json({ success: false, message: "Failed to fetch recently viewed tools." });
  }
};

/* ==========================================
     RECENTLY VIEWED BLOGS
     ===================================== */

/**
 * POST /api/users/me/viewed-blogs
 * - Adds a blog to the user's recently viewed blogs list
 * - Stores only blog IDs, most recent first, max 10 items
 */
export const addViewedBlog = async (req, res) => {
  try {
    const { blogId } = req.body;

    if (!blogId) {
      return res.status(400).json({ success: false, message: "Blog ID is required." });
    }

    // Verify blog exists
    const Blog = (await import("../models/Blog.js")).default;
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Remove the blog ID if it already exists (to avoid duplicates)
    user.recentlyViewed = user.recentlyViewed.filter(
      (id) => id.toString() !== blogId.toString()
    );

    // Add the blog ID to the beginning of the array (most recent first)
    user.recentlyViewed.unshift(blogId);

    // Keep only the most recent 10 items
    if (user.recentlyViewed.length > 10) {
      user.recentlyViewed = user.recentlyViewed.slice(0, 10);
    }

    await user.save();

    res.json({ success: true, message: "Blog added to recently viewed." });
  } catch (err) {
    logger.error("[addViewedBlog] Error adding viewed blog:", err);
    res.status(500).json({ success: false, message: "Failed to add viewed blog." });
  }
};

/**
 * GET /api/users/me/recently-viewed-blogs
 * - Returns the current user's recently viewed blogs (populated)
 */
export const getRecentlyViewedBlogs = async (req, res) => {
  try {
    const Blog = (await import("../models/Blog.js")).default;

    const user = await User.findById(req.user.id)
      .select("recentlyViewed")
      .populate({
        path: "recentlyViewed",
        match: { isDeleted: false, status: "published" },
        select:
          "title slug coverImage category excerpt readingTime publishedAt views",
      });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Filter out any nulls (e.g. blogs that were soft-deleted and not matched)
    const recentlyViewedBlogs = (user.recentlyViewed || []).filter(Boolean);

    return res.json({
      success: true,
      recentlyViewedBlogs,
      total: recentlyViewedBlogs.length,
    });
  } catch (err) {
    logger.error("[getRecentlyViewedBlogs] Error fetching recently viewed blogs:", err);
    res.status(500).json({ success: false, message: "Failed to fetch recently viewed blogs." });
  }
};
