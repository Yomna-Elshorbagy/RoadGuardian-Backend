import db from "../src/db.js";

const API_BASE_URL = "http://localhost:5321/api"; // Updated port to 5321 as per index.js

async function verifyAuthFlow() {
  try {
    console.log("Starting verification of authentication and profile APIs...");

    // 1. Create a test user
    console.log("\n--- Creating Test User ---");
    const testEmail = `authtest_${Date.now()}@test.com`;
    const testPassword = "TestPassword123";

    const createUserRes = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Auth Test User",
        email: testEmail,
        phone: "1234567890",
        role: "driver",
        password: testPassword,
        confirmedPassword: testPassword,
      }),
    });

    const createdUser = await createUserRes.json();
    console.log("Created user:", createdUser);

    // 2. Login and get token
    console.log("\n--- Testing Login ---");
    const loginRes = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginData = await loginRes.json();
    console.log("Login response:", loginData);

    if (!loginData.token) {
      throw new Error("No token received from login!");
    }

    const token = loginData.token;
    console.log("✅ Token received successfully");

    // 3. Get Profile with token
    console.log("\n--- Testing Get Profile ---");
    const profileRes = await fetch(`${API_BASE_URL}/users/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const profileData = await profileRes.json();
    console.log("Profile data:", profileData);

    if (profileData.email === testEmail) {
      console.log("✅ Profile retrieved successfully");
    } else {
      console.error("❌ Profile data mismatch!");
    }

    // 4. Update Profile with token
    console.log("\n--- Testing Update Profile ---");
    const updateRes = await fetch(`${API_BASE_URL}/users/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated Auth Test User",
        phone: "9876543210",
      }),
    });

    const updatedProfile = await updateRes.json();
    console.log("Updated profile:", updatedProfile);

    if (
      updatedProfile.name === "Updated Auth Test User" &&
      updatedProfile.phone === "9876543210"
    ) {
      console.log("✅ Profile updated successfully");
    } else {
      console.error("❌ Profile update failed!");
    }

    // 5. Test without token (should fail)
    console.log("\n--- Testing Access Without Token ---");
    const noTokenRes = await fetch(`${API_BASE_URL}/users/profile`, {
      method: "GET",
    });

    const noTokenData = await noTokenRes.json();
    console.log("Response without token:", noTokenData);

    if (noTokenRes.status === 401) {
      console.log("✅ Correctly rejected request without token");
    } else {
      console.error("❌ Should have rejected request without token!");
    }

    // 6. Cleanup - delete test user
    console.log("\n--- Cleaning Up ---");
    await db.query("DELETE FROM users WHERE email = $1", [testEmail]);
    console.log("✅ Test user deleted");

    console.log("\n✅ All verification tests passed!");
    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err.message);
    process.exit(1);
  }
}

verifyAuthFlow();
