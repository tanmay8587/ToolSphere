/**
 * Newsletter subscription flow test (no database required).
 *
 * The Newsletter and User models are redirected to in-memory mocks via
 * test-mocks/loader.mjs, so the subscribe controller logic is exercised
 * end-to-end without a live MongoDB connection.
 *
 * Verifies:
 *  - Guests can subscribe (email in body)
 *  - Logged-in users can subscribe (email from token, no body email)
 *  - Duplicate subscriptions are prevented (including case-insensitive)
 */
import jwt from "jsonwebtoken";
import { subscribe } from "./server/controllers/newsletterController.js";
import Newsletter from "./server/models/Newsletter.js";
import User from "./server/models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "Tanmay_AI_Tools_2026_Super_Secure_Key";

// The controller reads process.env.JWT_SECRET at call time (as the real app
// does via dotenv). Ensure it is set in this test process too.
process.env.JWT_SECRET = JWT_SECRET;

const TEST_EMAIL = "flowtest@newsletter.test";

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
  console.log("✅ Using in-memory mocks (no DB)\n");

  // Clean slate
  await Newsletter.deleteMany({});
  await User.deleteMany({});

  // Create a verified user for the "logged-in" scenario
  const user = await User.create({
    name: "Flow Test",
    email: TEST_EMAIL,
    password: "hashed",
    isVerified: true,
  });
  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);

  // 1. Guest subscribe (no token, email in body)
  const guest = await callSubscribe({
    body: { email: "guest@newsletter.test", source: "website" },
  });
  record(
    "Guest can subscribe",
    guest.status === 201 && guest.body?.success === true,
    `status=${guest.status} msg="${guest.body?.message}"`
  );

  // 2. Logged-in user subscribe (token, NO body email)
  const loggedIn = await callSubscribe({ token, body: { source: "website" } });
  record(
    "Logged-in user can subscribe (no body email)",
    loggedIn.status === 201 && loggedIn.body?.success === true,
    `status=${loggedIn.status} msg="${loggedIn.body?.message}"`
  );

  // 3. Duplicate guest (same email as #1)
  const dupGuest = await callSubscribe({
    body: { email: "guest@newsletter.test" },
  });
  record(
    "Duplicate guest prevented (friendly message)",
    dupGuest.status === 200 && dupGuest.body?.alreadySubscribed === true,
    `status=${dupGuest.status} msg="${dupGuest.body?.message}"`
  );

  // 4. Duplicate logged-in (same email as #2)
  const dupLoggedIn = await callSubscribe({
    token,
    body: { source: "website" },
  });
  record(
    "Duplicate logged-in prevented (friendly message)",
    dupLoggedIn.status === 200 && dupLoggedIn.body?.alreadySubscribed === true,
    `status=${dupLoggedIn.status} msg="${dupLoggedIn.body?.message}"`
  );

  // 5. Case-insensitive duplicate (different casing of guest email)
  const caseDup = await callSubscribe({
    body: { email: "GUEST@Newsletter.Test" },
  });
  record(
    "Case-insensitive duplicate prevented",
    caseDup.status === 200 && caseDup.body?.alreadySubscribed === true,
    `status=${caseDup.status} msg="${caseDup.body?.message}"`
  );

  // 6. Guest without email should error
  const noEmail = await callSubscribe({ body: {} });
  record(
    "Guest without email is rejected",
    noEmail.status === 400 && noEmail.body?.success === false,
    `status=${noEmail.status} msg="${noEmail.body?.message}"`
  );

  // Cleanup
  await Newsletter.deleteMany({});
  await User.deleteMany({});

  const failed = results.filter((r) => !r.pass);
  console.log(
    `\n${
      failed.length === 0
        ? "🎉 ALL TESTS PASSED"
        : `❌ ${failed.length} TEST(S) FAILED`
    }`
  );
  process.exit(failed.length === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});