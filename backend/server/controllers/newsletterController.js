import Newsletter from "../models/Newsletter.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { validateEmail, sanitizeInput } from "../utils/validation.js";
import { sendEmail } from "./smtpController.js";
import { getNewsletterVerificationTemplate } from "../utils/newsletterEmail.js";
import logger from "../utils/logger.js";

/* =====================================
   SUBSCRIBE TO NEWSLETTER
   ===================================== */
export const subscribe = async (req, res) => {
  try {
    const { source: sourceFromBody } = req.body;
    let email;
    let source = sourceFromBody;

    // Optionally resolve the authenticated user from a valid Bearer token.
    // We do NOT reject unauthenticated requests here — guests may subscribe
    // using an email provided in the request body.
    if (!req.user && req.headers.authorization?.startsWith("Bearer ")) {
      try {
        const decoded = jwt.verify(
          req.headers.authorization.split(" ")[1],
          process.env.JWT_SECRET
        );
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = { id: user._id, email: user.email };
        }
      } catch (err) {
        // Invalid/expired token — treat as guest and fall through to body email
        req.user = null;
      }
    }

    // Authenticated user: use email from the token (no body email required)
    if (req.user && req.user.email) {
      email = String(req.user.email).toLowerCase().trim();
      source = source || "website";
    } else {
      // Guest user: require and validate email from request body
      email = req.body.email;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      // Sanitize and validate email
      email = sanitizeInput(email);
      email = String(email).toLowerCase().trim();

      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }
    }

    // Check if email already exists. The lookup uses a normalized (lowercased,
    // trimmed) email so duplicates are reliably detected regardless of the
    // letter casing the client sent, and the friendly "already subscribed"
    // / reactivation paths below are reached instead of the DB error path.
    const existingSubscriber = await Newsletter.findOne({ email: email });

    if (existingSubscriber) {
      if (existingSubscriber.status === "active" && existingSubscriber.isVerified) {
        return res.status(200).json({
          success: true,
          message: "You are already subscribed to ToolSphere newsletter.",
          alreadySubscribed: true,
        });
      }

      // Reactivate / re-verify existing (unsubscribed or unverified) subscriber.
      // Generate a fresh verification token and send a new verification email.
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const hashedVerificationToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

      existingSubscriber.status = "active";
      existingSubscriber.unsubscribedAt = null;
      existingSubscriber.source = source || "website";
      existingSubscriber.isVerified = false;
      existingSubscriber.verificationToken = hashedVerificationToken;
      existingSubscriber.verificationTokenExpiry = verificationTokenExpiry;
      await existingSubscriber.save();

      // Send verification email
      try {
        const { subject, html } = getNewsletterVerificationTemplate(verificationToken);
        await sendEmail(existingSubscriber.email, subject, html);
      } catch (emailError) {
        logger.error(`Failed to send newsletter verification email: ${emailError.message}`);
      }

      logger.info(`Newsletter subscription re-verification initiated: ${email}`);

      return res.status(200).json({
        success: true,
        message:
          "Please check your email to confirm your newsletter subscription.",
        pendingVerification: true,
      });
    }

    // Generate secure random token and hash it before storing
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    // Create new subscriber (unverified until they confirm via email)
    const subscriber = await Newsletter.create({
      email: email,
      source: source || "website",
      isVerified: false,
      verificationToken: hashedVerificationToken,
      verificationTokenExpiry: verificationTokenExpiry,
    });

    await Notification.create({
      title: "New Newsletter Subscriber",
      message: "A new user subscribed to the newsletter.",
      type: "newsletter",
      isRead: false,
    });

    // Send verification email
    try {
      const { subject, html } = getNewsletterVerificationTemplate(verificationToken);
      await sendEmail(subscriber.email, subject, html);
    } catch (emailError) {
      logger.error(`Failed to send newsletter verification email: ${emailError.message}`);
      // Don't fail subscription if email fails — subscriber can request resend later
    }

    logger.info(`New newsletter subscription (pending verification): ${email}`);

    return res.status(201).json({
      success: true,
      message:
        "Please check your email to confirm your newsletter subscription.",
      subscriber: {
        email: subscriber.email,
        status: subscriber.status,
      },
    });

  } catch (err) {
    logger.error(`Newsletter subscription error: ${err.message}`);

    // Handle duplicate key error (race condition)
    if (err.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "You are already subscribed to ToolSphere newsletter.",
        alreadySubscribed: true,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to subscribe. Please try again later.",
    });
  }
};

/* =====================================
   VERIFY NEWSLETTER SUBSCRIPTION
   ===================================== */
