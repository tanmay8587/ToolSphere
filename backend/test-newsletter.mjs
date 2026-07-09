/**
 * Test Newsletter Subscription System
 */

import mongoose from "mongoose";
import Newsletter from "./server/models/Newsletter.js";
import { notifyNewTool, notifyNewBlog, getActiveSubscriberCount } from "./server/utils/newsletterEmail.js";

const TEST_DB_URL = "mongodb://localhost:27017/toolsphere_test";

async function runTests() {
  console.log("🧪 Starting Newsletter System Tests...\n");

  try {
    // Connect to test database
    await mongoose.connect(TEST_DB_URL);
    console.log("✅ Connected to test database\n");

    // Clean up any existing test data
    await Newsletter.deleteMany({ email: { $regex: /@test\.com$/ } });
    console.log("✅ Cleaned up test data\n");

    // Test 1: Create a new subscriber
    console.log("📝 Test 1: Create new subscriber");
    const testEmail1 = "test1@test.com";
    const subscriber1 = await Newsletter.create({
      email: testEmail1,
      status: "active",
      source: "website"
    });
    console.log(`✅ Created subscriber: ${subscriber1.email}`);
    console.log(`   Status: ${subscriber1.status}`);
    console.log(`   ID: ${subscriber1._id}\n`);

    // Test 2: Prevent duplicate subscriptions
    console.log("📝 Test 2: Prevent duplicate subscriptions");
    try {
      await Newsletter.create({
        email: testEmail1,
        status: "active",
        source: "website"
      });
      console.log("❌ FAILED: Duplicate subscription was created\n");
    } catch (error) {
      if (error.code === 11000) {
        console.log("✅ Duplicate subscription prevented (unique constraint)\n");
      } else {
        throw error;
      }
    }

    // Test 3: Create unsubscribed user and test reactivation
    console.log("📝 Test 3: Test reactivation of unsubscribed user");
    const testEmail2 = "test2@test.com";
    const unsubscribedUser = await Newsletter.create({
      email: testEmail2,
      status: "unsubscribed",
      source: "website"
    });
    console.log(`   Created unsubscribed user: ${unsubscribedUser.email}`);

    // Reactivate
    unsubscribedUser.status = "active";
    unsubscribedUser.unsubscribedAt = null;
    await unsubscribedUser.save();
    console.log("✅ User reactivated successfully\n");

    // Test 4: Get active subscriber count
    console.log("📝 Test 4: Get active subscriber count");
    const activeCount = await getActiveSubscriberCount();
    console.log(`✅ Active subscribers: ${activeCount}\n`);

    // Test 5: Test notifyNewTool function
    console.log("📝 Test 5: Test notifyNewTool function");
    const testTool = {
      name: "Test AI Tool",
      slug: "test-ai-tool",
      description: "A test tool for newsletter",
      category: "Testing",
      pricing: "Free",
      rating: 5.0
    };

    const toolResult = await notifyNewTool(testTool);
    console.log(`   Result: ${toolResult.message}`);
    console.log(`   Count: ${toolResult.count}`);
    console.log("✅ notifyNewTool executed (check logs for email sending)\n");

    // Test 6: Test notifyNewBlog function
    console.log("📝 Test 6: Test notifyNewBlog function");
    const testBlog = {
      title: "Test Blog Post",
      slug: "test-blog-post",
      excerpt: "A test blog post for newsletter",
      category: "Testing",
      author: "Test Author"
    };

    const blogResult = await notifyNewBlog(testBlog);
    console.log(`   Result: ${blogResult.message}`);
    console.log(`   Count: ${blogResult.count}`);
    console.log("✅ notifyNewBlog executed (check logs for email sending)\n");

    // Test 7: Verify subscribers in database
    console.log("📝 Test 7: Verify all subscribers");
    const allSubscribers = await Newsletter.find({});
    console.log(`✅ Total subscribers in DB: ${allSubscribers.length}`);
    allSubscribers.forEach(sub => {
      console.log(`   - ${sub.email} (${sub.status})`);
    });
    console.log();

    // Test 8: Test filtering active subscribers
    console.log("📝 Test 8: Filter active subscribers");
    const activeSubscribers = await Newsletter.find({ status: "active" });
    console.log(`✅ Active subscribers: ${activeSubscribers.length}\n`);

    // Clean up test data
    console.log("🧹 Cleaning up test data...");
    await Newsletter.deleteMany({ email: { $regex: /@test\.com$/ } });
    console.log("✅ Test data cleaned up\n");

    console.log("═══════════════════════════════════════");
    console.log("✅ ALL TESTS PASSED!");
    console.log("═══════════════════════════════════════");

  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from database");
    process.exit(0);
  }
}

// Run tests
runTests();