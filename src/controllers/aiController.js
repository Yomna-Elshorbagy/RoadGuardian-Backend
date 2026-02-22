import db from "../db.js";

export async function getAllPredictions(req, res) {
  try {
    const query = `
      SELECT
        p.id,
        p.media_id,
        p.related_accident_id,
        p.model_name,
        p.model_version,
        p.prediction_type,
        p.confidence,
        p.result_json,
        p.created_at,
        m.media_type,
        m.storage_url,
        a.severity
      FROM ai_predictions p
      LEFT JOIN media_raw m ON p.media_id = m.id
      LEFT JOIN accidents a ON p.related_accident_id = a.id
      ORDER BY p.created_at DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching predictions:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function createPrediction(req, res) {
  try {
    const {
      media_id,
      related_accident_id,
      model_name,
      model_version,
      prediction_type,
      confidence,
      result_json,
    } = req.body;

    if (!media_id || !model_name || !prediction_type || !result_json) {
      return res.status(400).json({
        error:
          "media_id, model_name, prediction_type and result_json are required",
      });
    }

    const insertQuery = `
      INSERT INTO ai_predictions (
        media_id,
        related_accident_id,
        model_name,
        model_version,
        prediction_type,
        confidence,
        result_json
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      media_id,
      related_accident_id || null,
      model_name,
      model_version || null,
      prediction_type,
      confidence || null,
      result_json,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating prediction:", err);
    res.status(500).json({ error: "Error creating prediction" });
  }
}

export async function predictRisk(req, res) {
  try {
    const { device_id, media_id } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: "device_id is required" });
    }

    // 1. Fetch last 50 telemetry records
    const telemetryQuery = `
      SELECT speed, accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z
      FROM telemetry_raw
      WHERE device_id = $1
      ORDER BY event_time DESC
      LIMIT 50
    `;
    const telemetryResult = await db.query(telemetryQuery, [device_id]);
    const telemetry = telemetryResult.rows;

    // 2. Fetch recent accidents
    const accidentQuery = `
      SELECT COUNT(*) as accident_count
      FROM accidents
      WHERE device_id = $1 AND detected_at > NOW() - INTERVAL '30 days'
    `;
    const accidentResult = await db.query(accidentQuery, [device_id]);
    const recentAccidents = parseInt(accidentResult.rows[0].accident_count);

    // 3. Simple Risk Algorithm
    let riskScore = 0;
    let avgSpeed = 0;
    let maxAccel = 0;

    if (telemetry.length > 0) {
      avgSpeed =
        telemetry.reduce((sum, t) => sum + (t.speed || 0), 0) /
        telemetry.length;
      maxAccel = Math.max(
        ...telemetry.map((t) =>
          Math.sqrt(
            Math.pow(t.accel_x || 0, 2) +
            Math.pow(t.accel_y || 0, 2) +
            Math.pow(t.accel_z || 0, 2),
          ),
        ),
      );

      // Speed factor (up to 40 points)
      riskScore += Math.min(avgSpeed / 3, 40);

      // Acceleration factor (up to 30 points)
      riskScore += Math.min(maxAccel * 5, 30);
    }

    // Accident history factor (up to 30 points)
    riskScore += Math.min(recentAccidents * 10, 30);

    // Final Normalization
    riskScore = Math.min(Math.round(riskScore), 100);

    let riskLevel = "Low";
    if (riskScore > 70) riskLevel = "High";
    else if (riskScore > 40) riskLevel = "Medium";

    const result_json = {
      risk_score: riskScore,
      risk_level: riskLevel,
      metrics: {
        avg_speed: avgSpeed.toFixed(2),
        max_acceleration: maxAccel.toFixed(2),
        recent_accidents: recentAccidents,
      },
    };

    // 4. Save Prediction (if media_id is provided)
    let savedPrediction = null;
    if (media_id) {
      const insertQuery = `
        INSERT INTO ai_predictions (
          media_id,
          model_name,
          model_version,
          prediction_type,
          confidence,
          result_json
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const saveResult = await db.query(insertQuery, [
        media_id,
        "SafeDrive-Risk-Model",
        "1.0.0",
        "Risk_Assessment",
        (100 - riskScore) / 100, // Confidence inverse to risk for safety
        result_json,
      ]);
      savedPrediction = saveResult.rows[0];
    }

    res.status(200).json({
      success: true,
      prediction: savedPrediction || result_json,
    });
  } catch (err) {
    console.error("Error in predictRisk:", err);
    res.status(500).json({ error: "Internal server error during prediction" });
  }
}

export async function deletePrediction(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      "DELETE FROM ai_predictions WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Prediction not found" });
    }

    res.json({ message: "Prediction deleted successfully", id });
  } catch (err) {
    console.error("Error deleting prediction:", err);
    res.status(500).json({ error: "Server error" });
  }
}
