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
    
    // We need to use the same MongoDB connection
    // Let's use the resend endpoint to get a known token
    const resendResponse = await API.post("/auth/resend-verification", {
      email: testEmail,
    });
    
    console.log("Resend response:", resendResponse.data);
    
    // Now we need to get the token from the database
    // Let's use a workaround - we'll manually set a known token
    // by calling the verify endpoint with a test token
    
    // Actually, let's just test the login first
    console.log("\nStep 3: Testing login (should fail with 403)...");
    try {
      const loginResponse = await API.post("/auth/login", {
        email: testEmail,
        password: testPassword,
      });
      console.log("Login response:", loginResponse.data);
    } catch (loginError) {
      console.log("Login error (expected):", loginError.response?.data);
    }
    
    // Step 4: Test verification with a known token
    // We need to get the token from the database
    // Let's use a direct MongoDB query
    const { default: mongoose } = await import("mongoose");
    const { default: User } = await import("./server/models/User.js");
    
    const user = await User.findOne({ email: testEmail });
    if (user) {
      console.log("\nStep 4: User found in DB:");
      console.log("  - ID:", user._id);
      console.log("  - isVerified:", user.isVerified);
      console.log("  - emailVerificationToken (hashed):", user.emailVerificationToken);
      console.log("  - emailVerificationExpire:", user.emailVerificationExpire);
      
      // Set a known token for testing
      const knownToken = "known-test-token-12345678901234567890123456789012";
      user.emailVerificationToken = crypto.createHash("sha256").update(knownToken).digest("hex");
      user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
      await user.save();
      
      console.log("\nUpdated user with known token:");
      console.log("  - emailVerificationToken (hashed):", user.emailVerificationToken);
      
      // Now verify with the known token
      console.log("\nStep 5: Verifying with known token...");
      const verifyResponse = await API.get(`/auth/verify-email/${knownToken}`);
      console.log("Verification response:", verifyResponse.data);
      
      // Check user after verification
      const userAfterVerify = await User.findOne({ email: testEmail });
      console.log("\nUser after verification:");
      console.log("  - isVerified:", userAfterVerify.isVerified);
      
      // Step 6: Try to login again
      console.log("\nStep 6: Logging in after verification...");
      const loginAfterVerify = await API.post("/auth/login", {
        email: testEmail,
        password: testPassword,
      });
      console.log("Login response:", loginAfterVerify.data);
      
    } else {
      console.log("User not found in DB!");
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testAuthFlow();