import express from "express";
import * as reviewController from "../controllers/reviewController.js";
import { validate } from "../middleware/validate.js";
import {
    createReviewSchema,
    reviewIdParamSchema,
} from "../validations/reviewValidation.js";

const router = express.Router();

router.get("/", reviewController.getAllReviews);
router.post(
    "/",
    validate(createReviewSchema),
    reviewController.createReview
);
router.delete(
    "/:id",
    validate(reviewIdParamSchema),
    reviewController.deleteReview
);

export default router;
