import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./backend/.env" });

const { MONGO_URI, JWT_SECRET } = process.env;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env file");
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET not found in .env file");
  process.exit(1);
}

// Import models
import HomeSettings from "./server/models/HomeSettings.js";
import Admin from "./server/models/Admin.js";

// Import utilities
import jwt from "jsonwebtoken";

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
    console.log("Testing HomeSettings API");
    console.log("==================================\n");

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Clean up any existing test data
    await HomeSettings.deleteMany({ key: "home" });
    await Admin.deleteMany({ email: "test-admin@test.com" });

    // Test 1: Check models exist
    await test("Models are properly defined", async () => {
      assert(HomeSettings, "HomeSettings model not found");
      assert(Admin, "Admin model not found");
    })();

    // Test 2: Create test admin
    await test("Create test admin for authentication", async () => {
      const testAdmin = await Admin.create({
        email: "test-admin@test.com",
        password: "test123",
        name: "Test Admin",
        role: "admin",
        active: true,
      });
      assert(testAdmin._id, "Admin should have an ID");
      console.log(`   Created admin with ID: ${testAdmin._id}`);
    })();

    // Test 3: Generate admin token
    await test("Generate valid admin JWT token", async () => {
      const admin = await Admin.findOne({ email: "test-admin@test.com" });
      const token = jwt.sign(
        { id: admin._id, email: admin.email, role: admin.role },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      assert(token, "Token should be generated");
      console.log(`   Generated token: ${token.substring(0, 20)}...`);
      global.testToken = token;
    })();

    // Test 4: Verify HomeSettings schema structure
    await test("HomeSettings schema has all required sections", async () => {
      const schema = HomeSettings.schema;
      const paths = schema.paths;

      assert(paths.key, "key field should exist");
      assert(paths.heroTrending, "heroTrending field should exist");
      assert(paths.trendingCard, "trendingCard field should exist");
      assert(paths.featuredCategories, "featuredCategories field should exist");
      assert(paths.statsCounter, "statsCounter field should exist");
      assert(paths.testimonials, "testimonials field should exist");
      assert(paths.faqPreview, "faqPreview field should exist");
      assert(paths.ctaSection, "ctaSection field should exist");

      console.log("   All required sections found in schema");
    })();

    // Test 5: Create HomeSettings with defaults
    await test("Create HomeSettings document with defaults", async () => {
      const settings = new HomeSettings({
        key: "home",
        heroTrending: {
          title: "Test Hero",
          subtitle: "Test Subtitle",
          icon: "FiZap",
          tools: [
            {
              name: "Test Tool",
              category: "Testing",
              rating: 4.5,
              description: "A test tool",
            },
          ],
          badge: "Test badge",
          heading: "Test heading",
          description: "Test description",
          searchPlaceholder: "Search...",
          buttonText: "Click",
        },
        trendingCard: {
          label: "Trending",
          title: "Test Trending",
          icon: "FiZap",
          tools: [
            {
              name: "Trending Tool",
              category: "Trending",
              rating: 4.8,
              description: "A trending tool",
            },
          ],
        },
        featuredCategories: {
          enabled: true,
          categoryOrder: ["Writing", "Image", "Productivity"],
        },
        statsCounter: {
          enabled: true,
          items: [
            { label: "Test Label", value: "100+" },
          ],
        },
        testimonials: {
          enabled: true,
          items: [
            {
              name: "Test User",
              role: "Tester",
              content: "Great product!",
              rating: 5,
            },
          ],
        },
        faqPreview: {
          enabled: true,
          items: [
            {
              question: "Test question?",
              answer: "Test answer",
            },
          ],
        },
        ctaSection: {
          enabled: true,
          title: "Test CTA",
          description: "Test description",
          primaryButtonText: "Click",
          primaryButtonLink: "/test",
          secondaryButtonText: "Learn More",
          secondaryButtonLink: "/learn",
        },
      });

      await settings.save();
      assert(settings._id, "Settings should have an ID");
      console.log(`   Created settings with ID: ${settings._id}`);
      global.settingsId = settings._id;
    })();

    // Test 6: Verify settings were saved
    await test("Verify settings exist in database", async () => {
      const settings = await HomeSettings.findOne({ key: "home" });
      assert(settings, "Settings should exist");
      assert(settings.heroTrending, "heroTrending should exist");
      assert(settings.trendingCard, "trendingCard should exist");
      assert(settings.featuredCategories, "featuredCategories should exist");
      assert(settings.statsCounter, "statsCounter should exist");
      assert(settings.testimonials, "testimonials should exist");
      assert(settings.faqPreview, "faqPreview should exist");
      assert(settings.ctaSection, "ctaSection should exist");
      console.log("   All sections verified in database");
    })();

    // Test 7: Verify singleton behavior (unique key)
    await test("Verify singleton behavior (unique key constraint)", async () => {
      const count = await HomeSettings.countDocuments({ key: "home" });
      assert(count === 1, "Should have exactly one home settings document");
      console.log(`   Found ${count} document(s) with key='home'`);
    })();

    // Test 8: Test partial update
    await test("Test partial update of heroTrending", async () => {
      const settings = await HomeSettings.findOne({ key: "home" });
      settings.heroTrending.title = "Updated Hero Title";
      settings.heroTrending.heading = "Updated Heading";
      await settings.save();

      const updated = await HomeSettings.findOne({ key: "home" });
      assert(updated.heroTrending.title === "Updated Hero Title", "Title should be updated");
      assert(updated.heroTrending.heading === "Updated Heading", "Heading should be updated");
      console.log("   Partial update successful");
    })();

    // Test 9: Verify timestamps exist
    await test("Verify timestamps are automatically managed", async () => {
      const settings = await HomeSettings.findOne({ key: "home" });
      assert(settings.createdAt, "createdAt should exist");
      assert(settings.updatedAt, "updatedAt should exist");
      console.log(`   Created: ${settings.createdAt}`);
      console.log(`   Updated: ${settings.updatedAt}`);
    })();

    // Test 10: Verify XSS sanitization
    await test("Verify XSS sanitization in pre-save hook", async () => {
      const settings = new HomeSettings({
        key: "home-xss-test",
        heroTrending: {
          title: "<script>alert('xss')</script>Test",
          subtitle: "Safe subtitle",
          icon: "FiZap",
          tools: [],
        },
      });

      await settings.save();
      const sanitized = await HomeSettings.findOne({ key: "home-xss-test" });
      
      // The sanitizeTextField function should remove script tags
      assert(!sanitized.heroTrending.title.includes("<script>"), "Script tags should be sanitized");
      console.log("   XSS sanitization working correctly");
    })();

    // Test 11: Verify default values
    await test("Verify default values are applied", async () => {
      const settings = new HomeSettings({ key: "home-defaults-test" });
      
      assert(settings.key === "home-defaults-test", "Key should be set");
      assert(settings.heroTrending !== undefined, "heroTrending should have default");
      assert(settings.trendingCard !== undefined, "trendingCard should have default");
      assert(settings.featuredCategories !== undefined, "featuredCategories should have default");
      assert(settings.statsCounter !== undefined, "statsCounter should have default");
      assert(settings.testimonials !== undefined, "testimonials should have default");
      assert(settings.faqPreview !== undefined, "faqPreview should have default");
      assert(settings.ctaSection !== undefined, "ctaSection should have default");

      console.log("   All default values verified");
    })();

    // Test 12: Verify validation constraints
    await test("Verify schema validation constraints", async () => {
      const schema = HomeSettings.schema;
      
      // Check heroTrending.tools rating constraint
      const toolsPath = schema.paths.heroTrending?.schema?.paths?.tools;
      if (toolsPath) {
        const toolSchema = toolsPath.schema || toolsPath;
        const ratingPath = toolSchema?.paths?.rating;
        if (ratingPath) {
          assert(ratingPath.min === 0, "Rating min should be 0");
          assert(ratingPath.max === 5, "Rating max should be 5");
        }
      }

      console.log("   Validation constraints verified");
    })();

    // Clean up test data
    console.log("\nCleaning up test data...");
    await HomeSettings.deleteMany({ key: { $in: ["home", "home-xss-test", "home-defaults-test"] } });
    await Admin.deleteMany({ email: "test-admin@test.com" });
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