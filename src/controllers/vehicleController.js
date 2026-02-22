import db from "../db.js";

export async function getAllVehicles(req, res) {
  try {
    const query = `
      SELECT 
        v.id,
        v.plate_number,
        v.vin,
        v.brand,
        v.model,
        v.year,
        v.status,
        v.owner_user_id,
        v.created_at,
        u.name AS owner_name,
        u.email AS owner_email
      FROM vehicles v
      LEFT JOIN users u ON v.owner_user_id = u.id
      ORDER BY v.id ASC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function createVehicle(req, res) {
  try {
    const {
      owner_user_id,
      plate_number,
      vin,
      brand,
      model,
      year,
      status,
    } = req.body;

    if (!plate_number) {
      return res
        .status(400)
        .json({ error: "plate_number is required" });
    }

    const insertQuery = `
      INSERT INTO vehicles (
        owner_user_id,
        plate_number,
        vin,
        brand,
        model,
        year,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'active'))
      RETURNING id, owner_user_id, plate_number, vin, brand, model, year, status, created_at
    `;

    const result = await db.query(insertQuery, [
      owner_user_id || null,
      plate_number,
      vin || null,
      brand || null,
      model || null,
      year || null,
      status || null,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating vehicle:", err);

    if (err.code === "23505") {
      return res.status(409).json({ error: "Plate number already exists" });
    }

    res.status(500).json({ error: "Error creating vehicle" });
  }
}

export async function deleteVehicle(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query("DELETE FROM vehicles WHERE id = $1 RETURNING id", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.json({ message: "Vehicle deleted successfully", id });
  } catch (err) {
    console.error("Error deleting vehicle:", err);
    res.status(500).json({ error: "Server error" });
  }
}
