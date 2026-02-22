import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

function normalizeRole(role) {
  return String(role || "user").toLowerCase();
}

export async function getAllUsers(req, res) {
  try {
    const result = await db.query(
      "SELECT id, name, email, phone, role, created_at FROM users ORDER BY id ASC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

export async function createUser(req, res) {
  console.log("✅ CREATE USER HIT:", req.body);

  try {
    const {
      name,
      username,
      email,
      phone,
      role,
      password,
      confirmedPassword,
      confirmPassword,
    } = req.body;

    const allowedRoles = ["user", "admin", "driver"];
    const normalizedRole = normalizeRole(role);

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        error: "Invalid role. Allowed roles: user, admin, driver",
      });
    }

    const finalName = name || username;

    const confirm = confirmedPassword ?? confirmPassword ?? password;

    if (!finalName || !email || !password) {
      return res.status(400).json({
        error: "name (or username), email and password are required",
      });
    }

    if (password !== confirm) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = `
      INSERT INTO users (name, email, phone, role, password)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, phone, role, created_at
    `;

    const result = await db.query(insertQuery, [
      finalName,
      email,
      phone || null,
      normalizedRole,
      hashedPassword,
    ]);

    return res.status(201).json({
      message: "User created successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Error creating user:", err);

    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }

    return res.status(500).json({
      error: "Error creating user",
      details: err.message,
    });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    delete user.password;

    res.json({ message: "Login successful", token, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully", id });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

export async function changePassword(req, res) {
  const userId = req.user?.id;
  const { current_password, new_password } = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!current_password || !new_password) {
    return res
      .status(400)
      .json({ error: "current_password and new_password are required" });
  }

  try {
    const result = await db.query("SELECT password FROM users WHERE id = $1", [
      userId,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(
      current_password,
      result.rows[0].password || "",
    );
    if (!isMatch)
      return res.status(401).json({ error: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedPassword,
      userId,
    ]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    res
      .status(500)
      .json({ error: "Error changing password", details: err.message });
  }
}

export async function getProfile(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const result = await db.query(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1",
      [userId],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { name, phone } = req.body;

    const updates = [];
    const values = [];
    let i = 1;

    if (name !== undefined) {
      updates.push(`name = $${i++}`);
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${i++}`);
      values.push(phone);
    }

    if (updates.length === 0)
      return res.status(400).json({ error: "No fields to update" });

    values.push(userId);

    const result = await db.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${i} RETURNING id, name, email, phone, role, created_at`,
      values,
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

export async function updateUserByAdmin(req, res) {
  try {
    const actorRole = String(req.user?.role || "").toLowerCase();
    if (actorRole !== "admin" && actorRole !== "super_admin") {
      return res.status(403).json({ error: "Only admin can update users" });
    }

    const { id } = req.params;
    const { name, phone, role } = req.body;

    const updates = [];
    const values = [];
    let i = 1;

    if (name !== undefined) {
      updates.push(`name = $${i++}`);
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${i++}`);
      values.push(phone);
    }
    if (role !== undefined) {
      const r = normalizeRole(role);
      if (!["user", "admin", "driver"].includes(r)) {
        return res
          .status(400)
          .json({ error: "Invalid role. Allowed roles: user, admin, driver" });
      }
      updates.push(`role = $${i++}`);
      values.push(r);
    }

    if (updates.length === 0)
      return res.status(400).json({ error: "No fields to update" });

    values.push(id);

    const result = await db.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${i} RETURNING id, name, email, phone, role, created_at`,
      values,
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating user by admin:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}
