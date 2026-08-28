import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const { MONGO_URI } = process.env;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env file");
  process.exit(1);
}

// Import models
import Tool from "./server/models/Tool.js";
import ToolAnalytics from "./server/models/ToolAnalytics.js";
import Bookmark from "./server/models/Bookmark.js";

// Import the controllers under test (invoked with mock req/res objects)
import {
  viewTool,
  clickTool,
  toggleToolLike,
  getToolAnalytics,
  getAllToolsAnalytics,
} from "./server/controllers/toolAnalyticsController.js";

// Test results tracker
const tests = [];
let passCount = 0;
let failCount = 0;

function test(name, fn) {
  return async () => {
    try {
      await fn();
      console.log(`✅ ${name}`);
      tests.push({ name, status: "PASS" });
      passCount++;
    } catch (error) {
      console.error(`❌ ${name}: ${error.message}`);
      tests.push({ name, status: "FAIL", error: error.message });
      failCount++;
    }
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

/* Mock req/res helpers so controllers can be exercised directly */
const mockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.json = function (payload) {
    this.body = payload;
    return this;
  };
  return res;
};

const mockReq = ({ slug, visitorId, userId } = {}) => ({
  params: { slug },
  headers: visitorId ? { "x-visitor-id": visitorId } : {},
  user: userId ? { id: userId } : undefined,
});

const runTests = async () => {
  console.log("\n==================================");
  console.log("Testing Tool Analytics System");
  console.log("==================================\n");

  // Connect to MongoDB
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB\n");

  // Unique test tool (isolated from production data, removed at the end)
  const stamp = Date.now();
  const testSlug = `analytics-test-tool-${stamp}`;
  let testTool;

  // Test 1: Models are properly defined
  await test("ToolAnalytics model is defined with TTL index", async () => {
    assert(ToolAnalytics, "ToolAnalytics model not found");
    const indexes = ToolAnalytics.schema.indexes();
    const hasTtl = indexes.some(([, opts]) => opts && opts.expireAfterSeconds !== undefined);
    assert(hasTtl, "ToolAnalytics is missing the TTL (expireAfterSeconds) index");
  })();

  await test("Tool model exposes likes + likedBy fields", async () => {
    assert(Tool.schema.path("likes"), "Tool.likes field missing");
    assert(Tool.schema.path("likedBy"), "Tool.likedBy field missing");
  })();

  // Create the isolated test tool
  await test("Create isolated test tool", async () => {
    testTool = await Tool.create({
      name: `Analytics Test Tool ${stamp}`,
      slug: testSlug,
      category: "Testing",
      description:
        "A temporary tool created by the tool-analytics test suite to validate view, click, like and traffic aggregation.",
      website: "https://example.com",
    });
    assert(testTool && testTool._id, "Test tool was not created");
  })();

  // Test 2: First view is counted
  await test("viewTool counts the first view", async () => {
    const res = mockRes();
    await viewTool(mockReq({ slug: testSlug, visitorId: `visitor-a-${stamp}` }), res);
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    assert(res.body?.success === true, "viewTool did not return success");
    assert(res.body?.counted === true, "First view should be counted");
    assert(res.body?.views === 1, `Expected views=1, got ${res.body?.views}`);
  })();

  // Test 3: Duplicate view within 24h is NOT counted (same visitor)
  await test("viewTool dedupes repeat views within 24h", async () => {
    const res = mockRes();
    await viewTool(mockReq({ slug: testSlug, visitorId: `visitor-a-${stamp}` }), res);
    assert(res.body?.counted === false, "Duplicate view should not be counted");
    assert(res.body?.views === 1, `Views should stay 1, got ${res.body?.views}`);
  })();

  // Test 4: A different visitor IS counted
  await test("viewTool counts a different visitor", async () => {
    const res = mockRes();
    await viewTool(mockReq({ slug: testSlug, visitorId: `visitor-b-${stamp}` }), res);
    assert(res.body?.counted === true, "New visitor should be counted");
    assert(res.body?.views === 2, `Expected views=2, got ${res.body?.views}`);
  })();

  // Test 5: Unknown slug returns 404
  await test("viewTool returns 404 for unknown slug", async () => {
    const res = mockRes();
    await viewTool(mockReq({ slug: `does-not-exist-${stamp}` }), res);
    assert(res.statusCode === 404, `Expected 404, got ${res.statusCode}`);
  })();

  // Test 6: clickTool increments the click counter and logs an event
  await test("clickTool increments clicks and logs a click event", async () => {
    const res = mockRes();
    await clickTool(mockReq({ slug: testSlug, visitorId: `visitor-c-${stamp}` }), res);
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    assert(res.body?.success === true, "clickTool did not return success");
    assert(res.body?.clicks === 1, `Expected clicks=1, got ${res.body?.clicks}`);

    const events = await ToolAnalytics.countDocuments({ tool: testTool._id, action: "click" });
    assert(events === 1, `Expected 1 click event, got ${events}`);
  })();

  // Test 7: toggleToolLike likes then unlikes
  await test("toggleToolLike toggles like on and off", async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    const likeRes = mockRes();
    await toggleToolLike(mockReq({ slug: testSlug, userId }), likeRes);
    assert(likeRes.body?.success === true, "toggleToolLike (on) did not return success");
    assert(likeRes.body?.liked === true, "Expected liked=true after first toggle");
    assert(likeRes.body?.totalLikes === 1, `Expected totalLikes=1, got ${likeRes.body?.totalLikes}`);

    const unlikeRes = mockRes();
    await toggleToolLike(mockReq({ slug: testSlug, userId }), unlikeRes);
    assert(unlikeRes.body?.liked === false, "Expected liked=false after second toggle");
    assert(unlikeRes.body?.totalLikes === 0, `Expected totalLikes=0, got ${unlikeRes.body?.totalLikes}`);

    const tool = await Tool.findById(testTool._id);
    assert((tool.likedBy || []).length === 0, "likedBy should be empty after unlike");
    assert(tool.likes === 0, `Expected likes=0 on tool, got ${tool.likes}`);
  })();

  // Test 8: getToolAnalytics returns summary + 30-day traffic series
  await test("getToolAnalytics returns summary + 30-day traffic chart", async () => {
    const res = mockRes();
    await getToolAnalytics(mockReq({ slug: testSlug }), res);
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    assert(res.body?.success === true, "getToolAnalytics did not return success");

    const { summary, traffic } = res.body;
    assert(summary.views === 2, `Expected summary.views=2, got ${summary.views}`);
    assert(summary.clicks === 1, `Expected summary.clicks=1, got ${summary.clicks}`);
    assert(summary.likes === 0, `Expected summary.likes=0, got ${summary.likes}`);

    assert(Array.isArray(traffic), "traffic should be an array");
    assert(traffic.length === 30, `Expected 30 traffic buckets, got ${traffic.length}`);

    const today = traffic[traffic.length - 1];
    assert(today.views === 2, `Expected today's views=2 in chart, got ${today.views}`);
    assert(today.clicks === 1, `Expected today's clicks=1 in chart, got ${today.clicks}`);
    assert(today.saves === 0, `Expected today's saves=0 in chart, got ${today.saves}`);

    // Ensure the series is continuous (one bucket per day)
    const first = new Date(traffic[0].date);
    const last = new Date(traffic[traffic.length - 1].date);
    const daySpan = Math.round((last - first) / (24 * 60 * 60 * 1000));
    assert(daySpan === 29, `Expected a continuous 30-day span, got ${daySpan} days`);
  })();

  // Test 9: getAllToolsAnalytics returns totals, traffic and tools
  await test("getAllToolsAnalytics returns totals + traffic + tools", async () => {
    const res = mockRes();
    await getAllToolsAnalytics({}, res);
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    assert(res.body?.success === true, "getAllToolsAnalytics did not return success");

    const { totals, traffic, tools } = res.body;
    assert(typeof totals.views === "number", "totals.views missing");
    assert(typeof totals.clicks === "number", "totals.clicks missing");
    assert(typeof totals.saves === "number", "totals.saves missing");
    assert(typeof totals.likes === "number", "totals.likes missing");

    assert(Array.isArray(traffic) && traffic.length === 30, "traffic should have 30 buckets");
    assert(Array.isArray(tools), "tools should be an array");

    const mine = tools.find((t) => t.slug === testSlug);
    assert(mine, "Test tool missing from admin tools analytics");
    assert(mine.views === 2, `Expected tool views=2 in admin list, got ${mine.views}`);
    assert(mine.clicks === 1, `Expected tool clicks=1 in admin list, got ${mine.clicks}`);
  })();

  // Test 10: A 'save' (Bookmark) event shows up in the traffic chart
  await test("Bookmark creation appears as a save in the traffic chart", async () => {
    const userId = new mongoose.Types.ObjectId();
    await Bookmark.create({ user: userId, tool: testTool._id });

    const res = mockRes();
    await getToolAnalytics(mockReq({ slug: testSlug }), res);
    const today = res.body.traffic[res.body.traffic.length - 1];
    assert(today.saves === 1, `Expected today's saves=1, got ${today.saves}`);

    await Bookmark.deleteOne({ tool: testTool._id, user: userId });
  })();

  /* =========================
     CLEANUP
     ========================= */
  await test("Cleanup test data", async () => {
    await ToolAnalytics.deleteMany({ tool: testTool._id });
    if (testTool) await Tool.deleteOne({ _id: testTool._id });
  })();

  // Print summary
  console.log("\n==================================");
  console.log("Tool Analytics Test Summary");
  console.log("==================================");
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);

  if (failCount > 0) {
    console.log("\nFailed tests:");
    tests.filter((t) => t.status === "FAIL").forEach((t) => console.log(`   - ${t.name}: ${t.error}`));
  }

  await mongoose.disconnect();
  process.exit(failCount > 0 ? 1 : 0);
};

// Run tests
runTests().catch(async (err) => {
  console.error("Fatal test error:", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});

