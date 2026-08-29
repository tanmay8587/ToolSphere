import crypto from "crypto";
import User from "../models/User.js";
import Membership, { MEMBERSHIP_STATUS, MEMBERSHIP_TIER } from "../models/Membership.js";
import logger from "../utils/logger.js";
import { getPaymentProviderConfig, PAYMENT_PROVIDER } from "../utils/paymentProvider.js";

const PRO_MONTHLY_CENTS = 1200;
const PRO_DURATION_DAYS = 30;

const buildMembershipPayload = (membership) => ({
  tier: membership.tier,
  status: membership.status,
  startedAt: membership.startedAt,
  endsAt: membership.endsAt,
  autoRenew: membership.autoRenew,
  metadata: membership.metadata,
  currentPlan: membership.metadata?.planName || (membership.tier || "free").toUpperCase(),
  paymentStatus:
    membership.status === MEMBERSHIP_STATUS.EXPIRED || membership.status === MEMBERSHIP_STATUS.CANCELED
      ? "past_due"
      : membership.tier === MEMBERSHIP_TIER.PRO
        ? "paid"
        : "free",
  renewalDate: membership.endsAt || null,
  isExpired: !!membership.endsAt && new Date(membership.endsAt).getTime() <= Date.now(),
});

const computeEndsAt = () => new Date(Date.now() + PRO_DURATION_DAYS * 24 * 60 * 60 * 1000);

const ensureEligibleCheckout = async (userId) => {
  const membership = await Membership.findOne({ user: userId });
  if (!membership) {
    throw new Error("Membership record not found.");
  }

  if (membership.tier === MEMBERSHIP_TIER.PRO && membership.status === MEMBERSHIP_STATUS.ACTIVE && membership.endsAt && membership.endsAt > new Date()) {
    return { membership, alreadyPro: true };
  }

  return { membership, alreadyPro: false };
};

export const createCheckout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const { membership, alreadyPro } = await ensureEligibleCheckout(user._id);
    if (alreadyPro) {
      return res.status(409).json({ success: false, message: "You already have an active Pro membership.", membership: buildMembershipPayload(membership) });
    }

    const config = getPaymentProviderConfig();
    const provider = config.provider;

    const checkoutId = crypto.randomUUID();
    const idempotencyKey = crypto.createHash("sha256").update(`${user._id}:${checkoutId}:${PRO_DURATION_DAYS}`).digest("hex");

    membership.metadata = {
      ...membership.metadata,
      pendingCheckoutId: checkoutId,
      pendingProvider: provider,
      pendingIdempotencyKey: idempotencyKey,
      planName: "Pro Monthly",
    };
    await membership.save();

    if (provider === PAYMENT_PROVIDER.STRIPE) {
      const successUrl = `${config.frontendUrl}/premium?checkout=success`;
      const cancelUrl = `${config.frontendUrl}/premium?checkout=failed`;
      return res.status(200).json({
        success: true,
        provider,
        checkout: {
          url: `${config.frontendUrl}/api/payments/mock/success?checkoutId=${checkoutId}`,
          external: true,
          amount: PRO_MONTHLY_CENTS,
          currency: config.currency,
          successUrl,
          cancelUrl,
        },
      });
    }

    return res.status(200).json({
      success: true,
      provider,
      checkout: {
        url: `${config.frontendUrl}/premium?checkout=mock&checkoutId=${checkoutId}`,
        external: false,
        amount: PRO_MONTHLY_CENTS,
        currency: config.currency,
      },
      message: "Mock checkout created. Use the success endpoint to simulate a successful payment in non-production environments.",
    });
  } catch (err) {
    logger.error(`Create checkout failed: ${err.message}`);
    return res.status(500).json({ success: false, message: "Failed to create checkout." });
  }
};

export const handleSuccessfulPayment = async (req, res) => {
  try {
    const { checkoutId, eventId, paymentIntentId } = req.body || {};
    const userId = req.user.id;
    const membership = await Membership.findOne({ user: userId });

    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership record not found." });
    }

    const eventKey = eventId || paymentIntentId || checkoutId;
    if (eventKey && membership.metadata?.lastProcessedPaymentEvent === eventKey && membership.tier === MEMBERSHIP_TIER.PRO) {
      return res.status(200).json({ success: true, duplicate: true, membership: buildMembershipPayload(membership) });
    }

    membership.tier = MEMBERSHIP_TIER.PRO;
    membership.status = MEMBERSHIP_STATUS.ACTIVE;
    membership.startedAt = membership.startedAt || new Date();
    membership.endsAt = computeEndsAt();
    membership.autoRenew = false;
    membership.metadata = {
      ...membership.metadata,
      planName: "Pro Monthly",
      lastProcessedPaymentEvent: eventKey || crypto.randomUUID(),
      paymentProvider: (req.body?.provider || getPaymentProviderConfig().provider),
      paymentIntentId: paymentIntentId || membership.metadata?.paymentIntentId || "",
      checkoutId: checkoutId || membership.metadata?.pendingCheckoutId || "",
      notes: "Activated by successful payment.",
    };
    await membership.save();

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          membershipTier: MEMBERSHIP_TIER.PRO,
          membershipStatus: MEMBERSHIP_STATUS.ACTIVE,
          membershipSince: membership.startedAt,
        },
      }
    );

    return res.status(200).json({ success: true, message: "Payment successful. Pro membership activated.", membership: buildMembershipPayload(membership) });
  } catch (err) {
    logger.error(`Successful payment handling failed: ${err.message}`);
    return res.status(500).json({ success: false, message: "Failed to process successful payment." });
  }
};

