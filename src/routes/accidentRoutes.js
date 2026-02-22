import express from "express";
import * as accidentController from "../controllers/accidentController.js";
import { validate } from "../middleware/validate.js";
import {
    createAccidentSchema,
    accidentIdParamSchema,
} from "../validations/accidentValidation.js";

const router = express.Router();

router.get("/", accidentController.getAllAccidents);
router.post(
    "/",
    validate(createAccidentSchema),
    accidentController.createAccident
);
router.delete(
    "/:id",
    validate(accidentIdParamSchema),
    accidentController.deleteAccident
);

export default router;
