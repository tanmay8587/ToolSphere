import axios from "axios";
import crypto from "crypto";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

async function testAuthFlow() {
  console.log("=== TESTING AUTH FLOW ===\n");
  
  // Step 1: Register a new user
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = "TestPassword123";
  const testName = "Test User";
  
  console.log("Step 1: Registering user...");
  console.log("Email:", testEmail);
  
  try {
    const registerResponse = await API.post("/auth/register", {
      name: testName,
      email: testEmail,
      password: testPassword,
    });
    
    console.log("Registration response:", registerResponse.data);
    
    // Step 2: Get the user from the database to check the token
    console.log("\nStep 2: Checking user in database...");
    const User = (await import("./server/models/User.js")).default;
    const user = await User.findOne({ email: testEmail });
    
    if (user) {
      console.log("User found in DB:");
      console.log("  - ID:", user._id);
      console.log("  - emailVerificationToken (hashed):", user.emailVerificationToken);
      console.log("  - emailVerificationExpire:", user.emailVerificationExpire);
      console.log("  - isVerified:", user.isVerified);
      
      // Step 3: Verify the email with the token
      console.log("\nStep 3: Verifying email...");
      
      // We need to get the plain token - but we only have the hashed one
      // Let's check if we can verify with a test token
      const testToken = "test-token-123";
      const hashedTestToken = crypto.createHash("sha256").update(testToken).digest("hex");
      
      console.log("Test token (plain):", testToken);
      console.log("Test token (hashed):", hashedTestToken);
      
      // Let's try to verify with the actual token from the DB
      // We need to manually set a known token to test
      const knownToken = "known-test-token-123";
      user.emailVerificationToken = crypto.createHash("sha256").update(knownToken).digest("hex");
      user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
      await user.save();
      
      console.log("\nUpdated user with known token:");
      console.log("  - emailVerificationToken (hashed):", user.emailVerificationToken);
      
      // Now verify with the known token
      const verifyResponse = await API.get(`/auth/verify-email/${knownToken}`);
      console.log("\nVerification response:", verifyResponse.data);
      
      // Check user after verification
      const userAfterVerify = await User.findOne({ email: testEmail });
      console.log("\nUser after verification:");
      console.log("  - isVerified:", userAfterVerify.isVerified);
      console.log("  - emailVerificationToken:", userAfterVerify.emailVerificationToken);
      
      // Step 4: Try to login
      console.log("\nStep 4: Logging in...");
      const loginResponse = await API.post("/auth/login", {
        email: testEmail,
        password: testPassword,
      });
      
      console.log("Login response:", loginResponse.data);
      
    } else {
      console.log("User not found in DB!");
    }
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testAuthFlow();