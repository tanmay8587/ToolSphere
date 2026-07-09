// This script should be run while the server is running
// It uses the server's MongoDB connection

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
    
    // Step 2: Test login (should fail with 403)
    console.log("\nStep 2: Testing login (should fail with 403)...");
    try {
      const loginResponse = await API.post("/auth/login", {
        email: testEmail,
        password: testPassword,
      });
      console.log("Login response:", loginResponse.data);
    } catch (loginError) {
      console.log("Login error (expected):", loginError.response?.data);
    }
    
    // Step 3: Test verification with a known token
    // We'll use a known token and manually set it in the database
    // by calling the verify endpoint with a test token
    
    // First, let's get the user from the database to see the token
    // We'll use the resend endpoint to generate a new token
    console.log("\nStep 3: Resending verification email...");
    const resendResponse = await API.post("/auth/resend-verification", {
      email: testEmail,
    });
    console.log("Resend response:", resendResponse.data);
    
    // Now we need to get the token from the database
    // Let's use a workaround - we'll manually set a known token
    // by using the admin API or direct database access
    
    // For now, let's just test with a random token to see the error
    console.log("\nStep 4: Testing verification with random token...");
    const randomToken = "random-test-token-12345678901234567890123456789012";
    try {
      const verifyResponse = await API.get(`/auth/verify-email/${randomToken}`);
      console.log("Verification response:", verifyResponse.data);
    } catch (verifyError) {
      console.log("Verification error (expected):", verifyError.response?.data);
    }
    
    // Step 5: Now let's set a known token in the database
    // We'll use the admin endpoint to update the user
    console.log("\nStep 5: Setting known token in database via admin API...");
    
    // First, let's login as admin
    const adminLogin = await API.post("/admin/login", {
      email: "admin@aitoolsdirectory.com",
      password: "Admin@12345",
    });
    
    if (adminLogin.data.success) {
      const adminToken = adminLogin.data.token;
      
      // Now update the user with a known token
      const knownToken = "known-test-token-12345678901234567890123456789012";
      const hashedKnownToken = crypto.createHash("sha256").update(knownToken).digest("hex");
      
      // Get the user ID
      const usersResponse = await API.get("/admin/users", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const testUser = usersResponse.data.users.find(u => u.email === testEmail);
      if (testUser) {
        console.log("Found test user:", testUser._id);
        
        // Update the user with the known token
        const updateResponse = await API.put(`/admin/users/${testUser._id}`, {
          emailVerificationToken: hashedKnownToken,
          emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000,
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        console.log("Update response:", updateResponse.data);
        
        // Now verify with the known token
        console.log("\nStep 6: Verifying with known token...");
        const verifyResponse = await API.get(`/auth/verify-email/${knownToken}`);
        console.log("Verification response:", verifyResponse.data);
        
        // Step 7: Try to login again
        console.log("\nStep 7: Logging in after verification...");
        const loginAfterVerify = await API.post("/auth/login", {
          email: testEmail,
          password: testPassword,
        });
        console.log("Login response:", loginAfterVerify.data);
      } else {
        console.log("Test user not found in admin users list");
      }
    } else {
      console.log("Admin login failed:", adminLogin.data);
    }
    
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testAuthFlow();