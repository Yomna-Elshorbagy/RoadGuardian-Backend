import express from "express";
import * as contactController from "../controllers/contactController.js";
import { validate } from "../middleware/validate.js";
import {
    createContactSchema,
    contactIdParamSchema,
} from "../validations/contactValidation.js";

const router = express.Router();

router.post("/", validate(createContactSchema), contactController.createContact);
router.delete(
    "/:id",
    validate(contactIdParamSchema),
    contactController.deleteContact
);
router.get("/", contactController.getAllContacts);

export default router;
