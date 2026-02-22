import express from "express";
import * as userController from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
    createUserSchema,
    loginSchema,
    updateProfileSchema,
    updateUserByAdminSchema,
    changePasswordSchema,
    userIdParamSchema,
} from "../validations/userValidation.js";

const router = express.Router();

router.get("/", userController.getAllUsers);
router.post("/", validate(createUserSchema), userController.createUser);
router.post("/login", validate(loginSchema), userController.login);
router.delete(
    "/:id",
    validate(userIdParamSchema),
    userController.deleteUser
);

// Protected routes (require authentication)
router.get("/profile", authenticateToken, userController.getProfile);
router.put(
    "/profile",
    authenticateToken,
    validate(updateProfileSchema),
    userController.updateProfile
);
router.post(
    "/change-password",
    authenticateToken,
    validate(changePasswordSchema),
    userController.changePassword
);
router.put(
    "/:id",
    authenticateToken,
    validate(updateUserByAdminSchema),
    userController.updateUserByAdmin
);

export default router;

