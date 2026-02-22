import db from "../src/db.js";
import { spawn } from "child_process";

async function run() {
  try {
    console.log("Setting up data...");
    const u = await db.query(
      "INSERT INTO users (name, email, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING id",
      ["Tester", "tester@test.com", "driver"],
    );
    const userId = u.rows[0].id;

    const v = await db.query(
      "INSERT INTO vehicles (owner_user_id, plate_number) VALUES ($1, $2) ON CONFLICT (plate_number) DO UPDATE SET plate_number=EXCLUDED.plate_number RETURNING id",
      [userId, "PRED-TEST-VO"],
    );
    const vehicleId = v.rows[0].id;

    const d = await db.query(
      "INSERT INTO devices (vehicle_id, device_type, serial_number) VALUES ($1, $2, $3) ON CONFLICT (serial_number) DO UPDATE SET serial_number=EXCLUDED.serial_number RETURNING id",
      [vehicleId, "test", "SERIAL-PRED-X"],
    );
    const deviceId = d.rows[0].id;

    console.log("Inserting telemetry...");
    await db.query(
      "INSERT INTO telemetry_raw (device_id, event_time, speed, accel_x, accel_y, accel_z) VALUES ($1, NOW(), 120, 3, 3, 3)",
      [deviceId],
    );

    console.log(`Testing API for Device ID: ${deviceId}`);

    // Call the API via curl
    const curl = spawn("curl", [
      "-X",
      "POST",
      "-H",
      "Content-Type: application/json",
      "-d",
      JSON.stringify({ device_id: deviceId }),
      "http://localhost:5321/api/ai/predict-risk", // Updated port to 5321 as per index.js
    ]);

    curl.stdout.on("data", (data) => {
      console.log("API Response:", data.toString());
    });

    curl.on("close", (code) => {
      console.log(`Curl process exited with code ${code}`);
      process.exit();
    });
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
