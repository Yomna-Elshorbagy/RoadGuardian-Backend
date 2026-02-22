import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import * as dashboardController from "../controllers/dashboardController.js";
import { validate } from "../middleware/validate.js";
import {
  ackAlertParamSchema,
  accidentIdParamSchema,
  updateAccidentStatusSchema,
} from "../validations/dashboardValidation.js";

const router = express.Router();

// All dashboard routes require authentication
router.get("/overview", authenticateToken, dashboardController.getOverview);
router.get(
  "/vehicles/latest-locations",
  authenticateToken,
  dashboardController.getLatestVehicleLocations,
);

router.get("/alerts", authenticateToken, dashboardController.getUserAlerts);
router.post(
  "/alerts/:id/ack",
  authenticateToken,
  validate(ackAlertParamSchema),
  dashboardController.ackAlert
);

router.get("/accidents", authenticateToken, dashboardController.getAccidents);
router.get(
  "/accidents/:id",
  authenticateToken,
  validate(accidentIdParamSchema),
  dashboardController.getAccidentById
);
router.patch(
  "/accidents/:id/status",
  authenticateToken,
  validate(updateAccidentStatusSchema),
  dashboardController.updateAccidentStatus
);

export default router;

