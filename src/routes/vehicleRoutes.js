import express from "express";
import * as vehicleController from "../controllers/vehicleController.js";
import { validate } from "../middleware/validate.js";
import {
    createVehicleSchema,
    vehicleIdParamSchema,
} from "../validations/vehicleValidation.js";

const router = express.Router();

router.get("/", vehicleController.getAllVehicles);
router.post(
    "/",
    validate(createVehicleSchema),
    vehicleController.createVehicle
);
router.delete(
    "/:id",
    validate(vehicleIdParamSchema),
    vehicleController.deleteVehicle
);

export default router;
