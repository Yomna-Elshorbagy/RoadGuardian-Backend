import db from "../db.js";

export async function getAllMedia(req, res) {
  try {
    const query = `
      SELECT
        m.id,
        m.device_id,
        m.vehicle_id,
        m.accident_id,
        m.media_type,
        m.storage_url,
        m.format,
        m.size_bytes,
        m.captured_at,
        m.source,
        m.created_at,
        a.severity,
        v.plate_number
      FROM media_raw m
      LEFT JOIN accidents a ON m.accident_id = a.id
      LEFT JOIN vehicles v ON m.vehicle_id = v.id
      ORDER BY m.captured_at DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching media:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function createMedia(req, res) {
  try {
    const {
      device_id,
      vehicle_id,
      accident_id,
      media_type,
      storage_url,
      format,
      size_bytes,
      captured_at,
      source,
    } = req.body;

    if (!media_type || !storage_url || !captured_at) {
      return res.status(400).json({
        error: "media_type, storage_url and captured_at are required",
      });
    }

    const insertQuery = `
      INSERT INTO media_raw (
        device_id,
        vehicle_id,
        accident_id,
        media_type,
        storage_url,
        format,
        size_bytes,
        captured_at,
        source
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,'auto_capture'))
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      device_id || null,
      vehicle_id || null,
      accident_id || null,
      media_type,
      storage_url,
      format || null,
      size_bytes || null,
      captured_at,
      source || null,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating media:", err);
    res.status(500).json({ error: "Error creating media" });
  }
}

export async function deleteMedia(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM media_raw WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Media not found" });
    }

    res.json({ message: "Media deleted successfully", id });
  } catch (err) {
    console.error("Error deleting media:", err);
    res.status(500).json({ error: "Server error" });
  }
}
