import db from "../db.js";

export async function createContact(req, res) {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: "Name, email and message are required" });
  }

  try {
    const insertQuery = `
      INSERT INTO contacts (name, email, message)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, message, created_at
    `;

    const result = await db.query(insertQuery, [name, email, message]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error saving contact message:", err);
    res.status(500).json({ error: "Server error saving message" });
  }
}

export async function getAllContacts(req, res) {
  try {
    const result = await db.query(
      "SELECT * FROM contacts ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching contact messages:", err);
    res.status(500).json({ error: "Server error fetching messages" });
  }
}

export async function deleteContact(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM contacts WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Contact message not found" });
    }

    res.json({ message: "Contact message deleted successfully", id });
  } catch (err) {
    console.error("Error deleting contact message:", err);
    res.status(500).json({ error: "Server error" });
  }
}
