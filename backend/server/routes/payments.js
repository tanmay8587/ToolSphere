import express from "express";
import { verifyUser } from "../middleware/auth.js";
import { createCheckout, handleFailedPayment, handleSuccessfulPayment, handleWebhook } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/checkout", verifyUser, createCheckout);
router.post("/success", verifyUser, handleSuccessfulPayment);
router.post("/failed", verifyUser, handleFailedPayment);
router.post("/webhook", express.text({ type: "*/*" }), handleWebhook);

export default router;
