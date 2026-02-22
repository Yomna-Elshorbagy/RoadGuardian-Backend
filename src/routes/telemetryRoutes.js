import express from "express";
import * as telemetryController from "../controllers/telemetryController.js";
import { validate } from "../middleware/validate.js";
import {
    createTelemetrySchema,
    getTelemetryQuerySchema,
    telemetryIdParamSchema,
} from "../validations/telemetryValidation.js";

const router = express.Router();

router.get(
    "/",
    validate(getTelemetryQuerySchema),
    telemetryController.getTelemetry
);
router.post(
    "/",
    validate(createTelemetrySchema),
    telemetryController.createTelemetry
);
router.delete(
    "/:id",
    validate(telemetryIdParamSchema),
    telemetryController.deleteTelemetry
);

export default router;
