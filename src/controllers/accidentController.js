import db from "../db.js";

export async function getAllAccidents(req, res) {
  try {
    const query = `
      SELECT
        a.id,
        a.device_id,
        a.vehicle_id,
        a.detected_at,
        a.reported_at,
        a.latitude,
        a.longitude,
        a.speed_at_impact,
        a.severity,
        a.status,
        a.source,
        a.root_cause,
        a.created_at,
        v.plate_number,
        d.device_type
      FROM accidents a
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      LEFT JOIN devices d ON a.device_id = d.id
      ORDER BY a.detected_at DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching accidents:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function createAccident(req, res) {
  try {
    const {
      device_id,
      vehicle_id,
      detected_at,
      latitude,
      longitude,
      speed_at_impact,
      severity,
      source,
      root_cause,
    } = req.body;

    if (!detected_at || !source) {
      return res
        .status(400)
        .json({ error: "detected_at and source are required" });
    }

    const insertQuery = `
      INSERT INTO accidents (
        device_id,
        vehicle_id,
        detected_at,
        latitude,
        longitude,
        speed_at_impact,
        severity,
        source,
        root_cause
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      device_id || null,
      vehicle_id || null,
      detected_at,
      latitude || null,
      longitude || null,
      speed_at_impact || null,
      severity || null,
      source,
      root_cause || null,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating accident:", err);
    res.status(500).json({ error: "Error creating accident" });
  }
}

export async function deleteAccident(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM accidents WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Accident not found" });
    }

    res.json({ message: "Accident deleted successfully", id });
  } catch (err) {
    console.error("Error deleting accident:", err);
    res.status(500).json({ error: "Server error" });
  }
}
