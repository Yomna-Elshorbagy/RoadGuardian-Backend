import db from "../db.js";

export async function getAllAlerts(req, res) {
  try {
    const query = `
      SELECT
        al.id,
        al.accident_id,
        al.user_id,
        al.channel,
        al.sent_at,
        al.status,
        al.response_time_sec,
        al.created_at,
        a.severity,
        a.source,
        u.name AS user_name,
        u.email AS user_email
      FROM alerts al
      LEFT JOIN accidents a ON al.accident_id = a.id
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.sent_at DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching alerts:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function createAlert(req, res) {
  try {
    const {
      accident_id,
      user_id,
      channel,
      sent_at,
      status,
      response_time_sec,
    } = req.body;

    if (!accident_id || !user_id || !channel || !sent_at) {
      return res.status(400).json({
        error: "accident_id, user_id, channel and sent_at are required",
      });
    }

    const insertQuery = `
      INSERT INTO alerts (
        accident_id,
        user_id,
        channel,
        sent_at,
        status,
        response_time_sec
      )
      VALUES ($1,$2,$3,$4,COALESCE($5,'sent'),$6)
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      accident_id,
      user_id,
      channel,
      sent_at,
      status || null,
      response_time_sec || null,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating alert:", err);
    res.status(500).json({ error: "Error creating alert" });
  }
}

export async function deleteAlert(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM alerts WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json({ message: "Alert deleted successfully", id });
  } catch (err) {
    console.error("Error deleting alert:", err);
    res.status(500).json({ error: "Server error" });
  }
}
