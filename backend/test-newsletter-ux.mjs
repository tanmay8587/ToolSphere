/**
 * Focused test for the newsletter UX message changes.
 *
 * Uses the in-memory model mocks (Newsletter, User) plus a Notification mock
 * so the subscribe controller runs end-to-end without a live MongoDB.
 *
 * Verifies the new verification-focused response messages:
 *  - New guest email  -> "Please check your email to confirm your newsletter subscription."
 *  - Existing verified -> "You are already subscribed to ToolSphere newsletter."
 *  - Existing unverified -> "Please check your email to confirm your newsletter subscription."
 *  - Invalid email     -> "Please provide a valid email address"
 */
import jwt from "jsonwebtoken";
import { subscribe } from "./server/controllers/newsletterController.js";
import Newsletter from "./server/models/Newsletter.js";
import User from "./server/models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "Tanmay_AI_Tools_2026_Super_Secure_Key";
process.env.JWT_SECRET = JWT_SECRET;

function makeRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

async function callSubscribe({ token, body = {} }) {
  const req = { body, headers: {} };
  if (token) req.headers.authorization = `Bearer ${token}`;
  const res = makeRes();
  await subscribe(req, res);
  return { status: res.statusCode, body: res.body };
}

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "✅" : "❌"} ${name} — ${detail}`);
}

async function run() {
  await Newsletter.deleteMany({});
  await User.deleteMany({});

  // 1. New guest email
  const fresh = await callSubscribe({
    body: { email: "newguest@newsletter.test", source: "website" },
  });
  record(
    "New guest email -> check-email message",
    fresh.status === 201 &&
      fresh.body?.success === true &&
      fresh.body?.message ===
        "Please check your email to confirm your newsletter subscription.",
    `status=${fresh.status} msg="${fresh.body?.message}"`
  );

  // 2. Existing verified subscriber
  const verified = await Newsletter.create({
    email: "verified@newsletter.test",
    status: "active",
    isVerified: true,
  });
  const user = await User.create({
    name: "Verified",
    email: "verified@newsletter.test",
    password: "hashed",
    isVerified: true,
  });
  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
  const dupVerified = await callSubscribe({
    token,
    body: { source: "website" },
  });
  record(
    "Existing verified -> already subscribed message",
    dupVerified.status === 200 &&
      dupVerified.body?.alreadySubscribed === true &&
      dupVerified.body?.message ===
        "You are already subscribed to ToolSphere newsletter.",
    `status=${dupVerified.status} msg="${dupVerified.body?.message}"`
  );

  // 3. Existing unverified subscriber (re-verification path)
  await Newsletter.create({
    email: "pending@newsletter.test",
    status: "active",
    isVerified: false,
  });
  const pending = await callSubscribe({
    body: { email: "pending@newsletter.test", source: "website" },
  });
  record(
    "Existing unverified -> check-email message (pendingVerification)",
    pending.status === 200 &&
      pending.body?.success === true &&
      pending.body?.pendingVerification === true &&
      pending.body?.message ===
        "Please check your email to confirm your newsletter subscription.",
    `status=${pending.status} msg="${pending.body?.message}" pending=${pending.body?.pendingVerification}`
  );

  // 4. Invalid email
  const invalid = await callSubscribe({
    body: { email: "not-an-email", source: "website" },
  });
  record(
    "Invalid email -> validation error",
    invalid.status === 400 &&
      invalid.body?.success === false &&
      invalid.body?.message === "Please provide a valid email address",
    `status=${invalid.status} msg="${invalid.body?.message}"`
  );

  await Newsletter.deleteMany({});
  await User.deleteMany({});

  const failed = results.filter((r) => !r.pass);
  console.log(
    `\n${
      failed.length === 0
        ? "🎉 ALL UX TESTS PASSED"
        : `❌ ${failed.length} TEST(S) FAILED`
    }`
  );
  process.exit(failed.length === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});