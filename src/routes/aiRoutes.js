import express from "express";
import * as aiController from "../controllers/aiController.js";
import { validate } from "../middleware/validate.js";
import {
    createPredictionSchema,
    predictRiskSchema,
    predictionIdParamSchema,
} from "../validations/aiValidation.js";

const router = express.Router();

router.get("/", aiController.getAllPredictions);
router.post(
    "/",
    validate(createPredictionSchema),
    aiController.createPrediction
);
router.post(
    "/predict-risk",
    validate(predictRiskSchema),
    aiController.predictRisk
);
router.delete(
    "/:id",
    validate(predictionIdParamSchema),
    aiController.deletePrediction
);

export default router;
