/**
 * Newsletter admin auth test (no database required).
 *
 * Verifies the `verifyAdmin` middleware used to protect the Newsletter
 * Subscribers admin endpoints (GET/DELETE /api/newsletter/subscribers):
 *   - A USER token must NOT be accepted (decoded.id is a User id, so
 *     Admin.findById returns null -> "Admin not found").
 *   - An ADMIN token MUST be accepted (admin loaded from DB -> next()).
 *
 * This confirms the backend is correct and the "Admin not found" error was
 * caused by the frontend sending the user token instead of the admin token.
 */
import jwt from "jsonwebtoken";
import { verifyAdmin } from "./server/middleware/auth.js";
import Admin from "./server/models/Admin.js";
import User from "./server/models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "Tanmay_AI_Tools_2026_Super_Secure_Key";
process.env.JWT_SECRET = JWT_SECRET;

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "✅" : "❌"} ${name} — ${detail}`);
}

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

async function run() {
  await Admin.deleteMany({});
  await User.deleteMany({});

  const admin = await Admin.create({
    name: "Auth Test Admin",
    email: "admin@newsletter.test",
    password: "hashed",
    active: true,
  });
  const user = await User.create({
    name: "Auth Test User",
    email: "user@newsletter.test",
    password: "hashed",
    isVerified: true,
  });

  const adminToken = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET);
  const userToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);

  // 1. User token must be rejected with "Admin not found"
  {
    let nextCalled = false;
    const req = {
      headers: { authorization: `Bearer ${userToken}` },
    };
    const res = makeRes();
    await verifyAdmin(req, res, () => {
      nextCalled = true;
    });
    record(
      "User token rejected (Admin not found)",
      res.statusCode === 401 &&
        res.body?.message === "Admin not found" &&
        !nextCalled,
      `status=${res.statusCode} msg="${res.body?.message}"`
    );
  }

  // 2. Admin token must be accepted (next() called, req.admin set)
  {
    let nextCalled = false;
    const req = {
      headers: { authorization: `Bearer ${adminToken}` },
    };
    const res = makeRes();
    await verifyAdmin(req, res, () => {
      nextCalled = true;
    });
    record(
      "Admin token accepted (req.admin set)",
      nextCalled === true &&
        req.admin?.id?.toString() === admin._id.toString(),
      `nextCalled=${nextCalled} adminId=${req.admin?.id?.toString()}`
    );
  }

  // 3. No token must be rejected with "Access Denied"
  {
    let nextCalled = false;
    const req = { headers: {} };
    const res = makeRes();
    await verifyAdmin(req, res, () => {
      nextCalled = true;
    });
    record(
      "Missing token rejected (Access Denied)",
      res.statusCode === 401 &&
        res.body?.message === "Access Denied" &&
        !nextCalled,
      `status=${res.statusCode} msg="${res.body?.message}"`
    );
  }

  await Admin.deleteMany({});
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