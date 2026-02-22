import db from "../db.js";

/**
 * Helper to decide whether we should filter by owner_user_id (regular user)
 * or return everything (admin).
 */
function buildUserFilterClause(role, userId) {
  if (role === "admin" || role === "super_admin") {
    return { clause: "", params: [] };
  }
  return { clause: "WHERE v.owner_user_id = $1", params: [userId] };
}

export async function getOverview(req, res) {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    // Vehicles count
    let vehiclesCount;
    if (role === "admin" || role === "super_admin") {
      const q = await db.query("SELECT COUNT(*) AS count FROM vehicles");
      vehiclesCount = Number(q.rows[0].count || 0);
    } else {
      const q = await db.query(
        "SELECT COUNT(*) AS count FROM vehicles WHERE owner_user_id = $1",
        [userId],
      );
      vehiclesCount = Number(q.rows[0].count || 0);
    }

    // Online devices in last 2 minutes
    let onlineDevicesCount;
    if (role === "admin" || role === "super_admin") {
      const q = await db.query(
        "SELECT COUNT(*) AS count FROM devices WHERE last_online_at >= NOW() - INTERVAL '2 minutes'",
      );
      onlineDevicesCount = Number(q.rows[0].count || 0);
    } else {
      const q = await db.query(
        `
        SELECT COUNT(*) AS count
        FROM devices d
        JOIN vehicles v ON d.vehicle_id = v.id
        WHERE v.owner_user_id = $1
          AND d.last_online_at >= NOW() - INTERVAL '2 minutes'
        `,
        [userId],
      );
      onlineDevicesCount = Number(q.rows[0].count || 0);
    }

    // Alerts last 24h
    let alertsLast24h;
    if (role === "admin" || role === "super_admin") {
      const q = await db.query(
        `
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'pending')  AS pending,
          COUNT(*) FILTER (WHERE status = 'sent')     AS sent
        FROM alerts
        WHERE sent_at >= NOW() - INTERVAL '24 hours'
        `,
      );
      alertsLast24h = {
        total: Number(q.rows[0].total || 0),
        pending: Number(q.rows[0].pending || 0),
        sent: Number(q.rows[0].sent || 0),
      };
    } else {
      const q = await db.query(
        `
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'pending')  AS pending,
          COUNT(*) FILTER (WHERE status = 'sent')     AS sent
        FROM alerts
        WHERE user_id = $1
          AND sent_at >= NOW() - INTERVAL '24 hours'
        `,
        [userId],
      );
      alertsLast24h = {
        total: Number(q.rows[0].total || 0),
        pending: Number(q.rows[0].pending || 0),
        sent: Number(q.rows[0].sent || 0),
      };
    }

    // Accidents last 30 days
    let accidentsLast30d;
    if (role === "admin" || role === "super_admin") {
      const q = await db.query(
        `
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'pending')   AS pending,
          COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed
        FROM accidents
        WHERE detected_at >= NOW() - INTERVAL '30 days'
        `,
      );
      accidentsLast30d = {
        total: Number(q.rows[0].total || 0),
        pending: Number(q.rows[0].pending || 0),
        confirmed: Number(q.rows[0].confirmed || 0),
      };
    } else {
      const q = await db.query(
        `
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE a.status = 'pending')   AS pending,
          COUNT(*) FILTER (WHERE a.status = 'confirmed') AS confirmed
        FROM accidents a
        JOIN vehicles v ON a.vehicle_id = v.id
        WHERE v.owner_user_id = $1
          AND a.detected_at >= NOW() - INTERVAL '30 days'
        `,
        [userId],
      );
      accidentsLast30d = {
        total: Number(q.rows[0].total || 0),
        pending: Number(q.rows[0].pending || 0),
        confirmed: Number(q.rows[0].confirmed || 0),
      };
    }

    // Safety score + total distance (last 30 days)
    let avgSafety = 0;
    let totalDistanceKm = 0;
    if (role === "admin" || role === "super_admin") {
      const q = await db.query(
        `
        SELECT
          COALESCE(AVG(safety_score), 0) AS avg_safety,
          COALESCE(SUM(distance_km), 0)  AS total_distance
        FROM trip_summary
        WHERE start_time >= NOW() - INTERVAL '30 days'
        `,
      );
      avgSafety = Number(q.rows[0].avg_safety || 0);
      totalDistanceKm = Number(q.rows[0].total_distance || 0);
    } else {
      const q = await db.query(
        `
        SELECT
          COALESCE(AVG(ts.safety_score), 0) AS avg_safety,
          COALESCE(SUM(ts.distance_km), 0)  AS total_distance
        FROM trip_summary ts
        JOIN vehicles v ON ts.vehicle_id = v.id
        WHERE v.owner_user_id = $1
          AND ts.start_time >= NOW() - INTERVAL '30 days'
        `,
        [userId],
      );
      avgSafety = Number(q.rows[0].avg_safety || 0);
      totalDistanceKm = Number(q.rows[0].total_distance || 0);
    }

    // Vehicles + latest telemetry snapshot (for My Vehicles + mini map)
    const { clause, params } = buildUserFilterClause(role, userId);
    const vehiclesQuery = `
      SELECT DISTINCT ON (v.id)
        v.id,
        v.plate_number,
        v.brand,
        v.model,
        v.year,
        v.status,
        d.status AS device_status,
        d.last_online_at,
        tr.speed      AS last_speed,
        tr.event_time AS last_event_time,
        tr.latitude   AS last_lat,
        tr.longitude  AS last_lng
      FROM vehicles v
      LEFT JOIN devices d   ON d.vehicle_id = v.id
      LEFT JOIN telemetry_raw tr ON tr.device_id = d.id
      ${clause}
      ORDER BY v.id, tr.event_time DESC
    `;
    const vehiclesResult = await db.query(vehiclesQuery, params);

    res.json({
      vehiclesCount,
      onlineDevicesCount,
      alertsLast24h,
      accidentsLast30d,
      averageSafetyScore: Math.round(avgSafety),
      totalDistanceKm,
      vehicles: vehiclesResult.rows,
    });
  } catch (err) {
    console.error("Error building dashboard overview:", err);
    res.status(500).json({ error: "Error building dashboard overview" });
  }
}

