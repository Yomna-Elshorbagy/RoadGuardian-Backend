import db from "../db.js";

export async function getAllDevices(req, res) {
  try {
    const query = `
      SELECT 
        d.id,
        d.vehicle_id,
        d.device_type,
        d.serial_number,
        d.imei,
        d.firmware_version,
        d.status,
        d.last_online_at,
        d.created_at,
        v.plate_number AS vehicle_plate
      FROM devices d
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      ORDER BY d.id ASC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching devices:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function createDevice(req, res) {
  try {
    const {
      vehicle_id,
      device_type,
      serial_number,
      imei,
      firmware_version,
      status,
    } = req.body;

    if (!device_type) {
      return res.status(400).json({ error: "device_type is required" });
    }

    const insertQuery = `
      INSERT INTO devices (
        vehicle_id, device_type, serial_number, imei, firmware_version, status
      )
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'installed'))
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      vehicle_id || null,
      device_type,
      serial_number || null,
      imei || null,
      firmware_version || null,
      status || null,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating device:", err);

    if (err.code === "23505") {
      return res.status(409).json({ error: "serial_number already exists" });
    }

    res.status(500).json({ error: "Error creating device" });
  }
}

export async function deleteDevice(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM devices WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Device not found" });
    }

    res.json({ message: "Device deleted successfully", id });
  } catch (err) {
    console.error("Error deleting device:", err);
    res.status(500).json({ error: "Server error" });
  }
}
