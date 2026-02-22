import express from "express";
import * as alertController from "../controllers/alertController.js";
import { validate } from "../middleware/validate.js";
import {
    createAlertSchema,
    alertIdParamSchema,
} from "../validations/alertValidation.js";

const router = express.Router();

router.get("/", alertController.getAllAlerts);
router.post("/", validate(createAlertSchema), alertController.createAlert);
router.delete(
    "/:id",
    validate(alertIdParamSchema),
    alertController.deleteAlert
);

export default router;