export async function getLatestVehicleLocations(req, res) {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const { clause, params } = buildUserFilterClause(role, userId);
    const q = await db.query(
      `
      SELECT DISTINCT ON (v.id)
        v.id,
        v.plate_number,
        tr.latitude   AS last_lat,
        tr.longitude  AS last_lng,
        tr.speed      AS last_speed,
        tr.event_time AS last_event_time
      FROM vehicles v
      LEFT JOIN devices d     ON d.vehicle_id = v.id
      LEFT JOIN telemetry_raw tr ON tr.device_id = d.id
      ${clause}
      ORDER BY v.id, tr.event_time DESC
      `,
      params,
    );

    res.json(q.rows);
  } catch (err) {
    console.error("Error fetching latest vehicle locations:", err);
    res.status(500).json({ error: "Error fetching latest vehicle locations" });
  }
}

export async function getUserAlerts(req, res) {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    let result;
    if (role === "admin" || role === "super_admin") {
      result = await db.query(
        `
        SELECT
          al.*,
          a.severity,
          a.source,
          a.latitude,
          a.longitude
        FROM alerts al
        LEFT JOIN accidents a ON al.accident_id = a.id
        ORDER BY al.sent_at DESC
        `,
      );
    } else {
      result = await db.query(
        `
        SELECT
          al.*,
          a.severity,
          a.source,
          a.latitude,
          a.longitude
        FROM alerts al
        LEFT JOIN accidents a ON al.accident_id = a.id
        WHERE al.user_id = $1
        ORDER BY al.sent_at DESC
        `,
        [userId],
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching dashboard alerts:", err);
    res.status(500).json({ error: "Error fetching alerts" });
  }
}

export async function ackAlert(req, res) {
  const userId = req.user.id;
  const alertId = req.params.id;

  try {
    const q = await db.query(
      `
      UPDATE alerts
      SET
        status = 'acknowledged',
        response_time_sec = COALESCE(
          response_time_sec,
          EXTRACT(EPOCH FROM (NOW() - sent_at))::INT
        )
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [alertId, userId],
    );

    if (q.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found or not owned by user" });
    }

    res.json(q.rows[0]);
  } catch (err) {
    console.error("Error acknowledging alert:", err);
    res.status(500).json({ error: "Error acknowledging alert" });
  }
}

export async function getAccidents(req, res) {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    let result;
    if (role === "admin" || role === "super_admin") {
      result = await db.query(
        `
        SELECT
          a.*,
          v.plate_number,
          v.brand,
          v.model
        FROM accidents a
        LEFT JOIN vehicles v ON a.vehicle_id = v.id
        ORDER BY a.detected_at DESC
        `,
      );
    } else {
      result = await db.query(
        `
        SELECT
          a.*,
          v.plate_number,
          v.brand,
          v.model
        FROM accidents a
        JOIN vehicles v ON a.vehicle_id = v.id
        WHERE v.owner_user_id = $1
        ORDER BY a.detected_at DESC
        `,
        [userId],
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching dashboard accidents:", err);
    res.status(500).json({ error: "Error fetching accidents" });
  }
}

export async function getAccidentById(req, res) {
  const userId = req.user.id;
  const role = req.user.role;
  const accidentId = req.params.id;

  try {
    let result;
    if (role === "admin" || role === "super_admin") {
      result = await db.query(
        `
        SELECT
          a.*,
          v.plate_number,
          v.brand,
          v.model
        FROM accidents a
        LEFT JOIN vehicles v ON a.vehicle_id = v.id
        WHERE a.id = $1
        `,
        [accidentId],
      );
    } else {
      result = await db.query(
        `
        SELECT
          a.*,
          v.plate_number,
          v.brand,
          v.model
        FROM accidents a
        JOIN vehicles v ON a.vehicle_id = v.id
        WHERE a.id = $1 AND v.owner_user_id = $2
        `,
        [accidentId, userId],
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Accident not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching accident details:", err);
    res.status(500).json({ error: "Error fetching accident details" });
  }
}

export async function updateAccidentStatus(req, res) {
  const role = req.user.role;
  const accidentId = req.params.id;
  const { status } = req.body;

  if (role !== "admin" && role !== "super_admin") {
    return res.status(403).json({ error: "Only admin can change accident status" });
  }

  if (!status) {
    return res.status(400).json({ error: "status is required" });
  }

  try {
    const q = await db.query(
      `
      UPDATE accidents
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, accidentId],
    );

    if (q.rows.length === 0) {
      return res.status(404).json({ error: "Accident not found" });
    }

    res.json(q.rows[0]);
  } catch (err) {
    console.error("Error updating accident status:", err);
    res.status(500).json({ error: "Error updating accident status" });
  }
}

