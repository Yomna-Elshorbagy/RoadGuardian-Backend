import db from "../src/db.js";

async function verify() {
  try {
    console.log("--- 1. Setting up mock data ---");

    // Create User (ignore if exists)
    const user = await db.query(
      "INSERT INTO users (name, email, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name=$1 RETURNING id",
      ["Test User", "test@safedrive.com", "driver"],
    );
    const userId = user.rows[0].id;

    // Create Vehicle
    const vehicle = await db.query(
      "INSERT INTO vehicles (owner_user_id, plate_number, brand, model) VALUES ($1, $2, $3, $4) ON CONFLICT (plate_number) DO UPDATE SET model=$4 RETURNING id",
      [userId, "TEST-123", "SafeDrive", "Mock-V1"],
    );
    const vehicleId = vehicle.rows[0].id;

    // Create Device
    const device = await db.query(
      "INSERT INTO devices (vehicle_id, device_type, serial_number) VALUES ($1, $2, $3) ON CONFLICT (serial_number) DO UPDATE SET device_type=$2 RETURNING id",
      [vehicleId, "OBD-II", "SD-TEST-999"],
    );
    const deviceId = device.rows[0].id;

    // Insert Telemetry (Fast speed, High acceleration)
    console.log("--- 2. Inserting mock telemetry ---");
    for (let i = 0; i < 5; i++) {
      await db.query(
        "INSERT INTO telemetry_raw (device_id, event_time, speed, accel_x, accel_y, accel_z) VALUES ($1, NOW(), $2, $3, $4, $5)",
        [deviceId, 120 + i * 5, 2.5, 1.8, 3.0],
      );
    }

    // Insert Accident (Recent)
    console.log("--- 3. Inserting mock accident ---");
    await db.query(
      "INSERT INTO accidents (device_id, detected_at, severity, source) VALUES ($1, NOW() - INTERVAL '2 days', 'high', 'auto')",
      [deviceId],
    );

    // 4. Call the API
    console.log("--- 4. Calling Predict Risk API ---");
    const PORT = 5321; // Updated port to 5321 as per index.js
    const response = await fetch(
      `http://localhost:${PORT}/api/ai/predict-risk`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId }),
      },
    );

    const data = await response.json();
    console.log("API Response Status:", response.status);
    console.log("Prediction Result:", JSON.stringify(data, null, 2));

    if (data.prediction && data.prediction.risk_score > 0) {
      console.log("SUCCESS: Prediction engine calculated a risk score.");
    } else {
      console.log("FAILURE: Risk score is 0 or missing, check algorithm.");
    }
  } catch (err) {
    console.error("Verification failed:", err.message);
    if (err.response) console.error("Data:", err.response.data);
  } finally {
    process.exit();
  }
}

// Check if server is running before testing
verify();
