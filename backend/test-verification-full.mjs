import axios from "axios";
import crypto from "crypto";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

async function testVerificationFlow() {
  console.log("=== TESTING VERIFICATION FLOW ===\n");
  
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
    
    // Step 2: Login as admin
    console.log("\nStep 2: Logging in as admin...");
    const adminLogin = await API.post("/admin/login", {
      email: "admin@aitoolsdirectory.com",
      password: "Admin@12345",
    });
    
    if (!adminLogin.data.success) {
      console.log("Admin login failed:", adminLogin.data);
      return;
    }
    
    const adminToken = adminLogin.data.token;
    
    // Get the user
    const usersResponse = await API.get("/admin/users", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const testUser = usersResponse.data.users.find(u => u.email === testEmail);
    if (!testUser) {
      console.log("Test user not found in admin users list");
      return;
    }
    
    console.log("Found test user:", testUser._id);
    console.log("User isVerified:", testUser.isVerified);
    
    // Set a known token for testing
    const knownToken = "known-test-token-12345678901234567890123456789012";
    const hashedKnownToken = crypto.createHash("sha256").update(knownToken).digest("hex");
    
    // Update the user with the known token
    console.log("\nStep 3: Setting known token in database...");
    const updateResponse = await API.put(`/admin/users/${testUser._id}`, {
      emailVerificationToken: hashedKnownToken,
      emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000,
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log("Update response:", updateResponse.data);
    
    // Step 4: Verify with the known token
    console.log("\nStep 4: Verifying with known token...");
    const verifyResponse = await API.get(`/auth/verify-email/${knownToken}`);
    console.log("Verification response:", verifyResponse.data);
    
    // Step 5: Check user after verification
    const usersAfterVerify = await API.get("/admin/users", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const testUserAfterVerify = usersAfterVerify.data.users.find(u => u.email === testEmail);
    console.log("\nUser after verification:");
    console.log("  - isVerified:", testUserAfterVerify.isVerified);
    
    // Step 6: Try to login
    console.log("\nStep 6: Logging in after verification...");
    const loginResponse = await API.post("/auth/login", {
      email: testEmail,
      password: testPassword,
    });
    
    console.log("Login response:", loginResponse.data);
    console.log("Login response - isVerified:", loginResponse.data.user?.isVerified);
    
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testVerificationFlow();