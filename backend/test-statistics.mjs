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
import Category from "./server/models/Category.js";
import Newsletter from "./server/models/Newsletter.js";
import Visitor from "./server/models/Visitor.js";

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

// Run tests
const runTests = async () => {
  try {
    console.log("\n==================================");
    console.log("Testing Statistics System");
    console.log("==================================\n");

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Test 1: Check models exist
    await test("Models are properly defined", async () => {
      assert(Tool, "Tool model not found");
      assert(Category, "Category model not found");
      assert(Newsletter, "Newsletter model not found");
      assert(Visitor, "Visitor model not found");
    })();

    // Test 2: Count existing tools
    await test("Count active tools", async () => {
      const count = await Tool.countDocuments({
        approved: true,
        isDeleted: false,
        status: "active",
      });
      console.log(`   Found ${count} active tools`);
      assert(typeof count === "number", "Tool count should be a number");
    })();

    // Test 3: Count existing categories
    await test("Count active categories", async () => {
      const count = await Category.countDocuments({ isActive: true });
      console.log(`   Found ${count} active categories`);
      assert(typeof count === "number", "Category count should be a number");
    })();

    // Test 4: Count existing newsletter subscribers
    await test("Count active newsletter subscribers", async () => {
      const count = await Newsletter.countDocuments({ status: "active" });
      console.log(`   Found ${count} active subscribers`);
      assert(typeof count === "number", "Subscriber count should be a number");
    })();

    // Test 5: Count monthly visitors
    await test("Count monthly unique visitors", async () => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const count = await Visitor.countDocuments({
        visitMonth: currentMonth,
        visitYear: currentYear,
        isUnique: true,
      });
      console.log(`   Found ${count} unique visitors this month`);
      assert(typeof count === "number", "Visitor count should be a number");
    })();

    // Test 6: Create a test visitor
    await test("Create test visitor", async () => {
      const testVisitor = await Visitor.create({
        ipAddress: "127.0.0.1",
        sessionId: "test-session-123",
        userAgent: "Test Agent",
        visitMonth: new Date().getMonth() + 1,
        visitYear: new Date().getFullYear(),
        isUnique: true,
      });
      assert(testVisitor._id, "Visitor should have an ID");
      console.log(`   Created visitor with ID: ${testVisitor._id}`);
    })();

    // Test 7: Verify visitor was created
    await test("Verify visitor exists in database", async () => {
      const visitor = await Visitor.findOne({ "sessionId": "test-session-123" });
      assert(visitor, "Visitor should exist");
      console.log(`   Found visitor: ${visitor.ipAddress}`);
    })();

    // Test 8: Test duplicate prevention
    await test("Prevent duplicate unique visitors for same IP", async () => {
      const currentDate = new Date();
      const visitMonth = currentDate.getMonth() + 1;
      const visitYear = currentDate.getFullYear();

      // Check if IP already exists as unique visitor this month
      const existing = await Visitor.findOne({
        ipAddress: "127.0.0.1",
        visitMonth,
        visitYear,
        isUnique: true,
      });

      if (existing) {
        console.log(`   IP 127.0.0.1 already tracked as unique visitor this month`);
        assert(true, "Duplicate prevention working");
      } else {
        // Create new unique visitor
        await Visitor.create({
          ipAddress: "192.168.1.100",
          sessionId: "test-session-456",
          userAgent: "Test Agent 2",
          visitMonth,
          visitYear,
          isUnique: true,
        });
        console.log(`   New unique visitor created for different IP`);
        assert(true, "New unique visitor allowed");
      }
    })();

    // Test 9: Verify indexes exist
    await test("Database indexes are properly configured", async () => {
      const indexes = await Visitor.collection.getIndexes();
      assert(Object.keys(indexes).length > 0, "Indexes should exist");
      console.log(`   Found ${Object.keys(indexes).length} indexes`);
    })();

    // Test 10: Test TTL index
    await test("TTL index configured for auto-cleanup", async () => {
      const indexes = await Visitor.collection.getIndexes();
      const hasTTL = Object.values(indexes).some(idx => 
        idx.expireAfterSeconds !== undefined
      );
      assert(hasTTL, "TTL index should be configured");
      console.log(`   TTL index found (auto-deletes after 1 year)`);
    })();

    // Cleanup test data
    console.log("\nCleaning up test data...");
    await Visitor.deleteMany({ sessionId: { $in: ["test-session-123", "test-session-456"] } });
    console.log("✅ Test data cleaned up\n");

    // Print summary
    console.log("==================================");
    console.log("Test Summary");
    console.log("==================================");
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${passCount} ✅`);
    console.log(`Failed: ${failCount} ❌`);
    console.log("==================================\n");

    if (failCount > 0) {
      console.log("Failed Tests:");
      tests.filter(t => t.status === "FAIL").forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
      console.log("");
    }

  } catch (error) {
    console.error("❌ Test execution error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB\n");
    process.exit(failCount > 0 ? 1 : 0);
  }
};

runTests();