import express from "express";
import * as mediaController from "../controllers/mediaController.js";
import { validate } from "../middleware/validate.js";
import {
    createMediaSchema,
    mediaIdParamSchema,
} from "../validations/mediaValidation.js";

const router = express.Router();

router.get("/", mediaController.getAllMedia);
router.post("/", validate(createMediaSchema), mediaController.createMedia);
router.delete(
    "/:id",
    validate(mediaIdParamSchema),
    mediaController.deleteMedia
);

export default router;
