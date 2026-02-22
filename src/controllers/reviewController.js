import db from "../db.js";

export async function getAllReviews(req, res) {
  try {
    const result = await db.query(
      "SELECT * FROM reviews ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function createReview(req, res) {
  try {
    const { user_id, name, role, rating, comment } = req.body;

    if (!name || !rating || !comment) {
      return res.status(400).json({
        error: "name, rating, and comment are required",
      });
    }

    const insertQuery = `
      INSERT INTO reviews (user_id, name, role, rating, comment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      user_id || null,
      name,
      role || null,
      rating,
      comment,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ error: "Error creating review" });
  }
}

export async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM reviews WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ message: "Review deleted successfully", id });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ error: "Server error" });
  }
}
