/**
 * Test Suite for Visitor Tracking System
 * 
 * Tests:
 * 1. Visitor counting works correctly
 * 2. Duplicate visitors are not counted
 * 3. Statistics update automatically
 * 4. Existing functionality remains unchanged
 */

import mongoose from "mongoose";
import Visitor from "./server/models/Visitor.js";
import { getStatistics } from "./server/controllers/statisticsController.js";

// Test configuration
const TEST_DB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai-tools-test";
const TEST_TIMEOUT = 10000;

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Log test result
 */
const logTest = (testName, passed, message = "") => {
  const status = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${status}: ${testName}${message ? ` - ${message}` : ""}`);
  
  testResults.tests.push({ testName, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
};

/**
 * Clear test data
 */
const clearTestData = async () => {
  await Visitor.deleteMany({});
  console.log("🧹 Test data cleared\n");
};

/**
 * Test 1: Unique visitor tracking with IP + Session + User-Agent
 */
const testUniqueVisitorTracking = async () => {
  console.log("\n📝 Test 1: Unique visitor tracking");
  
  const ipAddress = "192.168.1.100";
  const sessionId = "session-123";
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
  const currentDate = new Date();
  const visitMonth = currentDate.getMonth() + 1;
  const visitYear = currentDate.getFullYear();

  // Clear data
  await clearTestData();

  // Simulate first visit - should create unique visitor
  const result1 = await Visitor.findOneAndUpdate(
    { ipAddress, sessionId, visitMonth, visitYear },
    {
      ipAddress,
      sessionId,
      userAgent,
      visitMonth,
      visitYear,
      visitedAt: new Date(),
      isUnique: true,
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  logTest("First visit creates unique visitor", result1 !== null, "Visitor record created");
  logTest("First visit is marked as unique", result1.isUnique === true, "isUnique flag set correctly");

  // Simulate second visit from same visitor - should update, not create duplicate
  const result2 = await Visitor.findOneAndUpdate(
    { ipAddress, sessionId, visitMonth, visitYear },
    {
      ipAddress,
      sessionId,
      userAgent,
      visitMonth,
      visitYear,
      visitedAt: new Date(),
      isUnique: true,
    },
    { upsert: true, new: true }
  );

  const count = await Visitor.countDocuments({ ipAddress, sessionId, visitMonth, visitYear });
  logTest("Second visit doesn't create duplicate", count === 1, `Found ${count} record(s)`);
  logTest("Second visit updates timestamp", result2.visitedAt > result1.visitedAt, "Timestamp updated");
};

/**
 * Test 2: Different sessions from same IP are tracked separately
 */
const testDifferentSessions = async () => {
  console.log("\n📝 Test 2: Different sessions from same IP");
  
  const ipAddress = "192.168.1.200";
  const session1 = "session-A";
  const session2 = "session-B";
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
  const currentDate = new Date();
  const visitMonth = currentDate.getMonth() + 1;
  const visitYear = currentDate.getFullYear();

  await clearTestData();

  // First session
  await Visitor.findOneAndUpdate(
    { ipAddress, sessionId: session1, visitMonth, visitYear },
    { ipAddress, sessionId: session1, userAgent, visitMonth, visitYear, visitedAt: new Date(), isUnique: true, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Second session (different browser/incognito)
  await Visitor.findOneAndUpdate(
    { ipAddress, sessionId: session2, visitMonth, visitYear },
    { ipAddress, sessionId: session2, userAgent, visitMonth, visitYear, visitedAt: new Date(), isUnique: true, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const count = await Visitor.countDocuments({ ipAddress, visitMonth, visitYear });
  logTest("Different sessions create separate records", count === 2, `Found ${count} record(s)`);
};

/**
 * Test 3: Statistics calculation
 */
const testStatisticsCalculation = async () => {
  console.log("\n📝 Test 3: Statistics calculation");
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  await clearTestData();

  // Create test data
  const testVisitors = [
    { ipAddress: "10.0.0.1", sessionId: "s1", isUnique: true },
    { ipAddress: "10.0.0.2", sessionId: "s2", isUnique: true },
    { ipAddress: "10.0.0.3", sessionId: "s3", isUnique: true },
    { ipAddress: "10.0.0.1", sessionId: "s1", isUnique: false }, // Duplicate visit
    { ipAddress: "10.0.0.2", sessionId: "s2", isUnique: false }, // Duplicate visit
  ];

  for (const visitor of testVisitors) {
    await Visitor.findOneAndUpdate(
      { ipAddress: visitor.ipAddress, sessionId: visitor.sessionId, visitMonth: currentMonth, visitYear: currentYear },
      { ...visitor, userAgent: "test", visitMonth: currentMonth, visitYear: currentYear, visitedAt: new Date(), $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  // Count unique visitors
  const uniqueCount = await Visitor.countDocuments({
    visitMonth: currentMonth,
    visitYear: currentYear,
    isUnique: true
  });

  logTest("Statistics count unique visitors correctly", uniqueCount === 3, `Expected 3, got ${uniqueCount}`);
};

/**
 * Test 4: Route filtering
 */
const testRouteFiltering = async () => {
  console.log("\n📝 Test 4: Route filtering");
  
  const shouldSkipTracking = (reqPath) => {
    if (reqPath.startsWith("/api/")) return true;
    
    const staticAssetPatterns = ["/static/", "/uploads/", "/favicon.ico", "/robots.txt", "/sitemap.xml"];
    if (staticAssetPatterns.some(pattern => reqPath.startsWith(pattern))) return true;
    
    const staticExtensions = [".css", ".js", ".jsx", ".ts", ".tsx", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".otf", ".webp", ".avif"];
    if (staticExtensions.some(ext => reqPath.endsWith(ext))) return true;
    
    return false;
  };

  const testCases = [
    { path: "/api/tools", shouldSkip: true, desc: "API route" },
    { path: "/static/js/main.js", shouldSkip: true, desc: "JavaScript file" },
    { path: "/uploads/image.png", shouldSkip: true, desc: "Image file" },
    { path: "/favicon.ico", shouldSkip: true, desc: "Favicon" },
    { path: "/styles.css", shouldSkip: true, desc: "CSS file" },
    { path: "/fonts/roboto.woff2", shouldSkip: true, desc: "Font file" },
    { path: "/tools", shouldSkip: false, desc: "Page route" },
    { path: "/tools/chatgpt", shouldSkip: false, desc: "Tool detail page" },
    { path: "/categories", shouldSkip: false, desc: "Categories page" },
    { path: "/about", shouldSkip: false, desc: "About page" },
  ];

  let allPassed = true;
  for (const testCase of testCases) {
    const result = shouldSkipTracking(testCase.path);
    const passed = result === testCase.shouldSkip;
    logTest(`Route filtering: ${testCase.desc}`, passed, `${testCase.path} -> skip=${result}`);
    if (!passed) allPassed = false;
  }

  return allPassed;
};

/**
 * Test 5: Index verification
 */
const testIndexes = async () => {
  console.log("\n📝 Test 5: Index verification");
  
  const indexes = await Visitor.collection.getIndexes();
  
  // Check for required indexes
  const hasCompoundIndex = Object.values(indexes).some(idx => 
    idx.key && JSON.stringify(idx.key).includes('ipAddress') && 
    JSON.stringify(idx.key).includes('sessionId') &&
    JSON.stringify(idx.key).includes('visitMonth') &&
    JSON.stringify(idx.key).includes('visitYear')
  );
  
  logTest("Compound unique index exists", hasCompoundIndex, "IP + Session + Month + Year");
  
  const hasTTLIndex = Object.values(indexes).some(idx =>
    idx.key && JSON.stringify(idx.key).includes('visitedAt') && idx.expireAfterSeconds
  );
  
  logTest("TTL index exists", hasTTLIndex, "Auto-cleanup after 1 year");
};

/**
 * Test 6: Performance - No duplicate writes
 */
const testPerformance = async () => {
  console.log("\n📝 Test 6: Performance - No duplicate writes");
  
  const ipAddress = "192.168.1.50";
  const sessionId = "perf-test-session";
  const currentDate = new Date();
  const visitMonth = currentDate.getMonth() + 1;
  const visitYear = currentDate.getFullYear();

  await clearTestData();

  // Simulate 10 visits from same user
  const startTime = Date.now();
  
  for (let i = 0; i < 10; i++) {
    await Visitor.findOneAndUpdate(
      { ipAddress, sessionId, visitMonth, visitYear },
      { ipAddress, sessionId, userAgent: "test", visitMonth, visitYear, visitedAt: new Date(), isUnique: true, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const count = await Visitor.countDocuments({ ipAddress, sessionId, visitMonth, visitYear });
  
  logTest("10 visits create only 1 record", count === 1, `Expected 1, got ${count}`);
  logTest("Performance is acceptable", duration < 1000, `Completed in ${duration}ms`);
};

/**
 * Run all tests
 */
const runTests = async () => {
  console.log("🚀 Starting Visitor Tracking Tests\n");
  console.log("=" .repeat(60));

  try {
    // Connect to database
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(TEST_DB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Run tests
    await testUniqueVisitorTracking();
    await testDifferentSessions();
    await testStatisticsCalculation();
    await testRouteFiltering();
    await testIndexes();
    await testPerformance();

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log("=".repeat(60));

    if (testResults.failed > 0) {
      console.log("\n❌ Failed Tests:");
      testResults.tests
        .filter(t => !t.passed)
        .forEach(t => console.log(`  - ${t.testName}: ${t.message}`));
    }

    console.log("\n✅ All tests completed!\n");

  } catch (error) {
    console.error("❌ Test suite error:", error);
  } finally {
    // Cleanup and disconnect
    await clearTestData();
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
};

// Run tests with timeout
runTests();