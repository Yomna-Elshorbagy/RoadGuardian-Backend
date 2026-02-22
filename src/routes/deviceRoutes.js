import express from "express";
import * as deviceController from "../controllers/deviceController.js";
import { validate } from "../middleware/validate.js";
import {
    createDeviceSchema,
    deviceIdParamSchema,
} from "../validations/deviceValidation.js";

const router = express.Router();

router.get("/", deviceController.getAllDevices);
router.post("/", validate(createDeviceSchema), deviceController.createDevice);
router.delete(
    "/:id",
    validate(deviceIdParamSchema),
    deviceController.deleteDevice
);

export default router;