export const verifyNewsletter = async (req, res) => {
  try {
    // Decode the token in case it was URL-encoded
    const { token } = req.params;
    const decodedToken = decodeURIComponent(token);

    if (!decodedToken) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required.",
      });
    }

    // Hash the incoming token to compare with the stored hashed token
    const hashedToken = crypto
      .createHash("sha256")
      .update(decodedToken)
      .digest("hex");

    // Find subscriber with a matching token that has not expired
    const subscriber = await Newsletter.findOne({
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!subscriber) {
      // Check if the token exists but is expired (for a clearer log)
      const subscriberWithToken = await Newsletter.findOne({
        verificationToken: hashedToken,
      });
      if (subscriberWithToken) {
        logger.warn("Newsletter verification token expired", {
          email: subscriberWithToken.email,
          expiredAt: subscriberWithToken.verificationTokenExpiry,
        });
      }
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token.",
      });
    }

    // Mark as verified and remove the verification token fields
    subscriber.isVerified = true;
    subscriber.verificationToken = undefined;
    subscriber.verificationTokenExpiry = undefined;
    await subscriber.save();

    logger.info(`Newsletter subscription verified: ${subscriber.email}`);

    return res.status(200).json({
      success: true,
      message: "Your subscription has been confirmed. Thank you for subscribing!",
    });

  } catch (err) {
    logger.error(`Newsletter verification error: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to verify subscription. Please try again later.",
    });
  }
};

/* =====================================
   UNSUBSCRIBE FROM NEWSLETTER
===================================== */
export const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    const sanitizedEmail = sanitizeInput(email);

    if (!sanitizedEmail || !validateEmail(sanitizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Valid email is required",
      });
    }

    const subscriber = await Newsletter.findOne({ email: sanitizedEmail });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Email not found in our subscribers list",
      });
    }

    if (subscriber.status === "unsubscribed") {
      return res.status(200).json({
        success: true,
        message: "You are already unsubscribed.",
      });
    }

    subscriber.status = "unsubscribed";
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    logger.info(`Newsletter unsubscribed: ${sanitizedEmail}`);

    return res.json({
      success: true,
      message: "You have been successfully unsubscribed.",
    });

  } catch (err) {
    logger.error(`Newsletter unsubscribe error: ${err.message}`);
    
    return res.status(500).json({
      success: false,
      message: "Failed to unsubscribe. Please try again later.",
    });
  }
};

/* =====================================
    GET ALL SUBSCRIBERS (ADMIN)
    Supports: search, page, limit, sort, filter
 ===================================== */
export const getSubscribers = async (req, res) => {
  try {
    const {
      search = "",
      page = "1",
      limit = "20",
      sort = "newest",
      filter = "all",
    } = req.query;

    // Build query filters
    const filters = {};

    // Search by email (case-insensitive)
    if (search && search.trim()) {
      filters.email = { $regex: search.trim(), $options: "i" };
    }

    // Filter by verification / subscription state
    switch (filter) {
      case "verified":
        filters.isVerified = true;
        break;
      case "pending":
        filters.isVerified = false;
        break;
      case "unsubscribed":
        filters.status = "unsubscribed";
        break;
      case "all":
      default:
        // No additional filter
        break;
    }

    const pageNumber = Math.max(1, parseInt(page) || 1);
    const limitNumber = Math.max(1, parseInt(limit) || 20);
    const skip = (pageNumber - 1) * limitNumber;

    // Sort by subscription date
    const sortOption = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [total, subscribers] = await Promise.all([
      Newsletter.countDocuments(filters),
      Newsletter.find(filters)
        .select(
          "email status subscribedAt unsubscribedAt source isVerified createdAt"
        )
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return res.json({
      success: true,
      total,
      currentPage: pageNumber,
      totalPages,
      subscribers,
    });
  } catch (err) {
    logger.error(`Get subscribers error: ${err.message}`);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscribers",
    });
  }
};

/* =====================================
    NEWSLETTER STATISTICS (ADMIN)
 ===================================== */
export const getNewsletterStats = async (req, res) => {
  try {
    const [total, verified, pending, unsubscribed, newest] = await Promise.all([
      Newsletter.countDocuments({}),
      Newsletter.countDocuments({ isVerified: true }),
      Newsletter.countDocuments({ isVerified: false }),
      Newsletter.countDocuments({ status: "unsubscribed" }),
      Newsletter.findOne({})
        .sort({ createdAt: -1 })
        .select("email subscribedAt"),
    ]);

    return res.json({
      success: true,
      stats: {
        totalSubscribers: total,
        verifiedSubscribers: verified,
        pendingVerification: pending,
        unsubscribed,
        newestSubscriber: newest
          ? {
              email: newest.email,
              subscribedAt: newest.subscribedAt,
            }
          : null,
      },
    });
  } catch (err) {
    logger.error(`Get newsletter stats error: ${err.message}`);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch newsletter statistics",
    });
  }
};

/* =====================================
    RESEND VERIFICATION EMAIL (ADMIN)
 ===================================== */
export const resendVerification = async (req, res) => {
  try {
    const subscriber = await Newsletter.findById(req.params.id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Subscriber not found",
      });
    }

    // Only resend if the subscriber is NOT verified
    if (subscriber.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Subscriber is already verified",
      });
    }

    // Generate a fresh verification token and replace the old one
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    subscriber.verificationToken = hashedVerificationToken;
    subscriber.verificationTokenExpiry = verificationTokenExpiry;
    await subscriber.save();

    // Send the new verification email using the existing Resend utility
    try {
      const { subject, html } = getNewsletterVerificationTemplate(verificationToken);
      await sendEmail(subscriber.email, subject, html);
    } catch (emailError) {
      logger.error(
        `Failed to resend newsletter verification email: ${emailError.message}`
      );
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again later.",
      });
    }

    logger.info(`Newsletter verification re-sent: ${subscriber.email}`);

    return res.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (err) {
    logger.error(`Resend verification error: ${err.message}`);

    return res.status(500).json({
      success: false,
      message: "Failed to resend verification email",
    });
  }
};

/* =====================================
    DELETE SUBSCRIBER (ADMIN)
 ===================================== */
export const deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await Newsletter.findByIdAndDelete(req.params.id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Subscriber not found",
      });
    }

    logger.info(`Subscriber deleted: ${subscriber.email}`);

    return res.json({
      success: true,
      message: "Subscriber deleted successfully",
    });
  } catch (err) {
    logger.error(`Delete subscriber error: ${err.message}`);

    return res.status(500).json({
      success: false,
      message: "Failed to delete subscriber",
    });
  }
};
