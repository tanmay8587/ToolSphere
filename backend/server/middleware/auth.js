import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Membership, { MEMBERSHIP_STATUS, MEMBERSHIP_TIER } from "../models/Membership.js";
import { getMembershipPermissions } from "../utils/membershipPermissions.js";

export const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access Denied",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch admin from database to verify role
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Verify admin is active
    if (!admin.active) {
      return res.status(403).json({
        success: false,
        message: "Admin account is disabled",
      });
    }

    req.admin = { id: admin._id, email: admin.email, role: admin.role };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or Expired Token",
    });
  }
};

const getUserIdFromToken = (decoded) => {
  if (!decoded) return null;
  return decoded.userId || decoded.id || decoded._id || null;
};

export const verifyUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, code: "INVALID_TOKEN", message: "Unauthorized." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdFromToken = getUserIdFromToken(decoded);

    if (!userIdFromToken) {
      console.log({ authStep: "JWT_USER_LOOKUP", userIdFromToken: null, userFound: false, reason: "TOKEN_MISSING_USER_ID" });
      return res.status(401).json({ success: false, code: "INVALID_TOKEN", message: "Invalid or expired token." });
    }

    let user;
    try {
      user = await User.findById(userIdFromToken);
    } catch (dbErr) {
      console.log({ authStep: "JWT_USER_LOOKUP", userIdFromToken: userIdFromToken.toString(), userFound: false, reason: "DATABASE_ERROR", message: dbErr.message });
      return res.status(500).json({ success: false, code: "DATABASE_ERROR", message: "Authentication service is temporarily unavailable." });
    }

    console.log({ authStep: "JWT_USER_LOOKUP", userIdFromToken: userIdFromToken.toString(), userFound: !!user });

    if (!user) {
      return res.status(401).json({ success: false, code: "USER_NOT_FOUND", message: "Your account no longer exists. Please sign in again." });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email before accessing this resource.",
      });
    }

    const membership = await Membership.findOne({ user: user._id });
    const tier = membership?.tier || user.membershipTier || MEMBERSHIP_TIER.FREE;
    req.user = { id: user._id, email: user.email, membershipTier: tier, membershipStatus: membership?.status || user.membershipStatus || MEMBERSHIP_STATUS.ACTIVE, membershipPermissions: getMembershipPermissions(tier) };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, code: "INVALID_TOKEN", message: "Invalid or expired token." });
  }
};

export const verifyMembership = (requiredTier = MEMBERSHIP_TIER.PRO) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, code: "INVALID_TOKEN", message: "Unauthorized." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdFromToken = getUserIdFromToken(decoded);

    if (!userIdFromToken) {
      return res.status(401).json({ success: false, code: "INVALID_TOKEN", message: "Invalid or expired token." });
    }

    let user;
    try {
      user = await User.findById(userIdFromToken);
    } catch (dbErr) {
      return res.status(500).json({ success: false, code: "DATABASE_ERROR", message: "Authentication service is temporarily unavailable." });
    }

    if (!user) {
      return res.status(401).json({ success: false, code: "USER_NOT_FOUND", message: "Your account no longer exists. Please sign in again." });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email before accessing this resource.",
      });
    }

    const membership = await Membership.findOne({ user: user._id });
    const tier = membership?.tier || user.membershipTier || MEMBERSHIP_TIER.FREE;
    const status = membership?.status || user.membershipStatus || MEMBERSHIP_STATUS.ACTIVE;
    const permissions = getMembershipPermissions(tier);

    req.user = {
      id: user._id,
      email: user.email,
      membershipTier: tier,
      membershipStatus: status,
      membershipPermissions: permissions,
    };

    if (tier !== requiredTier && tier !== MEMBERSHIP_TIER.BUSINESS) {
      return res.status(403).json({
        success: false,
        message: "Upgrade to Pro to access this feature.",
        membership: {
          tier,
          status,
          permissions,
        },
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, code: "INVALID_TOKEN", message: "Invalid or expired token." });
  }
};

/**
 * Optional user auth: populates req.user when a valid token is present,
 * but does NOT reject the request when no/invalid token is provided.
 * Used by the public blog-view endpoint so logged-in users are deduped by
 * userId while guests fall back to their anonymous visitorId.
 */
export const optionalUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdFromToken = getUserIdFromToken(decoded);

    if (!userIdFromToken) {
      return next();
    }

    const user = await User.findById(userIdFromToken);

    if (user && user.isVerified) {
      const membership = await Membership.findOne({ user: user._id });
      const tier = membership?.tier || user.membershipTier || MEMBERSHIP_TIER.FREE;
      req.user = { id: user._id, email: user.email, membershipTier: tier, membershipStatus: membership?.status || user.membershipStatus || MEMBERSHIP_STATUS.ACTIVE, membershipPermissions: getMembershipPermissions(tier) };
    }
  } catch {
    // Ignore: treat as guest
  }
  next();
};
