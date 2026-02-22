import express from "express";
import cors from "cors";
import "dotenv/config";

import userRoutes from "./src/routes/userRoutes.js";
import vehicleRoutes from "./src/routes/vehicleRoutes.js";
import deviceRoutes from "./src/routes/deviceRoutes.js";
import telemetryRoutes from "./src/routes/telemetryRoutes.js";
import accidentRoutes from "./src/routes/accidentRoutes.js";
import alertRoutes from "./src/routes/alertRoutes.js";
import mediaRoutes from "./src/routes/mediaRoutes.js";
import aiRoutes from "./src/routes/aiRoutes.js";
import contactRoutes from "./src/routes/contactRoutes.js";
import reviewRoutes from "./src/routes/reviewRouter.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";

import db from "./src/db.js";

const app = express();

app.use(cors({
  origin: "*"
}));

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/accidents", accidentRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/dashboard", dashboardRoutes);


db.query("SELECT NOW()")
  .then(res => console.log("DB Connected:", res.rows))
  .catch(err => console.error("DB Error:", err));


// Health Check Route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running 🚀",
    time: new Date(),
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Start the server
const PORT = 6321;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