export const handleFailedPayment = async (req, res) => {
  try {
    const membership = await Membership.findOne({ user: req.user.id });
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership record not found." });
    }

    membership.metadata = {
      ...membership.metadata,
      lastFailedCheckoutId: req.body?.checkoutId || membership.metadata?.pendingCheckoutId || "",
      notes: "Payment failed or was canceled.",
    };
    await membership.save();

    return res.status(200).json({ success: true, message: "Payment failed or was canceled.", membership: buildMembershipPayload(membership) });
  } catch (err) {
    logger.error(`Failed payment handling failed: ${err.message}`);
    return res.status(500).json({ success: false, message: "Failed to record payment failure." });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const membership = await Membership.findOne({ user: req.user.id });
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership record not found." });
    }

    if (membership.tier === MEMBERSHIP_TIER.FREE) {
      return res.status(400).json({ success: false, message: "Free plans do not require cancellation." });
    }

    membership.status = MEMBERSHIP_STATUS.CANCELED;
    membership.autoRenew = false;
    membership.metadata = {
      ...membership.metadata,
      notes: "Subscription canceled by user.",
    };
    await membership.save();

    await User.updateOne(
      { _id: req.user.id },
      {
        $set: {
          membershipStatus: MEMBERSHIP_STATUS.CANCELED,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Subscription canceled successfully.",
      membership: buildMembershipPayload(membership),
    });
  } catch (err) {
    logger.error(`Cancel subscription failed: ${err.message}`);
    return res.status(500).json({ success: false, message: "Failed to cancel subscription." });
  }
};

export const refreshSubscriptionState = async (req, res) => {
  try {
    const membership = await Membership.findOne({ user: req.user.id });
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership record not found." });
    }

    const now = new Date();
    const isExpired = !!membership.endsAt && new Date(membership.endsAt).getTime() <= now.getTime();

    if (isExpired && membership.status !== MEMBERSHIP_STATUS.EXPIRED) {
      membership.status = MEMBERSHIP_STATUS.EXPIRED;
      membership.autoRenew = false;
      membership.metadata = {
        ...membership.metadata,
        notes: "Membership expired automatically.",
      };
      await membership.save();

      await User.updateOne(
        { _id: req.user.id },
        {
          $set: {
            membershipStatus: MEMBERSHIP_STATUS.EXPIRED,
            membershipTier: MEMBERSHIP_TIER.FREE,
          },
        }
      );
    }

    return res.status(200).json({
      success: true,
      membership: buildMembershipPayload(membership),
    });
  } catch (err) {
    logger.error(`Refresh subscription state failed: ${err.message}`);
    return res.status(500).json({ success: false, message: "Failed to refresh subscription state." });
  }
};

const verifyWebhookSignature = (rawBody, signature, secret) => {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
};

export const handleWebhook = async (req, res) => {
  try {
    const config = getPaymentProviderConfig();
    const signature = req.headers["x-webhook-signature"] || req.headers["stripe-signature"];
    const rawBody = req.rawBody || JSON.stringify(req.body || {});

    if (!verifyWebhookSignature(rawBody, signature, config.webhookSecret)) {
      return res.status(401).json({ success: false, message: "Invalid webhook signature." });
    }

    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { type, data } = payload || {};
    const userId = data?.userId;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Webhook payload missing userId." });
    }

    if (type === "payment.success") {
      req.body = { ...data, provider: config.provider };
      req.user = { id: userId };
      return handleSuccessfulPayment(req, res);
    }

    if (type === "payment.failed") {
      req.body = data;
      req.user = { id: userId };
      return handleFailedPayment(req, res);
    }

    return res.status(200).json({ success: true, message: "Webhook received." });
  } catch (err) {
    logger.error(`Webhook handling failed: ${err.message}`);
    return res.status(500).json({ success: false, message: "Webhook processing failed." });
  }
};
