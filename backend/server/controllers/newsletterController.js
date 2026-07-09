import Newsletter from "../models/Newsletter.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { validateEmail, sanitizeInput } from "../utils/validation.js";
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
      if (existingSubscriber.status === "active") {
        return res.status(200).json({
          success: true,
          message: "You are already subscribed.",
          alreadySubscribed: true,
        });
      }
      
      // Reactivate unsubscribed user
      existingSubscriber.status = "active";
      existingSubscriber.unsubscribedAt = null;
      existingSubscriber.source = source || "website";
      await existingSubscriber.save();

      logger.info(`Newsletter subscription reactivated: ${email}`);

      return res.status(200).json({
        success: true,
        message: "Welcome back! You have been re-subscribed to our newsletter.",
      });
    }

    // Create new subscriber
    const subscriber = await Newsletter.create({
      email: email,
      source: source || "website",
    });

    logger.info(`New newsletter subscription: ${email}`);

    return res.status(201).json({
      success: true,
      message: "You have successfully subscribed to our newsletter.",
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
        message: "You are already subscribed.",
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
===================================== */
export const getSubscribers = async (req, res) => {
  try {
    const { status = "active", page = "1", limit = "50" } = req.query;

    const filters = {};
    if (status && status !== "all") {
      filters.status = status;
    }

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.max(1, parseInt(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const [total, subscribers] = await Promise.all([
      Newsletter.countDocuments(filters),
      Newsletter.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .select("email status subscribedAt unsubscribedAt source createdAt"),
    ]);

    return res.json({
      success: true,
      total,
      subscribers,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber),
      },
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