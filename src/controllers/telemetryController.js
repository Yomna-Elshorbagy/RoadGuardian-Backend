import db from "../db.js";

export async function getTelemetry(req, res) {
  try {
    const { device_id, limit = 100 } = req.query;

    let query = `
      SELECT *
      FROM telemetry_raw
    `;
    const params = [];

    if (device_id) {
      query += ` WHERE device_id = $1`;
      params.push(device_id);
    }

    query += ` ORDER BY event_time DESC LIMIT ${Number(limit)}`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching telemetry:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function createTelemetry(req, res) {
  try {
    const {
      device_id,
      event_time,
      latitude,
      longitude,
      speed,
      accel_x,
      accel_y,
      accel_z,
      gyro_x,
      gyro_y,
      gyro_z,
      engine_temp,
      fuel_level,
      battery_voltage,
      raw_payload_json,
    } = req.body;

    if (!device_id || !event_time) {
      return res
        .status(400)
        .json({ error: "device_id and event_time are required" });
    }

    const insertQuery = `
      INSERT INTO telemetry_raw (
        device_id,
        event_time,
        latitude,
        longitude,
        speed,
        accel_x,
        accel_y,
        accel_z,
        gyro_x,
        gyro_y,
        gyro_z,
        engine_temp,
        fuel_level,
        battery_voltage,
        raw_payload_json
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15
      )
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      device_id,
      event_time,
      latitude || null,
      longitude || null,
      speed || null,
      accel_x || null,
      accel_y || null,
      accel_z || null,
      gyro_x || null,
      gyro_y || null,
      gyro_z || null,
      engine_temp || null,
      fuel_level || null,
      battery_voltage || null,
      raw_payload_json || null,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating telemetry:", err);
    res.status(500).json({ error: "Error inserting telemetry" });
  }
}

export async function deleteTelemetry(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM telemetry_raw WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Telemetry record not found" });
    }

    res.json({ message: "Telemetry record deleted successfully", id });
  } catch (err) {
    console.error("Error deleting telemetry:", err);
    res.status(500).json({ error: "Server error" });
  }
}
