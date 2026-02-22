import db from "../src/db.js";

const API_BASE_URL = "http://localhost:5321/api"; // Updated port to 5321 as per index.js

async function verifyDelete() {
  try {
    console.log("Starting verification of DELETE endpoints...");

    // 1. Verify User Deletion
    console.log("\n--- Verifying User Deletion ---");
    const userRes = await db.query(
      "INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING id",
      ["Delete Tester", `delete_${Date.now()}@test.com`, "driver"],
    );
    const userId = userRes.rows[0].id;
    console.log(`Created test user with ID: ${userId}`);

    const userDeleteRes = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "DELETE",
    });
    const userData = await userDeleteRes.json();
    console.log("Delete Response:", userData);

    const checkUser = await db.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    if (checkUser.rows.length === 0) {
      console.log("✅ User successfully deleted from database.");
    } else {
      console.error("❌ User still exists in database!");
    }

    // 2. Verify Vehicle Deletion
    console.log("\n--- Verifying Vehicle Deletion ---");
    const vehicleRes = await db.query(
      "INSERT INTO vehicles (plate_number) VALUES ($1) RETURNING id",
      [`PLATE-${Date.now()}`],
    );
    const vehicleId = vehicleRes.rows[0].id;
    console.log(`Created test vehicle with ID: ${vehicleId}`);

    const vehicleDeleteRes = await fetch(
      `${API_BASE_URL}/vehicles/${vehicleId}`,
      { method: "DELETE" },
    );
    const vehicleData = await vehicleDeleteRes.json();
    console.log("Delete Response:", vehicleData);

    const checkVehicle = await db.query(
      "SELECT * FROM vehicles WHERE id = $1",
      [vehicleId],
    );
    if (checkVehicle.rows.length === 0) {
      console.log("✅ Vehicle successfully deleted from database.");
    } else {
      console.error("❌ Vehicle still exists in database!");
    }

    // 3. Verify Contact Deletion
    console.log("\n--- Verifying Contact Deletion ---");
    const contactRes = await db.query(
      "INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING id",
      ["Tester", "test@test.com", "Test Message"],
    );
    const contactId = contactRes.rows[0].id;
    console.log(`Created test contact with ID: ${contactId}`);

    const contactDeleteRes = await fetch(
      `${API_BASE_URL}/contacts/${contactId}`,
      { method: "DELETE" },
    );
    const contactData = await contactDeleteRes.json();
    console.log("Delete Response:", contactData);

    const checkContact = await db.query(
      "SELECT * FROM contacts WHERE id = $1",
      [contactId],
    );
    if (checkContact.rows.length === 0) {
      console.log("✅ Contact successfully deleted from database.");
    } else {
      console.error("❌ Contact still exists in database!");
    }

    // 4. Verify Review Deletion
    console.log("\n--- Verifying Review Deletion ---");
    const reviewRes = await db.query(
      "INSERT INTO reviews (name, rating, comment) VALUES ($1, $2, $3) RETURNING id",
      ["Tester", 5, "Great!"],
    );
    const reviewId = reviewRes.rows[0].id;
    console.log(`Created test review with ID: ${reviewId}`);

    const reviewDeleteRes = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: "DELETE",
    });
    const reviewData = await reviewDeleteRes.json();
    console.log("Delete Response:", reviewData);

    const checkReview = await db.query("SELECT * FROM reviews WHERE id = $1", [
      reviewId,
    ]);
    if (checkReview.rows.length === 0) {
      console.log("✅ Review successfully deleted from database.");
    } else {
      console.error("❌ Review still exists in database!");
    }

    console.log("\nVerification complete!");
    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err.message);
    process.exit(1);
  }
}

verifyDelete();
